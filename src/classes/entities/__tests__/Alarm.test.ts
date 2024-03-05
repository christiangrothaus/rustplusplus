import { ActionRowBuilder, EmbedBuilder } from 'discord.js';
import Alarm from '../Alarm';
import AlarmEntityInfo from '../../entityInfo/AlarmEntityInfo';

describe('Alarm', () => {
  describe('ctor', () => {
    it('should create a new instance of SmartAlarmMessage', () => {
      const entityInfo = new AlarmEntityInfo('name', 'id');
      const smartAlarmMessage = new Alarm(entityInfo);

      expect(smartAlarmMessage.entityInfo).toEqual(entityInfo);
      expect(smartAlarmMessage.embeds).toHaveLength(1);
      expect(smartAlarmMessage.components).toHaveLength(1);
    });
  });

  describe('createMessageEmbed', () => {
    it('should create a new EmbedBuilder', () => {
      const entityInfo = new AlarmEntityInfo('name', 'id');
      const smartAlarmMessage = new Alarm(entityInfo);
      const embedBuilder = smartAlarmMessage.createMessageEmbed(entityInfo);

      expect(embedBuilder).toBeInstanceOf(EmbedBuilder);
    });

    it('should set the color to red', () => {
      const entityInfo = new AlarmEntityInfo('name', 'id');
      const smartAlarmMessage = new Alarm(entityInfo);
      const embedBuilder = smartAlarmMessage.createMessageEmbed(entityInfo);

      expect(embedBuilder.data.color).toBe(0xff5555);
    });
  });

  describe('createMessageButtons', () => {
    it('should create a new ActionRowBuilder', () => {
      const entityInfo = new AlarmEntityInfo('name', 'id');
      const smartAlarmMessage = new Alarm(entityInfo);
      const actionRowBuilder = smartAlarmMessage.createMessageButtons(entityInfo);

      expect(actionRowBuilder).toBeInstanceOf(ActionRowBuilder);
    });
  });
});