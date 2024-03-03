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
import State from './State';

const notificationChannelCreateOptions: CategoryCreateChannelOptions = {
  name: 'Notifications',
  type: ChannelType.GuildText
};

const switchChannelCreateOptions: CategoryCreateChannelOptions = {
  name: 'Switches',
  type: ChannelType.GuildText
};

export type RustChannels = {
  switchChannel: TextChannel,
  notificationChannel : TextChannel
};

export type ChannelReadyCallbacks = (channels: RustChannels) => void;
export default class DiscordWrapper {
  client: Client;

  commandManager: CommandManager;

  state: State;

  set notificationChannel(channel: TextChannel) {
    this._notificationChannel = channel;
    this.callChannelsReadyCallbacks();
  }

  get notificationChannel(): TextChannel {
    return this._notificationChannel;
  }

  set switchChannel(channel: TextChannel) {
    this._switchChannel = channel;
    this.callChannelsReadyCallbacks();
  }

  get switchChannel(): TextChannel {
    return this._switchChannel;
  }

  private modalSubmitCallbacks: Array<(interaction: ModalSubmitInteraction) => void> = [];

  private chatInputCommandCallbacks: Array<(interaction: ChatInputCommandInteraction) => void> = [];

  private buttonCallbacks: Array<(interaction: ButtonInteraction) => void> = [];

  private channelsReadyCallbacks: Array<ChannelReadyCallbacks> = [];

  private _notificationChannel: TextChannel;

  private _switchChannel: TextChannel;

  constructor(state: State) {
    this.client = new Client({ intents: [ GatewayIntentBits.Guilds ] });
    this.state = state;
  }

  public async start() {
    this.registerListeners();
    await this.client.login(process.env.DISCORD_TOKEN);
  }

  public async destroy() {
    this.client.removeAllListeners();
    await this.client.destroy();
  }

  public onButtonInteraction(callback: (interaction: ButtonInteraction) => void) {
    this.buttonCallbacks.push(callback);
  }

  public onModalSubmitInteraction(callback: (interaction: ModalSubmitInteraction) => void) {
    this.modalSubmitCallbacks.push(callback);
  }

  public onChatInputCommandInteraction(callback: (interaction: ChatInputCommandInteraction) => void) {
    this.chatInputCommandCallbacks.push(callback);
  }

  public async sendSwitchMessage(entityInfo: SmartSwitchEntityInfo) {
    const switchMessage = new SmartSwitchMessage(this.switchChannel, entityInfo);
    await switchMessage.send();
    this.state.messages.set(switchMessage.entityInfo.entityId, switchMessage);
  }

  public async sendAlarmMessage(entityInfo: SmartAlarmEntityInfo) {
    const alarmMessage = new SmartAlarmMessage(this.notificationChannel, entityInfo);
    await alarmMessage.send();
    this.state.messages.set(alarmMessage.entityInfo.entityId, alarmMessage);
  }

  public async sendStorageMessage(entityInfo: StorageMonitorEntityInfo) {
    const storageMessage = new StorageMonitorMessage(this.notificationChannel, entityInfo);
    await storageMessage.send();
    this.state.messages.set(storageMessage.entityInfo.entityId, storageMessage);
  }

  public async updateMessage(entityId: string, entityInfo: Partial<SmartAlarmEntityInfo | SmartSwitchEntityInfo | StorageMonitorEntityInfo>) {
    const switchMessage = this.state.messages.get(entityId);
    switchMessage.update(entityInfo);
  }

  public async deleteMessage(entityId: string) {
    const savedMessage = this.state.messages.get(entityId);
    if (savedMessage?.message) {
      await savedMessage.message.delete();
    }
    this.state.messages.delete(entityId);
  }

  public onChannelsReady(callback: (channel: RustChannels) => void) {
    if (this.switchChannel && this.notificationChannel) {
      callback({ switchChannel: this.switchChannel, notificationChannel: this.notificationChannel });
    } else {
      this.channelsReadyCallbacks.push(callback);
    }
  }

  private async createChannels(guildId: string) {
    const guild = await this.client.guilds.fetch(guildId);

    const channels = await guild.channels.fetch();

    const existingCategory = <CategoryChannel> channels.find((channel) => channel.name === 'Rust++' && channel.type === ChannelType.GuildCategory);

    if (existingCategory) {
      existingCategory.children.cache.forEach((channel) => {
        if (channel.name.toLowerCase() === 'notifications') {
          this.notificationChannel = <TextChannel> channel;
        } else if (channel.name.toLowerCase() === 'switches') {
          this.switchChannel = <TextChannel> channel;
        }
      });

      if (!this.notificationChannel) {
        this.notificationChannel = await existingCategory.children.create(notificationChannelCreateOptions);
      }
      if (!this.switchChannel) {
        this.switchChannel = await existingCategory.children.create(switchChannelCreateOptions);
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

      this.notificationChannel = await channelCategory.children.create(notificationChannelCreateOptions);

      this.switchChannel = await channelCategory.children.create(switchChannelCreateOptions);
    }
  }

  private async onClientReady(client: Client) {
    const guilds = await client.guilds.fetch();
    guilds.forEach((guild) => {
      this.createChannels(guild.id);
      this.commandManager = new CommandManager(guild.id);
      this.commandManager.loadCommands();
    });
  }

  private onGuildJoin(guild: Guild) {
    this.createChannels(guild.id);
    this.commandManager = new CommandManager(guild.id);
    this.commandManager.loadCommands();
  }

  private onInteractionCreate(interaction: Interaction) {
    if (interaction.isButton()) {
      this.buttonCallbacks.forEach((callback) => callback(interaction as ButtonInteraction));
    } else if (interaction.isModalSubmit()) {
      this.modalSubmitCallbacks.forEach((callback) => callback(interaction as ModalSubmitInteraction));
    } else if (interaction.isChatInputCommand()) {
      this.chatInputCommandCallbacks.forEach((callback) => callback(interaction as ChatInputCommandInteraction));
    }
  }

  private registerListeners() {
    this.client.once(Events.ClientReady, (client) => { this.onClientReady(client); });

    this.client.once(Events.GuildCreate, (guild) => { this.onGuildJoin(guild); });

    this.client.on(Events.InteractionCreate, (interaction) => { this.onInteractionCreate(interaction); });
  }

  private callChannelsReadyCallbacks() {
    if (this.switchChannel && this.notificationChannel) {
      this.channelsReadyCallbacks.forEach((callback) => callback({ switchChannel: this.switchChannel, notificationChannel: this.notificationChannel }));
      this.channelsReadyCallbacks = [];
    }
  }
}