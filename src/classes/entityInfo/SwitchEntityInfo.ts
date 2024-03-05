import { EntityType } from '../../models/RustPlus.models';
import BaseEntityInfo from './BaseEntityInfo';

export default class SwitchEntityInfo extends BaseEntityInfo {
  entityType: EntityType = EntityType.Switch;

  isActive?: boolean;

  constructor(name: string, entityId: string, isActive?: boolean) {
    super(name, entityId);

    this.isActive = isActive;
  }
}