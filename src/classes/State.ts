import fs from 'fs';
import path from 'path';
import Switch from './entities/Switch';
import StorageMonitor from './entities/StorageMonitor';
import Alarm from './entities/Alarm';
import SwitchEntityInfo from './entities/entity-info/SwitchEntityInfo';
import AlarmEntityInfo from './entities/entity-info/AlarmEntityInfo';
import StorageMonitorEntityInfo from './entities/entity-info/StorageMonitorEntityInfo';

export const SAVE_DATA_PATH = path.join(__dirname + '../../../save.json');

export type DataToSaveModel = {
  rustServerHost: string,
  rustServerPort: number,
  guildId: string,
  rustToken: string
  pushIds: Array<string>,
  pairedSwitches: Array<SwitchEntityInfo>,
  pairedAlarms: Array<AlarmEntityInfo>,
  pairedStorageMonitors: Array<Partial<StorageMonitorEntityInfo>>
};

export type SavedDataModel = {
  rustServerHost: string,
  rustServerPort: number,
  guildId: string,
  rustToken: string,
  pushIds: Array<string>,
  pairedSwitches: Array<SwitchEntityInfo>,
  pairedAlarms: Array<AlarmEntityInfo>,
  pairedStorageMonitors: Array<StorageMonitorEntityInfo>
};

export default class State {
  public rustServerHost: string;

  public rustServerPort: number;

  public guildId: string;

  public rustToken: string;

  public pushIds: Array<string> = [];

  /**
   * @key the entity id
   * @value the instantiated switch
   */
  public pairedSwitches: Map<string, Switch> = new Map();

  /**
   * @key the entity id
   * @value the instantiated alarm
   */
  public pairedAlarms: Map<string, Alarm> = new Map();

  /**
   * @key the entity id
   * @value the instantiated storage monitor
   */
  public pairedStorageMonitors: Map<string, StorageMonitor> = new Map();

  private static instance: State;

  private constructor() {
    this.loadFromSave();
  }

  public save(): void {
    const data: DataToSaveModel = {
      rustServerHost: this.rustServerHost,
      rustServerPort: this.rustServerPort,
      guildId: this.guildId,
      rustToken: this.rustToken,
      pushIds: this.pushIds,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      pairedSwitches: Array.from(this.pairedSwitches).map(([entityId, switchEntity]) => switchEntity.toJSON()),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      pairedAlarms: Array.from(this.pairedAlarms).map(([entityId, alarmEntity]) => alarmEntity.toJSON()),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      pairedStorageMonitors: Array.from(this.pairedStorageMonitors).map(([entityId, storageMonitorEntity]) => storageMonitorEntity.toJSON())
    };
    const json = JSON.stringify(data, null, 2);

    try {
      fs.writeFileSync(SAVE_DATA_PATH, json, 'utf-8');
    } catch (e) {
      throw new Error('Failed to save data: ' + e.message);
    }
  }

  public loadFromSave(): void {
    try {
      const data = fs.readFileSync(SAVE_DATA_PATH, 'utf-8');
      const saveData: SavedDataModel = JSON.parse(data);

      this.rustServerHost = saveData.rustServerHost;
      this.rustServerPort = saveData.rustServerPort;
      this.guildId = saveData.guildId;
      this.rustToken = saveData.rustToken;
      this.pushIds = saveData.pushIds || [];

      if (saveData.pairedSwitches) {
        for (const entityInfo of saveData.pairedSwitches) {
          const switchesEntityInfo = new SwitchEntityInfo(entityInfo.name, entityInfo.entityId, entityInfo.isActive);
          const entity = new Switch(switchesEntityInfo);
          this.pairedSwitches.set(entityInfo.entityId, entity);
        }
      }
      if (saveData.pairedStorageMonitors) {
        for (const entityInfo of saveData.pairedStorageMonitors) {
          const storageMonitorEntityInfo = new StorageMonitorEntityInfo(entityInfo.name, entityInfo.entityId);
          const entity = new StorageMonitor(storageMonitorEntityInfo);
          this.pairedStorageMonitors.set(entityInfo.entityId, entity);
        }
      }
      if (saveData.pairedAlarms) {
        for (const entityInfo of saveData.pairedAlarms) {
          const alarmEntityInfo = new AlarmEntityInfo(entityInfo.name, entityInfo.entityId);
          const entity = new Alarm(alarmEntityInfo);
          this.pairedAlarms.set(entityInfo.entityId, entity);
        }
      }
    } catch (e) {
      throw new Error('Failed to load data: ' + e.message);
    }
  }

  public getPairedDevice(entityId: string): Switch | Alarm | StorageMonitor {
    return this.pairedSwitches.get(entityId) || this.pairedAlarms.get(entityId) || this.pairedStorageMonitors.get(entityId);
  }

  public static getInstance(): State {
    if (!State.instance) {
      State.instance = new State();
      State.instance.loadFromSave();
    }

    return State.instance;
  }
}