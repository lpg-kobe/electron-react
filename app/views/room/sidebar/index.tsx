/**
 * @desc 直播间左侧菜单栏
 */
import React from 'react'
import { Switch, message } from 'antd'
import { SidebarType } from '../../../utils/type'

const Sidebar = (props: any) => {
    const {
        dispatch,
        rtcClient: roomRtcClient,
        speech: { speechModalShow },
        room: { roomIsBegin, roomInfo, roomOpenMic, roomOpenCamera, roomIsBeginOther, userStatus, roomQuesVisible },
        video: { videoStreamType },
        match: {
            params: {
                id: roomId
            }
        }
    } = props

    const isAnchor = userStatus.role === 1
    const isCameraLive = videoStreamType === 'camera'
    const roomActive = roomInfo.status === 1

    // 主播侧边栏
    const anchorBars = [{
        key: 'camera',
        value: roomIsBegin && isCameraLive ? <>
            <Switch checked={roomIsBegin && roomOpenCamera} className="ofweek-switch" onChange={handleCameraChange} />
            <label>摄像头</label>
        </> : null
    }, {
        key: 'mic',
        value: roomIsBegin && isCameraLive ? <>
            <Switch checked={roomIsBegin && roomOpenMic} className="ofweek-switch" onChange={handleMicChange} />
            <label>麦克风</label>
        </> : null
    }, {
        key: 'ppt',
        value: roomIsBeginOther || !roomIsBegin || !isCameraLive ? null : <>
            <i className="icon ppt" onClick={handleSwitchSpeech}></i>
            <label>演讲稿</label>
        </>
    }, {
        key: 'ques',
        value: roomActive ? <>
            <i className="icon ques" onClick={handleSwitchQaa}></i>
            <label>问卷调查</label>
        </> : null
    }]

    // 嘉宾侧边栏
    const guestBars = [{
        key: 'camera',
        value: roomIsBegin ? <>
            <Switch checked={roomIsBegin && roomOpenCamera} className="ofweek-switch" onChange={handleCameraChange} />
            <label>摄像头</label>
        </> : null
    }, {
        key: 'mic',
        value: roomIsBegin ? <>
            <Switch checked={roomIsBegin && roomOpenMic} className="ofweek-switch" onChange={handleMicChange} />
            <label>麦克风</label>
        </> : null
    }, {
        key: 'ppt',
        value: roomIsBeginOther || !roomIsBegin || !isCameraLive ? null : <>
            <i className="icon ppt" onClick={handleSwitchSpeech}></i>
            <label>演讲稿</label>
        </>
    }]
    const inititalSideBar = isAnchor ? anchorBars : guestBars

    /** handle close mic or not */
    function handleMicChange(value: boolean) {
        if (value) {
            roomRtcClient.openMic()
        } else {
            roomRtcClient.closeMic()
        }
        message.success(`麦克风已${value ? '开启' : '关闭'}`)
        dispatch({
            type: 'room/save',
            payload: {
                roomOpenMic: value
            }
        })
    }

    /** handle close camera or not  */
    function handleCameraChange(value: boolean) {
        if (value) {
            const videoDom: any = document.getElementById("liveVideo")
            roomRtcClient.openCamera(videoDom)
        } else {
            roomRtcClient.closeCamera()
        }
        // 发送摄像头广播通知
        dispatch({
            type: 'video/broatRoomCamera',
            payload: {
                params: {
                    roomid: roomId,
                    openorclose: value ? 1 : 2
                },
                onSuccess: {
                    operate: () => {
                        message.success(`摄像头已${value ? '开启' : '关闭'}`)
                        dispatch({
                            type: 'room/save',
                            payload: {
                                roomOpenCamera: value
                            }
                        })
                    }
                }
            }
        })
    }

    /** handle open quetion or not */
    function handleSwitchQaa() {
        dispatch({
            type: 'room/save',
            payload: {
                roomQuesVisible: !roomQuesVisible
            }
        })
        dispatch({
            type: 'room/fetchRoomQuestion',
            payload: {
                params: {
                    roomid: roomId
                }
            }
        })
    }

    /** handle open speech live or not */
    function handleSwitchSpeech() {
        dispatch({
            type: 'speech/save',
            payload: {
                speechModalShow: !speechModalShow
            }
        })
    }

    return (<div className="sidebar-container">
        <ul>
            {
                inititalSideBar.map((bar: SidebarType) => bar.value && <li className="sidebar-item" key={bar.key}>
                    {bar.value}
                </li>)
            }
        </ul>
    </div>)
}
export default Sidebar