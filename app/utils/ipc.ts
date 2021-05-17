/**
 * @desc main event during electron run,electron事件调度中心
 * @author pika
 */

import { ipcRenderer, ipcMain, remote } from 'electron'
import { DEFAULT_WINDOW_SIZE } from '../constants'

// event name config of main process, name rule as [process_operate_status]
export const MAIN_EVENT = {
  MAIN_LOAD_READY: 'MAIN_LOAD_READY', // 主进程加载完毕
  MAIN_OPEN_PAGE: 'MAIN_OPEN_PAGE', // 主进程开启新窗口
  MAIN_CLOSE_TOLOG: 'MAIN_CLOSE_TOLOG', // 主进程关闭所有窗口并打开登录窗口
}


// event name config of renderrer process, name rule as [process_operate_status]
export const RENDERER_EVENT = {
  RENDERER_LAUNCH_READY: 'RENDERER_LAUNCH_READY', // 渲染进程启动页加载完毕
  RENDERER_SEND_CODE: 'RENDERER_SEND_CODE', // 渲染进程发送指定操作码
  RENDERER_PAGE_CLOSE: 'RENDERER_PAGE_CLOSE'// 渲染进程页面关闭
}

// operate code between render pages
export const RENDERER_CODE = {
  ROOM_STATUS: 'roomStatus', // 发送房间状态，包括上麦状态 ==
  CLOSE_PAGE: 'closeWindow', // 关闭当前窗口
  OPEN_PAGE: 'openNewWindow', // 打开新的窗口
  OPEN_ROOM: 'openNewRoom',// 打开新的直播间
  KICKED_OUT: 'knickOut', // 登录被挤下线
  CHANGE_SETTING: 'changeSetting' // 修改用户设置，包括语言等
}

/**
 * @desc send msg to main process by renderer process
 * @param event
 */
export function rendererSend(eventName: string, ...args: any) {
  ipcRenderer.send(eventName, ...args)
}

/**
 * @desc msg listener from ipc-main on renderer process
 * @param event
 */
export function rendererListen(eventName: string, cb: () => void) {
  ipcRenderer.on(eventName, cb)
}

/**
 * @desc cancel msg listener from ipc-main on renderer process
 * @param event
 */
export function rendererOffListen(eventName: string, cb: () => void) {
  ipcRenderer.off(eventName, cb)
}

/**
 * @desc invoke msg to main process by renderer process
 * @param {String} eventName name of event
 * @param {Object} params send to main process
 * @param {Function} cb callback after receive reponse from main process
 */
export function rendererInvoke(eventName: string, params?: any, cb?: any) {
  ipcRenderer.invoke(eventName, params).then(cb)
}

/**
 * @desc msg listener from ipc-renderrer on main process
 * @param event
 */
export function mainListen(eventName: string, cb: any) {
  ipcMain.on(eventName, cb)
}

/**
 * @desc cancel msg listener from ipc-renderrer on main process
 * @param event
 */
export function mainOffListen(eventName: string, cb: any) {
  ipcMain.off(eventName, cb)
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
  width = width || DEFAULT_WINDOW_SIZE.MAIN.width
  height = height || DEFAULT_WINDOW_SIZE.MAIN.height
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
 * @desc maximize current window
 */
export function getCurrentWindow() {
  return remote.getCurrentWindow()
}
