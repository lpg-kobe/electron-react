/**
 * @desc main logic of communicate width trtc sdk
 * @author pika
 */

import TRTCElectron from 'trtc-electron-sdk'
import Event from '../utils/event'
const TIM = require('tim-js-sdk');
const {
  Rect,
  TRTCParams,
  TRTCRoleType,
  TRTCAppScene,
  TRTCVideoResolution,
  TRTCNetworkQosParam,
  TRTCVideoEncParam,
  TRTCVideoQosPreference,
  TRTCVideoFillMode
} = require('trtc-electron-sdk/liteav/trtc_define');

interface ImLoginParam {
  sdkAppId: number;
  userId: string | number; // 用户 ID
  userSig: string; // 签名
}

interface EnterRoomParams {
  role: string; // 角色
  roomId: number; // 直播间id
  userId: string | number; // 用户Id
  userSig: string; // 用户签名
  privateKey: string; // 房间秘钥
}

interface ConfigParam {
  sdkAppId: number; // 应用id
  imLogin: boolean; // 是否需要登录im
  userId: string | number; // 用户 ID
  userSig: string; // 签名
};

interface SourceParam {
  type: number; // 采集源类型
  sourceId: string; // 采集源ID，对于窗口，该字段指示窗口句柄；对于屏幕，该字段指示屏幕ID
  sourceName: string; // 采集源名称，UTF8编码
};

export const EVENT = {
  tim: {
    SDK_READY: TIM.EVENT.SDK_READY,// tim-sdk加载成功
    MESSAGE_RECEIVED: TIM.EVENT.MESSAGE_RECEIVED,// tim收到消息
    ERROR: TIM.EVENT.ERROR,// sdk-error
    KICKED_OUT: TIM.EVENT.KICKED_OUT // 被踢下线
  },
  trtc: {
    ENTER_ROOM_SUCCESS: 'onEnterRoom', // 用户进房成功
    REMOTE_ENTER_ROOM: 'onRemoteUserEnterRoom', // 远端用户进房成功
    LEAVE_ROOM_SUCCESS: 'onExitRoom', // 用户离开房间
    GET_VIDEO_FRAME: 'onFirstVideoFrame', // 视频首帧采集渲染，包含本地|远程
    SEND_AUDIO_FRAME: 'onSendFirstLocalAudioFrame', // 本地音频被送出
    REMOTE_CLOSE_VIDEO: 'onUserVideoAvailable', // 远端用户关闭摄像头
    ERROR: 'onError',
    WARNING: 'onWarning',
    NETWORK: 'onNetworkQuality',
    STATISTICS: 'onStatistics' // 统计指标
  }
};

export default class TrtcElectronVideocast {

  EVENT: any;

  trtcInstance: any;

  tim: any;

  TIM: any;

  private sdkAppId: number;

  private emmitter: any;

  constructor(config: ConfigParam) {
    const { userId, userSig, sdkAppId, imLogin } = config
    this.sdkAppId = sdkAppId;
    this.emmitter = new Event();
    this.EVENT = EVENT;
    // TRTCElectron.destroyTRTCShareInstance(); // clear prev trtc instance before init new instance,only open this if you sure to open only one trtc
    this.trtcInstance = TRTCElectron.getTRTCShareInstance(); // trtc instance only create once
    this._initTrtcSetting()
    // im-notice will not happend in page once not to set imLogin
    if (imLogin) {
      this.tim = this._initIm();
      this.TIM = TIM;
      this.loginIm({
        sdkAppId: sdkAppId,
        userId: userId,
        userSig: userSig
      })
      this._bindImEvent();
    }
  }

  /**
   * 登录IM
   * @param {Object} params
   * @param {String} userID 用户ID
   * @param {String} userSig 签名
   */
  loginIm(params: ImLoginParam) {
    if (!this.tim) {
      return;
    }
    const promise = this.tim.login({
      SDKAppID: params.sdkAppId,
      userID: params.userId,
      userSig: params.userSig
    });
    promise.then((imResponse: { data: { repeatLogin: boolean; errorInfo: any } }) => {
      console.log('loginIm', imResponse.data); // IM登录成功
    }).catch((imError: any) => {
      console.warn('login Im error:', imError); // 登录失败的相关信息
    });
  }

  // 登出IM
  logoutIm() {
    let promise = this.tim.logout();
    promise.then(() => {
      console.log('logout success'); // IM登出成功
    }).catch(function (imError: any) {
      console.warn('logout error:', imError);
    });
  }

  // 初始化 sdk 实例
  _initIm() {
    const tim = TIM.create({
      SDKAppID: this.sdkAppId,
    });
    tim.setLogLevel(2); // 告警级别，SDK 只输出告警和错误级别的日志
    return tim;
  }

  // 初始化rtc-sdk监听
  _bindRtcEvent() {
    this.trtcInstance.on('onEnterRoom', (result: number) => {
      this.emmitter.emit(EVENT.trtc.ENTER_ROOM_SUCCESS, { result });
    });
    this.trtcInstance.on('onExitRoom', (result: number) => {
      this.emmitter.emit(EVENT.trtc.LEAVE_ROOM_SUCCESS, { result });
    });
    this.trtcInstance.on('onRemoteUserEnterRoom', (uid: string) => {
      console.log(uid);
    });
    this.trtcInstance.on('onError', (errcode: number, errmsg: string) => {
      this.emmitter.emit(EVENT.trtc.ERROR, { errcode, errmsg });
    });
    this.trtcInstance.on(
      'onWarning',
      (warningCode: number, warningMsg: string) => {
        this.emmitter.emit(EVENT.trtc.WARNING, {
          errcode: warningCode,
          errmsg: warningMsg,
        });
      }
    );
  }

  // 初始化im-sdk监听
  _bindImEvent() {
    this.tim.off(EVENT.tim.SDK_READY, this._onIMSdkReady);
    this.tim.on(EVENT.tim.SDK_READY, this._onIMSdkReady, this);
    this.tim.off(EVENT.tim.ERROR, this._onError);
    this.tim.on(EVENT.tim.ERROR, this._onError, this);
    this.tim.off(EVENT.tim.MESSAGE_RECEIVED, this._onIMMessageReceived);
    this.tim.on(
      EVENT.tim.MESSAGE_RECEIVED,
      this._onIMMessageReceived,
      this
    );
    this.tim.off(EVENT.tim.KICKED_OUT, this._onKickedOut);
    this.tim.on(EVENT.tim.KICKED_OUT, this._onKickedOut, this);
  }

  // 被踢下线
  _onKickedOut() {
    this.emmitter.emit(EVENT.tim.KICKED_OUT, this);
  }

  // tim sdk error
  _onError(event: { data: { code: any; message: any } }) {
    this.emmitter.emit(EVENT.tim.ERROR, {
      errcode: event.data.code,
      errmsg: event.data.message,
    });
  }

  // tim sdk ready
  _onIMSdkReady() {
    this.emmitter.emit(EVENT.tim.SDK_READY, this);
  }

  // tim sdk 消息通知
  _onIMMessageReceived(event: { data: any }) {
    const messageData = event.data;
    this.emmitter.emit(EVENT.tim.MESSAGE_RECEIVED, messageData);
    try {
      // messageData.map((item: any) => {
      //   if (item.conversationType === TIM.TYPES.CONV_GROUP) {
      //     // 群发消息
      //     const data = JSON.parse(item.payload.data);
      //     console.log(data);
      //   }
      //   if (item.conversationType === TIM.TYPES.CONV_C2C) {
      //     // 单个用户消息
      //     const data = JSON.parse(item.payload.data);
      //     console.log(data);
      //   }
      // });
    } catch (e) { }
  }

  // 初始化trtc设置
  _initTrtcSetting() {
    // 弱网保流畅
    // const networkQosParam = new TRTCNetworkQosParam()
    // networkQosParam.preference = TRTCVideoQosPreference.TRTCVideoQosPreferenceSmooth
    // this.trtcInstance.setNetworkQosParam(networkQosParam)
  }

  /**
   * @desc 本地摄像头预览并设置视频编码相关参数,enterRoom之后调用该方法会自动推流
   * @param {String} videoResolution 视频编码参数
   * @param {HTMLElement} view 采集摄像头显示画面的元素
   * @param context
   */
  openCamera(view: HTMLElement, videoResolution?: string) {
    const videoParam = new TRTCVideoEncParam();
    videoParam.videoResolution =
      videoResolution || TRTCVideoResolution.TRTCVideoResolution_640_360;
    videoParam.videoBitrate = 550;
    this.trtcInstance.videoEncParam = videoParam;
    // this.trtcInstance.enableSmallVideoStream(true, videoParam) // 开启大小画面双路编码模式
    this.trtcInstance.setVideoEncoderParam(videoParam);
    this.trtcInstance.startLocalPreview(view);
    this.trtcInstance.muteLocalVideo(false);
  }

  /** 设置摄像头视频填充模式 */
  setVideoFillMode(mode?: string) {
    mode = mode || TRTCVideoFillMode.TRTCVideoFillMode_Fit
    this.trtcInstance.setLocalViewFillMode(mode)
  }

  /**
   * @desc 关闭摄像头结束推流
   */
  closeCamera() {
    this.trtcInstance.stopLocalPreview();
    this.trtcInstance.muteLocalVideo(true);
  }

  /**
   * @desc 开启摄像头测试
   * @param {HTMLElement} view 采集摄像头显示画面的元素
   */
  startCameraTest(view: HTMLElement) {
    this.trtcInstance.startCameraDeviceTest(view)
  }

  // 关闭摄像头测试
  stopCameraTest() {
    this.trtcInstance.stopCameraDeviceTest()
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

  /**
   * @desc 获取当前摄像头
   * @return {Object} deviceId & deviceName
   */
  getCurrentCamera() {
    return this.trtcInstance.getCurrentCameraDevice();
  }

  /**
   * @desc 开启麦克风测试
   * @param {Number} interval 反馈音量间隔时间
   */
  startMicTest(interval = 240) {
    this.trtcInstance.startMicDeviceTest(interval)
  }

  // 停止麦克风测试
  stopMicTest() {
    this.trtcInstance.stopMicDeviceTest()
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
  setCurrentMic(micId: string) {
    this.trtcInstance.setCurrentMicDevice(micId);
  }

  /**
  * @desc 获取当前麦克风
  * @return {Object} deviceId & deviceName
  */
  getCurrentMic() {
    return this.trtcInstance.getCurrentMicDevice();
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

  /**
   * @desc 开始直播
   * @description 直播后要将当前用户加到trtc房间
   */
  enterRoom(params: EnterRoomParams) {
    this._enterRoom(Number(params.roomId), String(params.userId), String(params.userSig), String(params.privateKey))
    // this.openMic()
  }

  /**
   * @desc 下麦退出房间
   */
  exitRoom() {
    this._clearMedia()
    this.trtcInstance.exitRoom()
  }

  /** 关闭所有音视频采集 */
  _clearMedia() {
    this.trtcInstance.stopLocalPreview();
    this.trtcInstance.stopLocalAudio();
    this.trtcInstance.stopScreenCapture();
    this.trtcInstance.stopAllAudioEffects();
    this.trtcInstance.stopBGM();
  }

  /** 销毁trtc实例，销毁同时销毁所有监听事件 */
  destroyTrtc() {
    this.trtcInstance = null
    TRTCElectron.destroyTRTCShareInstance()
  }

  /** trtc-sdk-enterRoom 推流 */
  _enterRoom(roomId: number, userId: number | string, userSig: string, privateKey: string) {
    const param = new TRTCParams();
    param.sdkAppId = this.sdkAppId;
    param.roomId = roomId;
    param.userId = userId;
    param.userSig = userSig;
    param.privateMapKey = privateKey;
    param.businessInfo = '';
    param.role = TRTCRoleType.TRTCRoleAnchor; // 主播，可以上行视频和音频
    this.trtcInstance.enterRoom(param, TRTCAppScene.TRTCAppSceneVideoCall); // 视频通话场景，支持720P、1080P高清画质，单个房间最多支持300人同时在线，最高支持50人同时发言. faq: 开启TRTCAppSceneLIVE场景直接导致wap在ios播放异常卡顿?
  }

  on(eventName: any, handler: any, context?: any) {
    this.emmitter.on(eventName, handler, context);
  }

  off(eventName: any, handler: any) {
    this.emmitter.off(eventName, handler);
  }
}
