import { ActionRowBuilder, EmbedBuilder } from 'discord.js';
import StorageMonitorMessage from '../StorageMonitorMessage';

describe('StorageMonitorMessage', () => {
  describe('ctor', () => {
    it('should create a new instance of SmartAlarmMessage', () => {
      const entityInfo = {
        name: 'name',
        entityId: 'id',
        capacity: 100
      };
      const storageMonitorMessage = new StorageMonitorMessage(entityInfo);

      expect(storageMonitorMessage.entityInfo).toEqual(entityInfo);
      expect(storageMonitorMessage.embeds).toHaveLength(1);
      expect(storageMonitorMessage.components).toHaveLength(1);
    });
  });

  describe('createMessageEmbed', () => {
    it('should create a new EmbedBuilder', () => {
      const entityInfo = {
        name: 'name',
        entityId: 'id',
        capacity: 100
      };
      const storageMonitorMessage = new StorageMonitorMessage(entityInfo);
      const embedBuilder = storageMonitorMessage.createMessageEmbed(entityInfo);

      expect(embedBuilder).toBeInstanceOf(EmbedBuilder);
    });

    it('should set the status to the passed in capacity', () => {
      const entityInfo = {
        name: 'name',
        entityId: 'id',
        capacity: 100
      };
      const storageMonitorMessage = new StorageMonitorMessage(entityInfo);
      const embedBuilder = storageMonitorMessage.createMessageEmbed(entityInfo);

      expect(embedBuilder.data.fields[0].value).toBe('100');
    });
  });

  describe('createMessageButtons', () => {
    it('should create a new ActionRowBuilder', () => {
      const entityInfo = {
        name: 'name',
        entityId: 'id',
        capacity: 100
      };
      const storageMonitorMessage = new StorageMonitorMessage(entityInfo);
      const actionRowBuilder = storageMonitorMessage.createMessageButtons(entityInfo);

      expect(actionRowBuilder).toBeInstanceOf(ActionRowBuilder);
    });
  });
});