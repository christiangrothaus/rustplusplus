import State, { SAVE_DATA_PATH } from '../State';
import fs from 'fs';
import Switch from '../entities/Switch';
import Alarm from '../entities/Alarm';
import StorageMonitor from '../entities/StorageMonitor';
import SwitchEntityInfo from '../entityInfo/SwitchEntityInfo';
import AlarmEntityInfo from '../entityInfo/AlarmEntityInfo';
import StorageMonitorEntityInfo from '../entityInfo/StorageMonitorEntityInfo';

jest.mock('fs', () => {
  return {
    ...jest.requireActual('fs'),
    readFileSync: jest.fn().mockImplementation(() => '{}'),
    writeFileSync: jest.fn().mockImplementation(() => {})
  };
});

describe('state', () => {
  beforeAll(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1);
  });

  afterEach(() => {
    State['instance'] = undefined;
  });

  it('should return the the state instance', () => {
    const state = State.getInstance();

    expect(state).toBeDefined();
  });

  describe('save', () => {
    it('should save the correct data', () => {
      const writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
      const state = State.getInstance();
      state.rustToken = 'myToken';
      state.rustServerHost = 'localhost';
      state.rustServerPort = 25565;
      state.guildId = '1234';
      state.pushIds = ['messageId1', 'messageId2'];
      state.pairedSwitches.set('entityId', new Switch(new SwitchEntityInfo('name', 'entityId', true)));
      state.pairedStorageMonitors.set('entityId', new StorageMonitor(new StorageMonitorEntityInfo('name', 'entityId', 100)));
      state.pairedAlarms.set('entityId', new Alarm(new AlarmEntityInfo('name', 'entityId')));

      const expected = JSON.stringify({
        'rustServerHost': 'localhost',
        'rustServerPort': 25565,
        'guildId': '1234',
        'rustToken': 'myToken',
        'pushIds': [
          'messageId1',
          'messageId2'
        ],
        'pairedSwitches': [
          {
            'name': 'name',
            'entityId': 'entityId',
            'entityType': 'Switch',
            'isActive': true
          }
        ],
        'pairedAlarms': [
          {
            'name': 'name',
            'entityId': 'entityId',
            'entityType': 'Alarm'
          }
        ],
        'pairedStorageMonitors': [
          {
            'name': 'name',
            'entityId': 'entityId',
            'entityType': 'StorageMonitor',
            'capacity': 100
          }
        ]
      }, null, 2);

      state.save();

      expect(writeFileSyncSpy).toHaveBeenCalledWith(SAVE_DATA_PATH, expected, 'utf-8');
    });

    it('should throw an error if it fails to save', () => {
      jest.spyOn(fs, 'writeFileSync').mockImplementation(() => { throw new Error('File not found'); });
      const state = State.getInstance();

      expect(() => state.save()).toThrow('Failed to save data: File not found');
    });
  });

  describe('getInstance', () => {
    it('should load the correct data from the save', async () => {
      const RUST_SERVER_HOST = 'localhost';
      const RUST_SERVER_PORT = 28083;
      const GUILD_ID = '1234';
      const RUST_TOKEN = 'myToken';
      const PAIRED_SWITCHES = [new Switch(new SwitchEntityInfo('switch', '1', true))];
      const PAIRED_ALARMS = [new Alarm(new AlarmEntityInfo('alarm', '2'))];
      const PAIRED_STORAGE_MONITORS = [new StorageMonitor(new StorageMonitorEntityInfo('storageMonitor', '3', 100))];
      const data = {
        rustServerHost: RUST_SERVER_HOST,
        rustServerPort: RUST_SERVER_PORT,
        guildId: GUILD_ID,
        rustToken: RUST_TOKEN,
        pairedSwitches: PAIRED_SWITCHES,
        pairedAlarms: PAIRED_ALARMS,
        pairedStorageMonitors: PAIRED_STORAGE_MONITORS
      };
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(data));
      const expectedPairedSwitches = new Map<string, Switch>();
      expectedPairedSwitches.set('1', PAIRED_SWITCHES[0]);
      const expectedPairedAlarms = new Map<string, Alarm>();
      expectedPairedAlarms.set('2', PAIRED_ALARMS[0]);
      const expectedPairedStorageMonitors = new Map<string, StorageMonitor>();
      expectedPairedStorageMonitors.set('3', PAIRED_STORAGE_MONITORS[0]);

      const state = State.getInstance();

      expect(state.rustServerHost).toBe(RUST_SERVER_HOST);
      expect(state.rustServerPort).toBe(RUST_SERVER_PORT);
      expect(state.guildId).toBe(GUILD_ID);
      expect(state.rustToken).toBe(RUST_TOKEN);
      expect(state.pairedSwitches).toEqual(expectedPairedSwitches);
      expect(state.pairedAlarms).toEqual(expectedPairedAlarms);
      expect(state.pairedStorageMonitors).toEqual(expectedPairedStorageMonitors);
    });

    it('should throw if it fails to load', async () => {
      jest.spyOn(fs, 'readFileSync').mockImplementation(() => { throw new Error('ENOENT'); });

      expect(() => State.getInstance()).toThrow('ENOENT');
    });
  });
});