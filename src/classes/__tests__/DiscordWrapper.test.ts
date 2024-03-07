import {
  ButtonInteraction,
  CategoryChannel,
  CategoryCreateChannelOptions,
  ChatInputCommandInteraction,
  Collection,
  Events,
  ChannelType,
  Guild,
  GuildChannelCreateOptions,
  ModalSubmitInteraction,
  OAuth2Guild,
  Role,
  TextChannel
} from 'discord.js';
import DiscordWrapper, { InteractionCreateEvents } from '../DiscordWrapper';
import CommandManager from '../CommandManager';

const mockGuildCollection = new Collection<string, OAuth2Guild>();
const mockCreatedCategoryChildren = {
  create: jest.fn().mockImplementation((childOptions: CategoryCreateChannelOptions) => {
    return {
      name: childOptions.name,
      type: childOptions.type
    } as TextChannel;
  })
};
// @ts-expect-error - mocking guild
const mockGuild = {
  id: 'guildId',
  roles: {
    everyone: {} as Role
  },
  channels: {
    fetch: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockImplementation((options: GuildChannelCreateOptions & { type: ChannelType.GuildCategory; }) => {
      if (options.type === ChannelType.GuildCategory) {
        // @ts-expect-error - mocking category channel
        return {
          children: mockCreatedCategoryChildren
        } as CategoryChannel;
      }
    })
  }
} as Guild;
// @ts-expect-error - mocking guild
mockGuildCollection.set('guildId', { fetch: jest.fn().mockResolvedValue(mockGuild) } as OAuth2Guild);

jest.mock('discord.js', () => {
  return {
    ...jest.requireActual('discord.js'),
    Client: jest.fn().mockImplementation(() => {
      return {
        login: jest.fn().mockResolvedValue('token'),
        destroy: jest.fn().mockResolvedValue(undefined),
        guilds: {
          fetch: jest.fn().mockResolvedValue(mockGuildCollection)
        },
        removeAllListeners: jest.fn(),
        on: jest.fn(),
        once: jest.fn(),
        user: {
          id: 'botId'
        }
      };
    }),
    PermissionsBitField: jest.fn().mockImplementation(() => {
      return {
        add: jest.fn(),
        remove: jest.fn()
      };
    })
  };
});

describe('DiscordWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('start', () => {
    it('should login to with the discord client', async () => {
      const discordWrapper = new DiscordWrapper();
      const loginSpy = jest.spyOn(discordWrapper.client, 'login').mockResolvedValue('token');

      await discordWrapper.start();

      expect(loginSpy).toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should remove all listeners and destroy the discord client', async () => {
      const discordWrapper = new DiscordWrapper();
      const destroySpy = jest.spyOn(discordWrapper.client, 'destroy').mockResolvedValue();
      // @ts-expect-error - mocking to avoid actual call
      const removeListenersSpy = jest.spyOn(discordWrapper.client, 'removeAllListeners').mockImplementation(() => {});

      await discordWrapper.destroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(removeListenersSpy).toHaveBeenCalled();
    });
  });

  describe('sendPairedDeviceMessage', () => {

  });

  describe('createChannels', () => {
    it('should create the channels if they do not exist', async () => {
      const discordWrapper = new DiscordWrapper();

      await discordWrapper['createChannels'](mockGuild);

      expect(discordWrapper['notificationsChannel']).toEqual({ name: 'notifications', type: ChannelType.GuildText });
      expect(discordWrapper['pairedDevicesChannel']).toEqual({ name: 'paired-devices', type: ChannelType.GuildText });
    });

    it('should get the channels if they already exist', async () => {
      const mockChildren = {
        cache: [
          { name: 'notifications', type: ChannelType.GuildText },
          { name: 'paired-devices', type: ChannelType.GuildText }
        ]
      };
      mockGuild.channels.fetch = jest.fn().mockResolvedValue([{ name: 'Rust++', type: ChannelType.GuildCategory, children: mockChildren }]);
      const discordWrapper = new DiscordWrapper();

      await discordWrapper['createChannels'](mockGuild);

      expect(mockGuild.channels.create).not.toHaveBeenCalled();
      expect(discordWrapper['notificationsChannel']).toEqual({ name: 'notifications', type: ChannelType.GuildText });
      expect(discordWrapper['pairedDevicesChannel']).toEqual({ name: 'paired-devices', type: ChannelType.GuildText });
    });
  });

  describe('onGuildJoin', () => {
    it('should load the discord commands', () => {
      const discordWrapper = new DiscordWrapper();
      const loadCommandsSpy = jest.spyOn(CommandManager.prototype, 'loadCommands').mockImplementation(async () => {});
      discordWrapper['createChannels'] = jest.fn();

      discordWrapper['onGuildJoin']({ id: 'guildId' } as Guild);

      expect(loadCommandsSpy).toHaveBeenCalled();
    });
  });

  describe('onInteractionCreate', () => {
    it('should emit a button interaction if the interaction is from a button', () => {
      const discordWrapper = new DiscordWrapper();
      const emitSpy = jest.spyOn(discordWrapper, 'emit');
      // @ts-expect-error - mocking interaction
      const interaction = { isButton: jest.fn().mockReturnValue(true) } as ButtonInteraction;

      discordWrapper['onInteractionCreate'](interaction);

      expect(emitSpy).toHaveBeenCalledWith(InteractionCreateEvents.Button, interaction);
    });

    it('should emit a modal submit interaction if the interaction is from a modal submission', () => {
      const discordWrapper = new DiscordWrapper();
      const emitSpy = jest.spyOn(discordWrapper, 'emit');
      // @ts-expect-error - mocking interaction
      const interaction = {
        isModalSubmit: jest.fn().mockReturnValue(true),
        isButton: jest.fn().mockReturnValue(false)
      } as ModalSubmitInteraction;

      discordWrapper['onInteractionCreate'](interaction);

      expect(emitSpy).toHaveBeenCalledWith(InteractionCreateEvents.ModalSubmit, interaction);
    });

    it('should emit a chat input command interaction if the interaction is from a chat input command', () => {
      const discordWrapper = new DiscordWrapper();
      const emitSpy = jest.spyOn(discordWrapper, 'emit');
      // @ts-expect-error - mocking interaction
      const interaction = {
        isChatInputCommand: jest.fn().mockReturnValue(true),
        isButton: jest.fn().mockReturnValue(false),
        isModalSubmit: jest.fn().mockReturnValue(false)
      } as ChatInputCommandInteraction;

      discordWrapper['onInteractionCreate'](interaction);

      expect(emitSpy).toHaveBeenCalledWith(InteractionCreateEvents.ChatInputCommand, interaction);
    });
  });

  describe('registerListeners', () => {
    it('should register the listeners for the discord client', () => {
      const discordWrapper = new DiscordWrapper();
      discordWrapper['createChannels'] = jest.fn();
      discordWrapper['onGuildJoin'] = jest.fn();
      discordWrapper['onInteractionCreate'] = jest.fn();
      // @ts-expect-error - mocking client
      discordWrapper.client = {
        once: jest.fn(),
        on: jest.fn()
      };

      discordWrapper['registerListeners']();

      expect(discordWrapper.client.once).toHaveBeenCalledWith(Events.GuildCreate, expect.any(Function));
      expect(discordWrapper.client.on).toHaveBeenCalledWith(Events.InteractionCreate, expect.any(Function));
    });
  });
});