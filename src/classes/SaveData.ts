import * as fs from 'fs';
import SmartSwitch, { SmartSwitchJSON } from './rust/SmartSwitch';

type SwitchesModel = { [key: string]: SmartSwitch };
type SwitchesJsonModel = { [key: string]: SmartSwitchJSON };
export type ChannelChangeCallbackModel = (channelId: string) => void;

export type DataToSaveModel = {
  switches: SwitchesModel,
  channelId: string,
  rustServerHost: string,
  rustServerPort: number
}

export type SavedDataModel = {
  switches: SwitchesJsonModel,
  channelId: string,
  rustServerHost: string,
  rustServerPort: number
}

export default class SaveData {
  switches: SwitchesModel;

  rustServerHost: string;

  rustServerPort: number;

  set channelId(channelId: string) {
    this._channelId = channelId;
    this.save();
    this.channelIdChangeCallbacks.forEach((callback) => callback(channelId));
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
    const data: DataToSaveModel = {
      switches: this.switches,
      channelId: this.channelId,
      rustServerHost: this.rustServerHost,
      rustServerPort: this.rustServerPort
    };

    const json = JSON.stringify(data);

    try {
      fs.writeFileSync('save.json', json, 'utf-8');
    } catch (e) {
      console.log('Failed to save data.', e);
    }
  }

  loadFromSave(): boolean {
    try {
      const data: string = fs.readFileSync('save.json', 'utf-8');
      const saveData: SavedDataModel = JSON.parse(data);

      const switches: SwitchesModel = {};
      Object.values(saveData.switches).forEach((smartSwitch) => {
        switches[smartSwitch.entityId] = new SmartSwitch(smartSwitch.name, smartSwitch.entityId, smartSwitch.isActive, smartSwitch.messageId);
      });

      this.switches = switches;
      this.channelId = saveData.channelId;
      this.rustServerHost = saveData.rustServerHost;
      this.rustServerPort = saveData.rustServerPort;
    } catch (e) {
      console.log('Unable to load save file.', e);
      return false;
    }

    return true;
  }
}