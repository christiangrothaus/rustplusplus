import 'dotenv/config';
import * as path from 'path';
import * as fs from 'fs';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Client, Collection, EmbedBuilder, Events, Interaction, Message, ModalBuilder, REST, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes, TextChannel, TextInputBuilder, TextInputStyle } from 'discord.js';
import SaveData from './SaveData';
import { channelId$ } from '../commands/set-channel';
import { bufferTime } from 'rxjs';
import FcmListener, { SwitchFcmNotification } from './FcmListener';
import Command from './Command';

export default class DiscordManager {
  client: Client<boolean>;

  rustPlus;

  saveData = new SaveData();

  commands = new Collection<string, Command>();

  fcmListener: FcmListener;

  pollingId: NodeJS.Timeout;

  constructor(
    client: Client<boolean>,
    rustPlus
  ) {
    this.client = client;
    this.rustPlus = rustPlus;
    this.fcmListener = new FcmListener();
  }

  start(): void {
    this.loadCommands();
    this.loadSaveData();
    this.fetchAllEntityInfo();
    this.registerListeners();
    this.createConnections();
  }

  refreshMessages(): void {
    const { messages, switches } = this.saveData;
    const channel = this.client.channels.cache.get(this.saveData.channelId) as TextChannel;

    messages.forEach((message, entityId) => {
      const switchEntity = switches.get(entityId);
      const existingMessage = channel.messages.cache.get(message.id);
      if(switchEntity?.customName) {
        existingMessage.edit(switchEntity.customName);
      }
    });

    switches.forEach(async (switchEntity) => {
      const message = messages.get(switchEntity.entityId);

      if(!message && channel) {
        const message = await this.createSwitchMessage(switchEntity);
        messages.set(switchEntity.entityId, message);
      }
    });

  }

  destroy(): void {
    this.saveData.save();

    if(this.fcmListener) {
      this.fcmListener.destroy();
    }

    process.exit(1);
  }

  async setSlashCommands(guildId: string): Promise<boolean> {
    const { CLIENT_ID, DISCORD_TOKEN } = process.env;
    const commands: Array<RESTPostAPIChatInputApplicationCommandsJSONBody> = [];
    // Grab all the command folders from the commands directory you created earlier
    const commandsPath = path.join(__dirname, 'src/commands');
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

  private async createSwitchMessage(switchEntity: SwitchFcmNotification): Promise<Message> {
    const onButton = new ButtonBuilder()
      .setCustomId(switchEntity.entityId + '-on')
      .setLabel('On')
      .setStyle(ButtonStyle.Success);

    const offButton = new ButtonBuilder()
      .setCustomId(switchEntity.entityId + '-off')
      .setLabel('Off')
      .setStyle(ButtonStyle.Danger);

    const nameButton = new ButtonBuilder()
      .setCustomId(switchEntity.entityId + '-name')
      .setLabel('Name')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().setComponents(onButton, offButton, nameButton);
    const channel = this.client.channels.cache.get(this.saveData.channelId) as TextChannel;

    const embded = new EmbedBuilder()
      .setColor(switchEntity.active ? 0x55ff55 : 0xff5555)
      .setTitle(switchEntity.customName || switchEntity.name)
      .addFields({ name: 'Status', value: switchEntity.active ? 'On' : 'Off' })
      .setTimestamp();

    const message = await channel.send({
      embeds: [embded],
      components: [row]
    });

    return message;
  }

  private loadSaveData(): void {
    this.saveData.loadFromSave();
  }

  private createConnections(): void {
    this.client.login(process.env.DISCORD_TOKEN);
    this.fcmListener.start();
    this.rustPlus.connect();
  }

  private registerListeners(): void {
    this.registerDiscordListeners();
    this.registerRustPlusListeners();
  }

  private registerDiscordListeners(): void {
    this.client.once(Events.ClientReady, readyClient => {
      console.log(`Ready! Logged in as ${readyClient.user.tag}`);

    });

    this.client.once(Events.GuildCreate, (guild) => {
      this.setSlashCommands(guild.id);
    });

    this.client.on(Events.InteractionCreate, async (interaction: Interaction) => {
      if(interaction.isButton()) {
        interaction as ButtonInteraction;

        const customId = interaction.customId;
        const [entityId, action] = customId.split('-');
        if(action === 'name') {
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

          const switchEntity = this.saveData.switches.get(entityId);

          switchEntity.customName = newName;

          this.refreshMessages();

          submitted.deferUpdate();

          return;
        }

        const switchEntity = this.saveData.switches.get(entityId);

        this.rustPlus.getEntityInfo(switchEntity.entityId, () => {
        });

        if (action === 'on') {
          this.rustPlus.turnSmartSwitchOn(switchEntity.entityId, () => {
            interaction.deferUpdate();
          });
        } else {
          this.rustPlus.turnSmartSwitchOff(switchEntity.entityId, () => {
            interaction.deferUpdate();
          });
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

    this.fcmListener.switches$.pipe(bufferTime(200)).subscribe((fcmNotifications) => {
      fcmNotifications.forEach((fcmNotification) => {
        this.saveData.switches.set(fcmNotification.entityId, fcmNotification);
      });

      if(this.saveData.switches.size && fcmNotifications.length) {
        this.refreshMessages();
      }
    });
  }

  private async fetchAllEntityInfo(): Promise<Array<any>> {
    const switchEntities = this.saveData.switches.keys();
    const messages: Array<any> = [];

    for (const switchEntityId in switchEntities) {
      messages.push(await this.fetchEntityInfo(switchEntityId));
    }

    return messages;
  }

  private async fetchEntityInfo(switchEntityId: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.rustPlus.getEntityInfo(switchEntityId, (message: any) => {
        if(message.broadcast) {
          resolve(message);
        } else {
          reject();
        }
      });
    });
  }

  private registerRustPlusListeners(): void {
    this.rustPlus.on('message', (message) => {
      if (message?.broadcast?.entityChanged) {
        const entityChange = message.broadcast.entityChanged;

        const entityId = entityChange.entityId;
        const active = entityChange.payload.value;

        if (this.saveData.switches.get(entityId)) {
          const switchEntity = this.saveData.switches.get(entityId);
          switchEntity.active = active;
        }
      }
    });

    channelId$.subscribe((id) => {
      this.saveData.channelId = id;
      this.saveData.save();
      this.refreshMessages();
    });
  }

  private async loadCommands(): Promise<void> {
    const commandsPath = path.join(__dirname, 'src/commands');
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