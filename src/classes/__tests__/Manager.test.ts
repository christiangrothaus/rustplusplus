import { Awaitable, Events, Interaction, ModalBuilder, TextChannel } from 'discord.js';
import Manager from '../Manager';
import CommandManager from '../CommandManager';
import SmartSwitchMessage from '../messages/SmartSwitchMessage';
import SmartSwitchEntityInfo from '../entityInfo/SmartSwitchEntityInfo';
import { EntityChanged } from '../../models/RustPlus.models';
import { PushNotification } from '../PushListener';

jest.mock('../State', () => {
  return jest.fn().mockImplementation(() => {
    return {
      loadFromSave: jest.fn().mockResolvedValue({}),
      save: jest.fn().mockResolvedValue({}),
      onChannelIdChange: jest.fn(),
      createMessageFromData: jest.fn(),
      messages: {},
      rustServerHost: 'localhost'
    };
  });
});

jest.mock('../RustPlusWrapper', () => {
  return jest.fn().mockImplementation(() => {
    return {
      onConnected: jest.fn(),
      onEntityChange: jest.fn(),
      connect: jest.fn(),
      hasClient: jest.fn().mockReturnValue(true),
      toggleSmartSwitch: jest.fn(),
      getEntityInfo: jest.fn().mockResolvedValue({})
    };
  });
});

jest.mock('../PushListener', () => {
  return jest.fn().mockImplementation(() => {
    return {
      onEntityPush: jest.fn(),
      start: jest.fn(),
      destroy: jest.fn(),
      loadConfig: jest.fn()
    };
  });
});

jest.mock('../DiscordWrapper', () => {
  return jest.fn().mockImplementation(() => {
    return {
      onButtonInteraction: jest.fn(),
      onModalSubmitInteraction: jest.fn(),
      onChatInputCommandInteraction: jest.fn(),
      start: jest.fn().mockResolvedValue({}),
      destroy: jest.fn(),
      deleteMessage: jest.fn(),
      updateMessage: jest.fn(),
      onGuildJoin: jest.fn(),
      onChannelsReady: jest.fn()
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
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(0);
    jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit() was called'); });
  });

  describe('ctor', () => {
    it('should create a new instance of DiscordManager', () => {
      const discordManager = new Manager();

      expect(discordManager).toBeInstanceOf(Manager);
    });
  });

  describe('destroy', () => {
    it('should save the state', async () => {
      const discordManager = new Manager();
      await discordManager.start();

      expect(() => {
        discordManager.destroy();
      }).toThrow();

      expect(discordManager.state.save).toHaveBeenCalled();
    });

    it('should exit the process', async () => {
      const discordManager = new Manager();
      await discordManager.start();

      expect(() => {
        discordManager.destroy();
      }).toThrow('process.exit() was called');
    });

    it('should destroy the push listener if there is one', async () => {
      const discordManager = new Manager();
      await discordManager.start();

      expect(() => {
        discordManager.destroy();
      }).toThrow();

      expect(discordManager.pushListener.destroy).toHaveBeenCalled();
    });
  });

  describe('restart', () => {
    it('should save the state, call destory, and call start', async () => {
      const discordManager = new Manager();
      await discordManager.start();

      const startSpy = jest.spyOn(discordManager, 'start');
      const destroySpy = jest.spyOn(discordManager, 'destroy');
      jest.spyOn(process, 'exit').mockImplementation(() => {return [] as never;});

      discordManager.restart();

      expect(discordManager.state.save).toHaveBeenCalled();
      expect(startSpy).toHaveBeenCalled();
      expect(destroySpy).toHaveBeenCalled();
    });
  });

  describe('loadState', () => {
    it('should load the state from save', async () => {
      const discordManager = new Manager();

      await discordManager['loadState']();

      expect(discordManager.state.loadFromSave).toHaveBeenCalled();
    });
  });

  describe('initializeDiscord', () => {
    it('should create a new DiscordWrapper and call start', async () => {
      const discordManager = new Manager();

      await discordManager['initializeDiscord']();

      expect(discordManager.discordClient.start).toHaveBeenCalled();
    });
  });

  describe('initializeRustPlus', () => {
    it('should create a new RustPlusWrapper and call connect if there is a server host', () => {
      const discordManager = new Manager();
      discordManager['state'].rustServerHost = 'rustServerHost';

      discordManager['initializeRustPlus']();

      expect(discordManager.rustPlus.connect).toHaveBeenCalled();
    });

    it('should not create a new RustPlusWrapper or call connect if there is not a server host', () => {
      const discordManager = new Manager();
      discordManager['state'].rustServerHost = undefined;

      discordManager['initializeRustPlus']();

      expect(discordManager.rustPlus).toBeUndefined();
    });
  });

  describe('initializePushListener', () => {
    it('should create a new PushListener and call start', async () => {
      const discordManager = new Manager();
      await discordManager['initializePushListener']();

      expect(discordManager.pushListener.start).toHaveBeenCalled();
    });
  });

  describe('onButtonInteraction', () => {
    describe('delete action', () => {
      it('should delete the message', async () => {
        const discordManager = new Manager();
        await discordManager.start();
        const interaction = {
          customId: 'entityId-delete',
          message: {
            embeds: [{ footer: { text: 'entityId' } }]
          }
        };

        // @ts-expect-error - mocking interaction
        await discordManager['onButtonInteraction'](interaction as Interaction);

        expect(discordManager.discordClient.deleteMessage).toHaveBeenCalled();
      });
    });

    describe('edit action', () => {
      it('should create a modal', async () => {
        const discordManager = new Manager();
        await discordManager.start();
        const interaction = {
          customId: 'entityId-edit',
          message: {
            embeds: [{ title: 'oldName' }]
          },
          showModal: jest.fn()
        };

        // @ts-expect-error - mocking interaction
        await discordManager['onButtonInteraction'](interaction as Interaction);

        expect(interaction.showModal).toHaveBeenCalled();
      });

      it('should have a name input with the old name as the value', async () => {
        const discordManager = new Manager();
        await discordManager.start();
        const interaction = {
          customId: 'entityId-edit',
          message: {
            embeds: [{ title: 'oldName' }]
          },
          showModal: jest.fn()
        };

        // @ts-expect-error - mocking interaction
        await discordManager['onButtonInteraction'](interaction as Interaction);

        const modal = <ModalBuilder> interaction.showModal.mock.calls[0][0];

        expect(modal.components[0].components[0].toJSON().value).toBe('oldName');
      });
    });

    describe('on/off action', () => {
      it('should call toggleSmartSwitch with true as the second argument when case is on', async () => {
        const discordManager = new Manager();
        await discordManager.start();
        const interaction = {
          customId: 'entityId-on',
          deferReply: jest.fn().mockResolvedValue({}),
          editReply: jest.fn().mockResolvedValue({
            deleteReply: jest.fn()
          }),
          message: {
            embeds: [{ title: 'entityName', footer: { text: 'entityId' } }]
          }
        };

        // @ts-expect-error - mocking interaction
        await discordManager['onButtonInteraction'](interaction as Interaction);

        expect(discordManager.rustPlus.toggleSmartSwitch).toHaveBeenCalledWith('entityId', true);
      });

      it('should call toggleSmartSwitch with false as the second argument when case is off', async () => {
        const discordManager = new Manager();
        await discordManager.start();
        const interaction = {
          customId: 'entityId-off',
          deferReply: jest.fn().mockResolvedValue({}),
          editReply: jest.fn().mockResolvedValue({
            deleteReply: jest.fn()
          }),
          message: {
            embeds: [{ title: 'entityName', footer: { text: 'entityId' } }]
          }
        };

        // @ts-expect-error - mocking interaction
        await discordManager['onButtonInteraction'](interaction as Interaction);

        expect(discordManager.rustPlus.toggleSmartSwitch).toHaveBeenCalledWith('entityId', false);
      });

      it('should edit the reply with the error if it fails', async () => {
        const discordManager = new Manager();
        await discordManager.start();
        discordManager.rustPlus.toggleSmartSwitch = jest.fn().mockRejectedValue('error');
        const interaction = {
          customId: 'entityId-on',
          deferReply: jest.fn().mockResolvedValue({}),
          editReply: jest.fn().mockResolvedValue({
            deleteReply: jest.fn()
          }),
          message: {
            embeds: [{ title: 'entityName', footer: { text: 'entityId' } }]
          }
        };

        // @ts-expect-error - mocking interaction
        await discordManager['onButtonInteraction'](interaction as Interaction);

        expect(interaction.editReply).toHaveBeenCalledWith('error');
      });
    });
  });

  describe('onModalSubmitInteraction', () => {
    it('should call updateMessage with the entityId and the new name', async () => {
      const discordManager = new Manager();
      await discordManager.start();
      const interaction = {
        message: {
          embeds: [{ footer: { text: 'entityId' } }]
        },
        fields: {
          getTextInputValue: jest.fn().mockReturnValue('newName')
        }
      };

      // @ts-expect-error - mocking interaction
      discordManager['onModalSubmitInteraction'](interaction as Interaction);

      expect(discordManager.discordClient.updateMessage).toHaveBeenCalledWith('entityId', { name: 'newName' });
    });
  });

  describe('onChatInputCommandInteraction', () => {
    it('should throw an error if the command does not exist', async () => {
      const discordManager = new Manager();
      await discordManager.start();
      discordManager.discordClient.commandManager = new CommandManager('123');
      const interaction = {
        commandName: 'commandName'
      };

      // @ts-expect-error - mocking interaction
      await expect(discordManager['onChatInputCommandInteraction'](interaction as Interaction)).rejects.toThrow('No command matching commandName was found.');
    });

    it('should call the command execute function', async () => {
      const discordManager = new Manager();
      await discordManager.start();
      const command = {
        execute: jest.fn()
      };
      discordManager.discordClient.commandManager = new CommandManager('123');
      // @ts-expect-error - mocking command
      discordManager.discordClient.commandManager.commands.set('commandName', command);
      const interaction = {
        commandName: 'commandName'
      };

      // @ts-expect-error - mocking interaction
      await discordManager['onChatInputCommandInteraction'](interaction as Interaction);

      expect(command.execute).toHaveBeenCalledWith(interaction, discordManager);
    });

    it('should call interaction followUp if the command fails and has been replied to', async () => {
      const discordManager = new Manager();
      await discordManager.start();
      const command = {
        execute: jest.fn().mockRejectedValue('error')
      };
      discordManager.discordClient.commandManager = new CommandManager('123');
      // @ts-expect-error - mocking command
      discordManager.discordClient.commandManager.commands.set('commandName', command);
      const interaction = {
        commandName: 'commandName',
        replied: true,
        followUp: jest.fn().mockResolvedValue({})
      };

      // @ts-expect-error - mocking interaction
      await discordManager['onChatInputCommandInteraction'](interaction as Interaction);

      expect(interaction.followUp).toHaveBeenCalledWith({ content: 'There was an error while executing this command!', ephemeral: true });
    });

    it('should call interaction followUp if the command fails and has been replied to', async () => {
      const discordManager = new Manager();
      await discordManager.start();
      const command = {
        execute: jest.fn().mockRejectedValue('error')
      };
      discordManager.discordClient.commandManager = new CommandManager('123');
      // @ts-expect-error - mocking command
      discordManager.discordClient.commandManager.commands.set('commandName', command);
      const interaction = {
        commandName: 'commandName',
        deferred: true,
        followUp: jest.fn().mockResolvedValue({})
      };

      // @ts-expect-error - mocking interaction
      await discordManager['onChatInputCommandInteraction'](interaction as Interaction);

      expect(interaction.followUp).toHaveBeenCalledWith({ content: 'There was an error while executing this command!', ephemeral: true });
    });

    it('should call interaction reply if the command fails and has not been replied to or deferred', async () => {
      const discordManager = new Manager();
      await discordManager.start();
      const command = {
        execute: jest.fn().mockRejectedValue('error')
      };
      discordManager.discordClient.commandManager = new CommandManager('123');
      // @ts-expect-error - mocking command
      discordManager.discordClient.commandManager.commands.set('commandName', command);
      const interaction = {
        commandName: 'commandName',
        reply: jest.fn().mockResolvedValue({})
      };

      // @ts-expect-error - mocking interaction
      await discordManager['onChatInputCommandInteraction'](interaction as Interaction);

      expect(interaction.reply).toHaveBeenCalledWith({ content: 'There was an error while executing this command!', ephemeral: true });
    });
  });

  describe('registerDiscordListenersd', () => {
    it('should call onButtonInteraction', async () => {
      const discordManager = new Manager();
      await discordManager.start();

      expect(discordManager.discordClient.onButtonInteraction).toHaveBeenCalled();
    });

    it('should call onModalSubmitInteraction', async () => {
      const discordManager = new Manager();
      await discordManager.start();

      expect(discordManager.discordClient.onModalSubmitInteraction).toHaveBeenCalled();
    });

    it('should call onChatInputCommandInteraction', async () => {
      const discordManager = new Manager();
      await discordManager.start();

      expect(discordManager.discordClient.onChatInputCommandInteraction).toHaveBeenCalled();
    });
  });

  describe('initilizeClients', () => {
    it('should call initializeDiscord', async () => {
      const discordManager = new Manager();
      discordManager['initializeDiscord'] = jest.fn();
      discordManager['registerDiscordListeners'] = jest.fn();
      discordManager['registerPushListeners'] = jest.fn();
      await discordManager.start();

      expect(discordManager['initializeDiscord']).toHaveBeenCalled();
    });

    it('should call initializeRustPlus', async () => {
      const discordManager = new Manager();
      discordManager['initializeRustPlus'] = jest.fn();
      await discordManager.start();

      expect(discordManager['initializeRustPlus']).toHaveBeenCalled();
    });

    it('should call initializePushListener', async () => {
      const discordManager = new Manager();
      discordManager['initializePushListener'] = jest.fn();
      discordManager['registerPushListeners'] = jest.fn();
      await discordManager.start();

      expect(discordManager['initializePushListener']).toHaveBeenCalled();
    });
  });
});

describe('updateAllMessages', () => {
  it('should call updateMessage for each message', async () => {
    const discordManager = new Manager();
    await discordManager.start();
    discordManager['state'].messages = new Map([
      ['entityId', new SmartSwitchMessage({} as TextChannel, new SmartSwitchEntityInfo('entityName', 'entityId', true))]
    ]);
    // @ts-expect-error - mocking getEntityInfo
    jest.spyOn(discordManager.rustPlus, 'getEntityInfo').mockResolvedValue({ payload: { value: true, items: [] } });

    await discordManager['updateAllMessages']();

    expect(discordManager.discordClient.updateMessage).toHaveBeenCalledWith('entityId', { isActive: true });
  });
});

describe('onRustPlusConnected', () => {
  it('should call updateAllMessages', async () => {
    const discordManager = new Manager();
    await discordManager.start();
    discordManager['updateAllMessages'] = jest.fn();

    discordManager['onRustPlusConnected']();

    expect(discordManager['updateAllMessages']).toHaveBeenCalled();
  });
});

describe('onRustPlusEntityChange', () => {
  it('should call updateMessage with the entityId and the entityInfo', async () => {
    const discordManager = new Manager();
    await discordManager.start();
    // @ts-expect-error - mocking getEntityInfo
    const entityChange = {
      entityId: 'entityId',
      payload: {
        value: true
      }
    } as EntityChanged;

    discordManager['onRustPlusEntityChange'](entityChange);

    expect(discordManager.discordClient.updateMessage).toHaveBeenCalledWith('entityId', { isActive: true });
  });
});

describe('registerRustPlusListeners', () => {
  it('should call onConnected', async () => {
    const discordManager = new Manager();
    await discordManager.start();

    expect(discordManager.rustPlus.onConnected).toHaveBeenCalledWith(discordManager['onRustPlusConnected']);
  });

  it('should call onEntityChange', async () => {
    const discordManager = new Manager();
    await discordManager.start();

    expect(discordManager.rustPlus.onEntityChange).toHaveBeenCalledWith(discordManager['onRustPlusEntityChange']);
  });
});

describe('createOnChannelsReady', () => {
  it('should return a function that creates a new message', async () => {
    const discordManager = new Manager();
    await discordManager.start();
    const pushNotif = {
      entityId: 'entityId',
      entityType: 'Switch',
      name: 'entityName'
    };

    const onChannelsReady = discordManager['createOnChannelsReady'](pushNotif as PushNotification);

    const channels = {
      switchChannel: {} as TextChannel,
      notificationChannel: {} as TextChannel
    };

    onChannelsReady(channels);

    expect(discordManager.state.createMessageFromData).toHaveBeenCalledWith(channels, { entityInfo: { entityId: 'entityId', entityType: 'Switch', name: 'entityName' } });
  });
});

describe('onEntityPush', () => {
  it('should call onChannelsReady', async () => {
    const discordManager = new Manager();
    await discordManager.start();
    const pushNotif = {
      entityId: 'entityId',
      entityType: 'Switch',
      name: 'entityName'
    };

    discordManager['onEntityPush'](pushNotif as PushNotification);

    expect(discordManager.discordClient.onChannelsReady).toHaveBeenCalled();
  });
});

describe('registerPushListeners', () => {
  it('should call onEntityPush', async () => {
    const discordManager = new Manager();
    await discordManager.start();

    expect(discordManager.pushListener.onEntityPush).toHaveBeenCalledWith(discordManager['onEntityPush']);
  });
});

describe('startRustPlusKeepAlive', () => {
  it('should call setInterval with the correct arguments and save the interval id', () => {
    jest.useFakeTimers();
    const discordManager = new Manager();
    discordManager['updateAllMessages'] = jest.fn();
    const setIntervalSpy = jest.spyOn(global, 'setInterval');

    discordManager['startRustPlusKeepAlive']();
    jest.advanceTimersByTime(300000);

    expect(discordManager['rustPlusKeepAliveId']).not.toBeUndefined();
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 300000);
    expect(discordManager['updateAllMessages']).toHaveBeenCalled();
    jest.clearAllTimers();
  });
});