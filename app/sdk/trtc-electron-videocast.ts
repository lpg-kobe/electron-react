/**
 * @desc main logic of communicate width trtc sdk
 * @author pika
 */

import TRTCElectron from 'trtc-electron-sdk';
// @ts-ignore
import {
  TRTCVideoResolution,
  TRTCVideoEncParam,
  // @ts-ignore
} from 'trtc-electron-sdk/liteav/trtc_define';

type configType = {
  sdkAppId: number;
};

const EVENT = {};

export default class TrtcElectronVideocast {
  private sdkAppId: number;

  private emmitter: Event;

  EVENT: any;

  trtcInstance: any;

  constructor(config: configType) {
    this.sdkAppId = config.sdkAppId;
    this.emmitter = new Event();
    this.EVENT = EVENT;
    // @ts-ignore
    TRTCElectron.destroyTRTCShareInstance(); // clear prev trtc instance before init new instance
    // @ts-ignore
    this.trtcInstance = TRTCElectron.getTRTCShareInstance(); // create new trtc instance
  }

  /**
   * @desc 本地摄像头预览之前设置视频编码相关参数
   * @param {String} videoResolution 视频编码参数
   * @param {HTMLElement} view 采集摄像头显示画面的元素
   * @param context
   */
  openCamera(view: HTMLElement, videoResolution?: string) {
    const videoParam = new TRTCVideoEncParam();
    videoParam.videoResolution =
      videoResolution || TRTCVideoResolution.TRTCVideoResolution_640_360;
    // @ts-ignore
    this.trtcInstance.setVideoEncoderParam(videoParam);
    // @ts-ignore
    this.trtcInstance.startLocalPreview(view);
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
