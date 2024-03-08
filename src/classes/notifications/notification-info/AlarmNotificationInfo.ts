import BaseNotificationInfo from './BaseNotificationInfo';

export default class AlarmNotificationInfo extends BaseNotificationInfo {
  constructor(name: string, message: string) {
    super(name, message);
  }
}