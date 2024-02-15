import 'dotenv/config';
import * as path from 'path';
import * as fs from 'fs';
import { ActionRowBuilder, ButtonInteraction, ChatInputCommandInteraction, Client, Collection, Events, GatewayIntentBits, Interaction, Message, ModalBuilder, ModalSubmitInteraction, REST, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes, TextChannel, TextInputBuilder, TextInputStyle } from 'discord.js';
import State from './State';
import PushListener from './PushListener';
import Command from './Command';
import RustPlusWrapper from './RustPlusWrapper';
import { EntityChanged, EntityType } from '../models/RustPlus.models';
import SmartSwitchMessage from './messages/SmartSwitchMessage';
import SmartAlarmMessage from './messages/SmartAlarmMessage';
import StorageMonitorMessage from './messages/StorageMonitorMessage';
import BaseEntityInfo from './entityInfo/BaseEntityInfo';
import SmartSwitchEntityInfo from './entityInfo/SmartSwitchEntityInfo';
import SmartAlarmEntityInfo from './entityInfo/SmartAlarmEntityInfo';
import StorageMonitorEntityInfo from './entityInfo/StorageMonitorEntityInfo';
import BaseSmartMessage from './messages/BaseSmartMessage';

export default class DiscordManager {
  discordClient: Client<boolean>;

  rustPlus: RustPlusWrapper;

  state = new State();

  commands = new Collection<string, Command>();

  pushListener: PushListener;

  private rustPlusKeepAliveId: NodeJS.Timeout;

  async start(): Promise<void> {
    this.loadState();
    await this.initializeClients();
    this.loadCommands();
    this.registerStateListeners();
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

    clearInterval(this.rustPlusKeepAliveId);

    if (this.pushListener) {
      this.pushListener.destroy();
    }

    process.exit(1);
  }

  async setSlashCommands(guildId: string): Promise<boolean> {
    const { APPLICATION_ID, DISCORD_TOKEN } = process.env;
    const commands: Array<RESTPostAPIChatInputApplicationCommandsJSONBody> = [];
    // Grab all the command folders from the commands directory you created earlier
    const commandsPath = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

    for (const file of commandFiles) {
    // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
      const filePath = path.join(commandsPath, file);
      const command: Command = await import(filePath);
      if (command.data && command.execute) {
        commands.push(command.data.toJSON());
      } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
      }
    }

    const rest = new REST().setToken(DISCORD_TOKEN as string);

    try {
      console.log(`Started refreshing ${commands.length} application (/) commands.`);

      const data = await rest.put(
        Routes.applicationGuildCommands(APPLICATION_ID as string, guildId),
        { body: commands }
      ) as Array<any>;

      console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
      console.error(error);
      return false;
    }

    return true;
  }

  private loadState(): void {
    this.state.loadFromSave();
  }

  private async initializeDiscord(): Promise<void> {
    this.discordClient = new Client({ intents: [GatewayIntentBits.Guilds] });
    this.registerDiscordListeners();
    await this.discordClient.login(process.env.DISCORD_TOKEN);
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
    this.discordClient.once(Events.ClientReady, (readyClient) => {
      console.log(`Ready! Logged in as ${readyClient.user.tag}`);
      this.setSlashCommands(this.state.guildId);
    });

    this.discordClient.once(Events.GuildCreate, (guild) => {
      this.setSlashCommands(guild.id);
      this.state.guildId = guild.id;
    });

    this.discordClient.on(Events.InteractionCreate, async (interaction: Interaction) => {
      if (interaction.isButton()) {
        interaction as ButtonInteraction;

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
            delete this.state.messages[interaction.message.id];
            interaction.message.delete();
            interaction.reply({ content: 'Message deleted!', ephemeral: true }).then(message => {
              setTimeout(() => message.delete(), 5000);
            });
            this.state.save();

            break;
          }
        }

        return;
      }

      if (interaction.isModalSubmit()) {
        interaction as ModalSubmitInteraction;

        const name = interaction.fields.getTextInputValue('name');
        const message = this.state.messages[interaction.message.id];

        this.updateMessage(message, { name });

        interaction.reply({ content: 'Message updated', ephemeral: true }).then(message => {
          setTimeout(() => message.delete(), 5000);
        });
      }
      if (interaction.isChatInputCommand()) {
        interaction as ChatInputCommandInteraction;

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
      }
    });
  }

  private async initializeClients(): Promise<void> {
    await this.initializeDiscord();
    this.initializeRustPlus();
    await this.initializePushListener();
  }

  private async fetchAllEntityInfo(): Promise<void> {
    if (this.state.messages) {
      const messages = Object.values(this.state.messages);

      for (const message of messages) {
        const entityInfo = await this.rustPlus.getEntityInfo(message.entityInfo.entityId);
        if (message instanceof StorageMonitorMessage) {
          this.updateMessage(message, { capacity: entityInfo.payload.capacity });
        } else {
          const castedMessage = message as SmartAlarmMessage | SmartSwitchMessage;
          this.updateMessage(castedMessage, { isActive: entityInfo.payload.value });
        }
      }
    }
  }

  private registerRustPlusListeners(): void {
    if (this.rustPlus.hasClient()) {
      this.rustPlus.onConnected(() => {
        this.fetchAllEntityInfo();
      });

      this.rustPlus.onEntityChange(async (entityChange: EntityChanged) => {
        const entityId = entityChange?.entityId;

        const messages = Object.values(this.state.messages);

        // Go through each message and update it then exit the loop
        for (const message of messages) {
          if (message.entityInfo.entityId === `${entityId}`) {
            if (message instanceof StorageMonitorMessage) {
              this.updateMessage(message, { capacity: entityChange.payload.capacity });
            } else {
              const castedMessage = message as SmartAlarmMessage | SmartSwitchMessage;
              this.updateMessage(castedMessage, { isActive: entityChange.payload.value });
            }

            break;
          }
        }
      });
    }
  }

  private registerStateListeners(): void {
    this.state.onChanelIdChange((oldId) => {
      const oldChannel = this.discordClient.channels.cache.get(oldId) as TextChannel;
      oldChannel.messages.cache.sweep((message) => {
        if (message.author.id === this.discordClient.user?.id) {
          delete this.state.messages[message.id];
          return true;
        }

        return false;
      });
    });
  }

  private registerPushListeners(): void {
    this.pushListener.onNewSwitch(async (switchPushNotification) => {
      const messages = Object.values(this.state.messages);
      const hasExistingMessage = messages.findIndex((smartMessage) => {
        return smartMessage.entityInfo.entityId === switchPushNotification.entityId;
      }) !== -1;

      if (hasExistingMessage) { return; }

      const entityInfo = await this.rustPlus.getEntityInfo(switchPushNotification.entityId);

      const smartSwitchEntityInfo: SmartSwitchEntityInfo = {
        name: switchPushNotification.name,
        entityId: switchPushNotification.entityId,
        isActive: entityInfo.payload.value
      };

      this.createNewMessage(entityInfo.type, smartSwitchEntityInfo);
    });
  }

  private async loadCommands(): Promise<void> {
    const commandsPath = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

    for (const file of commandFiles) {
    // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
      const filePath = path.join(commandsPath, file);
      const command: Command = await import(filePath);
      if (command.data && command.execute) {
        this.commands.set(command.data.name, command);
      }
    }
  }

  private startRustPlusKeepAlive(): void {
    this.rustPlusKeepAliveId = setInterval(() => {
      this.fetchAllEntityInfo();
    }, 5 * 60 * 1000);
  }

  private async createNewMessage(entityType: EntityType, entityInfo: BaseEntityInfo): Promise<Message> {
    let newMessage: BaseSmartMessage<BaseEntityInfo>;

    switch (entityType) {
      case 'Switch': {
        const castedEntityInfo = entityInfo as SmartSwitchEntityInfo;
        newMessage = new SmartSwitchMessage({ name: castedEntityInfo.name, entityId: castedEntityInfo.entityId, isActive: castedEntityInfo.isActive });
        break;
      }
      case 'Alarm': {
        const castedEntityInfo = entityInfo as SmartAlarmEntityInfo;
        newMessage = new SmartAlarmMessage({ name: castedEntityInfo.name, entityId: castedEntityInfo.entityId, isActive: castedEntityInfo.isActive });
        break;
      }
      case 'StorageMonitor': {
        const castedEntityInfo = entityInfo as StorageMonitorEntityInfo;
        newMessage = new StorageMonitorMessage({ name: castedEntityInfo.name, entityId: castedEntityInfo.entityId, capacity: castedEntityInfo.capacity });
        break;
      }
    }

    const channel = await this.discordClient.channels.fetch(this.state.channelId) as TextChannel;
    const discordMessage = await channel.send(newMessage);
    this.state.messages[discordMessage.id] = newMessage;
    this.state.save();

    return discordMessage;
  }

  private async updateMessage<T extends BaseEntityInfo>(message: BaseSmartMessage<T>, entityInfo: Partial<T>): Promise<void> {
    message.update(entityInfo);

    const channel = await this.discordClient.channels.fetch(message.channelId) as TextChannel;
    const discordMessage = await channel.messages.fetch(message.messageId);

    await discordMessage.edit(message);
  }
}