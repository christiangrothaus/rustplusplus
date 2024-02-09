import 'dotenv/config';
import * as path from 'path';
import * as fs from 'fs';
import { ActionRowBuilder, ButtonInteraction, ChatInputCommandInteraction, Client, Collection, Events, GatewayIntentBits, Interaction, ModalBuilder, REST, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes, TextChannel, TextInputBuilder, TextInputStyle } from 'discord.js';
import SaveData from './SaveData';
import PushListener from './PushListener';
import Command from './Command';
import RustPlusWrapper from './RustPlusWrapper';
import { ephemeralReply } from '../utils/messages';

export default class DiscordManager {
  client: Client<boolean>;

  rustPlus: RustPlusWrapper;

  saveData = new SaveData();

  commands = new Collection<string, Command>();

  pushListener: PushListener;

  start(): void {
    this.loadSaveData();
    this.initializeClients();
    this.loadCommands();
    this.fetchAllEntityInfo();
    this.registerListeners();
    this.createConnections();
  }

  restart(): void {
    this.saveData.save();
    this.destroy();
    this.start();
  }

  refreshMessages(): void {
    const { switches } = this.saveData;
    const channel = this.client.channels.cache.get(this.saveData.channelId) as TextChannel;

    Object.values(switches).forEach(async (smartSwitch) => {
      if (channel) {
        if (!smartSwitch.messageId) {
          const message = await channel.send(smartSwitch.toEmbedMessage());
          smartSwitch.messageId = message.id;
        } else {
          const message = await channel.messages.cache.get(smartSwitch.messageId);
          message.edit(smartSwitch.toEmbedMessage());
        }
      }
    });

  }

  destroy(): void {
    this.saveData.save();

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

  private loadSaveData(): void {
    this.saveData.loadFromSave();
  }

  private createConnections(): void {
    this.client.login(process.env.DISCORD_TOKEN);
    this.pushListener.start();
    if (this.rustPlus.serverHost && this.rustPlus.serverPort) {
      this.rustPlus.connect();
    }
  }

  private registerListeners(): void {
    this.registerDiscordListeners();
    this.registerRustPlusListeners();
    this.registerSaveDataListeners();
  }

  private registerDiscordListeners(): void {
    this.client.once(Events.ClientReady, readyClient => {
      console.log(`Ready! Logged in as ${readyClient.user.tag}`);
      this.setSlashCommands(this.saveData.guildId);
    });

    this.client.once(Events.GuildCreate, (guild) => {
      this.setSlashCommands(guild.id);
      this.saveData.guildId = guild.id;
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

            const smartSwitch = this.saveData.switches[entityId];
            smartSwitch.name = newName;

            this.refreshMessages();

            submitted.reply(ephemeralReply('Name changed!'));

            break;
          }
          case 'on':
          case 'off': {
            const switchEntity = this.saveData.switches[entityId];

            this.rustPlus.getEntityInfo(switchEntity.entityId);

            await this.rustPlus.toggleSmartSwitch(switchEntity.entityId, action === 'on');

            interaction.reply(ephemeralReply(`${switchEntity.name} switched ${action}!`));

            break;
          }
          case 'refresh': {
            const smartSwitch = this.saveData.switches[entityId];
            this.rustPlus.getEntityInfo(smartSwitch.entityId);
            this.refreshMessages();
            interaction.reply(ephemeralReply('Message refreshed!'));
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

    this.pushListener.onNewSwitch((smartSwitch) => {
      if (!this.saveData.switches[smartSwitch.entityId]) { // If this is a new switch, fetch the entity info so it starts sending messages
        this.rustPlus.getEntityInfo(smartSwitch.entityId);
      }

      this.saveData.switches[smartSwitch.entityId] = smartSwitch;
      this.refreshMessages();
    });
  }

  private initializeClients(): void {
    this.pushListener = new PushListener();
    this.rustPlus = new RustPlusWrapper(this.saveData.rustServerHost, this.saveData.rustServerPort);
    this.client = new Client({ intents: [GatewayIntentBits.Guilds] });
  }

  private async fetchAllEntityInfo(): Promise<Array<any>> {
    const messages: Array<any> = [];

    if (this.saveData.switches) {
      const switchEntities = Object.keys(this.saveData.switches);


      for (const switchEntityId in switchEntities) {
        messages.push(await this.rustPlus.getEntityInfo(switchEntityId));
      }
    }

    return messages;
  }

  private registerRustPlusListeners(): void {
    if (this.rustPlus.hasClient()) {
      this.rustPlus.onEntityChange((message) => {
        if (message?.broadcast?.entityChanged) {
          const entityChange = message.broadcast.entityChanged;

          const entityId = entityChange.entityId as string;
          const active = entityChange.payload.value === 'true';

          if (this.saveData.switches[entityId]) { // If this is a switch, set it to the active status and refresh the messages
            const smartSwitch = this.saveData.switches[entityId];
            smartSwitch.isActive = active;
            this.refreshMessages();
          }
        }
      });
    }
  }

  private registerSaveDataListeners(): void {
    this.saveData.onChanelIdChange(() => {
      this.refreshMessages();
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
}