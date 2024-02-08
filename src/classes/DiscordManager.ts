import 'dotenv/config';
import * as path from 'path';
import * as fs from 'fs';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Client, Collection, EmbedBuilder, Events, GatewayIntentBits, Interaction, Message, ModalBuilder, REST, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes, TextChannel, TextInputBuilder, TextInputStyle } from 'discord.js';
import SaveData from './SaveData';
import PushListener from './FcmListener';
import Command from './Command';
import SmartSwitch from './rust/SmartSwitch';
import RustPlusWrapper from './RustPlusWrapper';

export default class DiscordManager {
  client: Client<boolean>;

  rustPlus: RustPlusWrapper;

  saveData = new SaveData();

  commands = new Collection<string, Command>();

  fcmListener: PushListener;

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
    const { messages, switches } = this.saveData;
    const channel = this.client.channels.cache.get(this.saveData.channelId) as TextChannel;

    Object.entries(messages).forEach(([entityId, message]) => {
      const smartSwitch = switches[entityId];
      const existingMessage = channel.messages.cache.get(message.id);
      if (smartSwitch.name) {
        existingMessage.edit(smartSwitch.name);
      }
    });

    Object.values(switches).forEach(async (switchEntity) => {
      const message = messages[switchEntity.entityId];

      if (!message && channel) {
        const message = await this.createSwitchMessage(switchEntity);
        messages[switchEntity.entityId] = message;
      }
    });

  }

  destroy(): void {
    this.saveData.save();

    if (this.fcmListener) {
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

  private async createSwitchMessage(switchEntity: SmartSwitch): Promise<Message> {
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
      .setColor(switchEntity?.isActive ? 0x55ff55 : 0xff5555)
      .setTitle(switchEntity.name)
      .addFields({ name: 'Status', value: switchEntity?.isActive ? 'On' : 'Off' })
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
      if (interaction.isButton()) {
        interaction as ButtonInteraction;

        const customId = interaction.customId;
        const [entityId, action] = customId.split('-');
        if (action === 'name') {
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

          submitted.deferUpdate();

          return;
        }

        const switchEntity = this.saveData.switches[entityId];

        this.rustPlus.getEntityInfo(switchEntity.entityId);

        await this.rustPlus.toggleSmartSwitch(switchEntity.entityId, action === 'on');

        interaction.deferUpdate();

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

    this.fcmListener.onNewSwitch((smartSwitch) => {
      if (!this.saveData.switches[smartSwitch.entityId]) { // If this is a new switch, fetch the entity info so it starts sending messages
        this.rustPlus.getEntityInfo(smartSwitch.entityId);
      }

      this.saveData.switches[smartSwitch.entityId] = smartSwitch;
      this.refreshMessages();
    });
  }

  private initializeClients(): void {
    this.fcmListener = new PushListener();
    this.client = new Client({ intents: [GatewayIntentBits.Guilds] }),
    this.rustPlus = new RustPlusWrapper(this.saveData.rustServerHost, this.saveData.rustServerPort);
  }

  private async fetchAllEntityInfo(): Promise<Array<any>> {
    const switchEntities = Object.keys(this.saveData.switches);
    const messages: Array<any> = [];

    for (const switchEntityId in switchEntities) {
      messages.push(await this.rustPlus.getEntityInfo(switchEntityId));
    }

    return messages;
  }

  private registerRustPlusListeners(): void {
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

    this.saveData.onChanelIdChange(() => {
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