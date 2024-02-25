import fs from 'fs';
import { configFile } from './PushListener';
import push from 'push-receiver';
import path from 'path';
import axios from 'axios';
import { v4 } from 'uuid';
import express from 'express';

export default class PushRegister {

  public server;

  constructor() {
  }

  public async fcmRegister(): Promise<void> {
    const config = this.readConfig();
    if (!config.fcm_credentials) {
      console.log('Registering with FCM');
      const fcmCredentials = await push.register('976529667804');

      console.log('Fetching Expo Push Token');
      const expoPushToken = await this.getExpoPushToken(fcmCredentials).catch((error) => {
        console.log('Failed to fetch Expo Push Token');
        console.log(error);
        process.exit(1);
      });

      // show expo push token to user
      console.log('Successfully fetched Expo Push Token');
      console.log('Expo Push Token: ' + expoPushToken);

      // tell user to link steam with rust+ through Google Chrome
      console.log('Google Chrome is launching so you can link your Steam account with Rust+');
      const rustplusAuthToken = await this.linkSteamWithRustPlus();

      // show rust+ auth token to user
      console.log('Successfully linked Steam account with Rust+');
      console.log('Rust+ AuthToken: ' + rustplusAuthToken);

      console.log('Registering with Rust Companion API');
      await this.registerWithRustPlus(rustplusAuthToken, expoPushToken).catch((error) => {
        console.log('Failed to register with Rust Companion API');
        console.log(error);
        process.exit(1);
      });
      console.log('Successfully registered with Rust Companion API.');

      // save to config
      this.updateConfig({
        fcm_credentials: fcmCredentials,
        expo_push_token: expoPushToken,
        rustplus_auth_token: rustplusAuthToken
      });
      console.log('FCM, Expo and Rust+ auth tokens have been saved to ' + configFile);
    }
  }

  private readConfig() {
    try {
      return JSON.parse(fs.readFileSync(configFile, 'utf-8'));
    } catch (err) {
      return {};
    }
  }

  private updateConfig(config: any) {
    const currentConfig = this.readConfig();

    // merge config into current config
    const updatedConfig = { ...currentConfig, ...config };

    // convert to pretty json
    const json = JSON.stringify(updatedConfig, null, 2);

    // save updated config to config file
    fs.writeFileSync(configFile, json, 'utf8');
  }

  private async getExpoPushToken(fcmCredentials: any): Promise<string> {
    const response = await axios.post('https://exp.host/--/api/v2/push/getExpoPushToken', {
      deviceId: v4(),
      experienceId: '@facepunch/RustCompanion',
      appId: 'com.facepunch.rust.companion',
      deviceToken: fcmCredentials.fcm.token,
      type: 'fcm',
      development: false
    });

    return response.data.data.expoPushToken;
  }

  private async registerWithRustPlus(authToken: string, expoPushToken: string): Promise<void> {
    return axios.post('https://companion-rust.facepunch.com:443/api/push/register', {
      AuthToken: authToken,
      DeviceId: 'rustplus.js',
      PushKind: 0,
      PushToken: expoPushToken
    });
  }

  private async linkSteamWithRustPlus(): Promise<string> {
    const ChromeLauncher = await import('chrome-launcher');
    return new Promise((resolve, reject) => {
      const app = express();

      // register pair web page
      app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../pair.html'));
      });

      // register callback
      app.get('/callback', async (req, res) => {
        // we no longer need the Google Chrome instance
        await ChromeLauncher.killAll();

        // get token from callback
        const authToken = req.query.token;
        if (authToken) {
          res.send('Steam Account successfully linked with rustplus.js, you can now close this window and go back to the console.');
          resolve(authToken as string);
        } else {
          res.status(400).send('Token missing from request!');
          reject(new Error('Token missing from request!'));
        }

        // we no longer need the express web server
        this.server.close();
      });

      /**
       * Start the express server before Google Chrome is launched.
       * If the port is updated, make sure to also update it in pair.html
       */
      const port = 3000;
      this.server = app.listen(port, async () => {
        /**
           * FIXME: Google Chrome is launched with Web Security disabled.
           * This is bad, but it allows us to modify the window object of other domains, such as Rust+
           * By doing so, we can inject a custom ReactNativeWebView.postMessage handler to capture Rust+ auth data.
           *
           * Rust+ recently changed the login flow, which no longer sends auth data in the URL callback.
           * Auth data is now sent to a ReactNativeWebView.postMessage handler, which is available to the Rust+ app since
           * it is a ReactNative app.
           *
           * We don't have access to ReactNative, but we can emulate the behaviour by registering our own window objects.
           * However, to do so we need to disable Web Security to be able to manipulate the window of other origins.
           */
        await ChromeLauncher.launch({
          startingUrl: `http://localhost:${port}`,
          chromeFlags: [
            '--disable-web-security', // allows us to manipulate rust+ window
            '--disable-popup-blocking', // allows us to open rust+ login from our main window
            '--disable-site-isolation-trials', // required for --disable-web-security to work
            '--user-data-dir=/tmp/temporary-chrome-profile-dir-rustplus' // create a new chrome profile for pair.js
          ],
          handleSIGINT: false // handled manually in shutdown
        }).catch((error) => {
          console.log(error);
          console.log('pair.js failed to launch Google Chrome. Do you have it installed?');
          process.exit(1);
        });
      });
    });
  }
}