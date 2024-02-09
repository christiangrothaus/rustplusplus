import { EmbedBuilder, InteractionReplyOptions } from 'discord.js';

export const ephemeralReply = (content: string): InteractionReplyOptions => {
  const reply: InteractionReplyOptions = { content: content, ephemeral: true };
  return reply;
};

export const newSmartSwitchEmbed = (name: string, entityId: string, isActive?: boolean): EmbedBuilder => {
  return new EmbedBuilder()
    .setColor(isActive ? 0x55ff55 : 0xff5555)
    .setTitle(name)
    .addFields({ name: 'Status', value: isActive ? 'On' : 'Off' })
    .setFooter({ text:  entityId })
    .setTimestamp();
};