import SaveData from '../SaveData';
import fs from 'fs';
import SmartSwitch from '../rust/SmartSwitch';

const mockReadFileSync = jest.fn();
const mockWriteFileSync = jest.fn();

const CHANNEL_ID = '3972311231';
const SWITCH_ID = '4321';
const SWITCHES = { [SWITCH_ID]: new SmartSwitch('test', SWITCH_ID, true, '1234') };
const RUST_SERVER_HOST = 'localhost';
const RUST_SERVER_PORT = 25565;

let saveData: SaveData;

describe('SaveData', () => {
  beforeEach(() => {
    jest.spyOn(fs, 'readFileSync').mockImplementation(mockReadFileSync);
    jest.spyOn(fs, 'writeFileSync').mockImplementation(mockWriteFileSync);

    saveData = new SaveData();

    saveData.channelId = CHANNEL_ID;
    saveData.switches = SWITCHES;
    saveData.rustServerHost = RUST_SERVER_HOST;
    saveData.rustServerPort = RUST_SERVER_PORT;

  });

  it('should create a new SaveData', () => {
    const saveData = new SaveData();

    expect(saveData).toBeDefined();
  });

  it('should set channelId', () => {
    const saveData = new SaveData();
    const channelId = '1234';

    saveData.channelId = channelId;

    expect(saveData.channelId).toBe(channelId);
  });

  it('should save data', () => {
    const expected = JSON.stringify({
      switches: SWITCHES,
      channelId: CHANNEL_ID,
      rustServerHost: RUST_SERVER_HOST,
      rustServerPort: RUST_SERVER_PORT
    });

    saveData.save();

    expect(fs.writeFileSync).toHaveBeenCalledWith('save.json', expected, 'utf-8');
  });

  it('should load data from save', () => {
    const expected = {
      switches: { [SWITCH_ID]: SWITCHES[SWITCH_ID].toJSON() },
      channelId: CHANNEL_ID,
      rustServerHost: RUST_SERVER_HOST,
      rustServerPort: RUST_SERVER_PORT
    };

    mockReadFileSync.mockReturnValue(JSON.stringify(expected));

    const result = saveData.loadFromSave();

    expect(result).toBe(true);
    expect(saveData.switches).toEqual(SWITCHES);
    expect(saveData.channelId).toBe(CHANNEL_ID);
    expect(saveData.rustServerHost).toBe(RUST_SERVER_HOST);
    expect(saveData.rustServerPort).toBe(RUST_SERVER_PORT);
  });
});