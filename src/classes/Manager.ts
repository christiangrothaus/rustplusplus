import 'dotenv/config';
import {
  ActionRowBuilder,
  ButtonInteraction,
  ChatInputCommandInteraction,
  Collection,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import State from './State';
import PushListener from './PushListener';
import Command from './Command';
import RustPlusWrapper from './RustPlusWrapper';
import { EntityChanged } from '../models/RustPlus.models';
import DiscordWrapper from './DiscordWrapper';
import { MessageData } from './messages/BaseSmartMessage';

export default class Manager {
  discordClient: DiscordWrapper;

  rustPlus: RustPlusWrapper;

  state = new State();

  commands = new Collection<string, Command>();

  pushListener: PushListener;

  private rustPlusKeepAliveId: NodeJS.Timeout;

  async start(): Promise<void> {
    this.loadState();
    await this.initializeClients();

    this.registerDiscordListeners();
    this.registerPushListeners();

    this.startRustPlusKeepAlive();
  }

  restart(): void {
    this.state.save();
    this.destroy();
    this.start();
  }

  destroy(): void {
    this.state.save();
    this.discordClient.destroy();
    this.pushListener.destroy();

    clearInterval(this.rustPlusKeepAliveId);

    process.exit(1);
  }

  private loadState(): void {
    this.state.loadFromSave(this.discordClient);
  }

  private async initializeDiscord(): Promise<void> {
    this.discordClient = new DiscordWrapper();
    await this.discordClient.start();
  }

  private initializeRustPlus(): void {
    if (this.state.rustServerHost) {
      this.rustPlus = new RustPlusWrapper(this.state.rustServerHost, this.state.rustToken, this.state?.rustServerPort);
      this.rustPlus.connect();
      this.registerRustPlusListeners();
    }
  }

  private async initializePushListener(): Promise<void> {
    this.pushListener = new PushListener();
    await this.pushListener.start();
  }

  private registerDiscordListeners(): void {
    this.discordClient.onButtonInteraction(async (interaction: ButtonInteraction) => {
      const customId = interaction.customId;
      const [entityId, action] = customId.split('-');

      switch (action) {
        case 'edit': {
          const modal = new ModalBuilder()
            .setCustomId(entityId + '-editModal')
            .setTitle('Change Switch Details');

          const nameInput = new TextInputBuilder()
            .setCustomId('name')
            .setLabel('Name')
            .setValue(interaction.message.embeds[0].title)
            .setStyle(TextInputStyle.Short);

          const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);

          modal.setComponents(firstActionRow);

          await interaction.showModal(modal);

          break;
        }
        case 'on':
        case 'off': {
          const embed = interaction.message.embeds[0];
          const entityId = embed.footer?.text;
          const entityName = embed.title;

          await interaction.deferReply({ ephemeral: true, fetchReply: true });

          try {
            await this.rustPlus.toggleSmartSwitch(entityId, action === 'on');
            this.rustPlus.getEntityInfo(entityId);
          } catch (error) {
            if (typeof error === 'string') {
              interaction.editReply(error).then(() => {
                setTimeout(() => interaction.deleteReply(), 5000);
              });
            } else {
              interaction.editReply('An unkown error occured').then(() => {
                setTimeout(() => interaction.deleteReply(), 5000);
              });
            }

            break;
          }

          interaction.editReply(`${entityName} switched ${action}!`).then(() => {
            setTimeout(() => interaction.deleteReply(), 5000);
          });

          break;
        }
        case 'delete': {
          const entityId = interaction.message.embeds[0].footer.text;
          this.discordClient.deleteMessage(entityId);

          break;
        }
      }
    });

    this.discordClient.onModalSubmitInteraction(async (interaction: ModalSubmitInteraction) => {
      const name = interaction.fields.getTextInputValue('name');

      this.discordClient.updateMessage(interaction.message.embeds[0].footer.text, { name });
    });

    this.discordClient.onChatInputCommandInteraction(async (interaction: ChatInputCommandInteraction) => {
      const command = this.commands.get(interaction.commandName);

      if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        await command.execute(interaction, this);
      } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
          await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
      }
    });
  }

  private async initializeClients(): Promise<void> {
    await this.initializeDiscord();
    this.initializeRustPlus();
    await this.initializePushListener();
  }

  private async updateAllMessages(): Promise<void> {
    const allEntityIds = Object.keys(this.discordClient.messages);

    for (const entityId of allEntityIds) {
      const entityInfo = await this.rustPlus.getEntityInfo(entityId);
      const formattedEntityInfo = { isActive: entityInfo.payload.value, capacity: entityInfo.payload.capacity };
      this.discordClient.updateMessage(entityId, formattedEntityInfo);
    }
  }

  private registerRustPlusListeners(): void {
    if (this.rustPlus.hasClient()) {
      this.rustPlus.onConnected(() => {
        this.updateAllMessages();
      });

      this.rustPlus.onEntityChange(async (entityChange: EntityChanged) => {
        const entityId = entityChange.entityId;

        const entityInfo = { isActive: entityChange.payload.value, capacity: entityChange.payload.capacity };

        this.discordClient.updateMessage(`${entityId}`, entityInfo);
      });
    }
  }

  private registerPushListeners(): void {
    this.pushListener.onEntityPush(async (pushNotif) => {
      this.discordClient.onChannelsReady((channels) => {
        const messageData: MessageData = {
          entityInfo: {
            entityId: pushNotif.entityId,
            entityType: pushNotif.entityType,
            name: pushNotif.name
          }
        };

        this.state.createMessageFromData(channels, messageData);
      });
    });
  }

  private startRustPlusKeepAlive(): void {
    this.rustPlusKeepAliveId = setInterval(() => {
      this.updateAllMessages();
    }, 5 * 60 * 1000);
  }
}