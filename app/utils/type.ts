/**
 * @desc ts公用导出type
 */

import { DvaOption, Effect, Model } from 'dva'

export type DvaOptType = DvaOption;
export type DvaModelType = Model;
export type EffectType = Effect;

// 单个窗口按钮
export interface TitleMenuType {
  type: string;
  click?: any
}

// 窗口按钮菜单集群
export type TitleMenusType = Array<TitleMenuType>

// layout头部单个按钮
export interface HeaderBtnType {
  key: string;
  value: any
}

// layout头部按钮集群
export type HeaderBtnsType = Array<HeaderBtnType>

// sidebar 左侧菜单栏
export interface SidebarType {
  key: string;
  value: any
}

export type SidebarsType = Array<SidebarType>

// im消息推送单体
export interface MsgReceiveType {
  eventCode: string; // 订阅事件名称,
  data: Array<any> // 接收到的消息推送数组
}

// 路由配置单体
export interface RouteConfigType {
  path: string; // route path
  pathname: string; // path name
  component: (app: any) => void; // route component
  initTrtc: boolean; // 是否需要初始化trtc，开启该项的页面可以connect在system modal中初始化的trtc instance
  heartBeat: boolean; // 是否发送登录用户心跳
}

// 路由配置
export type RouteConfigsType = Array<RouteConfigType>

// renderer进程发送code格式单体
export interface RendererCode {
  code: string;
  data?: any
}

// renderer进程发送codes
export type RendererCodes = Array<RendererCode>
