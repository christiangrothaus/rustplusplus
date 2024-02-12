import * as fs from 'fs';
import * as path from 'path';

export const SAVE_DATA_PATH = path.join(__dirname + '../../../save.json');

export type ChannelChangeCallbackModel = (oldChannelId: string, channelId: string) => void;

export type DataToSaveModel = {
  channelId: string,
  messages: EntityMessages,
  rustServerHost: string,
  rustServerPort: number,
  guildId: string,
  rustToken: string
}

export type SavedDataModel = {
  channelId: string,
  rustServerHost: string,
  rustServerPort: number,
  guildId: string,
  rustToken: string,
  messages: EntityMessages
}

// {messageId: entityId}
export type EntityMessages = { [key: string]: string };

export default class State {
  rustServerHost: string;

  rustServerPort: number;

  guildId: string;

  rustToken: string;

  messages: EntityMessages = {};

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
    const data: DataToSaveModel = {
      channelId: this.channelId,
      rustServerHost: this.rustServerHost,
      rustServerPort: this.rustServerPort,
      guildId: this.guildId,
      messages: this.messages,
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
      const data: string = fs.readFileSync(SAVE_DATA_PATH, 'utf-8');
      const saveData: SavedDataModel = JSON.parse(data);

      this.messages = saveData.messages || {};
      this.channelId = saveData.channelId;
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