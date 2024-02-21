import State, { SAVE_DATA_PATH } from '../State';
import fs from 'fs';

describe('state', () => {
  let genericState: State;

  let RUST_SERVER_HOST: string;
  let RUST_SERVER_PORT: number;
  let GUILD_ID: string;
  let RUST_TOKEN: string;

  beforeAll(() => {
    RUST_SERVER_HOST = 'localhost';
    RUST_SERVER_PORT = 25565;
    GUILD_ID = '1234';
    RUST_TOKEN = 'myToken';
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
    const expected = JSON.stringify({
      rustServerHost: RUST_SERVER_HOST,
      rustServerPort: RUST_SERVER_PORT,
      guildId: GUILD_ID,
      rustToken: RUST_TOKEN
    });

    genericState.save();

    expect(writeFileSyncSpy).toHaveBeenCalledWith(SAVE_DATA_PATH, expected, 'utf-8');
  });

  it('should load data from save', () => {

    const data = {
      rustServerHost: RUST_SERVER_HOST,
      rustServerPort: RUST_SERVER_PORT,
      guildId: GUILD_ID,
      rustToken: RUST_TOKEN
    };
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(data));

    const result = genericState.loadFromSave();

    expect(result).toBe(true);
    expect(genericState.rustServerHost).toBe(RUST_SERVER_HOST);
    expect(genericState.rustServerPort).toBe(RUST_SERVER_PORT);
    expect(genericState.guildId).toBe(GUILD_ID);
    expect(genericState.rustToken).toBe(RUST_TOKEN);
  });
});