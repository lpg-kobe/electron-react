/**
 * @desc main event during electron run,electron事件调度中心
 * @author pika
 */

import { ipcRenderer, ipcMain, remote, app, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater';
import path from 'path'
import log from 'electron-log';

// event name config of main process, name rule as [process_operate_status]
export const MAIN_EVENT = {
    MAIN_LOAD_READY: 'MAIN_LOAD_READY', // 主进程加载完毕
    MAIN_OPEN_PAGE: 'MAIN_OPEN_PAGE', // 主进程开启新窗口
    MAIN_CLOSE_TOLOG: 'MAIN_CLOSE_TOLOG' // 主进程关闭所有窗口并打开登录窗口
}


// event name config of renderrer process, name rule as [process_operate_status]
export const RENDERER_EVENT = {
    RENDERER_LAUNCH_READY: 'RENDERER_LAUNCH_READY' //渲染进程启动页加载完毕 
}

/**
 * @desc send msg to main process by renderer process
 * @param event
 */
export function rendererSend(eventName: string, config?: any) {
    ipcRenderer.send(eventName, config)
}

/**
 * @desc send msg to renderer process by main process
 * @param event
 */
export function mainListen(eventName: string, cb: any) {
    ipcMain.on(eventName, cb)
}

/**
 * @desc set window size of current window
 * @param width size of width of window
 * @param height size of height of window
 */
export function setWindowSize(width?: number, height?: number) {
    width = width || 1124
    height = height || 754
    remote.getCurrentWindow().setSize(width, height, true)
}

/**
 * @desc judge current window is max or not
 */
export function isWindowMax() {
    return remote.getCurrentWindow().isMaximized()
}

/**
 * @desc minimize current window
 */
export function minWindow() {
    remote.getCurrentWindow().minimize()
}

/**
 * @desc maximize current window
 */
export function maxWindow() {
    remote.getCurrentWindow().maximize()
}

/**
 * @desc cancel maximize current window
 */
export function unMaxWindow() {
    remote.getCurrentWindow().unmaximize()
}

/**
 * @desc maximize current window
 */
export function closeWindow() {
    remote.getCurrentWindow().close()
}

/**
 * @desc 
 * @return {Object} global window Ojject witch contain all window of opened
 */

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

class AppUpdater {
    constructor() {
        log.transports.file.level = 'info';
        autoUpdater.logger = log;
        autoUpdater.checkForUpdatesAndNotify();
    }
}

class Windows {
    totalWindow: any // 开启的窗口
    mainWindow: any // 主窗口
    launchWindow: any // 启动页窗口
    defaultWindowConfig: DefaultConfigParam // 默认窗口配置

    constructor() {
        this.totalWindow = Object.create(null)
        this.defaultWindowConfig = {
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

    }

    // install extens for react before start app
    async installExtensions() {
        const installer = require('electron-devtools-installer');
        const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
        const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

        return Promise.all(
            extensions.map((name) => installer.default(installer[name], forceDownload))
        ).catch(console.log);
    }

    async createWindow() {
        if (
            process.env.NODE_ENV === 'development' ||
            process.env.DEBUG_PROD === 'true'
        ) {
            await this.installExtensions();
        }

        const RESOURCES_PATH = app.isPackaged
            ? path.join(process.resourcesPath, 'resources')
            : path.join(__dirname, '../resources');

        const getAssetPath = (...paths: string[]): string => {
            return path.join(RESOURCES_PATH, ...paths);
        };

        // create main window
        this.mainWindow = new BrowserWindow({
            ...this.defaultWindowConfig,
            icon: getAssetPath('icon.png'),
            show: false,
        });
        this.totalWindow['mainWindow'] = this.mainWindow

        // create launch window
        this.launchWindow = new BrowserWindow({
            ...this.defaultWindowConfig,
            skipTaskbar: true,
            width: 700,
            height: 450,
        });
        this.totalWindow['launchWindow'] = this.launchWindow

        this.launchWindow.loadURL(`file://${__dirname}/middleware/launch/index.html`);

        // 监听启动窗口关闭
        this.launchWindow.on('close', () => {
            this.launchWindow = null;
            delete this.totalWindow['launchWindow']
        });

        // 监听主窗口关闭
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
            delete this.totalWindow['mainWindow']
        });

        // 监听启动页开始
        mainListen(RENDERER_EVENT.RENDERER_LAUNCH_READY, () => {
            this.launchWindow.show();
        })

        // 监听启动页面加载完毕
        mainListen(MAIN_EVENT.MAIN_LOAD_READY, () => {
            if (!this.launchWindow) {
                return;
            }
            this.launchWindow.close();
            this.mainWindow.show();
        })

        // 监听关闭所有窗口并打开登录页面
        mainListen(MAIN_EVENT.MAIN_CLOSE_TOLOG, () => {
            // close all window only not mainWindow before add loginWindow to totalWindow
            Object.entries(this.totalWindow).forEach(([key, value]: any) => {
                if (key === 'mainWindow') {
                    // load login page here,or replace hashState of currentPage? @todo
                    value.setSize(740, 406, true)
                    value.loadURL(`file://${__dirname}/app.html#/login`)
                } else {
                    value.close()
                }
            })
        })

        this.mainWindow.loadURL(`file://${__dirname}/app.html`);

        // @TODO: Use 'ready-to-show' event
        //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
        this.mainWindow.webContents.on('did-finish-load', () => {
            if (!this.mainWindow) {
                throw new Error('"mainWindow" is not defined');
            }
            if (process.env.START_MINIMIZED) {
                this.mainWindow.minimize();
            } else {
                this.mainWindow.show();
                this.mainWindow.focus();
            }
        });

        // const menuBuilder = new MenuBuilder(mainWindow);
        // menuBuilder.buildMenu();

        // Remove this if your app does not use auto updates
        // eslint-disable-next-line
        new AppUpdater();
    }
}