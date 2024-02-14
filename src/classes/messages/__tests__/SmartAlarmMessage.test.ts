import { ActionRowBuilder, EmbedBuilder } from 'discord.js';
import SmartAlarmMessage from '../SmartAlarmMessage';

describe('SmartAlarmMessage', () => {
  describe('ctor', () => {
    it('should create a new instance of SmartAlarmMessage', () => {
      const entityInfo = {
        name: 'name',
        entityId: 'id',
        isActive: true
      };
      const smartAlarmMessage = new SmartAlarmMessage(entityInfo);

      expect(smartAlarmMessage.entityInfo).toEqual(entityInfo);
      expect(smartAlarmMessage.embeds).toHaveLength(1);
      expect(smartAlarmMessage.components).toHaveLength(1);
    });
  });

  describe('createMessageEmbed', () => {
    it('should create a new EmbedBuilder', () => {
      const entityInfo = {
        name: 'name',
        entityId: 'id',
        isActive: true
      };
      const smartAlarmMessage = new SmartAlarmMessage(entityInfo);
      const embedBuilder = smartAlarmMessage.createMessageEmbed(entityInfo);

      expect(embedBuilder).toBeInstanceOf(EmbedBuilder);
    });

    it('should set the color to green if isActive is true', () => {
      const entityInfo = {
        name: 'name',
        entityId: 'id',
        isActive: true
      };
      const smartAlarmMessage = new SmartAlarmMessage(entityInfo);
      const embedBuilder = smartAlarmMessage.createMessageEmbed(entityInfo);

      expect(embedBuilder.data.color).toBe(0x55ff55);
    });

    it('should set the color to red if isActive is false', () => {
      const entityInfo = {
        name: 'name',
        entityId: 'id',
        isActive: false
      };
      const smartAlarmMessage = new SmartAlarmMessage(entityInfo);
      const embedBuilder = smartAlarmMessage.createMessageEmbed(entityInfo);

      expect(embedBuilder.data.color).toBe(0xff5555);
    });

    it('should set the status to Triggered if isActive is true', () => {
      const entityInfo = {
        name: 'name',
        entityId: 'id',
        isActive: true
      };
      const smartAlarmMessage = new SmartAlarmMessage(entityInfo);
      const embedBuilder = smartAlarmMessage.createMessageEmbed(entityInfo);

      expect(embedBuilder.data.fields[0].value).toBe('Triggered');
    });

    it('should set the status to Off if isActive is false', () => {
      const entityInfo = {
        name: 'name',
        entityId: 'id',
        isActive: false
      };
      const smartAlarmMessage = new SmartAlarmMessage(entityInfo);
      const embedBuilder = smartAlarmMessage.createMessageEmbed(entityInfo);

      expect(embedBuilder.data.fields[0].value).toBe('Off');
    });
  });

  describe('createMessageButtons', () => {
    it('should create a new ActionRowBuilder', () => {
      const entityInfo = {
        name: 'name',
        entityId: 'id',
        isActive: true
      };
      const smartAlarmMessage = new SmartAlarmMessage(entityInfo);
      const actionRowBuilder = smartAlarmMessage.createMessageButtons(entityInfo);

      expect(actionRowBuilder).toBeInstanceOf(ActionRowBuilder);
    });
  });
});