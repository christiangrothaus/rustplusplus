import { ChannelType, Client, Events, Guild, Interaction, Message, PermissionsBitField, TextChannel } from 'discord.js';
import DiscordWrapper from '../DiscordWrapper';
import State from '../State';
import SmartSwitchEntityInfo from '../entityInfo/SmartSwitchEntityInfo';
import SmartSwitchMessage from '../messages/SmartSwitchMessage';
import SmartAlarmMessage from '../messages/SmartAlarmMessage';
import SmartAlarmEntityInfo from '../entityInfo/SmartAlarmEntityInfo';
import StorageMonitorEntityInfo from '../entityInfo/StorageMonitorEntityInfo';
import StorageMonitorMessage from '../messages/StorageMonitorMessage';
import CommandManager from '../CommandManager';

describe('DiscordWrapper', () => {
  describe('ctor', () => {
    it('should create a new instance of a discord client', () => {
      const discordWrapper = new DiscordWrapper({} as State);

      expect(discordWrapper.client).toBeInstanceOf(Client);
    });
  });

  describe('start', () => {
    it('should login to with the discord client', async () => {
      const discordWrapper = new DiscordWrapper({} as State);
      const loginSpy = jest.spyOn(discordWrapper.client, 'login').mockResolvedValue('token');

      await discordWrapper.start();

      expect(loginSpy).toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should remove all listeners and destroy the discord client', async () => {
      const discordWrapper = new DiscordWrapper({} as State);
      const destroySpy = jest.spyOn(discordWrapper.client, 'destroy').mockResolvedValue();
      // @ts-expect-error - mocking to avoid actual call
      const removeListenersSpy = jest.spyOn(discordWrapper.client, 'removeAllListeners').mockImplementation(() => {});

      await discordWrapper.destroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(removeListenersSpy).toHaveBeenCalled();
    });
  });

  describe('onButtonInteraction', () => {
    it('should add a callback to the buttonCallbacks array', () => {
      const discordWrapper = new DiscordWrapper({} as State);
      const callback = jest.fn();

      discordWrapper.onButtonInteraction(callback);

      expect(discordWrapper['buttonCallbacks']).toContain(callback);
    });
  });

  describe('onModalSubmitInteraction', () => {
    it('should add a callback to the modalSubmitCallbacks array', () => {
      const discordWrapper = new DiscordWrapper({} as State);
      const callback = jest.fn();

      discordWrapper.onModalSubmitInteraction(callback);

      expect(discordWrapper['modalSubmitCallbacks']).toContain(callback);
    });
  });

  describe('onChatInputCommandInteraction', () => {
    it('should add a callback to the chatInputCommandCallbacks array', () => {
      const discordWrapper = new DiscordWrapper({} as State);
      const callback = jest.fn();

      discordWrapper.onChatInputCommandInteraction(callback);

      expect(discordWrapper['chatInputCommandCallbacks']).toContain(callback);
    });
  });

  describe('sendSwitchMessage', () => {
    it('should send a message to the switch channel', async () => {
      const discordWrapper = new DiscordWrapper({ messages: new Map() } as State);
      // @ts-expect-error - mocking channel
      discordWrapper.switchChannel = {
        send: jest.fn().mockResolvedValue({} as Message)
      };
      const sendMessageSpy = jest.spyOn(SmartSwitchMessage.prototype, 'send').mockImplementation(() => { return {} as Promise<Message>;});

      await discordWrapper.sendSwitchMessage(new SmartSwitchEntityInfo('name', 'id', true));

      expect(sendMessageSpy).toHaveBeenCalled();
    });
  });

  describe('sendAlarmMessage', () => {
    it('should send a message to the notfication channel', async () => {
      const discordWrapper = new DiscordWrapper({ messages: new Map() } as State);
      // @ts-expect-error - mocking channel
      discordWrapper.notificationChannel = {
        send: jest.fn().mockResolvedValue({} as Message)
      };
      const sendMessageSpy = jest.spyOn(SmartAlarmMessage.prototype, 'send').mockImplementation(() => { return {} as Promise<Message>;});

      await discordWrapper.sendAlarmMessage(new SmartAlarmEntityInfo('name', 'id'));

      expect(sendMessageSpy).toHaveBeenCalled();
    });
  });

  describe('sendStorageMessage', () => {
    it('should send a message to the notification channel', async () => {
      const discordWrapper = new DiscordWrapper({ messages: new Map() } as State);
      // @ts-expect-error - mocking channel
      discordWrapper.notificationChannel = {
        send: jest.fn().mockResolvedValue({} as Message)
      };
      const sendMessageSpy = jest.spyOn(StorageMonitorMessage.prototype, 'send').mockImplementation(() => { return {} as Promise<Message>;});

      await discordWrapper.sendStorageMessage(new StorageMonitorEntityInfo('name', 'id', 100));

      expect(sendMessageSpy).toHaveBeenCalled();
    });
  });

  describe('updateMessage', () => {
    it('should update the message with the new entity info', async () => {
      const discordWrapper = new DiscordWrapper({ messages: new Map() } as State);
      const entityInfo = new SmartSwitchEntityInfo('name', 'id', true);
      const discordMessage = { edit: jest.fn().mockResolvedValue({} as Message) };
      const message = new SmartSwitchMessage({} as TextChannel, entityInfo);
      // @ts-expect-error - mocking message
      message.message = discordMessage;
      discordWrapper.state.messages.set('id', message);

      await discordWrapper.updateMessage('id', { name: 'newName' });

      expect(message.entityInfo.name).toBe('newName');
      expect(discordWrapper.state.messages.get('id').entityInfo.name).toBe('newName');
    });
  });

  describe('deleteMessage', () => {
    it('should delete the message', async () => {
      const discordWrapper = new DiscordWrapper({ messages: new Map() } as State);
      const entityInfo = new SmartSwitchEntityInfo('name', 'id', true);
      const discordMessage = { delete: jest.fn().mockResolvedValue({} as Message) };
      const message = new SmartSwitchMessage({} as TextChannel, entityInfo);
      // @ts-expect-error - mocking message
      message.message = discordMessage;
      discordWrapper.state.messages.set('id', message);

      await discordWrapper.deleteMessage('id');

      expect(discordMessage.delete).toHaveBeenCalled();
      expect(discordWrapper.state.messages.get('id')).toBeUndefined();
    });
  });

  describe('onChannelsReady', () => {
    it('should call the callback if the channels are already set', () => {
      const discordWrapper = new DiscordWrapper({} as State);
      discordWrapper.switchChannel = {} as TextChannel;
      discordWrapper.notificationChannel = {} as TextChannel;
      const callback = jest.fn();

      discordWrapper.onChannelsReady(callback);

      expect(callback).toHaveBeenCalled();
    });

    it('should add the callback to the channelsReadyCallbacks array if the channels are not set', () => {
      const discordWrapper = new DiscordWrapper({} as State);
      const callback = jest.fn();

      discordWrapper.onChannelsReady(callback);

      expect(discordWrapper['channelsReadyCallbacks']).toContain(callback);
    });
  });

  describe('createChannels', () => {
    it('should create the channels if they do not exist', async () => {
      const createChannelChild = jest.fn().mockResolvedValue({});
      const createChannelCategory = jest.fn().mockResolvedValue({
        children: {
          create: createChannelChild
        }
      });
      const discordWrapper = new DiscordWrapper({} as State);
      const guild = {
        roles: {
          everyone: 'everyone'
        },
        channels: {
          fetch: jest.fn().mockResolvedValue([]),
          create: createChannelCategory
        }
      };
      // @ts-expect-error - mocking guild
      discordWrapper.client.guilds = { fetch: jest.fn().mockResolvedValue(guild) };

      await discordWrapper['createChannels']('guildId');

      expect(createChannelCategory).toHaveBeenCalledWith({
        name: 'Rust++',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [{
          id: 'everyone',
          deny: new PermissionsBitField(['SendMessages']),
          allow: new PermissionsBitField(['ViewChannel', 'ReadMessageHistory'])
        }]
      });
      expect(createChannelChild).toHaveBeenCalledWith({ name: 'Notifications', type: ChannelType.GuildText });
      expect(createChannelChild).toHaveBeenCalledWith({ name: 'Switches', type: ChannelType.GuildText });
    });

    it('should set the channels if they already exist', async () => {
      const discordWrapper = new DiscordWrapper({} as State);
      const mockNotificationChannel = { name: 'Notifications', type: ChannelType.GuildText };
      const mockSwitchChannel = { name: 'Switches', type: ChannelType.GuildText };
      const mockCategoryChannel = {
        name: 'Rust++',
        type: ChannelType.GuildCategory,
        children: {
          cache: [
            mockNotificationChannel,
            mockSwitchChannel
          ]
        }
      };
      const guild = {
        roles: {
          everyone: 'everyone'
        },
        channels: {
          fetch: jest.fn().mockResolvedValue([mockCategoryChannel])
        }
      };
      // @ts-expect-error - mocking guild
      discordWrapper.client.guilds = { fetch: jest.fn().mockResolvedValue(guild) };

      await discordWrapper['createChannels']('guildId');

      expect(discordWrapper.notificationChannel).toBe(mockNotificationChannel);
      expect(discordWrapper.switchChannel).toBe(mockSwitchChannel);
    });
  });

  describe('onGuildJoin', () => {
    it('should create the channels and command manager', () => {
      const discordWrapper = new DiscordWrapper({} as State);
      const loadCommandsSpy = jest.spyOn(CommandManager.prototype, 'loadCommands').mockImplementation(async () => {});
      discordWrapper['createChannels'] = jest.fn();

      discordWrapper['onGuildJoin']({ id: 'guildId' } as Guild);

      expect(discordWrapper['createChannels']).toHaveBeenCalledWith('guildId');
      expect(loadCommandsSpy).toHaveBeenCalled();
    });
  });

  describe('onInteractionCreate', () => {
    it('should call the button callbacks if the interaction is a button', () => {
      const discordWrapper = new DiscordWrapper({} as State);
      const callback = jest.fn();
      discordWrapper['buttonCallbacks'].push(callback);

      // @ts-expect-error - mocking interaction
      discordWrapper['onInteractionCreate']({ isButton: jest.fn().mockReturnValue(true) } as Interaction);

      expect(callback).toHaveBeenCalled();
    });

    it('should call the modal submit callbacks if the interaction is a modal submit', () => {
      const discordWrapper = new DiscordWrapper({} as State);
      const callback = jest.fn();
      discordWrapper['modalSubmitCallbacks'].push(callback);

      // @ts-expect-error - mocking interaction
      discordWrapper['onInteractionCreate']({
        isButton: jest.fn().mockReturnValue(false),
        isModalSubmit: jest.fn().mockReturnValue(true)
      } as Interaction);

      expect(callback).toHaveBeenCalled();
    });

    it('should call the chat input command callbacks if the interaction is a chat input command', () => {
      const discordWrapper = new DiscordWrapper({} as State);
      const callback = jest.fn();
      discordWrapper['chatInputCommandCallbacks'].push(callback);

      // @ts-expect-error - mocking interaction
      discordWrapper['onInteractionCreate']({
        isButton: jest.fn().mockReturnValue(false),
        isModalSubmit: jest.fn().mockReturnValue(false),
        isChatInputCommand: jest.fn().mockReturnValue(true)
      } as Interaction);

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('registerListeners', () => {
    it('should register the listeners for the discord client', () => {
      const discordWrapper = new DiscordWrapper({} as State);
      discordWrapper['createChannels'] = jest.fn();
      discordWrapper['onGuildJoin'] = jest.fn();
      discordWrapper['onInteractionCreate'] = jest.fn();
      // @ts-expect-error - mocking client
      discordWrapper.client = {
        once: jest.fn(),
        on: jest.fn()
      };

      discordWrapper['registerListeners']();

      expect(discordWrapper.client.once).toHaveBeenCalledWith(Events.GuildCreate, discordWrapper['onGuildJoin']);
      expect(discordWrapper.client.on).toHaveBeenCalledWith(Events.InteractionCreate, discordWrapper['onInteractionCreate']);
    });
  });

  describe('callChannelsReadyCallbacks', () => {
    it('should call the callback if the channels are set', () => {
      const discordWrapper = new DiscordWrapper({} as State);
      discordWrapper.switchChannel = {} as TextChannel;
      discordWrapper.notificationChannel = {} as TextChannel;
      const callback = jest.fn();
      discordWrapper['channelsReadyCallbacks'] = [callback];

      discordWrapper['callChannelsReadyCallbacks']();

      expect(callback).toHaveBeenCalled();
    });

    it('should not call the callback if the channels are not set', () => {
      const discordWrapper = new DiscordWrapper({} as State);
      const callback = jest.fn();
      discordWrapper['channelsReadyCallbacks'] = [callback];

      discordWrapper['callChannelsReadyCallbacks']();

      expect(callback).not.toHaveBeenCalled();
    });
  });
});