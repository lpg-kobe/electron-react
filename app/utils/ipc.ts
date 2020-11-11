/**
 * @desc main event during electron run,electron事件调度中心
 * @author pika
 */

import { ipcRenderer, ipcMain, remote } from 'electron'

// event name config of main process, name rule as [process_operate_status]
export const MAIN_EVENT = {
    MAIN_LOAD_READY: 'MAIN_LOAD_READY', // 主进程加载完毕
    MAIN_OPEN_PAGE: 'MAIN_OPEN_PAGE', // 主进程开启新窗口
    MAIN_CLOSE_TOLOG: 'MAIN_CLOSE_TOLOG', // 主进程关闭所有窗口并打开登录窗口
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
