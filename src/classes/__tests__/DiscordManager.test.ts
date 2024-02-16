import { Awaitable, Events } from 'discord.js';
import DiscordManager from '../DiscordManager';
import PushListener from '../PushListener';
import SmartSwitchEntityInfo from '../entityInfo/SmartSwitchEntityInfo';
import SmartAlarmEntityInfo from '../entityInfo/SmartAlarmEntityInfo';
import StorageMonitorEntityInfo from '../entityInfo/StorageMonitorEntityInfo';
import SmartSwitchMessage from '../messages/SmartSwitchMessage';
import StorageMonitorMessage from '../messages/StorageMonitorMessage';
import SmartAlarmMessage from '../messages/SmartAlarmMessage';

jest.mock('../State', () => {
  return jest.fn().mockImplementation(() => {
    return {
      loadFromSave: jest.fn().mockResolvedValue({}),
      save: jest.fn().mockResolvedValue({}),
      onChannelIdChange: jest.fn(),
      messages: {}
    };
  });
});

jest.mock('../PushListener', () => {
  return jest.fn().mockImplementation(() => {
    return {
      onNewSwitch: jest.fn(),
      start: jest.fn(),
      destroy: jest.fn(),
      loadConfig: jest.fn()
    };
  });
});

jest.mock('discord.js', () => {
  return {
    ...jest.requireActual('discord.js'),
    Client: jest.fn().mockImplementation(() => {
      return {
        channels: {
          fetch: jest.fn().mockResolvedValue({
            send: jest.fn().mockResolvedValue({
              id: 'messageId',
              channel: {
                id: 'channelId'
              }
            })
          })
        },
        once: jest.fn((event: Events, cb: (obj: { [key: string]: any }) => Awaitable<void>): void => {
          cb({
            user: { tag: 'user#1234' },
            id: '1234567890'
          });
          return;
        }),
        on: jest.fn((event: Events, cb: (interaction: { [key: string]: any }) => Awaitable<void>): void => {
          const isModalSubmit = jest.fn(() => false);
          const isButton = jest.fn(() => true);
          const isChatInputCommand = jest.fn(() => false);
          const followUp = jest.fn().mockResolvedValue({});
          const reply = jest.fn().mockResolvedValue({});
          const editReply = jest.fn().mockResolvedValue({});
          const deferReply = jest.fn().mockResolvedValue({});
          const interaction = {
            isModalSubmit,
            isButton,
            isChatInputCommand,
            replied: false,
            defered: false,
            followUp,
            reply,
            commandName: 'commandName',
            message: {
              delete: jest.fn().mockResolvedValue({}),
              embeds: [
                { title: 'embedTitle' }
              ]
            },
            editReply,
            deferReply,
            customId: 'customId-action'
          };
          cb(interaction);
          return;
        }),
        login: jest.fn().mockResolvedValue('')
      };
    }),
    GatewayIntentBits: {
      Guilds: 1
    },
    REST: jest.fn().mockReturnValue({
      setToken: jest.fn().mockReturnValue({
        put: jest.fn().mockResolvedValue([1,2,3])
      })
    })
  };
});

describe('DiscordManager', () => {
  let discordManager: DiscordManager;

  beforeEach(() => {
    discordManager = new DiscordManager();

    jest.clearAllMocks();
    jest.restoreAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(0);
    jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit() was called'); });
  });

  afterEach(() => {
    try {
      discordManager.destroy();
    } catch (e) {} //eslint-disable-line
  });

  describe('ctor', () => {
    it('should create a new instance of DiscordManager', () => {
      expect(discordManager).toBeInstanceOf(DiscordManager);
    });
  });

  describe('destroy', () => {
    it('should save the state', () => {

      expect(() => {
        discordManager.destroy();
      }).toThrow();

      expect(discordManager.state.save).toHaveBeenCalled();
    });

    it('should exit the process', () => {
      expect(() => {
        discordManager.destroy();
      }).toThrow('process.exit() was called');
    });

    it('should destroy the push listener if there is one', () => {
      discordManager.pushListener = new PushListener();

      expect(() => {
        discordManager.destroy();
      }).toThrow();

      expect(discordManager.pushListener.destroy).toHaveBeenCalled();
    });

    it('should not attempt to destroy the push listener if there is not one', () => {
      expect(() => {
        expect(() => {
          discordManager.destroy();
        }).toThrow('process.exit() was called');
      }).not.toThrow();

      expect(discordManager.pushListener).toBeUndefined();
    });
  });

  describe('createNewMessage', () => {
    describe('SmartSwitchMessage', () => {
      it('should create a new switch message', async () => {
        discordManager.start();

        const message = await discordManager['createNewMessage']('Switch', <SmartSwitchEntityInfo>{
          entityId: '1',
          name: 'Switch',
          isActive: true
        });

        expect(message).toBeDefined();
      });

      it('should add the message to the state', async () => {
        const expectedMessage = new SmartSwitchMessage({ name: 'Switch', entityId: '1', isActive: true });
        expectedMessage.messageId = 'messageId';
        expectedMessage.channelId = 'channelId';
        discordManager.start();

        await discordManager['createNewMessage']('Switch', <SmartSwitchEntityInfo>{
          entityId: '1',
          name: 'Switch',
          isActive: true
        });

        expect(discordManager.state.messages['messageId']).toEqual(expectedMessage);
      });
    });

    describe('SmartAlarmMessage', () => {
      it('should create a new alarm message', async () => {
        discordManager.start();

        const message = await discordManager['createNewMessage']('Alarm', <SmartAlarmEntityInfo>{
          entityId: '1',
          name: 'Switch',
          isActive: true
        });

        expect(message).toBeDefined();
      });

      it('should add the message to the state', async () => {
        const expectedMessage = new SmartAlarmMessage({ name: 'Alarm', entityId: '1', isActive: false });
        expectedMessage.messageId = 'messageId';
        expectedMessage.channelId = 'channelId';
        discordManager.start();

        await discordManager['createNewMessage']('Alarm', <SmartAlarmEntityInfo>{
          entityId: '1',
          name: 'Alarm',
          isActive: false
        });

        expect(discordManager.state.messages['messageId']).toEqual(expectedMessage);
      });
    });

    describe('StorageMonitorMessage', () => {
      it('should create a new storage monitor message', async () => {
        discordManager.start();

        const message = await discordManager['createNewMessage']('StorageMonitor', <StorageMonitorEntityInfo>{
          entityId: '1',
          name: 'StorageMonitor',
          capacity: 100
        });

        expect(message).toBeDefined();
      });

      it('should add the message to the state', async () => {
        const expectedMessage = new StorageMonitorMessage({ name: 'StorageMonitor', entityId: '1', capacity: 100 });
        expectedMessage.messageId = 'messageId';
        expectedMessage.channelId = 'channelId';
        discordManager.start();

        await discordManager['createNewMessage']('StorageMonitor', <StorageMonitorEntityInfo>{
          entityId: '1',
          name: 'StorageMonitor',
          capacity: 100
        });

        expect(discordManager.state.messages['messageId']).toEqual(expectedMessage);
      });
    });
  });
});