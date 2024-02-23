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

  it('should save data', () => {
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

  it('should load data from save', async () => {
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
});