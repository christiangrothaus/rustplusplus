import { EmbedBuilder } from 'discord.js';
import BaseNotification from './BaseNotification';
import AlarmNotificationInfo from './notification-info/AlarmNotificationInfo';

export default class AlarmNotification extends BaseNotification<AlarmNotificationInfo> {

  constructor(entityInfo: AlarmNotificationInfo) {
    super(entityInfo);
  }

  protected createNotificationEmbed(entityInfo: AlarmNotificationInfo): EmbedBuilder {
    const { message, name } = entityInfo;

    return new EmbedBuilder()
      .setColor(0xff3333)
      .setTitle(name)
      .setDescription(message)
      .setTimestamp();
  }
}