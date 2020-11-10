/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import { app } from 'electron';
import { autoUpdater } from 'electron-updater';
// @ts-ignore 
import { Windows } from './utils/ipc';
import log from 'electron-log';
// import MenuBuilder from './menu';

export class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

// window instance during electron app run
export const WindowInstance = new Windows()

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'resources')
  : path.join(__dirname, '../resources');

const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

const mainWindowConfig = {
  icon: getAssetPath('icon.png'),
  show: false,
  url: `file://${__dirname}/app.html#/login`
}


/**
 * Add event listeners...
 */
app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

if (process.env.E2E_BUILD === 'true') {
  // @ts-ignore eslint-disable-next-line promise/catch-or-return
  app.whenReady().then(WindowInstance.createWindow('mainWindow', mainWindowConfig));
} else {
  // @ts-ignore
  app.on('ready', WindowInstance.createWindow('mainWindow', mainWindowConfig));
}

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (!Object.keys(WindowInstance.totalWindow).length || !WindowInstance.totalWindow) {
    WindowInstance.createWindow('mainWindow', mainWindowConfig)
  };
});
