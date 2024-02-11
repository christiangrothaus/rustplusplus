import 'dotenv/config';
import * as path from 'path';
import * as fs from 'fs';
import { ActionRowBuilder, ButtonInteraction, ChatInputCommandInteraction, Client, Collection, Events, GatewayIntentBits, Interaction, Message, ModalBuilder, REST, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes, TextChannel, TextInputBuilder, TextInputStyle } from 'discord.js';
import State from './State';
import PushListener, { SwitchPushNotification } from './PushListener';
import Command from './Command';
import RustPlusWrapper from './RustPlusWrapper';
import { createSmartSwitchButtonRow, createSmartSwitchEmbed, ephemeralReply, getMessageEmbed, updateMessageName, updateMessageStatus } from '../utils/messages';
import { EntityChanged } from '../models/RustPlus.models';

export default class DiscordManager {
  client: Client<boolean>;

  rustPlus: RustPlusWrapper;

  state = new State();

  commands = new Collection<string, Command>();

  pushListener: PushListener;

  async start(): Promise<void> {
    this.loadState();
    await this.initializeClients();
    this.loadCommands();
    this.registerStateListeners();
    this.registerPushListeners();
  }

  restart(): void {
    this.state.save();
    this.destroy();
    this.start();
  }

  destroy(): void {
    this.state?.save();

    if (this.pushListener) {
      this.pushListener.destroy();
    }

    process.exit(1);
  }

  async setSlashCommands(guildId: string): Promise<boolean> {
    const { CLIENT_ID, DISCORD_TOKEN } = process.env;
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
        Routes.applicationGuildCommands(CLIENT_ID as string, guildId),
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
    this.client = new Client({ intents: [GatewayIntentBits.Guilds] });
    this.registerDiscordListeners();
    await this.client.login(process.env.DISCORD_TOKEN);
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
    this.client.once(Events.ClientReady, readyClient => {
      console.log(`Ready! Logged in as ${readyClient.user.tag}`);
      this.setSlashCommands(this.state.guildId);
    });

    this.client.once(Events.GuildCreate, (guild) => {
      this.setSlashCommands(guild.id);
      this.state.guildId = guild.id;
    });

    this.client.on(Events.InteractionCreate, async (interaction: Interaction) => {
      if (interaction.isButton()) {
        interaction as ButtonInteraction;

        const customId = interaction.customId;
        const [entityId, action] = customId.split('-');
        switch (action) {
          case 'name': {
            const modal = new ModalBuilder()
              .setCustomId(entityId + '-nameChangeModal')
              .setTitle('Change Switch Name');

            const nameInput = new TextInputBuilder()
              .setCustomId('newName')
              .setLabel('New Name')
              .setStyle(TextInputStyle.Short);

            const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);

            modal.setComponents(firstActionRow);

            await interaction.showModal(modal);

            const submitted = await interaction.awaitModalSubmit({
              time: 60000
            });

            const newName = submitted.fields.getTextInputValue('newName');
            updateMessageName(interaction.message, newName);

            submitted.reply(ephemeralReply('Name changed!')).then(message => {
              setTimeout(() => message.delete(), 5000);
            });

            break;
          }
          case 'on':
          case 'off': {
            const embed = getMessageEmbed(interaction);
            const entityId = embed.footer?.text;
            const entityName = embed.title;

            try {
              await this.rustPlus.toggleSmartSwitch(entityId, action === 'on');
              this.rustPlus.getEntityInfo(entityId);
            } catch (error) {
              interaction.reply(ephemeralReply(error as string)).then(message => {
                setTimeout(() => message.delete(), 5000);
              });

              break;
            }

            interaction.reply(ephemeralReply(`${entityName} switched ${action}!`)).then(message => {
              setTimeout(() => message.delete(), 5000);
            });

            break;
          }
          case 'delete': {
            delete this.state.messages[interaction.message.id];
            interaction.message.delete();
            this.state.save();

            break;
          }
        }

        return;
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

  private async fetchAllEntityInfo(): Promise<Array<any>> {
    const messages: Array<any> = [];

    if (this.state.messages) {
      const entityIds = Object.values(this.state.messages);

      for (const entityId of entityIds) {
        messages.push(await this.rustPlus.getEntityInfo(entityId));
      }
    }

    return messages;
  }

  private registerRustPlusListeners(): void {
    if (this.rustPlus.hasClient()) {
      this.rustPlus.onConnected(() => {
        this.fetchAllEntityInfo();
      });

      this.rustPlus.onEntityChange((entityChange: EntityChanged) => {
        const entityId = entityChange?.entityId;

        const channel = this.client.channels.cache.get(this.state.channelId) as TextChannel;
        const message = channel.messages.cache.find((msg) => {
          const embed = msg.embeds[0];
          console.log(embed, entityId);
          return embed.footer?.text === `${entityId}`;
        });
        if (message) {
          updateMessageStatus(message, entityChange);
        }
      });
    }
  }

  private registerStateListeners(): void {
    this.state.onChanelIdChange((oldId) => {
      const oldChannel = this.client.channels.cache.get(oldId) as TextChannel;
      oldChannel.messages.cache.sweep((message) => {
        if (message.author.id === this.client.user?.id) {
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
      const hasExistingMessage = messages.findIndex((entityId) => {
        return entityId === switchPushNotification.entityId;
      }) !== -1;

      if (hasExistingMessage) { return; }

      const message = await this.sendEntityMessage(switchPushNotification);
      this.rustPlus.getEntityInfo(switchPushNotification.entityId);
      this.state.messages[message.id] = switchPushNotification.entityId;
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

  private async sendEntityMessage(pushNotification: SwitchPushNotification): Promise<Message<true>> {
    const channel = this.client.channels.cache.get(this.state.channelId) as TextChannel;
    const { name, entityId } = pushNotification;
    return await channel.send({
      embeds: [createSmartSwitchEmbed(name, entityId)],
      components: [createSmartSwitchButtonRow(entityId)]
    });
  }
}