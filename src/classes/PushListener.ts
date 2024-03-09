import push from 'push-receiver';
import fs from 'fs';
import { EntityType as EntityName } from '../models/RustPlus.models';
import path from 'path';
import Manager from './Manager';
import State from './State';
import { EventEmitter } from 'events';

export type PushData = {
  body: string,
  channelId: string,
  experienceId: string,
  message: string,
  projectId: string,
  scopeKey: string,
  title: string
};

type Push = {
  notification: {
    data: PushData,
    fcmMessageId: string,
    from: string,
    priority: string
  },
  persistentId: string
};

export type PushNotificationBody = {
  img: string,
  entityType: EntityName,
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
  NewStorageMonitor = 'NewStorageMonitor',
  AlarmTriggered = 'AlarmTriggered'
}

export const CONFIG_FILE = path.join(__dirname, '../../rustplus.config.json');

declare interface PushListener {
  on(event: PushEvents.NewSwitch, listener: (body: PushNotificationBody) => void): this;
  on(event: PushEvents.NewAlarm, listener: (body: PushNotificationBody) => void): this;
  on(event: PushEvents.NewStorageMonitor, listener: (body: PushNotificationBody) => void): this;
  on(event: PushEvents.AlarmTriggered, listener: (data: PushData) => void): this;
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

      if (notification.data.channelId === 'alarm') {
        this.emit(PushEvents.AlarmTriggered, notification.data);
      } else {
        const body = JSON.parse(notification.data.body) as PushNotificationBody;

        if (this.state.rustToken !== body.playerToken) {
          this.state.rustToken = body.playerToken;
          manager.rustPlus.updateRustPlusCreds(this.state.rustServerHost, this.state.rustServerPort, body.playerToken);
        }

        switch (body.entityName) {
          case EntityName.Switch: {
            this.emit(PushEvents.NewSwitch, body);
            break;
          }
          case EntityName.Alarm: {
            this.emit(PushEvents.NewAlarm, body);
            break;
          }
          case EntityName.StorageMonitor: {
            this.emit(PushEvents.NewStorageMonitor, body);
            break;
          }
        }
      }

      this.state.pushIds.push(persistentId);
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