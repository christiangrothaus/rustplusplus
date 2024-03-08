import { ActionRowBuilder, EmbedBuilder } from 'discord.js';
import StorageMonitor from '../StorageMonitor';
import StorageMonitorEntityInfo from '../entity-info/StorageMonitorEntityInfo';

describe('StorageMonitor', () => {
  describe('ctor', () => {
    it('should create a new instance of SmartAlarmMessage', () => {
      const entityInfo = {
        name: 'name',
        entityId: 'id',
        entityType: 'Storage Monitor',
        items: new Map<string, number>([['39600618', 100]])
      } as StorageMonitorEntityInfo;
      const storageMonitorMessage = new StorageMonitor(entityInfo);

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
        entityType: 'Storage Monitor',
        items: new Map<string, number>([['39600618', 100]])
      } as StorageMonitorEntityInfo;
      const storageMonitorMessage = new StorageMonitor(entityInfo);
      const embedBuilder = storageMonitorMessage.createMessageEmbed(entityInfo);

      expect(embedBuilder).toBeInstanceOf(EmbedBuilder);
    });

    it('should set the status to the passed in capacity', () => {
      const entityInfo = {
        name: 'name',
        entityId: 'id',
        entityType: 'Storage Monitor',
        items: new Map<string, number>([['39600618', 100]])
      } as StorageMonitorEntityInfo;
      const storageMonitorMessage = new StorageMonitor(entityInfo);
      const embedBuilder = storageMonitorMessage.createMessageEmbed(entityInfo);

      expect(embedBuilder.data.fields[0].value).toBe('100');
    });
  });

  describe('createMessageButtons', () => {
    it('should create a new ActionRowBuilder', () => {
      const entityInfo = {
        name: 'name',
        entityId: 'id',
        entityType: 'Storage Monitor',
        items: new Map<string, number>([['39600618', 100]])
      } as StorageMonitorEntityInfo;
      const storageMonitorMessage = new StorageMonitor(entityInfo);
      const actionRowBuilder = storageMonitorMessage.createMessageButtons(entityInfo);

      expect(actionRowBuilder).toBeInstanceOf(ActionRowBuilder);
    });
  });
});