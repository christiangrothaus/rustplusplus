import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';

const {GUILD_ID, CLIENT_ID, DISCORD_TOKEN} = process.env;
const commands: Array<any> = [];
// Grab all the command folders from the commands directory you created earlier
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

const deployCommands = async () => {
  for (const file of commandFiles) {
    // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
    const filePath = path.join(commandsPath, file);
    const command: any = await import(filePath);
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
  
  // Construct and prepare an instance of the REST module
  const rest = new REST().setToken(DISCORD_TOKEN as string);
  
  // and deploy your commands!
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);
  
    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID as string, GUILD_ID as string),
      { body: commands },
    ) as Array<any>;
  
    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
};

deployCommands();
