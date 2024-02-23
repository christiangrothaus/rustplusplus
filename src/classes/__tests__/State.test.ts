import DiscordWrapper from '../DiscordWrapper';
import State, { SAVE_DATA_PATH } from '../State';
import fs from 'fs';
import BaseSmartMessage from '../messages/BaseSmartMessage';
import BaseEntityInfo from '../entityInfo/BaseEntityInfo';
import SmartSwitchMessage from '../messages/SmartSwitchMessage';
import SmartSwitchEntityInfo from '../entityInfo/SmartSwitchEntityInfo';
import { Message, TextChannel } from 'discord.js';
import StorageMonitorMessage from '../messages/StorageMonitorMessage';
import StorageMonitorEntityInfo from '../entityInfo/StorageMonitorEntityInfo';
import { EntityType } from '../../models/RustPlus.models';
import SmartAlarmMessage from '../messages/SmartAlarmMessage';

describe('state', () => {
  let genericState: State;

  let RUST_SERVER_HOST: string;
  let RUST_SERVER_PORT: number;
  let GUILD_ID: string;
  let RUST_TOKEN: string;
  let MESSAGES: Map<string, BaseSmartMessage<BaseEntityInfo>>;

  beforeAll(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1);

    RUST_SERVER_HOST = 'localhost';
    RUST_SERVER_PORT = 25565;
    GUILD_ID = '1234';
    RUST_TOKEN = 'myToken';
    MESSAGES = new Map();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const messageOne = new SmartSwitchMessage({ send: async (options: string ): Promise<Message<true>> => {return { id: 'messageId1' } as Message<true>;} } as TextChannel, new SmartSwitchEntityInfo('name', 'entityId'));
    messageOne.message = { id: 'messageId1' } as Message;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const messageTwo = new StorageMonitorMessage({ send: async (options: string ): Promise<Message<true>> => {return { id: 'messageId2' } as Message<true>;} } as TextChannel, new StorageMonitorEntityInfo('name', 'entityId', 100));
    messageTwo.message = { id: 'messageId2' } as Message;

    MESSAGES.set('messageId1', messageOne);
    MESSAGES.set('messageId2', messageTwo);
  });

  beforeEach(() => {
    genericState = new State();
  });

  it('should create a new state', () => {
    const state = new State();

    expect(state).toBeDefined();
  });

  describe('save', () => {
    it('should save the correct data', () => {
      const writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
      genericState.rustServerHost = RUST_SERVER_HOST;
      genericState.rustServerPort = RUST_SERVER_PORT;
      genericState.guildId = GUILD_ID;
      genericState.rustToken = RUST_TOKEN;
      genericState.messages = MESSAGES;

      let expected = '{';
      expected += `"rustServerHost":"${RUST_SERVER_HOST}",`;
      expected += `"rustServerPort":${RUST_SERVER_PORT},`;
      expected += `"guildId":"${GUILD_ID}",`;
      expected += `"rustToken":"${RUST_TOKEN}",`;
      expected += '"messages":[';
      expected += '{"messageId":"messageId1","entityInfo":{"name":"name","entityId":"entityId","entityType":"Switch"}},';
      expected += '{"messageId":"messageId2","entityInfo":{"name":"name","entityId":"entityId","entityType":"StorageMonitor","capacity":100}}';
      expected += ']}';

      genericState.save();

      expect(writeFileSyncSpy).toHaveBeenCalledWith(SAVE_DATA_PATH, expected, 'utf-8');
    });

    it('should throw an error if it fails to save', () => {
      jest.spyOn(fs, 'writeFileSync').mockImplementation(() => { throw new Error('File not found'); });
      genericState.rustServerHost = RUST_SERVER_HOST;
      genericState.rustServerPort = RUST_SERVER_PORT;
      genericState.guildId = GUILD_ID;
      genericState.rustToken = RUST_TOKEN;
      genericState.messages = MESSAGES;

      expect(() => genericState.save()).toThrow('Failed to save data: File not found');
    });
  });

  describe('loadFromSave', () => {
    it('should load the correct data from save', async () => {
      const data = {
        rustServerHost: RUST_SERVER_HOST,
        rustServerPort: RUST_SERVER_PORT,
        guildId: GUILD_ID,
        rustToken: RUST_TOKEN,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        messages: Array.from(MESSAGES).map(([messageId, message]) => message)
      };
      const discordClient = new DiscordWrapper();
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(data));

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      discordClient.switchChannel = { send: async (options: string ): Promise<Message<true>> => {return { id: 'messageId1' } as Message<true>;} } as TextChannel;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      discordClient.notificationChannel = { send: async (options: string ): Promise<Message<true>> => {return { id: 'messageId2' } as Message<true>;} } as TextChannel;
      await genericState.loadFromSave(discordClient);

      expect(genericState.rustServerHost).toBe(RUST_SERVER_HOST);
      expect(genericState.rustServerPort).toBe(RUST_SERVER_PORT);
      expect(genericState.guildId).toBe(GUILD_ID);
      expect(genericState.rustToken).toBe(RUST_TOKEN);
      expect(JSON.stringify(genericState.messages)).toEqual(JSON.stringify(MESSAGES));
    });

    it('should reject if it fails to load', async () => {
      jest.spyOn(fs, 'readFileSync').mockImplementation(() => { throw new Error('ENOENT'); });
      const discordClient = new DiscordWrapper();

      await expect(genericState.loadFromSave(discordClient)).rejects.toThrow('ENOENT');
    });
  });

  describe('createMessageFromData', () => {
    it('should create a SmartSwitchMessage', async () => {
      const messageData = {
        messageId: 'messageId1',
        entityInfo: {
          name: 'name',
          entityId: 'entityId',
          entityType: EntityType.Switch,
          isActive: true
        }
      };
      const channels = {
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
        switchChannel: { send: async (options: string ): Promise<Message<true>> => {return { id: 'messageId1' } as Message<true>;} } as TextChannel,
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
        notificationChannel: { send: async (options: string ): Promise<Message<true>> => {return { id: 'messageId2' } as Message<true>;} } as TextChannel
      };
      const message = await genericState.createMessageFromData(channels, messageData);

      expect(message).toBeInstanceOf(SmartSwitchMessage);
      expect((message as SmartSwitchMessage).entityInfo.name).toBe('name');
      expect((message as SmartSwitchMessage).entityInfo.entityId).toBe('entityId');
      expect((message as SmartSwitchMessage).entityInfo.isActive).toBe(true);
    });

    it('should create a SmartAlarmMessage', async () => {
      const messageData = {
        messageId: 'messageId1',
        entityInfo: {
          name: 'name',
          entityId: 'entityId',
          entityType: EntityType.Alarm
        }
      };
      const channels = {
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
        switchChannel: { send: async (options: string ): Promise<Message<true>> => {return { id: 'messageId1' } as Message<true>;} } as TextChannel,
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
        notificationChannel: { send: async (options: string ): Promise<Message<true>> => {return { id: 'messageId2' } as Message<true>;} } as TextChannel
      };
      const message = await genericState.createMessageFromData(channels, messageData);

      expect(message).toBeInstanceOf(SmartAlarmMessage);
      expect((message as SmartAlarmMessage).entityInfo.name).toBe('name');
      expect((message as SmartAlarmMessage).entityInfo.entityId).toBe('entityId');
    });

    it('should create a StorageMonitorMessage', async () => {
      const messageData = {
        messageId: 'messageId1',
        entityInfo: {
          name: 'name',
          entityId: 'entityId',
          entityType: EntityType.StorageMonitor,
          capacity: 100
        }
      };
      const channels = {
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
        switchChannel: { send: async (options: string ): Promise<Message<true>> => {return { id: 'messageId1' } as Message<true>;} } as TextChannel,
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
        notificationChannel: { send: async (options: string ): Promise<Message<true>> => {return { id: 'messageId2' } as Message<true>;} } as TextChannel
      };
      const message = await genericState.createMessageFromData(channels, messageData);

      expect(message).toBeInstanceOf(StorageMonitorMessage);
      expect((message as StorageMonitorMessage).entityInfo.name).toBe('name');
      expect((message as StorageMonitorMessage).entityInfo.entityId).toBe('entityId');
      expect((message as StorageMonitorMessage).entityInfo.capacity).toBe(100);
    });

    it('should throw an error if the entity type is unknown', async () => {
      const messageData = {
        messageId: 'messageId1',
        entityInfo: {
          name: 'name',
          entityId: 'entityId'
        }
      };

      const channels = {
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
        switchChannel: { send: async (options: string ): Promise<Message<true>> => {return { id: 'messageId1' } as Message<true>;} } as TextChannel,
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
        notificationChannel: { send: async (options: string ): Promise<Message<true>> => {return { id: 'messageId2' } as Message<true>;} } as TextChannel
      };

      //@ts-expect-error - Testing for error
      await expect(genericState.createMessageFromData(channels, messageData)).rejects.toThrow('Unknown entity type');
    });
  });

  describe('attemptToSendMessage', () => {
    it('should just set the message if it already exists', async () => {
      //eslint-disable-next-line @typescript-eslint/no-unused-vars
      const switchChannel = { messages: { fetch: async (messageId: string): Promise<Message<true>> => {return { id: 'messageId1' } as Message<true>;} } } as TextChannel;
      const message = new SmartSwitchMessage(switchChannel, new SmartSwitchEntityInfo('name', 'entityId'));

      const sentMessage = await genericState['attemptToSendMessage'](message, 'messageId1');

      expect(sentMessage.message).toEqual({ id: 'messageId1' });
    });

    it('should send the message if no messageId is provided', async () => {
      const switchChannel = {
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
        send: async (content: string): Promise<Message<true>> => {return { id: 'messageId1' } as Message<true>;},
        messages: {
          //eslint-disable-next-line @typescript-eslint/no-unused-vars
          fetch: async (messageId: string): Promise<Message<true>> => {return { id: 'messageId1' } as Message<true>;}
        }
      } as TextChannel;
      const message = new SmartSwitchMessage(switchChannel, new SmartSwitchEntityInfo('name', 'entityId'));
      const messageSendSpy = jest.spyOn(message, 'send');

      await genericState['attemptToSendMessage'](message);

      expect(messageSendSpy).toHaveBeenCalled();
    });

    it('should send the message if the fetch call errors', async () => {
      const switchChannel = {
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
        send: async (content: string): Promise<Message<true>> => {return { id: 'messageId1' } as Message<true>;},
        messages: {
          //eslint-disable-next-line @typescript-eslint/no-unused-vars
          fetch: async (messageId: string): Promise<Message<true>> => {
            throw new Error('Not found');
            return { id: 'messageId1' } as Message<true>;}
        }
      } as TextChannel;
      const message = new SmartSwitchMessage(switchChannel, new SmartSwitchEntityInfo('name', 'entityId'));
      const messageSendSpy = jest.spyOn(message, 'send');

      await genericState['attemptToSendMessage'](message);

      expect(messageSendSpy).toHaveBeenCalled();
    });
  });
});