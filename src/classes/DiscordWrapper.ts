import 'dotenv/config';
import {
  ButtonInteraction,
  CategoryChannel,
  ChannelType,
  ChatInputCommandInteraction,
  Client,
  Events,
  GatewayIntentBits,
  ModalSubmitInteraction,
  PermissionsBitField,
  TextChannel
} from 'discord.js';
import CommandManager from './CommandManager';
import SmartSwitchMessage from './messages/SmartSwitchMessage';
import SmartSwitchEntityInfo from './entityInfo/SmartSwitchEntityInfo';
import SmartAlarmMessage from './messages/SmartAlarmMessage';
import SmartAlarmEntityInfo from './entityInfo/SmartAlarmEntityInfo';
import StorageMonitorMessage from './messages/StorageMonitorMessage';
import StorageMonitorEntityInfo from './entityInfo/StorageMonitorEntityInfo';
import BaseSmartMessage from './messages/BaseSmartMessage';
import BaseEntityInfo from './entityInfo/BaseEntityInfo';

export default class DiscordWrapper {
  client: Client;

  commandManager: CommandManager;

  notificationChannel: TextChannel;

  switchChannel: TextChannel;

  messages: Map<string, BaseSmartMessage<BaseEntityInfo>>;

  private modalSubmitCallbacks: Array<(interaction: ModalSubmitInteraction) => void> = [];

  private chatInputCommandCallbacks: Array<(interaction: ChatInputCommandInteraction) => void> = [];

  private buttonCallbacks: Array<(interaction: ButtonInteraction) => void> = [];

  constructor() {
    this.client = new Client({ intents: [ GatewayIntentBits.Guilds] });
    this.commandManager = new CommandManager();
  }

  async start() {
    this.registerListeners();
    this.client.login(process.env.DISCORD_TOKEN);
  }

  async destroy() {
    this.client.removeAllListeners();
    await this.client.destroy();
  }

  onButtonInteraction(callback: (interaction: ButtonInteraction) => void) {
    this.buttonCallbacks.push(callback);
  }

  onModalSubmitInteraction(callback: (interaction: ModalSubmitInteraction) => void) {
    this.modalSubmitCallbacks.push(callback);
  }

  onChatInputCommandInteraction(callback: (interaction: ChatInputCommandInteraction) => void) {
    this.chatInputCommandCallbacks.push(callback);
  }

  public async sendSwitchMessage(entityInfo: SmartSwitchEntityInfo) {
    const switchMessage = new SmartSwitchMessage(this.switchChannel, entityInfo);
    await switchMessage.send();
    this.messages.set(switchMessage.entityInfo.entityId, switchMessage);
  }

  public async sendAlarmMessage(entityInfo: SmartAlarmEntityInfo) {
    const alarmMessage = new SmartAlarmMessage(this.switchChannel, entityInfo);
    await alarmMessage.send();
    this.messages.set(alarmMessage.entityInfo.entityId, alarmMessage);
  }

  public async sendStorageMessage(entityInfo: StorageMonitorEntityInfo) {
    const storageMessage = new StorageMonitorMessage(this.switchChannel, entityInfo);
    await storageMessage.send();
    this.messages.set(storageMessage.entityInfo.entityId, storageMessage);
  }

  public async updateMessage(entityId: string, entityInfo: Partial<SmartAlarmEntityInfo | SmartSwitchEntityInfo | StorageMonitorEntityInfo>) {
    const switchMessage = this.messages.get(entityId);
    switchMessage.update(entityInfo);
  }

  public async deleteMessage(entityId: string) {
    const message = this.messages.get(entityId);
    await message.message.delete();
    this.messages.delete(entityId);
  }

  private async createChannels(guildId: string) {
    const guild = await this.client.guilds.fetch(guildId);

    const channels = await guild.channels.fetch();

    const existingCategory = <CategoryChannel> channels.find((channel) => channel.name === 'Rust++' && channel.type === ChannelType.GuildCategory);

    if (existingCategory) {
      existingCategory.children.cache.forEach((channel) => {
        if (channel.name === 'Notifications') {
          this.notificationChannel = <TextChannel> channel;
        } else if (channel.name === 'Switches') {
          this.switchChannel = <TextChannel> channel;
        }
      });
    } else {
      const channelCategory = await guild.channels.create({
        name: 'Rust++',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [{
          id: guild.roles.everyone,
          deny: new PermissionsBitField(['SendMessages']),
          allow: new PermissionsBitField(['ViewChannel', 'ReadMessageHistory'])
        }]
      });

      this.notificationChannel = await channelCategory.children.create({
        name: 'Notifications',
        type: ChannelType.GuildText
      });

      this.switchChannel = await channelCategory.children.create({
        name: 'Switches',
        type: ChannelType.GuildText
      });
    }
  }

  private registerListeners() {
    this.client.once(Events.ClientReady, async () => {
      this.commandManager.refreshSlashCommands(); // When the bot restarts, refresh the registered slash commands
      const guilds = await this.client.guilds.fetch(); // Fetch all guilds the bot is in
      guilds.forEach((guild) => this.createChannels(guild.id)); // Create channels for each guild
    });

    this.client.once(Events.GuildCreate, (guild) => {
      this.createChannels(guild.id);
      this.commandManager.refreshSlashCommands(); // When the bot first joins a server, set the slash commands
    });

    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (interaction.isButton()) {
        this.buttonCallbacks.forEach((callback) => callback(interaction as ButtonInteraction));
      } else if (interaction.isModalSubmit()) {
        this.modalSubmitCallbacks.forEach((callback) => callback(interaction as ModalSubmitInteraction));
      } else if (interaction.isChatInputCommand()) {
        this.chatInputCommandCallbacks.forEach((callback) => callback(interaction as ChatInputCommandInteraction));
      }
    });
  }
}