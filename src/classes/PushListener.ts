import * as push from 'push-receiver';
import * as fs from 'fs';
import { EntityType } from '../models/RustPlus.models';

export type PushNotification = {
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

type EntityCallback = (pushNotification: PushNotification) => void;

type PushConfig = {
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

  onEntityPush(callback: EntityCallback): void {
    this.entityPushCallbacks.push(callback);
  }

  async start(): Promise<void> {
    this.listener = await push.listen(this.config.fcm_credentials, ({ notification }) => {
      const body = JSON.parse(notification.data.body as string) as PushNotification;
      this.entityPushCallbacks.forEach((callback) => callback(body));
    });
  }

  destroy(): void {
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