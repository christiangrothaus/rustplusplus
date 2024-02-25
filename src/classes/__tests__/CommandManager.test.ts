import CommandManager from '../CommandManager';
import fs from 'fs';
import path from 'path';

const mockPut = jest.fn().mockResolvedValue(undefined);
jest.mock('discord.js', () => {
  return {
    ...jest.requireActual('discord.js'),
    Routes: {
      applicationGuildCommands: jest.fn().mockReturnValue(undefined)
    },
    REST: jest.fn().mockImplementation(() => {
      return {
        setToken: jest.fn(() => {
          return {
            put: mockPut
          };
        })
      };
    })
  };
});

describe('CommandManager', () => {

  beforeEach(() => {
    process.env = {};
    jest.restoreAllMocks();
  });

  describe('ctor', () => {
    it('should set the guild ID', () => {
      const guildId = '123';

      const manager = new CommandManager(guildId);

      expect(manager['guildId']).toBe(guildId);
    });
  });

  describe('loadCommands', () => {
    it('should load the commands in the command directory', async () => {
      const manager = new CommandManager('123');
      const readdirSyncSpy = jest.spyOn(fs, 'readdirSync').mockReturnValue([]);
      jest.spyOn(manager as any, 'postCommands').mockResolvedValue(undefined);
      const expectedPath = path.join(__dirname, '../../commands');

      manager.loadCommands();

      expect(readdirSyncSpy).toHaveBeenCalledWith(expectedPath);
    });

    it('should add the command data in the dir to the list of commands', async () => {
      const commandManager = new CommandManager('123');
      jest.spyOn(commandManager as any, 'postCommands').mockResolvedValue(undefined);
      const rustInfoData = (await import('../../commands/set-rust-info')).data.toJSON();
      const expectedCommandValue = [rustInfoData];

      await commandManager.loadCommands();

      expect(commandManager['commandJson']).toHaveLength(1);
      expect(commandManager['commandJson']).toEqual(expectedCommandValue);
      expect(commandManager.commands.size).toBe(1);
      expect(commandManager.commands.get('setrustinfo')).toBeDefined();
    });

    it('should throw an error if the commands fail to load', async () => {
      const commandManager = new CommandManager('123');
      const expectedError = 'Failed to load commands: test error';
      jest.spyOn(fs, 'readdirSync').mockImplementation(() => { throw new Error('test error'); });

      expect(commandManager.loadCommands()).rejects.toThrow(expectedError);
    });

    it('should throw an error if a command is missing the data property', async () => {
      const commandManager = new CommandManager('123');
      const expectedError = /is missing a required "data" or "execute" property./;
      jest.doMock('../../commands/set-rust-info', () => { return { execute: jest.fn() }; });

      expect(commandManager.loadCommands()).rejects.toThrow(expectedError);
    });

    it('should throw an error if a command is missing the data property', async () => {
      const commandManager = new CommandManager('123');
      const expectedError = /is missing a required "data" or "execute" property./;
      jest.doMock('../../commands/set-rust-info', () => { return { data: {} }; });

      expect(commandManager.loadCommands()).rejects.toThrow(expectedError);
    });
  });

  describe('postCommands', () => {
    it('should throw an error if the application ID is missing', async () => {
      const manager = new CommandManager('123');
      process.env.DISCORD_TOKEN = '321';

      expect(manager['postCommands']()).rejects.toThrow('Missing required application ID.');
    });

    it('should throw an error if the discord token is missing', async () => {
      const manager = new CommandManager('123');
      process.env.APPLICATION_ID = '321';

      expect(manager['postCommands']()).rejects.toThrow('Missing required discord token.');
    });

    it('should throw an error if the guild ID is missing', async () => {
      // @ts-expect-error - Ignoring to test error
      const manager = new CommandManager();
      process.env.APPLICATION_ID = '321';
      process.env.DISCORD_TOKEN = '231';

      expect(manager['postCommands']()).rejects.toThrow('Missing required guild ID.');
    });

    it('should throw an error if there are no commands', async () => {
      const manager = new CommandManager('123');
      process.env.APPLICATION_ID = '321';
      process.env.DISCORD_TOKEN = '231';
      manager['commandJson'] = [];

      expect(manager['postCommands']()).rejects.toThrow('No commands loaded.');
    });

    it('should throw an error the put request rejects', async () => {
      const manager = new CommandManager('123');
      process.env.APPLICATION_ID = '321';
      process.env.DISCORD_TOKEN = '231';
      manager['commandJson'] = [{ name: 'test', description: 'test' }];
      mockPut.mockImplementationOnce(() => { throw new Error('401: Unauthorized'); });
      const expectedError = 'Failed to register application commands: 401: Unauthorized';

      expect(manager['postCommands']()).rejects.toThrow(expectedError);
    });

    it('should post the commands to discord', async () => {
      const manager = new CommandManager('123');
      process.env.APPLICATION_ID = '321';
      process.env.DISCORD_TOKEN = '231';
      manager['commandJson'] = [{ name: 'test', description: 'test' }];

      await expect(manager['postCommands']()).resolves.not.toThrow();
    });
  });
});