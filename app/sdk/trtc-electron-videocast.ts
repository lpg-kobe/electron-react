/**
 * @desc main logic of communicate width trtc sdk
 * @author pika
 */

const TRTCElectron = require('trtc-electron-sdk');
const TIM = require('tim-js-sdk');
const {
  Rect,
  TRTCVideoResolution,
  TRTCVideoEncParam,
} = require('trtc-electron-sdk/liteav/trtc_define');

type ConfigParam = {
  sdkAppId: number;
};

type SourceParam = {
  type: number; // 采集源类型
  sourceId: string; // 采集源ID，对于窗口，该字段指示窗口句柄；对于屏幕，该字段指示屏幕ID
  sourceName: string; // 采集源名称，UTF8编码
};

const EVENT = {
  ENTER_ROOM_SUCCESS: 'ENTER_ROOM_SUCCESS', // 进房成功
  LEAVE_ROOM_SUCCESS: 'LEAVE_ROOM_SUCCESS', // 离开房间
  ERROR: 'ERROR', // SDK ERROR
  WARNING: 'WARNING', // SDK WARNING
  KICKED_OUT: 'KICKED_OUT', // 被踢下线
  MESSAGE_RECEIVED: 'MESSAGE_RECEIVED', // IM消息通知
};

export default class TrtcElectronVideocast {
  private sdkAppId: number;

  private emmitter: Event;

  EVENT: any;

  trtcInstance: any;

  tim: any;

  constructor(config: ConfigParam) {
    this.sdkAppId = config.sdkAppId;
    this.emmitter = new Event();
    this.EVENT = EVENT;
    this.tim = this._initIm();
    TRTCElectron.destroyTRTCShareInstance(); // clear prev trtc instance before init new instance
    this.trtcInstance = TRTCElectron.getTRTCShareInstance(); // create new trtc instance
    this._bindEvent();
  }

  // 初始化 sdk 实例
  _initIm() {
    const tim = TIM.create({
      SDKAppID: this.sdkAppId,
    });
    tim.setLogLevel(2); // 告警级别，SDK 只输出告警和错误级别的日志
    return tim;
  }

  // 初始化sdk监听
  _bindEvent() {
    this.trtcInstance.on('onEnterRoom', (result: number) => {
      this.emmitter.emit(EVENT.ENTER_ROOM_SUCCESS, { result });
    });
    this.trtcInstance.on('onExitRoom', (result: number) => {
      this.emmitter.emit(EVENT.LEAVE_ROOM_SUCCESS, { result });
    });
    this.trtcInstance.on('onRemoteUserEnterRoom', (uid: string) => {
      console.log(uid);
    });
    this.trtcInstance.on('onError', (errcode: number, errmsg: string) => {
      this.emmitter.emit(EVENT.ERROR, { errcode, errmsg });
    });
    this.trtcInstance.on(
      'onWarning',
      (warningCode: number, warningMsg: string) => {
        this.emmitter.emit(EVENT.WARNING, {
          errcode: warningCode,
          errmsg: warningMsg,
        });
      }
    );
    this.tim.off(TIM.EVENT.ERROR, this._onError);
    this.tim.on(TIM.EVENT.ERROR, this._onError.bind(this));
    this.tim.off(TIM.EVENT.MESSAGE_RECEIVED, this._onIMMessageReceived);
    this.tim.on(
      TIM.EVENT.MESSAGE_RECEIVED,
      this._onIMMessageReceived.bind(this)
    );
    this.tim.off(TIM.EVENT.KICKED_OUT, this._onKickedOut);
    this.tim.on(TIM.EVENT.KICKED_OUT, this._onKickedOut.bind(this));
  }

  // 被踢下线
  _onKickedOut(event: any) {
    this.emmitter.emit(EVENT.KICKED_OUT, event);
  }

  // tim sdk error
  _onError(event: { data: { code: any; message: any } }) {
    this.emmitter.emit(EVENT.ERROR, {
      errcode: event.data.code,
      errmsg: event.data.message,
    });
  }

  // tim sdk 消息通知
  _onIMMessageReceived(event: { data: any }) {
    const messageData = event.data;
    this.emmitter.emit(EVENT.MESSAGE_RECEIVED, messageData);
    try {
      messageData.map((item: any) => {
        if (item.conversationType === TIM.TYPES.CONV_GROUP) {
          // 群发消息
          const data = JSON.parse(item.payload.data);
          console.log(data);
        }
        if (item.conversationType === TIM.TYPES.CONV_C2C) {
          // 单个用户消息
          const data = JSON.parse(item.payload.data);
          console.log(data);
        }
      });
    } catch (e) {}
  }

  /**
   * @desc 本地摄像头预览并设置视频编码相关参数
   * @param {String} videoResolution 视频编码参数
   * @param {HTMLElement} view 采集摄像头显示画面的元素
   * @param context
   */
  openCamera(view: HTMLElement, videoResolution?: string) {
    const videoParam = new TRTCVideoEncParam();
    videoParam.videoResolution =
      videoResolution || TRTCVideoResolution.TRTCVideoResolution_640_360;
    this.trtcInstance.setVideoEncoderParam(videoParam);
    this.trtcInstance.startLocalPreview(view);
  }

  /**
   * @desc 关闭摄像头
   */
  closeCamera() {
    this.trtcInstance.stopLocalPreview();
  }

  // 获取摄像头列表
  getCameraList() {
    return this.trtcInstance.getCameraDevicesList();
  }

  /**
   * @desc 设置摄像头
   * @params {String} deviceId 从 getCameraDevicesList 中得到的设备 ID
   */
  setCurrentCamera(deviceId: string) {
    this.trtcInstance.setCurrentCameraDevice(deviceId);
  }

  // 开启本地音频的采集和上行
  openMic() {
    this.trtcInstance.startLocalAudio();
    this.trtcInstance.muteLocalAudio(false);
  }

  // 关闭本地音频的采集和上行
  closeMic() {
    this.trtcInstance.stopLocalAudio();
    this.trtcInstance.muteLocalAudio(true);
  }

  // 获取麦克风设备列表
  getMicList() {
    return this.trtcInstance.getMicDevicesList();
  }

  /**
   * @desc 设置麦克风
   * @params {String} micId 从 getMicDevicesList 中得到的设备 ID
   */
  setCurrentMicDevice(micId: string) {
    this.trtcInstance.setCurrentMicDevice(micId);
  }

  /**
   * @desc 获取屏幕分享窗口列表
   * @param {function getScreenCaptureSources(thumbWidth,thumbHeight,iconWidth,iconHeight){return []}}
   */
  getScreenShareList(): [] {
    const screenList = this.trtcInstance.getScreenCaptureSources(
      120,
      70,
      20,
      20
    );
    return screenList;
  }

  /**
   * @desc 设置屏幕参数并开启屏幕分享
   * @params {Object} source 采集源来自getScreenShareList获取选中的screen
   */
  shareScreen(source: SourceParam): void {
    const rect = new Rect(0, 0, 0, 0); // 默认共享整个窗口
    const mouse = true; // 是否捕获鼠标指针
    const highlight = true; // 是否高亮窗口
    this.trtcInstance.selectScreenCaptureTarget(
      source.type,
      source.sourceId,
      source.sourceName,
      rect,
      mouse,
      highlight
    );
    this.trtcInstance.startScreenCapture();
  }

  // 关闭屏幕分享推流
  stopShareScreen() {
    this.trtcInstance.stopScreenCapture();
  }

  on(eventName: any, handler: any, context: any) {
    this.emmitter.on(eventName, handler, context);
  }

  off(eventName: any, handler: any) {
    this.emmitter.off(eventName, handler);
  }
}

class Event {
  eventBus: any;

  constructor() {
    this.eventBus == this.eventBus || Object.create(null);
  }

  on(eventName: any, handler: any, context: any) {
    if (typeof handler !== 'function') {
      console.error('Event handler must be a function');
      return;
    }
    const eventCollection = this.eventBus[eventName] || [];
    eventCollection.push({
      handler,
      context,
    });
  }

  emit(eventName: any, data: any) {
    let eventCollection = this.eventBus[eventName];
    const args: Array<any> = [];
    if (eventCollection) {
      eventCollection = [].slice.call(eventCollection);
      args[0] = {
        eventCode: eventName,
        data,
      };
      for (let i = 0, len = eventCollection.length; i < len; i++) {
        eventCollection[i].handler.apply(eventCollection[i].context, args);
      }
    }
  }

  off(eventName: any, handler: any) {
    const eventCollection = this.eventBus[eventName];

    // clear all eventBus when not give the eventName
    if (!eventName) {
      this.eventBus = Object.create(null);
      return;
    }

    if (eventCollection) {
      return;
    }

    if (!handler) {
      delete this.eventBus[eventName];
    }

    for (let i = 0, len = eventCollection.length; i < len; i++) {
      if (eventCollection[i].handler === handler) {
        eventCollection.splice(i, 1);
        break;
      }
    }
  }
}
