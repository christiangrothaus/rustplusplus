import * as path from 'path';
import * as fs from 'fs';
import { REST, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes, SlashCommandBuilder } from 'discord.js';
import Command, { CommandExecute } from '../classes/Command';

export const data = new SlashCommandBuilder()
  .setName('refreshcommands')
  .setDescription('Refreshes the loaded commands');

export const execute: CommandExecute = async (interaction) => {
  const {CLIENT_ID, DISCORD_TOKEN} = process.env;
  const commands: Array<RESTPostAPIChatInputApplicationCommandsJSONBody> = [];
  // Grab all the command folders from the commands directory you created earlier
  const commandsPath = path.join(__dirname, 'commands');
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
      Routes.applicationGuildCommands(CLIENT_ID as string, interaction.guildId),
      { body: commands },
    ) as Array<any>;
  
    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error(error);
  }

  interaction.reply('Commands successfully refreshed');
};

export default new Command(data, execute);