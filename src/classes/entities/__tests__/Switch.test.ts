import { ActionRowBuilder, EmbedBuilder } from 'discord.js';
import Switch from '../Switch';
import SwitchEntityInfo from '../entity-info/SwitchEntityInfo';

describe('Switch', () => {
  describe('ctor', () => {
    it('should create a new instance of SmartSwitchMessage', () => {
      const entityInfo = {
        name: 'name',
        entityId: 'id',
        isActive: true,
        entityType: 'Switch'
      } as SwitchEntityInfo;
      const smartSwitchMessage = new Switch(entityInfo);

      expect(smartSwitchMessage.entityInfo).toEqual(entityInfo);
      expect(smartSwitchMessage.embeds).toHaveLength(1);
      expect(smartSwitchMessage.components).toHaveLength(1);
    });
  });

  describe('createMessageEmbed', () => {
    it('should create a new EmbedBuilder', () => {
      const entityInfo = {
        name: 'name',
        entityId: 'id',
        isActive: true,
        entityType: 'Switch'
      } as SwitchEntityInfo;
      const smartSwitchMessage = new Switch(entityInfo);
      const embedBuilder = smartSwitchMessage.createMessageEmbed(entityInfo);

      expect(embedBuilder).toBeInstanceOf(EmbedBuilder);
    });

    it('should set the color to green if isActive is true', () => {
      const entityInfo = {
        name: 'name',
        entityId: 'id',
        isActive: true,
        entityType: 'Switch'
      } as SwitchEntityInfo;
      const smartSwitchMessage = new Switch(entityInfo);
      const embedBuilder = smartSwitchMessage.createMessageEmbed(entityInfo);

      expect(embedBuilder.data.color).toBe(0x55ff55);
    });

    it('should set the color to red if isActive is false', () => {
      const entityInfo = new SwitchEntityInfo('name', 'id', false);
      const smartSwitchMessage = new Switch(entityInfo);
      const embedBuilder = smartSwitchMessage.createMessageEmbed(entityInfo);

      expect(embedBuilder.data.color).toBe(0xff5555);
    });

    it('should set the status to On if isActive is true', () => {
      const entityInfo = {
        name: 'name',
        entityId: 'id',
        isActive: true,
        entityType: 'Switch'
      } as SwitchEntityInfo;
      const smartSwitchMessage = new Switch(entityInfo);
      const embedBuilder = smartSwitchMessage.createMessageEmbed(entityInfo);

      expect(embedBuilder.data.fields[0].value).toBe('On');
    });

    it('should set the status to Off if isActive is false', () => {
      const entityInfo = {
        name: 'name',
        entityId: 'id',
        isActive: false,
        entityType: 'Switch'
      } as SwitchEntityInfo;
      const smartSwitchMessage = new Switch(entityInfo);
      const embedBuilder = smartSwitchMessage.createMessageEmbed(entityInfo);

      expect(embedBuilder.data.fields[0].value).toBe('Off');
    });
  });

  describe('createMessageButtons', () => {
    it('should create a new ActionRowBuilder', () => {
      const entityInfo = {
        name: 'name',
        entityId: 'id',
        isActive: true,
        entityType: 'Switch'
      } as SwitchEntityInfo;
      const smartSwitchMessage = new Switch(entityInfo);
      const actionRowBuilder = smartSwitchMessage.createMessageButtons(entityInfo);

      expect(actionRowBuilder).toBeInstanceOf(ActionRowBuilder);
    });
  });
});