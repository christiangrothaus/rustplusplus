import { REST, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes } from 'discord.js';
import Command from './Command';
import path from 'path';
import fs from 'fs';

export default class CommandManager {

  /**
   * @key the command name
   * @value the command
   */
  commands: Map<string, Command> = new Map();

  private commandJson: Array<RESTPostAPIChatInputApplicationCommandsJSONBody> = [];

  private guildId: string;

  constructor(guildId: string) {
    this.guildId = guildId;
  }

  async loadCommands(): Promise<void> {
    try {
      // Grab all the command folders from the commands directory you created earlier
      const commandsPath = path.join(__dirname, '../commands');
      const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));
      for (const file of commandFiles) {
        // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
        const filePath = 'file:///' + path.join(commandsPath, file);
        const command: Command = await import(filePath);
        if (command.data && command.execute) {
          this.commandJson.push(command.data.toJSON());
          this.commands.set(command.data.name, command);
        } else {
          throw new Error(`The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
      }
    } catch (error) {
      throw new Error(`Failed to load commands: ${error.message}`);
    }

    await this.postCommands();
  }

  private async postCommands(): Promise<void> {
    const { APPLICATION_ID, DISCORD_TOKEN } = process.env;
    if (!APPLICATION_ID) {
      throw new Error('Missing required application ID.');
    } else if (!DISCORD_TOKEN) {
      throw new Error('Missing required discord token.');
    } else if (!this.guildId) {
      throw new Error('Missing required guild ID.');
    } else if (!this.commandJson.length) {
      throw new Error('No commands loaded.');
    }

    const rest = new REST().setToken(DISCORD_TOKEN as string);

    try {
      await rest.put(
        Routes.applicationGuildCommands(APPLICATION_ID as string, this.guildId),
        { body: this.commandJson }
      ) as Array<any>;
    } catch (error) {
      throw new Error(`Failed to register application commands: ${error.message}`);
    }
  }
}