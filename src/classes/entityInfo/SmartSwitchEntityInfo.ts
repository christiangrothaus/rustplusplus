import BaseEntityInfo from './BaseEntityInfo';

export default class SmartSwitchEntityInfo implements BaseEntityInfo {
  public name: string;

  public entityId: string;

  public isActive?: boolean;
}