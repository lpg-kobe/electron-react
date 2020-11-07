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
import { app, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import { MAIN_EVENT, RENDERER_EVENT, mainListen } from './utils/ipc';
import log from 'electron-log';
// import MenuBuilder from './menu';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

type DefaultConfigParam = {
  show?: boolean;
  width?: number;
  height?: number;
  webPreferences?: any;
  maximizable?: boolean,
  minimizable?: boolean,
  resizable?: boolean, // 是否支持调整大小
  titleBarStyle?: any,// 隐藏标题栏窗口
  transparent?: boolean,// 透明窗口?
  frame?: boolean, // 带边框窗口?
  icon?: string, // 窗口icon
  skipTaskbar?: boolean // 窗口icon
};

let mainWindow: any; // 主窗口
let launchWindow: any; // 启动缓冲窗口 
let totalWindow: any = Object.create(null);// 开启的窗口
const defaultWindowConfig: DefaultConfigParam = {
  show: true,
  maximizable: true,
  minimizable: true,
  resizable: false,
  titleBarStyle: 'hidden',
  transparent: true,
  frame: false,
  width: 1124,
  height: 754,
  webPreferences:
    (process.env.NODE_ENV === 'development' ||
      process.env.E2E_BUILD === 'true') &&
      process.env.ERB_SECURE !== 'true'
      ? {
        nodeIntegration: true,
      }
      : {
        preload: path.join(__dirname, 'dist/renderer.prod.js'),
      },
};

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

/**
 * @desc install extens for react before start app
 */
const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map((name) => installer.default(installer[name], forceDownload))
  ).catch(console.log);
};

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'resources')
    : path.join(__dirname, '../resources');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  // create main window
  mainWindow = new BrowserWindow({
    ...defaultWindowConfig,
    icon: getAssetPath('icon.png'),
    show: false,
  });
  totalWindow['mainWindow'] = mainWindow

  // create launch window
  launchWindow = new BrowserWindow({
    ...defaultWindowConfig,
    skipTaskbar: true,
    width: 700,
    height: 450,
  });
  totalWindow['launchWindow'] = launchWindow

  launchWindow.loadURL(`file://${__dirname}/middleware/launch/index.html`);

  // 监听启动窗口关闭
  launchWindow.on('close', () => {
    launchWindow = null;
    delete totalWindow['launchWindow']
  });

  // 监听主窗口关闭
  mainWindow.on('closed', () => {
    mainWindow = null;
    delete totalWindow['mainWindow']
  });

  // 监听启动页开始
  mainListen(RENDERER_EVENT.RENDERER_LAUNCH_READY, () => {
    launchWindow.show();
  })

  // 监听启动页面加载完毕
  mainListen(MAIN_EVENT.MAIN_LOAD_READY, () => {
    if (!launchWindow) {
      return;
    }
    launchWindow.close();
    mainWindow.show();
  })

  // 监听关闭所有窗口并打开登录页面
  mainListen(MAIN_EVENT.MAIN_CLOSE_TOLOG, () => {
    // close all window only not mainWindow before add loginWindow to totalWindow
    Object.entries(totalWindow).forEach(([key, value]: any) => {
      if (key === 'mainWindow') {
        // load login page here,or replace hashState of currentPage? @todo
        value.setSize(740, 406, true)
        value.loadURL(`file://${__dirname}/app.html#/login`)
      } else {
        value.close()
      }
    })
  })

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // const menuBuilder = new MenuBuilder(mainWindow);
  // menuBuilder.buildMenu();

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

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
  // eslint-disable-next-line promise/catch-or-return
  app.whenReady().then(createWindow);
} else {
  app.on('ready', createWindow);
}

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});
