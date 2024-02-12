import State, { SAVE_DATA_PATH } from '../State';
import fs from 'fs';

const mockReadFileSync = jest.fn();
const mockWriteFileSync = jest.fn();

const CHANNEL_ID = '3972311231';
const RUST_SERVER_HOST = 'localhost';
const RUST_SERVER_PORT = 25565;
const GUILD_ID = '1234';
const RUST_TOKEN = 'myToken';
const MESSAGES = { 'messageId': 'entityId' };

describe('state', () => {
  let genericState: State;

  beforeEach(() => {
    jest.spyOn(fs, 'readFileSync').mockImplementation(mockReadFileSync);
    jest.spyOn(fs, 'writeFileSync').mockImplementation(mockWriteFileSync);

    genericState = new State();

    genericState.channelId = CHANNEL_ID;
    genericState.rustServerHost = RUST_SERVER_HOST;
    genericState.rustServerPort = RUST_SERVER_PORT;
    genericState.guildId = GUILD_ID;
    genericState.rustToken = RUST_TOKEN;
    genericState.messages = MESSAGES;
  });

  it('should create a new state', () => {
    const state = new State();

    expect(state).toBeDefined();
  });

  it('should set channelId', () => {
    const state = new State();
    const channelId = '1234';

    state.channelId = channelId;

    expect(state.channelId).toBe(channelId);
  });

  it('should save data', () => {
    const expected = JSON.stringify({
      channelId: CHANNEL_ID,
      rustServerHost: RUST_SERVER_HOST,
      rustServerPort: RUST_SERVER_PORT,
      guildId: GUILD_ID,
      messages: MESSAGES,
      rustToken: RUST_TOKEN
    });

    genericState.save();

    expect(fs.writeFileSync).toHaveBeenCalledWith(SAVE_DATA_PATH, expected, 'utf-8');
  });

  it('should load data from save', () => {
    const expected = {
      channelId: CHANNEL_ID,
      rustServerHost: RUST_SERVER_HOST,
      rustServerPort: RUST_SERVER_PORT
    };

    mockReadFileSync.mockReturnValue(JSON.stringify(expected));

    const result = genericState.loadFromSave();

    expect(result).toBe(true);
    expect(genericState.channelId).toBe(CHANNEL_ID);
    expect(genericState.rustServerHost).toBe(RUST_SERVER_HOST);
    expect(genericState.rustServerPort).toBe(RUST_SERVER_PORT);
  });
});