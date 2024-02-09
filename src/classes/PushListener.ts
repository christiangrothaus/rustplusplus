import * as push from 'push-receiver';
import * as fs from 'fs';
import SmartSwitch from './rust/SmartSwitch';


export type SwitchPushNotification = {
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
}

type NewSwitchCallback = (smartSwitch: SmartSwitch) => void;

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
}

export default class PushListener {
  config: PushConfig;

  listener;

  private newSwitchCallbacks: Array<NewSwitchCallback> = [];

  constructor() {
    this.config = this.loadConfig();

    if (!this.config.fcm_credentials){
      console.error('FCM Credentials missing. Please run `fcm-register` first.');
      process.exit(1);
    }
  }

  onNewSwitch(callback: NewSwitchCallback): void {
    this.newSwitchCallbacks.push(callback);
  }

  async start(): Promise<void> {
    this.listener = await push.listen(this.config.fcm_credentials, ({ notification }) => {
      const body = JSON.parse(notification.data.body as string) as SwitchPushNotification;
      if (body.entityName === 'Switch') {
        const smartSwitch = new SmartSwitch(body.entityName, body.entityId);
        this.newSwitchCallbacks.forEach((callback) => callback(smartSwitch));
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