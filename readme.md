<div align="center"><img src="/src/assets/images/rust-plus-plus-logo.svg"></img></div>

<br>

<a href="https://github.com/christiangrothaus/rustplusplus/actions">![coverage](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/christiangrothaus/831eac19a71961961077dfb8d00f7224/raw/jest-coverage.json)</a>
<a href="https://github.com/christiangrothaus/rustplusplus/blob/main/LICENSE">![license](https://img.shields.io/badge/License-MIT-purple)</a>

# Rust++

Rust++ is a Discord bot that integrates with Rust+.  It supports the same features as the Rust+ app while adding extended functionality.

# Setup

## Push Listener

When first starting the app a chrome instance will be started and you will be requested to sign into to Steam through Rust+.  Once signed in a config file named `rustplus.config.json` should be created in the root directory.

## Environment Variables

Once you have signed into Rust+ you will be asked for your secrets for the Discord bot and your Steam ID.

To retrieve the Discord token and Application ID, sign in to the Discord developer portal and go to the application you are going to use. The application ID is on the General Information page. For the Discord token, navigate to the Bot tab on the left side and reset the token to retrieve a new one.

The Steam ID needs to be the account that will be pairing with the entities in game. To retrieve your Steam ID go to [SteamDB](https://www.steamdb.info) and paste your Steam accounts URL in the search. Make sure to copy the regular **SteamID** that is 17 digits long.

If you set these incorrectly or need to edit them you can open the `.env` file in the root directory in a text editor and switch the values.  The file should look like the example below:

```
DISCORD_TOKEN={DiscordToken}
APPLICATION_ID={ApplicationID}
STEAM_ID={SteamID}
```