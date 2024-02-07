import * as push from 'push-receiver';
import * as fs from 'fs';
import { Subject } from 'rxjs';
import SmartSwitch from './rust/SmartSwitch';


export type SwitchFcmNotification = {
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

type FcmConfig = {
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

export default class FcmListener {
  config: FcmConfig;

  switches$ = new Subject<SmartSwitch>();

  listener;

  constructor() {
    this.config = this.loadConfig();

    if (!this.config.fcm_credentials){
      console.error('FCM Credentials missing. Please run `fcm-register` first.');
      process.exit(1);
    }
  }

  async start(): Promise<void> {
    this.listener = await push.listen(this.config.fcm_credentials, ({ notification }) => {
      const body = JSON.parse(notification.data.body as string) as SwitchFcmNotification;
      if (body.entityName === 'Switch') {
        const smartSwitch = new SmartSwitch(body.name, body.entityId);
        this.switches$.next(smartSwitch);
      }
    });
  }

  destroy(): void {
    this.listener.destroy();
  }

  private loadConfig(): FcmConfig | undefined {
    try {
      return JSON.parse(fs.readFileSync('rustplus.config.json', 'utf-8'));
    } catch (err) {
      console.log('Failed to load config.');
      return undefined;
    }
  }
}