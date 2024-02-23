import { EntityType } from '../../models/RustPlus.models';
import BaseEntityInfo from './BaseEntityInfo';

export default class StorageMonitorEntityInfo extends BaseEntityInfo {
  entityType: EntityType = EntityType.StorageMonitor;

  capacity?: number;

  constructor(name: string, entityId: string, capacity?: number) {
    super(name, entityId);

    this.capacity = capacity;
  }
}