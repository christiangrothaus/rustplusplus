![badge](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/christiangrothaus/831eac19a71961961077dfb8d00f7224/raw/jest-coverage-comment__main.json)

# WIP

# Rust++

Rust++ is a Discord bot that integrates with Rust+.  It supports the same features as the Rust+ app while adding extended functionality.

# Setup

## Environment

Start by creating a .env file at the root of the project. Within this file provide your secret credentials to be used. 

To retrieve the Discord token and Application ID, sign in to the Discord developer portal and go to the application you are going to use. The application ID is on the General Information page. For the Discord token, navigate to the Bot tab on the left side and reset the token to retrieve a new one.

The Steam ID needs to be the account that will be pairing with the entities in game. To retrieve your Steam ID go to [SteamDB](steamdb.info) and paste your Steam accounts URL in the search. Make sure to copy the regular **SteamID**.

```
DISCORD_TOKEN={DiscordToken}
APPLICATION_ID={ApplicationID}
STEAM_ID={SteamID}
```
<em>Do not include the curly brackets when entering your secrets</em>

## Push Notifications

To begin listening to the push notifications that Rust+ receives you will need to enter the following command in the command prompt, `npx @liamcottle/rustplus.js --config-file=/path/to/config.json fcm-register`. This requires Google Chrome to be installed. Once you successfuly run the command you will be required to sign into your Steam account. After completing this a config file will be generated at the file path you provided in the command. With this new config file move it to the root of the project and ensure it is named `rustplus.config.json`.
