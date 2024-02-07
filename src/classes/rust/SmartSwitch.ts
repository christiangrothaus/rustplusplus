export type SmartSwitchJSON = {
  name: string,
  entityId: string,
  isActive?: boolean
}

export default class SmartSwitch {

  name: string;

  entityId: string;

  isActive?: boolean;

  constructor(name: string, entityId: string, isActive?: boolean) {
    this.name = name;

    this.entityId = entityId;

    this.isActive = isActive;
  }

  toJSON(): SmartSwitchJSON {
    return { name: this.name, entityId: this.entityId, isActive: this.isActive };
  }
}