import 'dotenv/config';
import { ChatInputCommandInteraction, Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import * as rustplus from '@liamcottle/rustplus.js';
import * as path from 'path';
import * as fs from 'fs';

type CommandModel = {
  execute: (interation: ChatInputCommandInteraction) => Promise<void>
}

export const rustPlusClient = new rustplus('168.100.163.133', '28182', '76561198057625988', process.env.RUST_TOKEN);

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

  client.on(Events.InteractionCreate, async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.isChatInputCommand()) return;
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
  });

  // Log in to Discord with your client's token
  client.login(process.env.DISCORD_TOKEN);
  
  rustPlusClient.connect();
};

init();