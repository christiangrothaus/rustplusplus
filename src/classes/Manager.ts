import 'dotenv/config';
import {
  ActionRowBuilder,
  ButtonInteraction,
  ChatInputCommandInteraction,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import State from './State';
import PushListener, { PushNotification } from './PushListener';
import RustPlusWrapper from './RustPlusWrapper';
import { EntityChanged } from '../models/RustPlus.models';
import DiscordWrapper, { RustChannels } from './DiscordWrapper';
import { MessageData } from './messages/BaseSmartMessage';

export default class Manager {
  discordClient: DiscordWrapper;

  rustPlus: RustPlusWrapper;

  state = new State();

  pushListener: PushListener;

  private rustPlusKeepAliveId: NodeJS.Timeout;

  async start(): Promise<void> {
    await this.loadState();
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

  private async loadState(): Promise<void> {
    await this.state.loadFromSave(this.discordClient);
  }

  private async initializeDiscord(): Promise<void> {
    this.discordClient = new DiscordWrapper(this.state);
    await this.discordClient.start();
  }

  private initializeRustPlus(): void {
    if (this.state.rustServerHost) {
      this.rustPlus = new RustPlusWrapper(this.state.rustServerHost, this.state.rustToken, this.state?.rustServerPort);
      this.rustPlus.connect();
      this.registerRustPlusListeners();
    } else {
      console.log('No rust server host found in state. RustPlus will not be initialized.');
    }
  }

  private async initializePushListener(): Promise<void> {
    this.pushListener = new PushListener();
    await this.pushListener.start();
  }

  private async onButtonInteraction(interaction: ButtonInteraction) {
    const customId = interaction.customId;
    const [entityId, action] = customId.split('-');

    switch (action) {
      case 'edit': {
        const modal = new ModalBuilder()
          .setCustomId(entityId + '-editModal')
          .setTitle('Change Message Details');

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

        await interaction.deferReply({ fetchReply: true });

        try {
          await this.rustPlus.toggleSmartSwitch(entityId, action === 'on');
          this.rustPlus.getEntityInfo(entityId);
        } catch (error) {
          interaction.editReply(error as string).then(() => {
            setTimeout(() => interaction.deleteReply(), 5000);
          });
        }
        break;
      }
      case 'delete': {
        const entityId = interaction.message.embeds[0].footer.text;
        this.discordClient.deleteMessage(entityId);

        break;
      }
    }
  }

  private onModalSubmitInteraction(interaction: ModalSubmitInteraction) {
    const entityId =interaction.message.embeds[0].footer.text;
    const name = interaction.fields.getTextInputValue('name');

    this.discordClient.updateMessage(entityId, { name });
  }

  private async onChatInputCommandInteraction(interaction: ChatInputCommandInteraction) {
    const command = this.discordClient.commandManager.commands.get(interaction.commandName);

    if (!command) {
      throw new Error(`No command matching ${interaction.commandName} was found.`);
    }

    try {
      await command.execute(interaction, this);
    } catch (error) {
      console.log(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    }
  }

  private registerDiscordListeners(): void {
    this.discordClient.onButtonInteraction(this.onButtonInteraction);

    this.discordClient.onModalSubmitInteraction(this.onModalSubmitInteraction);

    this.discordClient.onChatInputCommandInteraction(this.onChatInputCommandInteraction);
  }

  private async initializeClients(): Promise<void> {
    await this.initializeDiscord();
    this.initializeRustPlus();
    await this.initializePushListener();
  }

  private async updateAllMessages(): Promise<void> {
    const allEntityIds = this.state.messages.keys();

    for (const entityId of allEntityIds) {
      const entityInfo = await this.rustPlus.getEntityInfo(entityId);
      const formattedEntityInfo = { isActive: entityInfo.payload.value, capacity: entityInfo.payload.capacity };
      this.discordClient.updateMessage(entityId, formattedEntityInfo);
    }
  }

  private onRustPlusConnected(): void {
    this.updateAllMessages();
  }

  private async onRustPlusEntityChange(entityChange: EntityChanged): Promise<void> {
    const entityId = entityChange.entityId;

    const entityInfo = { isActive: entityChange.payload.value, capacity: entityChange.payload.capacity };

    await this.discordClient.updateMessage(`${entityId}`, entityInfo);
  }

  private registerRustPlusListeners(): void {
    this.rustPlus.onConnected(this.onRustPlusConnected);

    this.rustPlus.onEntityChange(this.onRustPlusEntityChange);
  }

  private createOnChannelsReady(pushNotif: PushNotification) {
    return (channels: RustChannels): void => {
      const messageData: MessageData = {
        entityInfo: {
          entityId: pushNotif.entityId,
          entityType: pushNotif.entityType,
          name: pushNotif.name
        }
      };

      this.state.createMessageFromData(channels, messageData);
    };
  }

  private onEntityPush(pushNotif: PushNotification): void {
    this.discordClient.onChannelsReady(this.createOnChannelsReady(pushNotif));
  }

  private registerPushListeners(): void {
    this.pushListener.onEntityPush(this.onEntityPush);
  }

  private startRustPlusKeepAlive(): void {
    this.rustPlusKeepAliveId = setInterval(() => {
      this.updateAllMessages();
    }, 5 * 60 * 1000);
  }
}