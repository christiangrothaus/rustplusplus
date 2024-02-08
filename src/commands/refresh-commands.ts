import { SlashCommandBuilder } from 'discord.js';
import Command, { CommandExecute } from '../classes/Command';
import { ephemeralReply } from '../utils/messages';

export const data = new SlashCommandBuilder()
  .setName('refreshcommands')
  .setDescription('Refreshes the loaded commands');

export const execute: CommandExecute = async (interaction, discordManager) => {
  const success = await discordManager.setSlashCommands(interaction.guildId);

  if (success) {
    interaction.reply(ephemeralReply('Commands successfully refreshed'));
  } else {
    interaction.reply(ephemeralReply('Commands failed to refresh'));
  }
};

export default new Command(data, execute);