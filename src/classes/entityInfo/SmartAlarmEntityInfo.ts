import BaseEntityInfo from './BaseEntityInfo';

export default class SmartAlarmEntityInfo implements BaseEntityInfo {
  public name: string;

  public entityId: string;

  public isActive?: boolean;
}