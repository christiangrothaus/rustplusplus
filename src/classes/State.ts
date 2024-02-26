import * as fs from 'fs';
import * as path from 'path';
import BaseSmartMessage, { MessageData } from './messages/BaseSmartMessage';
import BaseEntityInfo from './entityInfo/BaseEntityInfo';
import DiscordWrapper, { RustChannels } from './DiscordWrapper';
import SmartSwitchMessage from './messages/SmartSwitchMessage';
import SmartAlarmMessage from './messages/SmartAlarmMessage';
import StorageMonitorMessage from './messages/StorageMonitorMessage';
import StorageMonitorEntityInfo from './entityInfo/StorageMonitorEntityInfo';
import SmartAlarmEntityInfo from './entityInfo/SmartAlarmEntityInfo';
import SmartSwitchEntityInfo from './entityInfo/SmartSwitchEntityInfo';

export const SAVE_DATA_PATH = path.join(__dirname + '../../../save.json');

export type DataToSaveModel = {
  rustServerHost: string,
  rustServerPort: number,
  guildId: string,
  rustToken: string
  messages: Array<BaseSmartMessage<BaseEntityInfo>>
};

export type SavedDataModel = {
  rustServerHost: string,
  rustServerPort: number,
  guildId: string,
  rustToken: string,
  messages: Array<MessageData>
};

export default class State {
  public rustServerHost: string;

  public rustServerPort: number;

  public guildId: string;

  public rustToken: string;

  /**
   * @key the entity id
   * @value the instantiated message
   */
  public messages: Map<string, BaseSmartMessage<BaseEntityInfo>> = new Map();

  public save(): void {
    const data: DataToSaveModel = {
      rustServerHost: this.rustServerHost,
      rustServerPort: this.rustServerPort,
      guildId: this.guildId,
      rustToken: this.rustToken,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      messages: Array.from(this.messages).map(([messageId, message]) => message)
    };
    const json = JSON.stringify(data, null, 2);

    try {
      fs.writeFileSync(SAVE_DATA_PATH, json, 'utf-8');
    } catch (e) {
      throw new Error('Failed to save data: ' + e.message);
    }
  }

  public loadFromSave(discordClient: DiscordWrapper): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const data = fs.readFileSync(SAVE_DATA_PATH, 'utf-8');
        const saveData: SavedDataModel = JSON.parse(data);

        this.rustServerHost = saveData.rustServerHost;
        this.rustServerPort = saveData.rustServerPort;
        this.guildId = saveData.guildId;
        this.rustToken = saveData.rustToken;

        discordClient.onChannelsReady(async (channels) => {
          const { messages } = saveData;

          for (const msgData of messages) {
            const message = await this.createMessageFromData(channels, msgData);
            this.messages.set(message.message.id, message);
          }
        });
        resolve();

      } catch (e) {
        if (e.code === 'ENOENT') {
          resolve();
        }
        reject(e);
      }
    });
  }

  public async createMessageFromData(channels: RustChannels, messageData: MessageData): Promise<BaseSmartMessage<BaseEntityInfo>> {
    const { messageId } = messageData;

    let message: BaseSmartMessage<BaseEntityInfo>;
    switch (messageData.entityInfo.entityType) {
      case 'Switch': {
        const castedEntityInfo = messageData.entityInfo as SmartSwitchEntityInfo;
        const entityInfo = new SmartSwitchEntityInfo(castedEntityInfo.name, castedEntityInfo.entityId, castedEntityInfo.isActive);
        message = new SmartSwitchMessage(channels.switchChannel , entityInfo);
        break;
      }
      case 'Alarm': {
        const castedEntityInfo = messageData.entityInfo as SmartAlarmEntityInfo;
        const entityInfo = new SmartAlarmEntityInfo(castedEntityInfo.name, castedEntityInfo.entityId);
        message = new SmartAlarmMessage(channels.notificationChannel, entityInfo);
        break;
      }
      case 'StorageMonitor': {
        const castedEntityInfo = messageData.entityInfo as StorageMonitorEntityInfo;
        const entityInfo = new StorageMonitorEntityInfo(castedEntityInfo.name, castedEntityInfo.entityId, castedEntityInfo.capacity);
        message = new StorageMonitorMessage(channels.notificationChannel, entityInfo);
        break;
      }
      default: {
        throw new Error('Unknown entity type');
      }
    }

    const msg = await this.attemptToSendMessage(message, messageId);

    return msg;
  }

  private async attemptToSendMessage(message: BaseSmartMessage<BaseEntityInfo>, messageId?: string): Promise<BaseSmartMessage<BaseEntityInfo>> {
    if (messageId) {
      try {
        const discordMessage = await message.channel.messages.fetch(messageId);
        message.message = discordMessage;
      } catch (e) {
        message.send();
      }
    } else {
      message.send();
    }

    return message;
  }
}