import { EntityType } from '../../../models/RustPlus.models';

export default abstract class BaseEntityInfo {
  name: string;

  entityId: string;

  abstract entityType: EntityType;

  constructor(name: string, entityId: string) {
    this.name = name;
    this.entityId = entityId;
  }
}