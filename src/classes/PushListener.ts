import * as push from 'push-receiver';
import * as fs from 'fs';

export type PushNotification = {
  img: string,
  entityType: string,
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

type NewEntityCallback = (pushNotification: PushNotification) => void;

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

  private newSwitchCallbacks: Array<NewEntityCallback> = [];

  private newAlarmCallbacks: Array<NewEntityCallback> = [];

  private newStorageMonitorCallbacks: Array<NewEntityCallback> = [];

  constructor() {
    this.config = this.loadConfig();

    if (!this.config.fcm_credentials){
      console.error('FCM Credentials missing. Please run `fcm-register` first.');
      process.exit(1);
    }
  }

  onNewSwitch(callback: NewEntityCallback): void {
    this.newSwitchCallbacks.push(callback);
  }

  onNewAlarm(callback: NewEntityCallback): void {
    this.newAlarmCallbacks.push(callback);
  }

  onNewStorageMonitor(callback: NewEntityCallback): void {
    this.newStorageMonitorCallbacks.push(callback);
  }

  async start(): Promise<void> {
    this.listener = await push.listen(this.config.fcm_credentials, ({ notification }) => {
      const body = JSON.parse(notification.data.body as string) as PushNotification;
      if (body.entityName === 'Switch') {
        this.newSwitchCallbacks.forEach((callback) => callback(body));
      } else if (body.entityName === 'Alarm') {
        this.newAlarmCallbacks.forEach((callback) => callback(body));
      } else if (body.entityName === 'StorageMonitor') {
        this.newStorageMonitorCallbacks.forEach((callback) => callback(body));
      }
    });
  }

  destroy(): void {
    this.listener.destroy();
  }

  private loadConfig(): PushConfig | undefined {
    try {
      return JSON.parse(fs.readFileSync('rustplus.config.json', 'utf-8'));
    } catch (err) {
      console.log('Failed to load config.');
      return undefined;
    }
  }
}