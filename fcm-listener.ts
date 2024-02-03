import * as push from 'push-receiver';
import * as fs from 'fs';
import { Subject } from 'rxjs';

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
  playerId: string,
  active?: boolean,
  customName?: string
}

export const switches = new Subject<SwitchFcmNotification>();

const readConfig = () => {
  try {
    return JSON.parse(fs.readFileSync('rustplus.config.json', 'utf-8'));
  } catch (err) {
    return {};
  }
};

export const fcmListen = async () => {
  // read config file
  const config = readConfig();

  // make sure fcm credentials are in config
  if(!config.fcm_credentials){
    console.error('FCM Credentials missing. Please run `fcm-register` first.');
    process.exit(1);
    return;
  }

  console.log('Listening for FCM Notifications');
  await push.listen(config.fcm_credentials, ({ notification }) => {
    // parse notification body

    const body = JSON.parse(notification.data.body) as SwitchFcmNotification;
    if(body.entityId) {
      switches.next(body);
    }
  });
};
