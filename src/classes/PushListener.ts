import push from 'push-receiver';
import fs from 'fs';
import { EntityType } from '../models/RustPlus.models';
import path from 'path';

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

type EntityCallback = (pushNotification: PushNotificationBody) => void;

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

  public async start(): Promise<void> {
    this.listener = await push.listen(this.config.fcm_credentials, ({ notification }) => {
      const body = JSON.parse(notification.data.body as string) as PushNotificationBody;
      this.entityPushCallbacks.forEach((callback) => callback(body));
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