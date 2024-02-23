import { EntityType } from '../../models/RustPlus.models';
import BaseEntityInfo from './BaseEntityInfo';

export default class SmartAlarmEntityInfo extends BaseEntityInfo {

  entityType: EntityType = EntityType.Alarm;

  constructor(name: string, entityId: string) {
    super(name, entityId);
  }
}