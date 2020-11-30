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
import { app, BrowserWindow, Menu, Tray } from 'electron';
import { autoUpdater } from 'electron-updater';
// @ts-ignore 
import { MAIN_EVENT, RENDERER_EVENT, mainListen, mainHandle } from './utils/ipc';
import { DEFAULT_WINDOW_CONFIG, DEFAULT_WINDOW_SIZE, APP_VERSION } from './constants'
import log from 'electron-log';
// import MenuBuilder from './menu';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

// namespace of mainWindow
let mainWindowKey = 'mainWindow';
// namespace of launchWindow
let launchWindowKey = 'launchWindow';
// manage all window of opened
let totalWindow: any = Object.create(null);
const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'resources')
  : path.join(__dirname, '../resources');
// get public path of app
const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
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

/** init app name or tray-menu after app ready */
const initTool = () => {
  // 应用设置
  app.setAboutPanelOptions({
    applicationName: 'OFweek直播',
    applicationVersion: APP_VERSION
  })
  // 系统托盘
  const tray = new Tray(getAssetPath('tray-icon.png'))
  const contextMenu = Menu.buildFromTemplate([
    { label: '退出', type: 'normal', role: 'quit' }
  ])
  tray.setToolTip('OFweek直播')
  tray.setContextMenu(contextMenu)
}

/**
 * @desc init window once and register all event listener after electron app ready
 */
const initWindow = async () => {

  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  createWindow(launchWindowKey, {
    ...DEFAULT_WINDOW_SIZE.LAUNCH,
    skipTaskbar: true,
    url: `file://${__dirname}/middleware/launch/index.html`
  })

  createWindow(mainWindowKey, {
    icon: getAssetPath('icon.png'),
    show: false,
    url: `file://${__dirname}/app.html#/login`
  })

  // 监听启动页开始
  mainListen(RENDERER_EVENT.RENDERER_LAUNCH_READY, () => {
    totalWindow[launchWindowKey].show();
  })

  // 监听启动页面加载完毕
  mainListen(MAIN_EVENT.MAIN_LOAD_READY, () => {
    if (!totalWindow[launchWindowKey]) {
      return;
    }
    totalWindow[launchWindowKey].close();
    totalWindow[mainWindowKey].show();
  })

  // 监听关闭所有窗口并打开登录页面
  mainListen(MAIN_EVENT.MAIN_CLOSE_TOLOG, () => {
    // close all window only not mainWindow before add loginWindow to totalWindow
    Object.entries(totalWindow).forEach(([key, value]: any, index: number, arr: Array<any>) => {
      if (index === arr.length - 1) {
        // load login page here,or replace hashState of currentPage? @todo
        createWindow('loginWindow', {
          url: `file://${__dirname}/app.html#/login`,
          ...DEFAULT_WINDOW_SIZE.LOGIN
        })
        value.close()
      } else {
        value.close()
      }
    })
  })

  /**
   * @desc handle open new page
   * @param {namespace} window namespace you want to create
   * @param {config} config of new window
   */
  mainHandle(MAIN_EVENT.MAIN_OPEN_PAGE, async ({ sender: { history } }: any, { namespace, ...config }: any) => {
    console.log(history, MAIN_EVENT.MAIN_OPEN_PAGE, '=>', JSON.stringify(config))
    if (!namespace) {
      throw new Error("can not create new window without namespce, plaease try again with namespace key in your config")
    }
    if (totalWindow[namespace]) {
      totalWindow[namespace].loadURL(config.url)
    } else {
      createWindow(namespace, config)
    }
  })

  // const menuBuilder = new MenuBuilder(mainWindow);
  // menuBuilder.buildMenu();

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
}

/**
 * @desc main function to create Window
 * @param {String} namespace name of window witch you create 
 * @param {Object} config config of window witch you create 
 */
const createWindow = (namespace: string, config: any) => {
  totalWindow[namespace] = new BrowserWindow(
    {
      ...DEFAULT_WINDOW_CONFIG,
      ...config
    }
  );

  totalWindow[namespace].loadURL(config.url);

  // 监听窗口关闭
  totalWindow[namespace].on('closed', () => {
    totalWindow[namespace] = null;
    delete totalWindow[namespace]
  });

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  totalWindow[namespace].webContents.on('did-finish-load', () => {
    if (!totalWindow[namespace]) {
      throw new Error(`${namespace} is not defined`);
    }
    if (process.env.START_MINIMIZED) {
      totalWindow[namespace].minimize();
    } else {
      totalWindow[namespace].show();
      totalWindow[namespace].focus();
    }
  });
};


/**
 * Add event listeners of app...
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
  app.whenReady().then(() => {
    initTool()
    initWindow()
  });
} else {
  // @ts-ignore
  app.on('ready', () => {
    initTool()
    initWindow()
  });
}

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (!Object.keys(totalWindow).length || !totalWindow) {
    initTool()
    initWindow()
  };
});
