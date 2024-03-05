import 'dotenv/config';
import {
  ButtonInteraction,
  CategoryChannel,
  CategoryCreateChannelOptions,
  ChannelType,
  ChatInputCommandInteraction,
  Client,
  Events,
  GatewayIntentBits,
  Guild,
  Interaction,
  Message,
  ModalSubmitInteraction,
  PermissionsBitField,
  TextChannel
} from 'discord.js';
import CommandManager from './CommandManager';
import { EventEmitter } from 'events';
import BaseEntity from './entities/BaseEntity';
import BaseEntityInfo from './entityInfo/BaseEntityInfo';

const notificationChannelCreateOptions: CategoryCreateChannelOptions = {
  name: 'Notifications',
  type: ChannelType.GuildText
};

const pairedDevicesChannelCreateOptions: CategoryCreateChannelOptions = {
  name: 'Paired Devices',
  type: ChannelType.GuildText
};

export enum InteractionCreateEvents {
  Button = 'Button',
  ModalSubmit = 'ModalSubmit',
  ChatInputCommand = 'ChatInputCommand'
}

declare interface DiscordWrapper {
  on(event: InteractionCreateEvents.Button, listener: (interaction: ButtonInteraction) => void): this;
  on(event: InteractionCreateEvents.ModalSubmit, listener: (interaction: ModalSubmitInteraction) => void): this;
  on(event: InteractionCreateEvents.ChatInputCommand, listener: (interaction: ChatInputCommandInteraction) => void): this;
}

class DiscordWrapper extends EventEmitter {
  client: Client;

  commandManager: CommandManager;

  private notificationsChannel: TextChannel;

  private pairedDevicesChannel: TextChannel;

  constructor() {
    super();
    this.client = new Client({ intents: [ GatewayIntentBits.Guilds ] });
  }

  public async start() {
    this.registerListeners();
    await this.client.login(process.env.DISCORD_TOKEN);
    const guilds = await this.client.guilds.fetch();
    this.createChannels(await guilds.first().fetch());
  }

  public async destroy() {
    this.client.removeAllListeners();
    await this.client.destroy();
  }

  public async sendPairedDeviceMessage(entity: BaseEntity<BaseEntityInfo>) {
    await this.pairedDevicesChannel.send(entity);
  }

  public async getPairedDeviceMessage(entityId: string): Promise<Message<boolean>> {
    const pairedDeviceMessages = await this.pairedDevicesChannel.messages.fetch();

    const discordMessage = pairedDeviceMessages.find((message) => {
      message.embeds[0].footer.text === entityId;
    });

    return discordMessage;
  }

  private async createChannels(guild: Guild) {
    const channels = await guild.channels.fetch();

    const existingCategory = channels.find((channel) => channel.name.toLowerCase() === 'rust++' && channel.type === ChannelType.GuildCategory) as CategoryChannel;

    if (existingCategory) {
      existingCategory.children.cache.forEach((channel) => {
        if (channel.name.toLowerCase() === 'notifications') {
          this.notificationsChannel = channel as TextChannel;
        } else if (channel.name.toLowerCase() === 'paired devices') {
          this.pairedDevicesChannel = channel as TextChannel;
        }
      });

      if (!this.notificationsChannel) {
        this.notificationsChannel = await existingCategory.children.create(notificationChannelCreateOptions);
      }
      if (!this.pairedDevicesChannel) {
        this.pairedDevicesChannel = await existingCategory.children.create(pairedDevicesChannelCreateOptions);
      }
    } else {
      const channelCategory = await guild.channels.create({
        name: 'Rust++',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [{
          id: guild.roles.everyone,
          deny: new PermissionsBitField(['SendMessages']),
          allow: new PermissionsBitField(['ViewChannel', 'ReadMessageHistory'])
        }, {
          id: this.client.user.id,
          allow: new PermissionsBitField(['SendMessages', 'ManageMessages'])
        }]
      });

      this.notificationsChannel = await channelCategory.children.create(notificationChannelCreateOptions);

      this.pairedDevicesChannel = await channelCategory.children.create(pairedDevicesChannelCreateOptions);
    }
  }

  private onGuildJoin(guild: Guild) {
    this.createChannels(guild);
    this.commandManager = new CommandManager(guild.id);
    this.commandManager.loadCommands();
  }

  private onInteractionCreate(interaction: Interaction) {
    if (interaction.isButton()) {
      this.emit(InteractionCreateEvents.Button, interaction as ButtonInteraction);
    } else if (interaction.isModalSubmit()) {
      this.emit(InteractionCreateEvents.ModalSubmit, interaction as ModalSubmitInteraction);
    } else if (interaction.isChatInputCommand()) {
      this.emit(InteractionCreateEvents.ChatInputCommand, interaction as ChatInputCommandInteraction);
    }
  }

  private registerListeners() {
    this.client.once(Events.GuildCreate, (guild) => { this.onGuildJoin(guild); });
    this.client.on(Events.InteractionCreate, (interaction) => { this.onInteractionCreate(interaction); });
  }
}

export default DiscordWrapper;