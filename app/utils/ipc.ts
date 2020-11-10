/**
 * @desc main event during electron run,electron事件调度中心
 * @author pika
 */

import { ipcRenderer, ipcMain, remote, BrowserWindow } from 'electron'
import { AppUpdater } from '../main.dev'
import path from 'path'

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
 * @desc invoke msg to main process by renderer process
 * @param {String} eventName name of event
 * @param {any} arguments send to main process
 * @param {Function} cb callback after receive reponse from main process
 */
export function rendererInvoke(eventName: string, args?: any, cb?: any) {
    ipcRenderer.invoke(eventName, args).then(cb)
}

/**
 * @desc send msg to renderer process by main process
 * @param event
 */
export function mainListen(eventName: string, cb: any) {
    ipcMain.on(eventName, cb)
}

/**
 * @desc handle msg from renderer process and async callback 
 * @param {String} eventName name of event
 * @param {Function} handler handler after receive msg from renderer process
 */
export function mainHandle(eventName: string, handler: any) {
    ipcMain.handle(eventName, handler)
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
    url?: string, // 开启的窗口url
    skipTaskbar?: boolean // 窗口icon
};

/**
 * @desc base Class to create window instance,inorder to manage all window
 * @author pika
 */
export class Windows {
    private launchWindow: any // 默认创建启动缓冲窗口
    private mainWindowKey: any // 主窗口namespace
    private defaultWindowConfig: DefaultConfigParam // 默认窗口配置

    totalWindow: any // 开启的所有窗口

    constructor() {
        this.totalWindow = Object.create(null)
        this.mainWindowKey = 'mainWindow'
        this.defaultWindowConfig = {
            show: true,
            maximizable: true,
            minimizable: true,
            resizable: false,
            titleBarStyle: 'hidden',
            transparent: true,
            frame: false,
            width: 740,
            height: 406,
            webPreferences:
                (process.env.NODE_ENV === 'development' ||
                    process.env.E2E_BUILD === 'true') &&
                    process.env.ERB_SECURE !== 'true'
                    ? {
                        nodeIntegration: true,
                    }
                    : {
                        preload: path.join(__dirname, '../dist/renderer.prod.js'),
                    },
        };

        if (!this.launchWindow) {
            this.launchWindow = new BrowserWindow({
                ...this.defaultWindowConfig,
                skipTaskbar: true,
                width: 700,
                height: 450,
            });
            this.launchWindow.loadURL(`file://${__dirname}/middleware/launch/index.html`)
            // 监听启动窗口关闭
            this.launchWindow.on('close', () => {
                this.launchWindow = null;
            });
        } else {
            // 监听启动缓冲页面加载完毕
            mainHandle(MAIN_EVENT.MAIN_LOAD_READY, async () => {
                await this.launchWindow.close();
                return await this.totalWindow[this.mainWindowKey].show();
            })
        }

        /****************************************************************/
        /***************** main event handler after *********************/
        /***************** create window instance   *********************/
        /****************************************************************/

        // 监听启动页开始
        mainHandle(RENDERER_EVENT.RENDERER_LAUNCH_READY, async () => {
            return await this.launchWindow.show();
        })

        // 监听关闭所有窗口并打开登录页面
        mainHandle(MAIN_EVENT.MAIN_CLOSE_TOLOG, async () => {
            // close all window only not mainWindow before add loginWindow to totalWindow
            return await Object.entries(this.totalWindow).forEach(([key, value]: any) => {
                if (key === this.mainWindowKey) {
                    // load login page here,or replace hashState of currentPage? @todo
                    value.setSize(740, 406, true)
                    value.loadURL(`file://${__dirname}/app.html#/login`)
                } else {
                    value.close()
                }
            })
        })
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

    /**
     * @desc main function to create a new window
     * @param {String} namespace of name which window you want to create
     * @param {Object} config config of window
     */
    async createWindow(namespace: string, config: DefaultConfigParam) {
        if (
            process.env.NODE_ENV === 'development' ||
            process.env.DEBUG_PROD === 'true'
        ) {
            await this.installExtensions();
        }

        // create BrowserWindow by namespace
        this.totalWindow[namespace] = new BrowserWindow({
            ...this.defaultWindowConfig,
            ...config
        });

        // listen closed event of all window after create new window
        this.totalWindow[namespace].on('closed', () => {
            this.totalWindow[namespace] = null;
            delete this.totalWindow[namespace]
        });

        // load url of window config
        this.totalWindow[namespace].loadURL(config.url);

        // @TODO: Use 'ready-to-show' event
        //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
        this.totalWindow[namespace].webContents.on('did-finish-load', () => {
            if (!this.totalWindow[namespace]) {
                throw new Error(`${this.totalWindow[namespace]}is not defined`);
            }
            if (process.env.START_MINIMIZED) {
                this.totalWindow[namespace].minimize();
            } else {
                this.totalWindow[namespace].show();
                this.totalWindow[namespace].focus();
            }
        });

        // const menuBuilder = new MenuBuilder(mainWindow);
        // menuBuilder.buildMenu();

        // Remove this if your app does not use auto updates
        // eslint-disable-next-line
        console.log('check update for app.....', AppUpdater)
        new AppUpdater();
    };
}