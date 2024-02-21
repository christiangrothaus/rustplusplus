import { Collection, REST, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes } from 'discord.js';
import Command from './Command';
import path from 'path';
import fs from 'fs';

export default class CommandManager {

  commands: Collection<string, Command>;

  constructor() {
    this.loadCommands();
    this.refreshSlashCommands();
  }

  refreshSlashCommands(): void {
    this.setSlashCommands('guildId');
  }

  private async setSlashCommands(guildId: string): Promise<boolean> {
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
      await rest.put(
        Routes.applicationGuildCommands(APPLICATION_ID as string, guildId),
        { body: commands }
      ) as Array<any>;
    } catch (error) {
      console.error(error);
      return false;
    }

    return true;
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