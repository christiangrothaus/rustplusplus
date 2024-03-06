import push from 'push-receiver';
import fs from 'fs';
import { EntityType } from '../models/RustPlus.models';
import path from 'path';
import { Awaitable } from 'discord.js';
import Manager from './Manager';
import State from './State';
import { EventEmitter } from 'events';

type Push = {
  notification: {
    data: {
      body: string,
      channelId: string,
      experienceId: string,
      message: string,
      projectId: string,
      scopeKey: string,
      title: string
    },
    fcmMessageId: string,
    from: string,
    priority: string
  },
  persistentId: string
};

export type PushNotificationBody = {
  img: string,
  entityType: EntityType,
  ip: string,
  entityId: string,
  type: string,
  url: string,
  playerToken: string,
  port: string,
  entityName: string,
  name: string,
  logo: string,
  id: string,
  desc: string,
  playerId: string
};

export type PushConfig = {
  fcm_credentials: {
    keys: {
      privateKey: string,
      publicKey: string,
      authSecret: string
    }
    fcm: {
      token: string,
      pushSet: string
    }
    gcm: {
      token: string,
      androidId: string,
      securityToken: string,
      appId: string
    }
  }
};

export enum PushEvents {
  NewSwitch = 'NewSwitch',
  NewAlarm = 'NewAlarm',
  NewStorageMonitor = 'NewStorageMonitor'
}

export const CONFIG_FILE = path.join(__dirname, '../../rustplus.config.json');

declare interface PushListener {
  on(event: PushEvents, listener: (body: PushNotificationBody) => Awaitable<void>): this;
}
class PushListener extends EventEmitter {
  config: PushConfig;

  listener;

  private state = State.getInstance();

  constructor() {
    super();
    this.config = this.loadConfig();

    if (!this.config.fcm_credentials){
      throw new Error('FCM Credentials missing. Please run `fcm-register` first.');
    }
  }

  public async start(manager: Manager): Promise<void> {
    this.listener = await push.listen({ ...this.config.fcm_credentials, persistentIds: this.state.pushIds }, (push: Push) => {
      const { notification, persistentId } = push;
      const body = JSON.parse(notification.data.body) as PushNotificationBody;

      if (this.state.rustToken !== body.playerToken) {
        this.state.rustToken = body.playerToken;
        manager.rustPlus.updateRustPlusCreds(this.state.rustServerHost, this.state.rustServerPort, body.playerToken);
      }
      this.state.pushIds.push(persistentId);

      switch (body.entityName) {
        case EntityType.Switch: {
          this.emit(PushEvents.NewSwitch, body);
          break;
        }
        case EntityType.Alarm: {
          this.emit(PushEvents.NewAlarm, body);
          break;
        }
        case EntityType.StorageMonitor: {
          this.emit(PushEvents.NewStorageMonitor, body);
          break;
        }
      }
    });
  }

  public destroy(): void {
    this.listener.destroy();
    this.removeAllListeners();
  }

  private loadConfig(): PushConfig {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    } catch (err) {
      throw new Error('Failed to load rustplus.config.json');
    }
  }
}

export default PushListener;