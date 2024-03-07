import { EntityType } from '../../models/RustPlus.models';
import BaseEntityInfo from './BaseEntityInfo';

/**
 * @key Item ID
 * @value Item Count
 */
export type StorageItems = Map<string, number>;
export default class StorageMonitorEntityInfo extends BaseEntityInfo {
  entityType: EntityType = EntityType.StorageMonitor;

  items: StorageItems = new Map<string, number>();

  constructor(name: string, entityId: string, items?: StorageItems) {
    super(name, entityId);

    this.items = items ?? new Map<string, number>();
  }
}