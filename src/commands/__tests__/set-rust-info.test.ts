import { Interaction } from 'discord.js';
import { execute, data } from '../set-rust-info';

describe('execute', () => {
  it('should reply saying no hostname provided if there was no host', () => {
    const interaction = {
      options: {
        getString: jest.fn().mockReturnValue(undefined),
        getNumber: jest.fn()
      },
      reply: jest.fn().mockImplementation(() => Promise.resolve())
    };

    // @ts-expect-error - This is a mock
    execute(interaction as Interaction, {});

    expect(interaction.reply).toHaveBeenCalledWith({ content: 'No server hostname/IP provided', ephemeral: true });
  });

  it('should reply saying invalid port if the port is less than 1', () => {
    const interaction = {
      options: {
        getString: jest.fn().mockReturnValue('localhost'),
        getNumber: jest.fn().mockReturnValue(0)
      },
      reply: jest.fn().mockImplementation(() => Promise.resolve())
    };

    // @ts-expect-error - This is a mock
    execute(interaction as Interaction, {});

    expect(interaction.reply).toHaveBeenCalledWith({ content: 'Invalid port number', ephemeral: true });
  });

  it('should reply saying invalid port if the port greater than 65468', () => {
    const interaction = {
      options: {
        getString: jest.fn().mockReturnValue('localhost'),
        getNumber: jest.fn().mockReturnValue(65469)
      },
      reply: jest.fn().mockImplementation(() => Promise.resolve())
    };

    // @ts-expect-error - This is a mock
    execute(interaction as Interaction, {});

    expect(interaction.reply).toHaveBeenCalledWith({ content: 'Invalid port number', ephemeral: true });
  });

  it('should set the server port with the offset if it is a valid port', () => {
    const interaction = {
      options: {
        getString: jest.fn().mockReturnValue('localhost'),
        getNumber: jest.fn().mockReturnValue(400)
      },
      reply: jest.fn().mockImplementation(() => Promise.resolve()),
      deleteReply: jest.fn().mockImplementation(() => Promise.resolve())
    };
    const discordManager = {
      state: {
        rustServerPort: 0
      },
      restart: jest.fn()
    };

    // @ts-expect-error - This is a mock
    execute(interaction as Interaction, discordManager);

    expect(discordManager.state.rustServerPort).toBe(467);
  });

  it('should set the server host', () => {
    const interaction = {
      options: {
        getString: jest.fn().mockReturnValue('localhost'),
        getNumber: jest.fn().mockReturnValue(400)
      },
      reply: jest.fn().mockImplementation(() => Promise.resolve()),
      deleteReply: jest.fn().mockImplementation(() => Promise.resolve())
    };
    const discordManager = {
      state: {
        rustServerHost: ''
      },
      restart: jest.fn()
    };

    // @ts-expect-error - This is a mock
    execute(interaction as Interaction, discordManager);

    expect(discordManager.state.rustServerHost).toBe('localhost');
  });
});

describe('data', () => {
  it('should have a required server host option', () => {
    const serverHostOption = data.options.find(option => option.toJSON().name === 'serverhost');
    expect(serverHostOption).toBeDefined();
    expect(serverHostOption.toJSON().required).toBe(true);
  });

  it('should have an optional server port option', () => {
    const serverHostOption = data.options.find(option => option.toJSON().name === 'serverport');
    expect(serverHostOption).toBeDefined();
    expect(serverHostOption.toJSON().required).toBe(false);
  });
});