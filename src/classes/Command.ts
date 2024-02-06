import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import DiscordManager from './DiscordManager';

export type CommandData = SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>
export type CommandExecute = (interation: ChatInputCommandInteraction, discordManager: DiscordManager) => Promise<void>

export default class Command {
  data: CommandData;

  execute: CommandExecute;

  constructor(data: CommandData, execute: CommandExecute) {
    this.data = data;
    this.execute = execute;
  }
}