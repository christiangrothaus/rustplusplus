import { SlashCommandBuilder } from 'discord.js';
import Command, { CommandExecute } from '../classes/Command';

export const data = new SlashCommandBuilder()
  .setName('refreshcommands')
  .setDescription('Refreshes the loaded commands');

export const execute: CommandExecute = async (interaction, discordManager) => {
  const success = await discordManager.setSlashCommands(interaction.guildId);

  if (success) {
    interaction.reply({ content: 'Commands successfully refreshed', ephemeral: true }).then(message => {
      setTimeout(() => message.delete(), 5000);
    });
  } else {
    interaction.reply({ content: 'Commands failed to refresh', ephemeral: true }).then(message => {
      setTimeout(() => message.delete(), 5000);
    });
  }
};

export default new Command(data, execute);