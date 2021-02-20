/**
 * @desc 基于chrome提供的webRTC封装的本地音视频采集库，封装这个库的初衷是为了提供本地音视频预览采集不推流等功能，因为目前腾讯云trtc-sdk只能提供单例采集模式，在enterRoom之后通过trtc-sdk对音视频的操作都会实时反馈到观众端，因此需要通过该sdk在trtc-sdk进行enterRoom之后进行本地音视频操作不推流
 * @link https://github.com/webrtc/samples/tree/gh-pages/src/content/devices/input-output
 * @demo https://webrtc.github.io/samples/src/content/devices/input-output/
 * @author pika
 */

'use strict'

type WebRtcError = {
    name: string,
    message: string,
}

interface DeviceParam {
    deviceId: string; // 设备Id
    groupId: string; // 组id
    kind: 'audioinput' | 'audiooutput' | 'videoinput' | 'videooutput'; // 设备类型
    label: string; //设备名称
}

type DevicesParam = Array<DeviceParam>

export const EVENT = {
    ERROR: 'onError',
    MEDIA_CHANGE: 'ondevicechange'
}

interface MediaHtml extends HTMLElement {
    srcObject: MediaStream | null,
    captureStream: () => MediaStream
}

export default class WebRtc {
    private mediaInstance: any
    private emmitter: Event;
    private videoDom: MediaHtml | null; // 预览视频节点
    private rtcStream: MediaStream | null; // webrtc stream

    constructor() {
        this.emmitter = new Event()
        this.videoDom = null
        this.rtcStream = null
        this.initRtc()
        this.handleMediaChange()
    }

    /** 事件订阅 */
    on(eventName: any, handler: any, context?: any) {
        this.emmitter.on(eventName, handler, context);
    }

    off(eventName: any, handler: any) {
        this.emmitter.off(eventName, handler);
    }

    /** ====================================================================*/
    /** ********************  媒体设备变更处理  ******************************/
    /** MediaDevices.ondevicechange 属性是一种EventHandler，当MediaDevices 接口 /** 的devicechange事件被触发时会被调用. 不论user agent媒体设备的设置是否可   /** 用, 或者网站或者应用发生变了都会触发且触发多次    *********************/
    /** ====================================================================*/
    handleMediaChange() {
        this.mediaInstance.ondevicechange = () => {
            this.emmitter.emit(EVENT.MEDIA_CHANGE, {})
        }
    }

    /** init webrtc-client */
    initRtc() {
        if (navigator.mediaDevices) {
            this.mediaInstance = navigator.mediaDevices
        } else {
            throw new Error('sorry, your browser can not support webrtc~~')
        }
    }

    /** 枚举可用的设备并过滤输出性|重复媒体设备 */
    getUserMedia(callback: (deviceObj: Object) => void) {
        this.mediaInstance.enumerateDevices().then((devices: DevicesParam) => {
            // 默认获取输入设备，本地获取设备要跟trtc-sdk获取的设备通过deviceId映射，待观测 => deviceId过滤条件是否合理
            const inputDevice = {
                mics: JSON.parse(JSON.stringify(devices.filter(({ kind, deviceId }) => kind === 'audioinput' && !["default", "communications"].includes(deviceId)))),
                cameras: JSON.parse(JSON.stringify(devices.filter(({ kind, deviceId }) => kind === 'videoinput' && !["default", "communications"].includes(deviceId)))),
            }
            callback(inputDevice)
        }, (err: WebRtcError) => {
            callback({
                mics: [],
                cameras: []
            })
            this.emmitter.emit(EVENT.ERROR, { msg: `${err.name}:${err.message}` })
        })
    }

    /** 打开指定摄像头本地预览 */
    openCamera(deviceId: string, dom: MediaHtml, onSuccess?: (stream: any) => void, onError?: (err: WebRtcError) => void) {
        this.closeCamera()
        this.mediaInstance.getUserMedia({
            video: {
                deviceId: {
                    exact: deviceId
                }
            },
            audio: {
                deviceId: undefined
            }
        }).then((stream: any) => {
            // add stream to media player
            dom.innerHTML = ''
            const videoDom: any = document.createElement('video')
            videoDom.setAttribute('autoPlay', 'true')
            this.rtcStream = new MediaStream(stream)
            videoDom.srcObject = this.rtcStream
            this.videoDom = videoDom

            dom.appendChild(videoDom)
            onSuccess && onSuccess(this.rtcStream)
        }, (err: WebRtcError) => {
            if (onError) {
                onError(err)
            } else {
                this.emmitter.emit(EVENT.ERROR, { msg: `${err.name}:${err.message}` })
            }
        })
    }

    /** close camera and stop MediaStream */
    closeCamera() {
        if (this.rtcStream) {
            const videoTracks = this.rtcStream.getTracks().filter((track: MediaStreamTrack) => track.kind === "video")
            for (let i = 0, len = videoTracks.length; i < len; i++) {
                const videoTrack = videoTracks[i]
                videoTrack.stop()
            }
            // @ts-ignore
            this.videoDom.srcObject = null
        }
    }

    /** 打开指定麦克风 */
    openMic(deviceId: string, onSuccess?: (stream: any) => void, onError?: (err: WebRtcError) => void) {
        this.closeMic()
        this.mediaInstance.getUserMedia({
            video: {
                deviceId: undefined
            },
            audio: {
                deviceId: {
                    exact: deviceId
                }
            }
        }).then((stream: any) => {
            onSuccess && onSuccess(stream)
        }, (err: WebRtcError) => {
            if (onError) {
                onError(err)
            } else {
                this.emmitter.emit(EVENT.ERROR, { msg: `${err.name}:${err.message}` })
            }
        })
    }

    /** handle close mic */
    closeMic() {
        if (this.rtcStream) {
            const audioTracks = this.rtcStream.getTracks().filter((track: MediaStreamTrack) => track.kind === "audio")
            for (let i = 0, len = audioTracks.length; i < len; i++) {
                const audioTrack = audioTracks[i]
                audioTrack.stop()
            }
        }
    }

}

class Event {
    eventBus: any;

    constructor() {
        this.eventBus = this.eventBus || Object.create(null);
    }

    on(eventName: any, handler: any, context?: any) {
        if (typeof handler !== 'function') {
            console.error('Event handler must be a function');
            return;
        }
        this.eventBus[eventName] = this.eventBus[eventName] || []
        this.eventBus[eventName].push({
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

        if (!eventCollection || !eventCollection.length) {
            return;
        }

        if (!handler) {
            delete this.eventBus[eventName];
        }

        for (let i = 0, len = eventCollection.length; i < len; i++) {
            const fnName = (fun: any) => fun.name || fun.toString().match(/function\s*([^(]*)\(/)[1]
            // remove event handler if function name of it is the same as eventCollection
            if (fnName(eventCollection[i].handler) === fnName(handler)) {
                eventCollection.splice(i, 1);
                break;
            }
        }
    }
}
