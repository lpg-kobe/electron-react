/**
 * @desc 直播间小窗口模块
 */
import React from 'react'
import AnchorVideo from '../video/anchorVideo'
import GuestVideo from '../video/guestVideo'
import Speech from '../speech'

const ThumbView = (props: any) => {
    const {
        room: {
            roomWatchMode,
            userStatus
        },
        rtcClient,
        dispatch
    } = props

    const isVideoMode = roomWatchMode === 'video'
    const iAnchor = userStatus.role === 1
    const VideoRender = iAnchor ? AnchorVideo : GuestVideo
    return rtcClient ?
        <div className="thumb-view-container">
            {
                !isVideoMode ? <VideoRender
                    // @ts-ignore
                    rtcClient={rtcClient} {...props} /> : <Speech {...props} />
            }
            <i title={`切换到${isVideoMode ? '视频' : '演讲稿'}`} className="icon icon-switch-video" onClick={() => dispatch({
                type: 'room/save',
                payload: {
                    roomWatchMode: isVideoMode ? 'speech' : 'video'
                }
            })}></i>
        </div> : null
}
export default ThumbView