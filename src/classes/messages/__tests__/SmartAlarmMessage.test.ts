import { ActionRowBuilder, EmbedBuilder, TextChannel } from 'discord.js';
import SmartAlarmMessage from '../SmartAlarmMessage';
import SmartAlarmEntityInfo from '../../entityInfo/SmartAlarmEntityInfo';

describe('SmartAlarmMessage', () => {
  const mockChannel = {} as TextChannel;

  describe('ctor', () => {
    it('should create a new instance of SmartAlarmMessage', () => {
      const entityInfo = new SmartAlarmEntityInfo('name', 'id');
      const smartAlarmMessage = new SmartAlarmMessage(mockChannel, entityInfo);

      expect(smartAlarmMessage.entityInfo).toEqual(entityInfo);
      expect(smartAlarmMessage.embeds).toHaveLength(1);
      expect(smartAlarmMessage.components).toHaveLength(1);
    });
  });

  describe('createMessageEmbed', () => {
    it('should create a new EmbedBuilder', () => {
      const entityInfo = new SmartAlarmEntityInfo('name', 'id');
      const smartAlarmMessage = new SmartAlarmMessage(mockChannel, entityInfo);
      const embedBuilder = smartAlarmMessage.createMessageEmbed(entityInfo);

      expect(embedBuilder).toBeInstanceOf(EmbedBuilder);
    });

    it('should set the color to red', () => {
      const entityInfo = new SmartAlarmEntityInfo('name', 'id');
      const smartAlarmMessage = new SmartAlarmMessage(mockChannel, entityInfo);
      const embedBuilder = smartAlarmMessage.createMessageEmbed(entityInfo);

      expect(embedBuilder.data.color).toBe(0xff5555);
    });
  });

  describe('createMessageButtons', () => {
    it('should create a new ActionRowBuilder', () => {
      const entityInfo = new SmartAlarmEntityInfo('name', 'id');
      const smartAlarmMessage = new SmartAlarmMessage(mockChannel, entityInfo);
      const actionRowBuilder = smartAlarmMessage.createMessageButtons(entityInfo);

      expect(actionRowBuilder).toBeInstanceOf(ActionRowBuilder);
    });
  });
});