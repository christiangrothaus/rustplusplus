import 'dotenv/config';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Client, Collection, Events, GatewayIntentBits, Interaction, Message, ModalBuilder, TextChannel, TextInputBuilder, TextInputStyle } from 'discord.js';
import * as rustplus from '@liamcottle/rustplus.js';
import * as path from 'path';
import * as fs from 'fs';
import { SwitchFcmNotification, fcmListen, switches } from './fcm-listener';
import { bufferTime } from 'rxjs';
import { createSwitches } from './commands/create-switches';

type CommandModel = {
  execute: (interation: ChatInputCommandInteraction) => Promise<void>
}

export const rustPlusClient = new rustplus('168.100.163.133', '28182', '76561198057625988', process.env.RUST_TOKEN);

const switchMap = new Map<string, SwitchFcmNotification>();
const messageMap = new Map<string, Message>();

const init = async () => {
// Create a new client instance
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  const commands = new Collection<string, CommandModel>();
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

  for (const file of commandFiles) {
    // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
    const filePath = path.join(commandsPath, file);
    const command: any = await import(filePath);
    if ('data' in command && 'execute' in command) {
      commands.set(command.data.name, command);
    }
  }

  // When the client is ready, run this code (only once).
  // The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
  // It makes some properties non-nullable.
  client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  });

  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    // if(interaction.isModalSubmit()) {
    //   interaction as ModalSubmitInteraction;

    //   const customId = interaction.customId;
    //   const [entityId] = customId.split('-');
    //   const newName = interaction.fields.getTextInputValue('nameChangeModal');

    //   const switchEntity = switchMap.get(entityId);

    //   switchEntity.customName = newName;

    //   refreshSwitchMessages(client, interaction.channel as TextChannel);

    //   return;
    // }

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

        const switchEntity = switchMap.get(entityId);

        switchEntity.customName = newName;

        refreshSwitchMessages(client, interaction.channel as TextChannel);

        submitted.deferUpdate();

        return;
      }  
    
      const switchEntity = switchMap.get(entityId);

      rustPlusClient.getEntityInfo(switchEntity.entityId, () => {
      });

      if (action === 'on') {
        rustPlusClient.turnSmartSwitchOn(switchEntity.entityId, () => {
          interaction.deferUpdate();
        });
      } else {
        rustPlusClient.turnSmartSwitchOff(switchEntity.entityId, () => {
          interaction.deferUpdate();       
        });
      }

      return;
    }

    if (interaction.isChatInputCommand()) {
      interaction as ChatInputCommandInteraction;
      
      const command = commands.get(interaction.commandName); 

      if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        await command.execute(interaction);
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

  rustPlusClient.on('message', (message) => {
    if (message?.broadcast?.entityChanged) {
      const entityChange = message.broadcast.entityChanged;

      const entityId = entityChange.entityId;
      const active = entityChange.payload.value;

      if (switchMap.get(entityId)) {
        const switchEntity = switchMap.get(entityId);
        switchEntity.active = active;
      }
    }
  });

  createSwitches.subscribe((channelId) => {
    console.log(channelId);
    const channel = client.channels.cache.get(channelId) as TextChannel;
    refreshSwitchMessages(client, channel, true);
  });

  switches.pipe(bufferTime(200)).subscribe((fcmNotifications) => {
    fcmNotifications.forEach((fcmNotification) => {
      switchMap.set(fcmNotification.entityId, fcmNotification);
    });

    if(switchMap.size && fcmNotifications.length) {
      refreshSwitchMessages(client);
    }
  });

  // Log in to Discord with your client's token
  client.login(process.env.DISCORD_TOKEN);

  fcmListen();
  
  rustPlusClient.connect();
};

const refreshSwitchMessages = (client: Client<boolean>, channel?: TextChannel, recreate: boolean = false) => {
  messageMap.forEach((message, entityId) => {
    const switchEntity = switchMap.get(entityId);
    const channelId = message.channelId;
    const channel = client.channels.cache.get(channelId) as TextChannel; 
    const existingMessage = channel.messages.cache.get(message.id);
    if(switchEntity?.customName) {
      existingMessage.edit(switchEntity.customName);
    }
  });

  switchMap.forEach((switchEntity) => {
    const message = messageMap.get(switchEntity.entityId);

    console.log(messageMap.keys());

    if((!message || recreate) && channel) {
      createSwitchButton(channel, switchEntity);
    }
  });

};

const createSwitchButton = async (channel: TextChannel, switchEntity: SwitchFcmNotification) => {
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
    
  const message = await channel.send({
    components: [row],
    content: switchEntity.customName || switchEntity.entityName
  });

  messageMap.set(switchEntity.entityId, message);
};

const save = () => {
  const messages = Object.fromEntries(messageMap);
  const switches = Object.fromEntries(switchMap);

  const data = {messages, switches};

  const json = JSON.stringify(data);

  fs.writeFile('save.json', json, 'utf-8', () => {});
};

const load = () => {
  fs.readFile('save.json', () => {

  });
};


init();