import BaseEntityInfo from './BaseEntityInfo';

export default class SmartSwitchEntityInfo implements BaseEntityInfo {
  name: string;

  entityId: string;

  isActive?: boolean;
}