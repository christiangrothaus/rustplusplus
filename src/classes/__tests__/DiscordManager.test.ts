import DiscordManager from '../DiscordManager';
import PushListener from '../PushListener';
import State from '../State';

jest.mock('../State');
jest.mock('../PushListener');

describe('DiscordManager', () => {
  let discordManager: DiscordManager;

  beforeEach(() => {
    discordManager = new DiscordManager();

    jest.clearAllMocks();
    jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit() was called'); });
  });

  afterEach(() => {
    try {
      discordManager.destroy();
    } catch (e) {} //eslint-disable-line
  });

  describe('ctor', () => {
    it('should create a new instance of DiscordManager', () => {
      expect(discordManager).toBeInstanceOf(DiscordManager);
    });
  });

  describe('destroy', () => {
    it('should save the state', () => {
      const stateSaveSpy = jest.spyOn(State.prototype, 'save');

      expect(() => {
        discordManager.destroy();
      }).toThrow();

      expect(stateSaveSpy).toHaveBeenCalled();
    });

    it('should exit the process', () => {
      expect(() => {
        discordManager.destroy();
      }).toThrow('process.exit() was called');
    });

    it('should destroy the push listener if there is one', () => {
      const pushListenerDestroySpy = jest.spyOn(PushListener.prototype, 'destroy');
      discordManager.pushListener = new PushListener();

      expect(() => {
        discordManager.destroy();
      }).toThrow();

      expect(pushListenerDestroySpy).toHaveBeenCalled();
    });

    it('should not destroy the push listener if there is not one', () => {
      const pushListenerDestroySpy = jest.spyOn(PushListener.prototype, 'destroy');


      expect(() => {
        discordManager.destroy();
      }).toThrow();

      expect(pushListenerDestroySpy).not.toHaveBeenCalled();
    });
  });
});