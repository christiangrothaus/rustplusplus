import { InteractionReplyOptions } from 'discord.js';

export const ephemeralReply = (content: string) => {
  const reply: InteractionReplyOptions = {content: content, ephemeral: true};
  return reply;
};