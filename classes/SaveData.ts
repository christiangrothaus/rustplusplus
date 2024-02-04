import * as fs from 'fs';
import { Message } from 'discord.js';
import { SwitchFcmNotification } from './FcmListener';

type SavedDataModel = {
  messages: {[key: string]: Message<boolean>},
  switches: {[key: string]: SwitchFcmNotification},
  channelId: string
}

export default class SaveData {
  messages: Map<string, Message<boolean>>;
  switches: Map<string, SwitchFcmNotification>;
  channelId: string;

  save = () => {
    const messages = Object.fromEntries(this.messages);
    const switches = Object.fromEntries(this.switches);
  
    const data: SavedDataModel = {messages, switches, channelId: this.channelId};
  
    const json = JSON.stringify(data);
  
    fs.writeFileSync('save.json', json, 'utf-8');
  };
  switchMap: any;

  loadFromSave(): void {
    fs.readFile('save.json', 'utf-8', (error, data) => {
      if (error) {
        console.log('Unable to load save file.', error);
        return;
      }
      
      try {
        const saveData: SavedDataModel = JSON.parse(data);
        this.messages = new Map(Object.entries(saveData.messages));
        this.switches = new Map(Object.entries(saveData.switches));
        this.channelId = saveData.channelId;
      } catch(e) {
        console.log('Unable to parse save file.', e);
      }
    });
  }
}