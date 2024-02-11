import State from '../State';
import fs from 'fs';

const mockReadFileSync = jest.fn();
const mockWriteFileSync = jest.fn();

const CHANNEL_ID = '3972311231';
const RUST_SERVER_HOST = 'localhost';
const RUST_SERVER_PORT = 25565;

let state: State;

describe('state', () => {
  beforeEach(() => {
    jest.spyOn(fs, 'readFileSync').mockImplementation(mockReadFileSync);
    jest.spyOn(fs, 'writeFileSync').mockImplementation(mockWriteFileSync);

    state = new State();

    state.channelId = CHANNEL_ID;
    state.rustServerHost = RUST_SERVER_HOST;
    state.rustServerPort = RUST_SERVER_PORT;

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
      rustServerPort: RUST_SERVER_PORT
    });

    state.save();

    expect(fs.writeFileSync).toHaveBeenCalledWith('save.json', expected, 'utf-8');
  });

  it('should load data from save', () => {
    const expected = {
      channelId: CHANNEL_ID,
      rustServerHost: RUST_SERVER_HOST,
      rustServerPort: RUST_SERVER_PORT
    };

    mockReadFileSync.mockReturnValue(JSON.stringify(expected));

    const result = state.loadFromSave();

    expect(result).toBe(true);
    expect(state.channelId).toBe(CHANNEL_ID);
    expect(state.rustServerHost).toBe(RUST_SERVER_HOST);
    expect(state.rustServerPort).toBe(RUST_SERVER_PORT);
  });
});