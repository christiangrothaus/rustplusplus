export default class SmartSwitch {

  name: string;

  entityId: string;

  isActive?: boolean;

  constructor(name: string, entityId: string, isActive?: boolean) {
    this.name = name;

    this.entityId = entityId;

    this.isActive = isActive;
  }
}