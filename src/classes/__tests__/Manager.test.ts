import {
  Awaitable,
  CategoryCreateChannelOptions,
  ChannelType,
  Collection,
  Events,
  Guild,
  GuildChannelCreateOptions,
  Interaction,
  ModalBuilder,
  OAuth2Guild,
  Role
} from 'discord.js';
import Manager, { ENV_FILE_PATH } from '../Manager';
import CommandManager from '../CommandManager';
import SwitchEntityInfo from '../entityInfo/SwitchEntityInfo';
import { CONFIG_FILE } from '../PushListener';
import Switch from '../entities/Switch';
import Alarm from '../entities/Alarm';
import StorageMonitor from '../entities/StorageMonitor';
import RustPlusWrapper from '../RustPlusWrapper';
import { SAVE_DATA_PATH } from '../State';

jest.mock('prompt-sync', () => {
  return jest.fn().mockImplementation(() => {
    return jest.fn().mockImplementation(() => 'envvar');
  });
});

const mockGuild = {
  roles: {
    everyone: {} as Role
  },
  channels: {
    fetch: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockImplementation((options: GuildChannelCreateOptions & { type: ChannelType.GuildCategory }) => {
      return {
        name: options.name,
        type: options.type,
        children: {
          create: jest.fn().mockImplementation((options: CategoryCreateChannelOptions) => {
            return {
              name: options.name,
              type: options.type
            };
          })
        }
      };
    })
  }
};
const mockOAuth2Guilds = new Collection<string, OAuth2Guild>();
// @ts-expect-error - mocking guild
mockOAuth2Guilds.set('guildId', {
  id: 'guildId',
  fetch: jest.fn().mockImplementation(() => {
    return mockGuild;
  })
} as OAuth2Guild);

jest.mock('discord.js', () => {
  return {
    ...jest.requireActual('discord.js'),
    Client: jest.fn().mockImplementation(() => {
      return {
        removeAllListeners: jest.fn(),
        destroy: jest.fn().mockResolvedValue(undefined),
        guilds: {
          fetch: jest.fn().mockResolvedValue(mockOAuth2Guilds)
        },
        user: {
          id: 'botId'
        },
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
          switch (event) {
            case Events.GuildCreate: {
              // @ts-expect-error - mocking guild
              const guild = {
                id: 'guildId',
                roles: {
                  everyone: {} as Role
                },
                channels: {
                  fetch: jest.fn().mockResolvedValue([]),
                  create: jest.fn().mockImplementation((options: GuildChannelCreateOptions & { type: ChannelType.GuildCategory }) => {
                    return {
                      name: options.name,
                      type: options.type,
                      children: {
                        create: jest.fn().mockImplementation((options: CategoryCreateChannelOptions) => {
                          return {
                            name: options.name,
                            type: options.type
                          };
                        })
                      }
                    };
                  })
                }
              } as Guild;
              cb(guild);
              break;
            }
          }
        }),
        on: jest.fn((event: Events, cb: (interaction: { [key: string]: any }) => Awaitable<void>): void => {
          switch (event) {
            case Events.InteractionCreate: {
              const isModalSubmit = jest.fn(() => false);
              const isButton = jest.fn(() => true);
              const isChatInputCommand = jest.fn(() => false);
              const followUp = jest.fn().mockResolvedValue({});
              const reply = jest.fn().mockResolvedValue({});
              const editReply = jest.fn().mockResolvedValue({});
              const deferReply = jest.fn().mockResolvedValue({});
              // @ts-expect-error - mocking interaction
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
              } as Interaction;
              cb(interaction);
              break;
            }
          }
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

jest.mock('@liamcottle/rustplus.js', () => {
  return jest.fn().mockImplementation(() => {
    return {
      connect: jest.fn(),
      removeAllListeners: jest.fn(),
      disconnect: jest.fn(),
      getEntityInfo: jest.fn(),
      turnSmartSwitchOn: jest.fn(),
      turnSmartSwitchOff: jest.fn(),
      on: jest.fn(),
      getTime: jest.fn()
    };
  });
});

jest.mock('dotenv', () => {
  return {
    ...jest.requireActual('dotenv'),
    config: jest.fn().mockImplementation(() => {
      process.env = {
        DISCORD_TOKEN: 'discordToken',
        APPLICATION_ID: 'applicationId',
        STEAM_ID: 'steamId'
      };
    })
  };
});

jest.mock('fs', () => {
  return {
    ...jest.requireActual('fs'),
    readFileSync: jest.fn().mockImplementation((path: string) => {
      switch (path) {
        case SAVE_DATA_PATH: {
          return JSON.stringify({
            rustServerHost: 'localhost',
            rustServerPort: 28082,
            rustToken: '123456',
            pushIds: [],
            pairedSwitches: [],
            pairedAlarms: [],
            pairedStorageMonitors: []
          });
        }
        case CONFIG_FILE: {
          return JSON.stringify({
            fcm_credentials: {
              keys: {
                privateKey: 'privateKey',
                publicKey: 'publicKey',
                authSecret: 'keyAuthSecret'
              },
              fcm: {
                token: 'fcmToken',
                pushSet: 'pushSet'
              },
              gcm: {
                token: 'gcmToken',
                androidId: 'gcmAndroidId',
                securityToken: 'gcmSecurityToken',
                appId: 'gcmAppId'
              }
            },
            expo_push_token: 'expoPushToken',
            rustplus_auth_token: 'rustPlusAuthToken'
          });
        }
        case ENV_FILE_PATH: {
          return `DISCORD_TOKEN=discordToken
          APPLICATION_ID=applicationId
          STEAM_ID=steamId`;
        }
      }
    }),
    writeFileSync: jest.fn().mockImplementation(() => {})
  };
});

describe('DiscordManager', () => {
  let discordManager: Manager;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(0);
    jest.spyOn(process, 'exit').mockImplementation(() => {return [] as never;});
  });

  afterEach(() => {
    discordManager.destroy();
  });

  describe('ctor', () => {
    it('should create a new instance of DiscordManager', () => {
      discordManager = new Manager();

      expect(discordManager).toBeInstanceOf(Manager);
    });
  });

  describe('destroy', () => {
    it('should save the state', async () => {
      discordManager = new Manager();
      await discordManager.start();
      const stateSaveSpy = jest.spyOn(discordManager.state, 'save');

      discordManager.destroy();

      expect(stateSaveSpy).toHaveBeenCalled();
    });

    it('should exit the process', async () => {
      jest.spyOn(process, 'exit').mockImplementationOnce(() => {throw new Error('process.exit() was called');});
      discordManager = new Manager();
      await discordManager.start();

      expect(() => {
        discordManager.destroy();
      }).toThrow('process.exit() was called');
    });

    it('should destroy the push listener if there is one', async () => {
      discordManager = new Manager();
      await discordManager.start();
      const pushListenerDestroySpy = jest.spyOn(discordManager.pushListener, 'destroy');

      discordManager.destroy();

      expect(pushListenerDestroySpy).toHaveBeenCalled();
    });
  });

  describe('restart', () => {
    it('should save the state, call destory, and call start', async () => {
      discordManager = new Manager();
      await discordManager.start();
      const startSpy = jest.spyOn(discordManager, 'start');
      const destroySpy = jest.spyOn(discordManager, 'destroy');
      const stateSaveSpy = jest.spyOn(discordManager.state, 'save');

      discordManager.restart();

      expect(stateSaveSpy).toHaveBeenCalled();
      expect(startSpy).toHaveBeenCalled();
      expect(destroySpy).toHaveBeenCalled();
    });
  });

  describe('initializeDiscord', () => {
    it('should call start on the discord client', async () => {
      discordManager = new Manager();
      // @ts-expect-error - mocking discordClient
      discordManager.discordClient = {
        start: jest.fn()
      };

      await discordManager['initializeDiscord']();

      expect(discordManager.discordClient.start).toHaveBeenCalled();
    });
  });

  describe('initializeRustPlus', () => {
    it('should create a new RustPlusWrapper and call connect if there is a server host', () => {
      discordManager = new Manager();
      discordManager.state.rustServerHost = 'rustServerHost';
      const rustPlusConnectSpy = jest.spyOn(RustPlusWrapper.prototype, 'connect');

      discordManager['initializeRustPlus']();

      expect(rustPlusConnectSpy).toHaveBeenCalled();
    });

    it('should throw an error if there is no server host', () => {
      discordManager = new Manager();
      discordManager['state'].rustServerHost = undefined;

      expect(() => discordManager['initializeRustPlus']()).toThrow('No rust server host found in state.');
    });
  });

  describe('onButtonInteraction', () => {
    describe('delete action', () => {
      describe('pairedSwitch', () => {
        it('should delete the message', async () => {
          discordManager = new Manager();
          await discordManager.start();
          const interaction = {
            customId: 'entityId-delete',
            message: {
              embeds: [{ footer: { text: 'entityId' } }],
              delete: jest.fn()
            }
          };
          discordManager.state.pairedSwitches.set('entityId', {} as Switch);

          // @ts-expect-error - mocking interaction
          await discordManager['onButtonInteraction'](interaction as Interaction);

          expect(discordManager.state.pairedSwitches.get('entityId')).toBeUndefined();
        });
      });

      describe('pairedAlarm', () => {
        it('should delete the message', async () => {
          discordManager = new Manager();
          await discordManager.start();
          const interaction = {
            customId: 'entityId-delete',
            message: {
              embeds: [{ footer: { text: 'entityId' } }],
              delete: jest.fn()
            }
          };
          discordManager.state.pairedAlarms.set('entityId', {} as Alarm);

          // @ts-expect-error - mocking interaction
          await discordManager['onButtonInteraction'](interaction as Interaction);

          expect(discordManager.state.pairedAlarms.get('entityId')).toBeUndefined();
        });
      });

      describe('pairedStorageMonitor', () => {
        it('should delete the message', async () => {
          discordManager = new Manager();
          await discordManager.start();
          const interaction = {
            customId: 'entityId-delete',
            message: {
              embeds: [{ footer: { text: 'entityId' } }],
              delete: jest.fn()
            }
          };
          discordManager.state.pairedStorageMonitors.set('entityId', {} as StorageMonitor);

          // @ts-expect-error - mocking interaction
          await discordManager['onButtonInteraction'](interaction as Interaction);

          expect(discordManager.state.pairedStorageMonitors.get('entityId')).toBeUndefined();
        });
      });

      it('should call delete on the interactions message', async () => {
        discordManager = new Manager();
        await discordManager.start();
        const interaction = {
          customId: 'entityId-delete',
          message: {
            embeds: [{ footer: { text: 'entityId' } }],
            delete: jest.fn()
          }
        };

        // @ts-expect-error - mocking interaction
        await discordManager['onButtonInteraction'](interaction as Interaction);

        expect(interaction.message.delete).toHaveBeenCalled();
      });
    });

    describe('edit action', () => {
      it('should create a modal', async () => {
        discordManager = new Manager();
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
        discordManager = new Manager();
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
        discordManager = new Manager();
        discordManager.state.rustServerHost = 'localhost';
        await discordManager.start();
        const interaction = {
          customId: 'entityId-on',
          deferUpdate: jest.fn().mockResolvedValue({}),
          message: {
            embeds: [{ title: 'entityName', footer: { text: 'entityId' } }]
          }
        };
        const toggleSmartSwitchSpy = jest.spyOn(discordManager.rustPlus, 'toggleSmartSwitch');

        // @ts-expect-error - mocking interaction
        await discordManager['onButtonInteraction'](interaction as Interaction);

        expect(toggleSmartSwitchSpy).toHaveBeenCalledWith('entityId', true);
      });

      it('should call toggleSmartSwitch with false as the second argument when case is off', async () => {
        discordManager = new Manager();
        await discordManager.start();
        const interaction = {
          customId: 'entityId-off',
          deferUpdate: jest.fn().mockResolvedValue({}),
          message: {
            embeds: [{ title: 'entityName', footer: { text: 'entityId' } }]
          }
        };
        const toggleSmartSwitchSpy = jest.spyOn(discordManager.rustPlus, 'toggleSmartSwitch');

        // @ts-expect-error - mocking interaction
        await discordManager['onButtonInteraction'](interaction as Interaction);

        expect(toggleSmartSwitchSpy).toHaveBeenCalledWith('entityId', false);
      });
    });
  });

  describe('onModalSubmitInteraction', () => {
    it('should edit the discord message and entity in state', async () => {
      discordManager = new Manager();
      await discordManager.start();
      const interaction = {
        message: {
          embeds: [{ footer: { text: 'entityId' } }],
          edit: jest.fn()
        },
        fields: {
          getTextInputValue: jest.fn().mockReturnValue('newName')
        }
      };
      const switchEntity = new Switch(new SwitchEntityInfo('entityName', 'entityId', true));
      discordManager.state.pairedSwitches.set('entityId', switchEntity);

      // @ts-expect-error - mocking interaction
      discordManager['onModalSubmitInteraction'](interaction as Interaction);

      expect(discordManager.state.pairedSwitches.get('entityId').entityInfo.name).toBe('newName');
      expect(interaction.message.edit).toHaveBeenCalledWith(discordManager.state.pairedSwitches.get('entityId'));
    });
  });

  describe('onChatInputCommandInteraction', () => {
    it('should throw an error if the command does not exist', async () => {
      discordManager = new Manager();
      await discordManager.start();
      discordManager.discordClient.commandManager = new CommandManager('123');
      const interaction = {
        commandName: 'commandName'
      };

      // @ts-expect-error - mocking interaction
      await expect(discordManager['onChatInputCommandInteraction'](interaction as Interaction)).rejects.toThrow('No command matching commandName was found.');
    });

    it('should call the command execute function', async () => {
      discordManager = new Manager();
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
      discordManager = new Manager();
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
      discordManager = new Manager();
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
      discordManager = new Manager();
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
});