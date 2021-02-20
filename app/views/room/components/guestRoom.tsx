/**
 * @desc 嘉宾房间，默认摄像头直播
 */
import React, { useState, useEffect, useRef } from 'react'
import { Button, Select, Form, Modal, message } from 'antd'

import { EVENT } from '../../../sdk/trtc-electron-videocast'
import WebRtc, { EVENT as WREVENT } from '../../../sdk/webRtc'
import AModal from '../../../components/modal';
import AForm from '../../../components/form';
import CommonHeader from '../../../components/layout/header';
import CommonFooter from '../../../components/layout/footer';
import { MsgReceiveType } from '../../../utils/type'
import { closeWindow } from '../../../utils/ipc';
import { debounce } from '../../../utils/tool'
import ShareRoom from './shareRoom';
import SpeechList from './speechList';
import SidebarInfo from '../sidebar'
import GuestVideo from '../video/guestVideo'
import Speech from '../speech'
import ChatInfo from '../chat'
import MenuInfo from '../menu'
import ThumbView from '../thumbView'

type MediaInfo = {
    mics: Array<any>; // 用户麦克风
    cameras: Array<any> // 用户摄像头
}

let webRtcClient: WebRtc

const GuestRoom = (props: any) => {
    // export function of this component
    GuestRoom.prototype.handleClosePage = handleClosePage
    GuestRoom.prototype.handleExitRoom = handleExitRoom
    GuestRoom.prototype.handleCheckMediaToStart = handleCheckMediaToStart

    const {
        dispatch,
        rtcClient: roomRtcClient,
        system: { rtcClient: sysRtcClient }, // system-trtc used in local
        video: { videoStreamType },
        speech: { speechModalShow, speechFullScreen },
        room: { roomFunHandler, roomInfo, userStatus, roomWatchMode, roomIsBegin, roomIsBeginOther, roomOpenSpeech, roomOpenSpeechOther },
        match: {
            params: {
                id: roomId
            }
        }
    } = props

    // 嘉宾头部-直播状态 1直播3预告6结束 
    const guestBtns = roomInfo.status === 1 ? [
        !roomIsBegin && videoStreamType === 'camera' ? <Button className="ofweek-btn gradient danger radius header-btn" onClick={() => handleHeaderClick('start')} key="start">申请上麦</Button> : null,
        roomIsBegin ? <Button className="ofweek-btn gradient primary radius header-btn" onClick={() => handleHeaderClick('stop')
        } key="stop">下麦</Button> : null,
        videoStreamType === 'camera' && !roomIsBeginOther ? <a key="setting" onClick={() => handleHeaderClick('setting')} className="media-setting-btn header-btn">媒体设置</a> : null
    ] : []

    const [shareModalShow, setShareModalShow] = useState(false)
    const [mediaSetShow, setMediaSetShow] = useState(false)
    const [cameraList, setCameraList] = useState([])
    const [micList, setMicList] = useState([])
    const mediaThumbRef: any = useRef(null)
    const [mediaForm] = Form.useForm()

    useEffect(() => {
        // 跨组件方法调用
        const { key, value: { name, args, callback } } = roomFunHandler
        const namespace = 'GuestRoom'
        const fun = GuestRoom.prototype[name]

        if (!key.startsWith(namespace) || typeof (fun) !== 'function') {
            return
        }

        (async () => {
            await fun.apply(null, args)
            callback && callback()
        })()

    }, [roomFunHandler.key]);

    useEffect(() => {
        // init local webrtc,in order to review media in local
        if (!webRtcClient) {
            webRtcClient = new WebRtc()
            bindRtcEvent()
            bindWREvent(webRtcClient)
        }
        return () => {
            unBindRtcEvent()
            unBindWREvent()
        }
    }, [])

    useEffect(() => {
        // 检测主播房间正在开播的推流类型并初始化房间状态
        const { status, liveAnthorIds, streamType, carmeraUrlList } = roomInfo
        const { imAccount } = userStatus

        const isSomeOneLive = Boolean(liveAnthorIds && liveAnthorIds.length)
        const roomActive = +status === 1

        if (!roomActive || !isSomeOneLive) {
            return
        }

        const actionObj: any = {
            // trtc推流
            1: () => {
                if (liveAnthorIds.some((anchorId: string) => String(anchorId) === String(imAccount))) {
                    // try to leave room if yourSelf alive
                    roomRtcClient.exitRoom()
                    dispatch({
                        type: 'room/exitRoom',
                        payload: {
                            params: {
                                roomid: roomId
                            },
                            onError: {
                                offLine: () => { }
                            }
                        }
                    })
                } else { // 主播开播中
                    initRemoteEnter({
                        ...roomInfo,
                        streamType: 1
                    })
                }
            },
            // cdn推流
            2: () => {
                // 主播暂不提供cdn推流
            },
            // 主播摄像机推流中
            3: () => {
                if (carmeraUrlList && carmeraUrlList.length) {
                    initRemoteEnter({
                        ...roomInfo,
                        streamType: 3
                    })
                } else {
                    Modal.warn({
                        okText: '确定',
                        centered: true,
                        content: '没有可播放的视频源',
                        title: '提示'
                    })
                }
            }
        }
        actionObj[streamType] && actionObj[streamType]()

    }, [roomInfo.streamType])

    useEffect(() => {
        // 房间stremId更新之后再绑定事件，确保trtc-sdk进房推流成功回调时拿到最新的roomInfo，推送由room-rtcClient订阅
        const { trtc: { ENTER_ROOM_SUCCESS } } = EVENT;
        roomRtcClient.trtcInstance.off(ENTER_ROOM_SUCCESS, handleEnterRoom)
        roomRtcClient.trtcInstance.on(ENTER_ROOM_SUCCESS, handleEnterRoom)
    }, [roomInfo.myStreamId])

    useEffect(() => {
        if (!sysRtcClient) { return }
        // 嘉宾直播间消息推送处理，im相关推送由system-rtcClient订阅
        const { tim: { MESSAGE_RECEIVED } } = EVENT
        sysRtcClient.off(MESSAGE_RECEIVED, handleMessageReceive)
        sysRtcClient.on(MESSAGE_RECEIVED, handleMessageReceive)
        return () => {
            sysRtcClient.off(MESSAGE_RECEIVED, handleMessageReceive)
        }
    }, [sysRtcClient])

    // 直播媒体form
    const mediaFormOptions = {
        options: {
            form: mediaForm,
            name: 'mediaSetting',
            initialValues: {
                // @ts-ignore
                cameraVal: cameraList[0] && cameraList[0].deviceId,
                // @ts-ignore
                micVal: micList[0] && micList[0].deviceId
            }
        },
        items: [{
            options: {},
            component: <div className="media-thumb-box" ref={mediaThumbRef}></div>
        }, {
            options: {
                name: 'cameraVal',
                label: '摄像头'
            },
            component: <Select onChange={handleCameraSel}>
                {
                    cameraList.map((camera: any) => <Select.Option value={camera.deviceId} key={camera.deviceId}>{camera.deviceName}</Select.Option>)
                }
            </Select>
        }, {
            options: {
                name: 'micVal',
                label: '麦克风'
            },
            component: <Select onChange={handleMicSel}>
                {
                    micList.map((mic: any) => <Select.Option value={mic.deviceId} key={mic.deviceId}>{mic.deviceName}</Select.Option>)
                }
            </Select>
        }]
    }

    useEffect(() => {
        // 媒体设置开启本地摄像头跟麦克风预览
        const { MEDIA_CHANGE } = WREVENT
        if (mediaSetShow) {
            webRtcClient.on(MEDIA_CHANGE, debounce(handleRefreshMedia, 800))
            function rqaToGetDom() {
                if (!mediaThumbRef.current) {
                    window.requestAnimationFrame(rqaToGetDom)
                } else {
                    initMedia(syncRtcMediaToSetting)
                }
            }
            rqaToGetDom()
        } else {
            closeMediaPreview()
            webRtcClient.off(MEDIA_CHANGE, debounce(handleRefreshMedia, 800))
        }
        return () => { }
    }, [mediaSetShow]);

    /** handle click of header btns */
    function handleHeaderClick(type: string) {
        const actionObj: any = {
            'start': () => {
                // 嘉宾申请上麦
                handleCheckMediaToStart(1)
            },
            'stop': async () => {
                // 下麦
                await handleExitRoom()
                message.success('下麦成功')
            },
            'setting': () => {
                // 媒体设置
                setMediaSetShow(!mediaSetShow)
            }
        }
        actionObj[type] && actionObj[type]()
    }

    /** init current user enter status of room after enterroom success */
    function initUserEnter(sourceData: any) {

        dispatch({
            type: 'room/save',
            payload: {
                roomIsBegin: true,
                roomOpenCamera: true,
                roomOpenMic: true,
                roomIsBeginOther: false,
                roomOpenCameraOther: false,
                roomOpenMicOther: false,
                roomOpenSpeechOther: false
            }
        })

        const { isOpenSpeech, speechDataDto, cdnStreamUrl } = sourceData
        dispatch({
            type: 'video/save',
            payload: {
                videoStreamType: 'camera',
                videoStreamSrc: initStreamUrl(cdnStreamUrl)
            }
        })

        isOpenSpeech && handleSpeechReady(true, speechDataDto)
    }

    /** init current user status of room sfter overmic success */
    function initUserLeave() {
        dispatch({
            type: 'room/save',
            payload: {
                roomIsBegin: false,
                roomOpenCamera: false,
                roomOpenSpeech: false,
                roomOpenMic: false
            }
        })
    }

    /** init remote online status after change ahchor by remote user*/
    function initRemoteEnter(sourceData: any) {
        const { cdnStreamUrl, carmeraUrlList, isCameraOpen, isOpenSpeech, speechDataDto, streamType } = sourceData

        // 初始化上麦状态 & 媒体状态
        dispatch({
            type: 'room/save',
            payload: {
                roomIsBegin: false,
                roomIsOpenMic: false,
                roomOpenCamera: false,
                roomOpenSpeech: false,
                roomIsBeginOther: true,
                roomOpenCameraOther: isCameraOpen === 1,
            }
        })

        if (+streamType === 3) { // 远端摄像机推流
            dispatch({
                type: 'video/save',
                payload: {
                    videoStreamType: 'video',
                    videoStreamSrc: initStreamUrl(carmeraUrlList)
                }
            })
            return
        }

        // 初始化视频流
        dispatch({
            type: 'video/save',
            payload: {
                videoStreamType: 'camera',
                videoStreamSrc: initStreamUrl(cdnStreamUrl)
            }
        })

        // 初始化演讲稿状态
        isOpenSpeech && handleSpeechReady(false, speechDataDto)
    }

    /** init remote status of room after remote user leave room */
    function initRemoteLeave() {
        dispatch({
            type: 'room/save',
            payload: {
                roomIsBeginOther: false,
                roomOpenCameraOther: false,
                roomOpenMicOther: false,
                roomOpenSpeechOther: false
            }
        })
    }

    /** init to find flv url of sources first if exit */
    function initStreamUrl(sources: Array<any>) {
        if (!sources.length) {
            return ''
        }
        const curSource = sources.find(({ type }: any) => +type === 1)
        return curSource ? curSource.streamUrl : sources[0].streamUrl
    }

    /** update status of memberList */
    function updateMemberStatus(updateAttrs: Array<any>, memberId: string | number) {
        // when msgReceive event happended,data from page may not the newest,so get newest data from modal by getLatestState effect
        dispatch({
            type: 'system/getLatestState',
            payload: {
                params: {
                    namespace: 'chat',
                    stateKey: 'memberList'
                },
                callback: (members: Array<any>) => {
                    const curMember = members.find(({ memberId: id }: any) => String(id) === String(memberId))
                    updateAttrs.forEach(({ key, value }: any) => {
                        curMember && (curMember[key] = value)
                    })
                    dispatch({
                        type: 'chat/save',
                        payload: {
                            memberList: members
                        }
                    })
                }
            }
        })
    }

    /** get speech detail by id */
    function fetchSpeechInfo(speechId: number | string, onSuccess?: () => void) {
        dispatch({// speech data has saved by model
            type: 'speech/getInfo',
            payload: {
                params: { speechid: speechId },
                onSuccess: {
                    operate: () => {
                        onSuccess && onSuccess()
                    }
                },
                onError: {
                    operate: () => {
                        message.error('暂时获取不到演讲稿信息，请稍后重试')
                    }
                }
            }
        })
    }

    /** ready to open speech by user type */
    function handleSpeechReady(isUserSelf: boolean, speechData: any) {
        const { speechId, speechPageNum } = speechData
        // update speech active index
        dispatch({
            type: 'speech/save',
            payload: {
                speechPageIndex: speechPageNum
            }
        })

        // 初始化主屏展示状态
        dispatch({
            type: 'room/save',
            payload: {
                roomWatchMode: 'speech',
                roomOpenSpeech: isUserSelf,
                roomOpenSpeechOther: !isUserSelf
            }
        })

        fetchSpeechInfo(speechId)
    }

    /**
     * @desc 初始化媒体设备
     * @description 媒体设置获取的设备需要从webRtc中获取，为了在切换预览设备的时候
     * @description 只预览不推流并且预览画面跟开播时候的画面脱离。因为腾讯trtc-sdk
     * @description 目前只能创建单例trtcInstance，在enterRoom之后对媒体设置中的所
     * @description 有媒体设备的设置都会实时推流并显示在观众端
     * @param callback 
     */
    function initMedia(callback?: any) {
        webRtcClient.getUserMedia(({ mics, cameras }: any) => {
            const rtcMics = roomRtcClient.getMicList()
            const rtcCameras = roomRtcClient.getCameraList()
            // 映射webRtc媒体id，trtc-sdk切换摄像头|麦克风时要用到获取设备时的id
            const cbMics = mics.map((mic: any, index: any) => ({
                ...mic,
                rtcDeviceId: rtcMics[index].deviceId,
                deviceName: rtcMics[index].deviceName
            }))
            const cbCameras = cameras.map((camera: any, index: any) => ({
                ...camera,
                rtcDeviceId: rtcCameras[index].deviceId,
                deviceName: rtcCameras[index].deviceName
            }))
            setMicList(cbMics)
            setCameraList(cbCameras)
            callback && callback({ mics: cbMics, cameras: cbCameras })
        })
    }

    /**
     * @desc 检测正在使用的设备并在预览窗口开启设备预览
     * @param type 要打开的设备类型 mic麦克风 camrea摄像头
     * @param deviceId 要打开的设备id 
     * @param mediaInfo 获取的媒体设备 
     */
    function checkUsedToReviewMedia(type: string, deviceId: string, mediaInfo?: MediaInfo) {
        const { mics, cameras } = mediaInfo || { mics: micList, cameras: cameraList }
        const { deviceId: rtcCameraId } = roomRtcClient.getCurrentCamera()
        const { deviceId: rtcMicId } = roomRtcClient.getCurrentMic()
        const rtcMic = mics.find((mic: any) => mic.deviceId === deviceId)
        const rtcCamera = cameras.find((camera: any) => camera.deviceId === deviceId)

        // tips:当前预览设备为上麦中的设备时可以通过trtc测试api去调用，切换设备预览会导致画面同步到观众端，需要通过本地wecrtc-sdk来切换设备预览不推流
        const reactObj: any = {
            'mic': () => {
                if (roomIsBegin && rtcMic && rtcMic.rtcDeviceId === rtcMicId) {
                    roomRtcClient.startMicTest()
                } else {
                    webRtcClient.openMic(deviceId)
                }
            },
            'camera': () => {
                if (roomIsBegin && rtcCamera && rtcCamera.rtcDeviceId === rtcCameraId) {
                    roomRtcClient.startCameraTest(mediaThumbRef.current)
                } else {
                    webRtcClient.openCamera(deviceId, mediaThumbRef.current)
                }
            }
        }
        reactObj[type] && reactObj[type]()
    }

    /** handle sync trtc-sdk current using media to media setting modal form*/
    function syncRtcMediaToSetting({ mics, cameras }: any) {
        // 优先同步trtc-sdk正在使用的mic & camera，否则默认开启webrtc设备的第一个
        const { deviceId: cameraId } = roomRtcClient.getCurrentCamera()
        const { deviceId: micId } = roomRtcClient.getCurrentMic()
        if (mics.length) {
            const rtcMic = mics.find(({ rtcDeviceId }: any) => rtcDeviceId === micId)
            const targetId = rtcMic ? rtcMic.deviceId : mics[0].deviceId

            checkUsedToReviewMedia('mic', targetId, { mics, cameras })
            mediaForm.setFieldsValue({
                micVal: targetId
            })
        } else {
            webRtcClient.closeMic()
            mediaForm.setFieldsValue({
                micVal: ''
            })
        }

        if (cameras.length) {
            const rtcCamera = cameras.find(({ rtcDeviceId }: any) => rtcDeviceId === cameraId)
            const targetId = rtcCamera ? rtcCamera.deviceId : cameras[0].deviceId

            checkUsedToReviewMedia('camera', targetId, { mics, cameras })
            mediaForm.setFieldsValue({
                cameraVal: targetId
            })
        } else {
            webRtcClient.closeCamera()
            mediaForm.setFieldsValue({
                cameraVal: ''
            })
        }
    }

    /** close media preview before change media to push stream after enterRoom*/
    function closeMediaPreview() {
        // 非开播状态关闭trtc预览，开播状态关闭会停止推流
        if (!roomIsBegin) {
            roomRtcClient.stopCameraTest()
            roomRtcClient.stopMicTest()
        }
        webRtcClient.closeCamera()
        webRtcClient.closeMic()
    }

    /**
     * @desc 媒体检测后上麦
     * @param {Number} type 上麦类型 0主动维持上麦 1申请上麦 2同意邀请上麦
     * @param type 
     */
    function handleCheckMediaToStart(type: number) {
        initMedia(({ mics, cameras }: any) => {
            if (!mics.length || !cameras.length) {
                Modal.warn({
                    okText: '确定',
                    centered: true,
                    content: '未检测到摄像头或麦克风设备',
                    title: '提示',
                    onOk: () => setMediaSetShow(true)
                })
            } else {
                handleOnLine(type)
            }
        })
    }

    /** TRTC-SDK 嘉宾端trtc上麦推流成功 */
    function handleEnterRoom(result: number) {
        if (result < 0) {
            return
        }
        const { myStreamId } = roomInfo
        dispatch({
            type: 'room/startRoom',
            payload: {
                params: {
                    roomid: roomId,
                    streamid: myStreamId,
                    streamtype: 1
                },
                onSuccess: {
                    onLine: true
                }
            }
        })
    }

    /**
     * @desc 嘉宾下麦退出直播
     * @description 下麦过程 1、trtc & api结束直播推流 2、关闭所有设备调试
     */
    function handleExitRoom() {
        return new Promise((resolve, reject) => {
            roomRtcClient.exitRoom()
            dispatch({
                type: 'room/exitRoom',
                payload: {
                    params: {
                        roomid: roomId
                    },
                    onSuccess: {
                        operate: () => {
                            initUserLeave()
                            resolve(true)
                        }
                    },
                    onError: {
                        operate: () => {
                            message.error('下麦出现异常~~')
                            reject(false)
                        }
                    }
                }
            })
        })
    }

    /**
     * @desc 嘉宾摄像头上麦 
     * @param {Number} type 上麦类型 0主动维持上麦 1申请上麦 2同意邀请上麦
     */
    function handleOnLine(type: number) {
        const { imAccount, userSig } = userStatus

        const actionObj: any = {
            // 主动上麦
            0: async () => {
                const { trtcPrivateSig } = await fetchRoomPrivate()
                roomRtcClient.enterRoom({
                    roomId,
                    userId: imAccount,
                    userSig,
                    privateKey: trtcPrivateSig
                })
            },
            // 申请上麦
            1: () => {
                dispatch({
                    type: 'room/applyOnLine',
                    payload: {
                        params: {
                            roomid: roomId
                        },
                        onSuccess: {
                            operate: () => {
                                message.success('上麦申请已发送')
                            }
                        }
                    }
                })
            },
            // 接受邀请上麦
            2: async () => {
                const { trtcPrivateSig } = await fetchRoomPrivate()
                roomRtcClient.enterRoom({
                    roomId,
                    userId: imAccount,
                    userSig,
                    privateKey: trtcPrivateSig
                })
            }
        }
        actionObj[type] && actionObj[type]()
    }

    /** fetch room private key before enter room */
    function fetchRoomPrivate(): Promise<any> {
        return new Promise((resolve, reject) => {
            dispatch({
                type: 'room/getRoomPrivateKey',
                payload: {
                    params: {
                        roomid: roomId
                    },
                    onSuccess: {
                        operate: ({ data }: any) => resolve(data)
                    },
                    onError: {
                        operate: () => {
                            message.error('房间秘钥获取失败，请联系管理员重试')
                            reject(false)
                        }
                    }
                }
            });
        })
    }

    /** handle camera select of media setting */
    function handleCameraSel(cameraId: string) {
        checkUsedToReviewMedia('camera', cameraId)
    }

    /** handle mic select of media setting */
    function handleMicSel(micId: string) {
        checkUsedToReviewMedia('mic', micId)
    }

    /** refresh media setting */
    function handleRefreshMedia() {
        initMedia(syncRtcMediaToSetting)
    }

    /** form submit of media setting */
    function handleMediaFormSubmit() {
        mediaForm.validateFields().then(({ cameraVal, micVal }: any) => {
            // tips:roomRtcClient媒体设置同步本地webRtc预览设置，且在同步前需提前断掉webrtc媒体预览测试操作，否则造成摄像头占用等异常
            const curSelCamera: any = cameraList.find(({ deviceId }) => deviceId === cameraVal)
            const curSelMic: any = micList.find(({ deviceId }) => deviceId === micVal)
            closeMediaPreview()
            roomRtcClient.setCurrentCamera(curSelCamera ? curSelCamera.rtcDeviceId : '')
            roomRtcClient.setCurrentMic(curSelMic ? curSelMic.rtcDeviceId : '')
            setMediaSetShow(false)
        })
    }

    /** handle close event of menu */
    async function handleClosePage() {
        // 页面关闭前发送退房广播
        try {
            roomIsBegin && await handleExitRoom()
            dispatch({
                type: 'room/leaveRoom',
                payload: {
                    params: {
                        roomid: roomId
                    },
                    onSuccess: {
                        operate: () => closeWindow()
                    },
                    onError: {
                        operate: () => closeWindow()
                    }
                }
            })
        } catch (err: any) {
            closeWindow()
        }
    }

    /** roomRtcClient事件推送 */
    function bindRtcEvent() {
        const { trtc: { GET_VIDEO_FRAME, SEND_AUDIO_FRAME } } = EVENT;
        roomRtcClient.trtcInstance.on(GET_VIDEO_FRAME, onFirstVideoFrame)
        roomRtcClient.trtcInstance.on(SEND_AUDIO_FRAME, onSendAudioFrame)
    }

    /** roomRtcClient事件解绑 */
    function unBindRtcEvent() {
        const { trtc: { GET_VIDEO_FRAME, SEND_AUDIO_FRAME } } = EVENT;
        roomRtcClient.trtcInstance.off(GET_VIDEO_FRAME, onFirstVideoFrame)
        roomRtcClient.trtcInstance.off(SEND_AUDIO_FRAME, onSendAudioFrame)
    }

    /** web-rtc 事件推送绑定 */
    function bindWREvent(webRtc: any) {
        const { ERROR } = WREVENT
        webRtc.on(ERROR, onWRError)
    }

    /** web-rtc 事件推送解绑 */
    function unBindWREvent() {
        const { ERROR } = WREVENT
        webRtcClient.off(ERROR, onWRError)
    }

    /** handle error of web-rtc */
    function onWRError({ data: { msg } }: any) {
        message.error(msg)
    }

    /** 本地视频采集成功回调 userId == '' 代表当前用户，userId != '' 代表远程*/
    function onFirstVideoFrame(userId?: string) {
        if (!userId) {
            // 采集到画面之后再激活开播人视频状态
            dispatch({
                type: 'room/save',
                payload: {
                    roomOpenCamera: true
                }
            })
        }
    }

    /** 本地音频发送成功回调 */
    function onSendAudioFrame() {
        dispatch({
            type: 'room/save',
            payload: {
                roomOpenMic: true
            }
        })
    }

    /** 嘉宾处理上麦邀请 */
    function handleRoomInvite(isAgree: number, anchorId: number | string) {
        dispatch({
            type: 'room/handleRoomInvite',
            payload: {
                params: {
                    roomid: roomId,
                    adminid: anchorId,
                    isagree: isAgree
                },
                onSuccess: {
                    operate: () => {
                        if (isAgree) {
                            message.success('已同意该上麦邀请')
                            handleCheckMediaToStart(2)
                        } else {
                            message.success('已拒绝该上麦邀请')
                        }
                    }
                }
            }
        })
    }

    /** 主播直播间推送，这里只单独处理上下麦相关推送，其他推送消息统一由房间处理 */
    function handleMessageReceive({ data: messageData }: MsgReceiveType) {
        const { imAccount } = userStatus
        try {
            for (let i = 0, len = messageData.length; i < len; i++) {
                const msg = messageData[i]
                const payloadData = JSON.parse(msg.payload.data)
                const { anthorId } = payloadData

                if (String(payloadData.roomId) !== String(roomId)) {
                    return
                }

                switch (String(payloadData.msgCode)) {

                    // 演讲稿翻页|开启演讲稿消息
                    case "1023":
                        console.log('演讲稿翻页消息1023')

                        const { pageNum, speechId } = payloadData

                        // 自己消息不处理
                        if (String(imAccount) === String(anthorId)) {
                            return
                        }

                        dispatch({
                            type: 'speech/save',
                            payload: {
                                speechPageIndex: pageNum
                            }
                        })

                        dispatch({
                            type: 'room/save',
                            payload: {
                                roomOpenSpeech: false,
                                roomOpenSpeechOther: true
                            }
                        })

                        // get newest state from modal
                        dispatch({
                            type: 'system/getLatestState',
                            payload: {
                                params: {
                                    namespace: 'speech',
                                    stateKey: 'speechInfo'
                                },
                                callback: (speech: any) => {
                                    const { id } = speech

                                    if (id && String(id) === String(speechId)) { // speech data has been getted
                                        return
                                    }

                                    fetchSpeechInfo(speechId)
                                }
                            }
                        })
                        break;

                    // 结束演讲稿广播
                    case "1024":
                        console.log('结束演讲稿广播1024')

                        // ignore self
                        if (String(anthorId) === String(imAccount)) {
                            return
                        }
                        dispatch({
                            type: 'room/save',
                            payload: {
                                roomOpenSpeechOther: false
                            }
                        })
                        break;

                    // 上麦消息
                    case "1702":
                        console.log('上麦消息1702')

                        // update isLive status of last anchor if exits
                        const { lastAnthorId } = payloadData
                        lastAnthorId && updateMemberStatus([{
                            key: 'isLive',
                            value: false
                        }], lastAnthorId)

                        // update isLive status of current user
                        updateMemberStatus([{
                            key: 'isLive',
                            value: true
                        }], anthorId)

                        // 自己上麦
                        if (String(anthorId) === String(imAccount)) {
                            initUserEnter(payloadData)
                            return
                        }

                        // 主播上麦时断掉当前嘉宾所有相关连接，拉流默认获取cdnStreamUrl中的flv流，其他流不做处理
                        dispatch({
                            type: 'system/getLatestState',
                            payload: {
                                params: {
                                    namespace: 'room',
                                    stateKey: 'roomIsBegin'
                                },
                                callback: (roomIsBegin: boolean) => {
                                    if (roomIsBegin) {
                                        // 退出当前上麦用户
                                        roomRtcClient.exitRoom()
                                        initUserLeave()
                                    }
                                    // 初始化remote端状态
                                    initRemoteEnter({
                                        ...payloadData,
                                        isCameraOpen: 1 // 默认开启摄像头
                                    })
                                }
                            }
                        })
                        break;

                    // 下麦消息
                    case "1704":
                        console.log('下麦消息1704')
                        const { endType } = payloadData

                        // update isLive status of members
                        updateMemberStatus([{
                            key: 'isLive',
                            value: false
                        }], anthorId)

                        if (String(imAccount) === String(anthorId)) {
                            // 嘉宾(B)主动|被动下麦 endType 1:A下A, 2: B下B,3: A下B
                            +endType === 3 && (message.warn('您已被主播强制下麦'))
                            initUserLeave()
                        } else {
                            // 主播下麦
                            initRemoteLeave()
                        }

                        break;

                    // 处理主播邀请上麦消息
                    case "1706":
                        console.log('主播邀请上麦消息1706')

                        const { inviterNick, inviterId } = payloadData
                        let modalTimer: any = null
                        let applyModal: any = null
                        // 30秒内不处理上麦消息自动决绝并关闭弹窗
                        modalTimer = setTimeout(() => {
                            handleRoomInvite(0, inviterId)
                            applyModal.destroy()
                        }, 30 * 1000)
                        applyModal = Modal.confirm({
                            icon: null,
                            centered: true,
                            cancelText: '拒绝',
                            okText: '同意',
                            content: `${inviterNick}邀请您上麦`,
                            onCancel: () => {
                                clearTimeout(modalTimer)
                                handleRoomInvite(0, inviterId)
                            },
                            onOk: () => {
                                clearTimeout(modalTimer)
                                handleRoomInvite(1, inviterId)
                            }
                        })
                        break;

                    // 主播反馈的上麦申请
                    case "1712":
                        console.log('主播反馈上麦申请1712')
                        const { auditerId: applyId, anthorNick, isAgree } = payloadData

                        // 过滤非自己申请的反馈
                        if (String(applyId) !== String(imAccount)) {
                            return
                        }

                        if (isAgree) {
                            message.success(`${anthorNick}同意了您的上麦申请`)
                            handleCheckMediaToStart(0)
                        } else {
                            message.warn(`${anthorNick}拒绝了您的上麦申请`)
                        }

                        break;

                    // 开播人摄像头采集改变消息
                    case "1716":
                        console.log('开播人摄像头采集改变消息1716')
                        const { isCameraOpen } = payloadData
                        dispatch({
                            type: 'room/save',
                            payload: {
                                roomOpenCameraOther: isCameraOpen === 1 ? true : false
                            }
                        })
                        break;
                }
            }
        } catch (err) {

        }
    }

    const isVideoMode = roomWatchMode === 'video'
    const isOpenThumbView = (roomIsBegin || roomIsBeginOther) && (roomOpenSpeech || roomOpenSpeechOther)
    return <>
        <div className="flex room-page-container">
            <CommonHeader
                className="room-page-header"
                headerProps={[
                    { key: 'title', value: roomInfo && roomInfo.name },
                    { key: 'button', value: guestBtns },
                    { key: 'avatar' }
                ]}
                titleBarProps={[{
                    type: 'share',
                    title: '分享',
                    click: () => setShareModalShow(!shareModalShow)
                }, {
                    type: 'min',
                    title: '最小化'
                }, {
                    type: 'max',
                    title: '最大化'
                }, {
                    type: 'close',
                    title: '关闭',
                    click: () => handleClosePage()
                }]}
            />
            <main>
                <section className="section-wrap-l">
                    <SidebarInfo
                        // @ts-ignore
                        rtcClient={roomRtcClient}
                        {...props}
                    />
                </section>
                <section className="section-wrap-m">
                    {/* 视窗主区域 */}
                    {
                        (roomOpenSpeech || roomOpenSpeechOther) && !isVideoMode ? <Speech {...props} /> : <GuestVideo
                            // @ts-ignore
                            rtcClient={roomRtcClient}
                            {...props}
                        />
                    }
                    <MenuInfo />
                </section>
                <section className="section-wrap-r">
                    {
                        roomRtcClient && isOpenThumbView && <ThumbView rtcClient={roomRtcClient} {...props} />
                    }
                    <ChatInfo />
                </section>
            </main>
            <CommonFooter />

            {/* 媒体预览设置，可在直播时重新选择设备并推流 */}
            <AModal
                width={380}
                footer={[
                    <Button key={Math.random()} onClick={handleRefreshMedia}>刷新设备</Button>,
                    <Button key={Math.random()} type="primary" onClick={handleMediaFormSubmit} disabled={sysRtcClient && !sysRtcClient.getCurrentMic() || sysRtcClient && !sysRtcClient.getCurrentCamera() || !cameraList.length || !micList.length}>确定</Button>
                ]}
                forceRender={true}
                visible={mediaSetShow}
                destroyOnClose={false}
                title={<h1 className="ofweek-modal-title z2">媒体设置</h1>}
                onCancel={() => setMediaSetShow(false)}
                className="ofweek-modal media-setting small"
            >
                <AForm {...mediaFormOptions} />
            </AModal>

            {/* 直播间分享 */}
            <ShareRoom visible={shareModalShow} onCancel={() => setShareModalShow(false)} />

            {/* 查看所有演讲稿 */}
            {
                speechModalShow && <SpeechList {...props} />
            }

            {/* 演讲稿全屏 */}
            {
                <AModal
                    footer={null}
                    visible={speechFullScreen}
                    destroyOnClose={false}
                    width='90%'
                    className="ofweek-modal review"
                    onCancel={() => dispatch({
                        type: 'speech/save',
                        payload: {
                            speechFullScreen: false
                        }
                    })}>
                    <Speech {...props} />
                </AModal>
            }

        </div>
    </>
}

export default GuestRoom

