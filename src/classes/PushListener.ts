import push from 'push-receiver';
import fs from 'fs';
import { EntityType } from '../models/RustPlus.models';
import path from 'path';
import { Awaitable } from 'discord.js';
import Manager from './Manager';

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

type EntityCallback = (pushNotification: PushNotificationBody) => Awaitable<void>;

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

export const configFile = path.join(__dirname, '../../rustplus.config.json');

export default class PushListener {
  config: PushConfig;

  listener;

  private entityPushCallbacks: Array<EntityCallback> = [];

  constructor() {
    this.config = this.loadConfig();

    if (!this.config.fcm_credentials){
      throw new Error('FCM Credentials missing. Please run `fcm-register` first.');
    }
  }

  public onEntityPush(callback: EntityCallback): void {
    this.entityPushCallbacks.push(callback);
  }

  public async start(manager: Manager): Promise<void> {
    const { state } = manager;
    this.listener = await push.listen({ ...this.config.fcm_credentials, persistentIds: state.pushIds }, (push: Push) => {
      const { notification, persistentId } = push;
      const body = JSON.parse(notification.data.body) as PushNotificationBody;
      if (state.rustToken !== body.playerToken) {
        state.rustToken = body.playerToken;
        manager.rustPlus.updateRustPlusCreds(state.rustServerHost, state.rustServerPort, body.playerToken);
      }
      state.pushIds.push(persistentId);
      this.entityPushCallbacks.forEach(async (callback) => await callback(body));
    });
  }

  public destroy(): void {
    this.listener.destroy();
  }

  private loadConfig(): PushConfig {
    try {
      return JSON.parse(fs.readFileSync('rustplus.config.json', 'utf-8'));
    } catch (err) {
      throw new Error('Failed to load rustplus.config.json');
    }
  }
}