import dotenv from 'dotenv';
import {
  ActionRowBuilder,
  ButtonInteraction,
  ChatInputCommandInteraction,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import State from './State';
import PushListener, { PushEvents, PushNotificationBody } from './PushListener';
import RustPlusWrapper, { RustPlusEvents } from './RustPlusWrapper';
import { EntityChanged, EntityPayloadItem } from '../models/RustPlus.models';
import DiscordWrapper, { InteractionCreateEvents } from './DiscordWrapper';
import promptSync from 'prompt-sync';
import PushRegister from './PushRegister';
import fs from 'fs';
import path from 'path';
import Switch from './entities/Switch';
import Alarm from './entities/Alarm';
import StorageMonitor from './entities/StorageMonitor';
import SwitchEntityInfo from './entityInfo/SwitchEntityInfo';
import AlarmEntityInfo from './entityInfo/AlarmEntityInfo';
import StorageMonitorEntityInfo, { StorageItems } from './entityInfo/StorageMonitorEntityInfo';

type RequiredEnv = {
  discordToken: string;
  applicationId: string;
  steamId: string;
};

export const ENV_FILE_PATH = path.join(__dirname, '../../.env');

export default class Manager {
  discordClient: DiscordWrapper;

  rustPlus: RustPlusWrapper;

  state = State.getInstance();

  pushListener: PushListener;

  async start(): Promise<void> {
    dotenv.config();
    this.setupEnv();

    this.discordClient = new DiscordWrapper();

    const pushRegister = new PushRegister();

    await pushRegister.fcmRegister();
    this.pushListener = new PushListener();
    await this.initializeDiscord();
    if (this.state.rustServerHost) {
      this.initializeRustPlus();
      this.registerRustPlusListeners();
    }
    await this.pushListener.start(this);

    this.registerDiscordListeners();
    this.registerPushListeners();
  }

  public restart(): void {
    this.state.save();
    this.destroy();
    this.start();
  }

  public destroy(): void {
    if (this.state?.save) {
      this.state.save();
    }
    if (this.discordClient?.destroy) {
      this.discordClient.destroy();
    }
    if (this.pushListener?.destroy) {
      this.pushListener.destroy();
    }
    if (this.rustPlus?.disconnect) {
      this.rustPlus.disconnect();
    }

    process.exit(1);
  }

  public restartRustPlus(): void {
    this.rustPlus.updateRustPlusCreds(this.state.rustServerHost, this.state.rustServerPort);
  }

  private setupEnv(): void {
    const { DISCORD_TOKEN, APPLICATION_ID, STEAM_ID } = process.env;
    const prompt = promptSync();
    const env: RequiredEnv = {
      discordToken: DISCORD_TOKEN,
      applicationId: APPLICATION_ID,
      steamId: STEAM_ID
    };

    if (!env.discordToken) {
      env.discordToken = prompt('Please enter your Discord Bot Token: ');
    }
    if (!env.applicationId) {
      env.applicationId = prompt('Please enter your Discord Application ID: ');
    }
    if (!env.steamId) {
      env.steamId = prompt('Please enter your Steam ID: ');
    }

    fs.writeFileSync(ENV_FILE_PATH, `DISCORD_TOKEN=${env.discordToken}\nAPPLICATION_ID=${env.applicationId}\nSTEAM_ID=${env.steamId}`);

    const envConfig = dotenv.parse(fs.readFileSync(ENV_FILE_PATH));

    for (const key in envConfig) {
      process.env[key] = envConfig[key];
    }
  }

  private async initializeDiscord(): Promise<void> {
    await this.discordClient.start();
  }

  private initializeRustPlus(): void {
    if (this.state.rustServerHost) {
      this.rustPlus = new RustPlusWrapper(this.state.rustServerHost, this.state.rustToken, this.state?.rustServerPort);
      this.rustPlus.connect();
    } else {
      throw new Error('No rust server host found in state.');
    }
  }

  private async onButtonInteraction(interaction: ButtonInteraction) {
    const customId = interaction.customId;
    const [entityId, action] = customId.split('-');

    switch (action) {
      case 'edit': {
        const modal = new ModalBuilder()
          .setCustomId(entityId + '-editModal')
          .setTitle('Change Message Details');

        const nameInput = new TextInputBuilder()
          .setCustomId('name')
          .setLabel('Name')
          .setValue(interaction.message.embeds[0].title)
          .setStyle(TextInputStyle.Short);

        const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);

        modal.setComponents(firstActionRow);

        await interaction.showModal(modal);

        break;
      }
      case 'on':
      case 'off': {
        const embed = interaction.message.embeds[0];
        const entityId = embed.footer?.text;

        interaction.deferUpdate();

        try {
          await this.rustPlus.toggleSmartSwitch(entityId, action === 'on');
          this.rustPlus.getEntityInfo(entityId);
        } catch (error) {} //eslint-disable-line
        break;
      }
      case 'delete': {
        const entityId = interaction.message.embeds[0].footer.text;
        if (this.state.pairedSwitches.has(entityId)) {
          this.state.pairedSwitches.delete(entityId);
        } else if (this.state.pairedAlarms.has(entityId)) {
          this.state.pairedAlarms.delete(entityId);
        } else if (this.state.pairedStorageMonitors.has(entityId)) {
          this.state.pairedStorageMonitors.delete(entityId);
        }
        interaction.message.delete();

        break;
      }
    }
  }

  private onModalSubmitInteraction(interaction: ModalSubmitInteraction) {
    const entityId =interaction.message.embeds[0].footer.text;
    const name = interaction.fields.getTextInputValue('name');

    const pairedDevice = this.state.getPairedDevice(entityId);
    pairedDevice.updateEntityInfo({ name });

    interaction.message.edit(pairedDevice);
    interaction.deferUpdate();
  }

  private async onChatInputCommandInteraction(interaction: ChatInputCommandInteraction) {
    const command = this.discordClient.commandManager.commands.get(interaction.commandName);

    if (!command) {
      throw new Error(`No command matching ${interaction.commandName} was found.`);
    }

    try {
      await command.execute(interaction, this);
    } catch (error) {
      console.log(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    }
  }

  private registerDiscordListeners(): void {
    this.discordClient.on(InteractionCreateEvents.Button, (interaction) => { this.onButtonInteraction(interaction); });

    this.discordClient.on(InteractionCreateEvents.ModalSubmit, (interaction) => { this.onModalSubmitInteraction((interaction)); });

    this.discordClient.on(InteractionCreateEvents.ChatInputCommand, (interaction) => { this.onChatInputCommandInteraction((interaction)); });
  }

  private async onRustPlusEntityChange(entityChange: EntityChanged): Promise<void> {
    const entityId = `${entityChange.entityId}`;

    const pairedDevice = this.state.getPairedDevice(entityId);

    if (pairedDevice instanceof Switch) {
      pairedDevice.updateEntityInfo({ isActive: entityChange?.payload.value });
    } else if (pairedDevice instanceof StorageMonitor) {
      const items = this.entityPayloadItemToStorageEntityItems(entityChange.payload.items);
      pairedDevice.updateEntityInfo({ items });
    }

    const discordMessage = await this.discordClient.getPairedDeviceMessage(entityId);
    discordMessage.edit(pairedDevice);
  }

  private registerRustPlusListeners(): void {
    this.rustPlus.on(RustPlusEvents.EntityChange, (entityChange) => { this.onRustPlusEntityChange(entityChange); });
  }

  private async onNewSwitchPush(pushNotif: PushNotificationBody): Promise<void> {
    const entityInfo = await this.rustPlus.getEntityInfo(pushNotif.entityId);
    const switchEntityInfo = new SwitchEntityInfo(pushNotif.entityName, pushNotif.entityId, entityInfo.payload.value);
    const switchEntity = new Switch(switchEntityInfo);
    this.state.pairedSwitches.set(pushNotif.entityId, switchEntity);
    this.discordClient.sendPairedDeviceMessage(switchEntity);
  }

  private async onNewAlarmPush(pushNotif: PushNotificationBody): Promise<void> {
    const alarmEntityInfo = new AlarmEntityInfo(pushNotif.entityName, pushNotif.entityId);
    const alarmEntity = new Alarm(alarmEntityInfo);
    this.state.pairedAlarms.set(pushNotif.entityId, alarmEntity);
    this.discordClient.sendPairedDeviceMessage(alarmEntity);
  }

  private async onNewStorageMonitorPush(pushNotif: PushNotificationBody): Promise<void> {
    const entityInfo = await this.rustPlus.getEntityInfo(pushNotif.entityId);
    const items = this.entityPayloadItemToStorageEntityItems(entityInfo.payload.items);
    const storageMonitorEntityInfo = new StorageMonitorEntityInfo(pushNotif.entityName, pushNotif.entityId, items);
    const storageMonitorEntity = new StorageMonitor(storageMonitorEntityInfo);
    this.state.pairedStorageMonitors.set(pushNotif.entityId, storageMonitorEntity);
    this.discordClient.sendPairedDeviceMessage(storageMonitorEntity);
  }

  private registerPushListeners(): void {
    this.pushListener.on(PushEvents.NewSwitch, async (pushNotif) => {
      await this.onNewSwitchPush(pushNotif);
    });
    this.pushListener.on(PushEvents.NewAlarm, async (pushNotif) => {
      await this.onNewAlarmPush(pushNotif);
    });
    this.pushListener.on(PushEvents.NewStorageMonitor, async (pushNotif) => {
      await this.onNewStorageMonitorPush(pushNotif);
    });
  }

  private entityPayloadItemToStorageEntityItems(payloadItems: Array<EntityPayloadItem>): StorageItems {
    const items = new Map<string, number>();
    payloadItems.forEach((item) => {
      const itemId = `${item.itemId}`;
      if (items.has(itemId)) {
        items.set(itemId, items.get(itemId) + item.quantity);
      } else {
        items.set(itemId, item.quantity);
      }
    });

    return items;
  }

}