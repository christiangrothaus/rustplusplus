import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import Manager from './Manager';

export type CommandData = SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
export type CommandExecute = (interation: ChatInputCommandInteraction, discordManager: Manager) => Promise<void>;

export default class Command {
  data: CommandData;

  execute: CommandExecute;

  constructor(data: CommandData, execute: CommandExecute) {
    this.data = data;
    this.execute = execute;
  }
}