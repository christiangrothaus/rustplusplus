import * as fs from 'fs';
import { Message } from 'discord.js';
import SmartSwitch, { SmartSwitchJSON } from './rust/SmartSwitch';

type DataToSaveModel = {
  messages: { [key: string]: Message<boolean> },
  switches: { [key: string]: SmartSwitch },
  channelId: string,
  rustServerHost: string,
  rustServerPort: number
}

type SavedDataModel = {
  messages: { [key: string]: Message<boolean> },
  switches: { [key: string]: SmartSwitchJSON },
  channelId: string,
  rustServerHost: string,
  rustServerPort: number
}

export default class SaveData {
  messages: Map<string, Message<boolean>>;

  switches: Map<string, SmartSwitch>;

  channelId: string;

  rustServerHost: string;

  rustServerPort: number;

  save(): void {
    const messages = Object.fromEntries(this.messages) as { [key: string]: Message<boolean> };
    const switches = Object.fromEntries(this.switches) as { [key: string]: SmartSwitch };

    const data: DataToSaveModel = {
      messages,
      switches,
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
      this.messages = new Map(Object.entries(saveData.messages));

      const switchEntries = Object.entries(saveData.switches);
      const switches = switchEntries.map(([key, value]) => [key, new SmartSwitch(value.name, value.entityId, value.isActive)]) as Array<[string, SmartSwitch]>;

      this.switches = new Map(switches);
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