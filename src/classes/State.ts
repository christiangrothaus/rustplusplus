import * as fs from 'fs';
import * as path from 'path';
import BaseSmartMessage, { MessageJson } from './messages/BaseSmartMessage';
import BaseEntityInfo from './entityInfo/BaseEntityInfo';

export const SAVE_DATA_PATH = path.join(__dirname + '../../../save.json');

export type DataToSaveModel = {
  rustServerHost: string,
  rustServerPort: number,
  guildId: string,
  rustToken: string
};

export type SavedDataModel = {
  rustServerHost: string,
  rustServerPort: number,
  guildId: string,
  rustToken: string,
};

/**
 * @description The key is the discord message ID
 */
export type EntityMessages = { [key: string]: BaseSmartMessage<BaseEntityInfo> };

/**
 * @description The key is the discord message ID
 */
export type EntityMessagesJson = { [key: string]: MessageJson<BaseEntityInfo> };

export default class State {
  rustServerHost: string;

  rustServerPort: number;

  guildId: string;

  rustToken: string;

  save(): void {
    const data: DataToSaveModel = {
      rustServerHost: this.rustServerHost,
      rustServerPort: this.rustServerPort,
      guildId: this.guildId,
      rustToken: this.rustToken
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
      const data = fs.readFileSync(SAVE_DATA_PATH, 'utf-8');
      const saveData: SavedDataModel = JSON.parse(data);

      this.rustServerHost = saveData.rustServerHost;
      this.rustServerPort = saveData.rustServerPort;
      this.guildId = saveData.guildId;
      this.rustToken = saveData.rustToken;

      console.log('Loaded save!');
    } catch (e) {
      console.log('Unable to load save file.', e);
      return false;
    }

    return true;
  }
}