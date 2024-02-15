import { Awaitable, ClientOptions, Events } from 'discord.js';

export class Client<T> {
  constructor(clientOptions: ClientOptions) {
    clientOptions;
  }

  channels = {
    fetch: jest.fn().mockResolvedValue({
      send: jest.fn().mockResolvedValue({})
    })
  };

  once = jest.fn((event: Events, cb: (obj: { [key: string]: any }) => Awaitable<void>): Client<T> => {
    cb({ user: { tag: 'user#1234' }, id: '1234567890' });
    return <Client<T>>{};
  });

  on = jest.fn((event: Events, cb: (interaction: { [key: string]: any }) => Awaitable<void>): Client<T> => {
    const isModalSubmit = jest.fn(() => false);
    const isButton = jest.fn(() => true);
    const isChatInputCommand = jest.fn(() => false);
    const followUp = jest.fn().mockResolvedValue({});
    const reply = jest.fn().mockResolvedValue({});
    const editReply = jest.fn().mockResolvedValue({});
    const deferReply = jest.fn().mockResolvedValue({});
    const interaction = {
      isModalSubmit,
      isButton,
      isChatInputCommand,
      replied: false,
      defered: false,
      followUp,
      reply,
      commandName: 'commandName',
      message: {
        delete: jest.fn().mockResolvedValue({}),
        embeds: [
          { title: 'embedTitle' }
        ]
      },
      editReply,
      deferReply,
      customId: 'customId-action'
    };
    cb(interaction);
    return <Client<T>>{};
  });

  login = jest.fn().mockResolvedValue('');
}

export enum GatewayIntentBits {
  Guilds = 1
}