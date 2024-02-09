import * as fs from 'fs';
import SmartSwitch, { SmartSwitchJSON } from './rust/SmartSwitch';
import { SAVE_DATA_PATH } from '../..';

type SwitchesModel = { [key: string]: SmartSwitch };
type SwitchesJsonModel = { [key: string]: SmartSwitchJSON };
export type ChannelChangeCallbackModel = (oldChannelId: string, channelId: string) => void;

export type DataToSaveModel = {
  switches: SwitchesModel,
  channelId: string,
  rustServerHost: string,
  rustServerPort: number,
  guildId: string
}

export type SavedDataModel = {
  switches: SwitchesJsonModel,
  channelId: string,
  rustServerHost: string,
  rustServerPort: number,
  guildId: string
}

export default class State {
  switches: SwitchesModel = {};

  rustServerHost: string;

  rustServerPort: number;

  guildId: string;

  set channelId(channelId: string) {
    const oldChannelId = this._channelId;
    this._channelId = channelId;
    if (oldChannelId !== channelId) {
      this.channelIdChangeCallbacks.forEach((callback) => callback(oldChannelId, channelId));
    }
  }

  get channelId(): string {
    return this._channelId;
  }

  private _channelId: string;

  private channelIdChangeCallbacks: Array<ChannelChangeCallbackModel> = [];

  onChanelIdChange(callback: ChannelChangeCallbackModel): void {
    this.channelIdChangeCallbacks.push(callback);
  }

  save(): void {
    console.log('Saving data ----------------------');
    const data: DataToSaveModel = {
      switches: this.switches,
      channelId: this.channelId,
      rustServerHost: this.rustServerHost,
      rustServerPort: this.rustServerPort,
      guildId: this.guildId
    };

    const json = JSON.stringify(data);

    try {
      fs.writeFileSync(SAVE_DATA_PATH, json, 'utf-8');
    } catch (e) {
      console.log('Failed to save data.', e);
    }
  }

  loadFromSave(): boolean {
    try {
      const data: string = fs.readFileSync(SAVE_DATA_PATH, 'utf-8');
      const saveData: SavedDataModel = JSON.parse(data);

      const switches: SwitchesModel = {};
      if (saveData.switches) {
        Object.values(saveData.switches).forEach((smartSwitch) => {
          switches[smartSwitch.entityId] = new SmartSwitch(smartSwitch.name, smartSwitch.entityId, smartSwitch.isActive, smartSwitch.messageId);
        });
      }


      this.switches = switches;
      this.channelId = saveData.channelId;
      this.rustServerHost = saveData.rustServerHost;
      this.rustServerPort = saveData.rustServerPort;
      this.guildId = saveData.guildId;
    } catch (e) {
      if (e.code === 'ENOENT') {
        return false;
      }
      console.log('Unable to load save file.', e);
      return false;
    }

    return true;
  }
}