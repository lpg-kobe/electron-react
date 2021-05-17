/* eslint global-require: 0, no-console: off */

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
import { app, BrowserWindow, Menu, Tray, protocol } from 'electron';
import {
  MAIN_EVENT,
  RENDERER_EVENT,
  mainListen,
  mainHandle,
} from './utils/ipc';
import { DEFAULT_WINDOW_CONFIG, DEFAULT_WINDOW_SIZE } from './constants';
import { productName, version } from './package.json';
import logger from './utils/log';
// import MenuBuilder from './menu';

const ofweekLog: any = logger('______Main Process______');

// tray of app
let tray: any = null;
// namespace of loginWindow
let loginWindowKey = 'loginWindow';
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
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

/** show last active window */
const showLastWindow = () => {
  const windowKeys = Object.keys(totalWindow);
  const windowLength = windowKeys.length;
  windowLength && totalWindow[windowKeys[windowLength - 1]].show();
};

/** init app name or tray-menu after app ready */
const initTool = async () => {
  // 应用设置
  app.setAboutPanelOptions({
    applicationName: productName,
    applicationVersion: version,
  });
  // 系统托盘
  tray = await new Tray(getAssetPath('tray-icon.png'));
  const contextMenu = await Menu.buildFromTemplate([
    { label: productName, type: 'normal', click: showLastWindow },
    { label: '退出', type: 'normal', role: 'quit' },
  ]);
  tray.on('click', showLastWindow);
  await tray.setTitle(productName);
  await tray.setToolTip(productName);
  await tray.setContextMenu(contextMenu);
};

/**
 * @desc init window once and register all event listener after electron app ready
 */
const initWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    // await installExtensions();
  }

  createWindow(launchWindowKey, {
    ...DEFAULT_WINDOW_SIZE.LAUNCH,
    skipTaskbar: true,
    maximizable: false,
    url: `file://${__dirname}/app.html#/launch`,
  });

  createWindow(loginWindowKey, {
    show: false,
    maximizable: false,
    url: `file://${__dirname}/app.html#/login`,
  });

  // 监听启动页面加载完毕
  mainListen(MAIN_EVENT.MAIN_LOAD_READY, () => {
    if (!totalWindow[launchWindowKey]) {
      return;
    }
    totalWindow[launchWindowKey].close();
    totalWindow[loginWindowKey].show();
  });

  /** send operate code to all renderer witch can reply by it */
  mainListen(RENDERER_EVENT.RENDERER_SEND_CODE, (event: any, ...args: any) => {
    ofweekLog.info(`${RENDERER_EVENT.RENDERER_SEND_CODE}:`, ...args);
    Object.values(totalWindow).forEach((bWindow: any) => {
      bWindow.webContents.send(RENDERER_EVENT.RENDERER_SEND_CODE, ...args);
    });
  });

  /**
   * @desc handle open new page
   * @param {namespace} window namespace you want to create
   * @param {config} config of new window
   */
  mainHandle(
    MAIN_EVENT.MAIN_OPEN_PAGE,
    async ({ sender: { history } }: any, { namespace, ...config }: any) => {
      ofweekLog.info(`${MAIN_EVENT.MAIN_OPEN_PAGE}:`, history);
      if (!namespace) {
        throw new Error(
          'can not create new window without namespce, plaease try again with namespace key in your config'
        );
      }
      if (totalWindow[namespace]) {
        totalWindow[namespace].loadURL(config.url);
      } else {
        createWindow(namespace, config);
      }
    }
  );

  // const menuBuilder = new MenuBuilder(mainWindow);
  // menuBuilder.buildMenu();
};

/**
 * @desc main function to create Window
 * @param {String} namespace name of window witch you create
 * @param {Object} config config of window witch you create
 */
const createWindow = (namespace: string, config: any) => {
  ofweekLog.info('create new window:', namespace, config);
  const { closeNamespace } = config;
  const windowConfig = {
    icon: getAssetPath('/icons/iconX64.png'),
    ...DEFAULT_WINDOW_CONFIG,
    ...config,
  };

  totalWindow[namespace] = new BrowserWindow(windowConfig);
  totalWindow[namespace].config = windowConfig;
  totalWindow[namespace].loadURL(config.url);
  // open devtool in dev
  // totalWindow[namespace].webContents.openDevTools({ mode: 'detach' })

  // close window by closeNamespace which you need to close
  closeNamespace && totalWindow[closeNamespace].close();

  // 监听窗口关闭
  totalWindow[namespace].on('closed', () => {
    totalWindow[namespace] = null;
    delete totalWindow[namespace];
  });

  // @TODO: Use 'ready-to-show' event
  // https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  totalWindow[namespace].webContents.on('did-finish-load', () => {
    if (!totalWindow[namespace]) {
      throw new Error(`error~~,can not find window of ${namespace}`);
    }
    const { config } = totalWindow[namespace];
    if (process.env.START_MINIMIZED) {
      totalWindow[namespace].minimize();
    } else {
      if (config.show) {
        totalWindow[namespace].show();
        totalWindow[namespace].focus();
      }
    }
  });
};

// custom protocol setting
protocol.registerSchemesAsPrivileged([
  { scheme: 'file', privileges: { standard: true, secure: true } },
]);

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
    initTool();
    initWindow();
  });
} else {
  // @ts-ignore
  app.on('ready', () => {
    initTool();
    initWindow();
  });
}

// 应用单例锁
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // focus window after got second instance
    totalWindow && showLastWindow();
  });
}

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (!Object.keys(totalWindow).length || !totalWindow) {
    initTool();
    initWindow();
  }
});

// renderer process was gone
app.on('render-process-gone', (event, webContents, details) => {
  ofweekLog.info('______render-process-gone______', webContents, details);
});

// gpu process was gone
app.on('child-process-gone', (event: any, details: any) => {
  ofweekLog.info('______child-process-gone______', details);
});
