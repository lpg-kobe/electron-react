/**
 * @desc 直播间嘉宾大视频，直播间状态 1直播中 3预告 6结束
 * @description 视频显示规则: 预告状态:显示封面+倒计时
 * @description 视频显示规则: 结束状态:有回放&可播放视频，显示封面+回放按钮
 * @description 视频显示规则: 结束状态:无回放|无可播放视频，显示封面+直播已结束
 * @description 视频显示规则: 房间详情streamType(3)为摄像机推流时取***************************  carmeraUrlList不同视频流进行播放
 * @description 视频显示规则: 房间详情streamType(1|2)为非摄像机推流时取***************************  liveAnthorIds开播列的账户跟当前账户比对，非当前账户则播放远端视频流，播放的视频流可通过trtc广播接收，当前账户则自动下麦退出房间，没有开播列则显示封面
 */
import React, { useEffect, useRef, useState } from 'react';
import VideoPlayer from '../../../components/videoPlayer'
import { countdown, fullScreenEle, exitFullScreen } from '../../../utils/tool';

type PropsType = {
    dispatch(action: any): void,
    auth: any,
    room: any,
    chat: any,
    video: any,
    detail: any,
    rtcClient: any,
    match: any
}

function GuestVideo(props: PropsType) {
    const {
        dispatch,
        rtcClient,
        room: { roomInfo, roomIsBegin, roomOpenMic, roomOpenCamera, roomIsBeginOther, roomOpenCameraOther },
        video: { videoReviewList, videoStreamType, videoStreamSrc }
    } = props

    const [countTime, setCountTime] = useState({
        day: 0,
        hour: 0,
        minutes: 0,
        second: 0
    })
    const guestVideoRef: any = useRef(null)
    const videoBoxRef: any = useRef(null)

    useEffect(() => {
        // 房间开播初始化媒体设备
        switch (true) {
            case Boolean(roomIsBegin && videoStreamType === 'camera'):
                roomOpenCamera && rtcClient.openCamera(guestVideoRef.current)
                roomOpenMic && rtcClient.openMic()
                break;
        }
    }, [roomIsBegin])

    useEffect(() => {
        // 预告倒计时
        if (!roomInfo.startTime || roomInfo.status !== 3) {
            return
        }
        let timer = null
        const { curTime } = roomInfo
        // @ts-ignore
        timer = countdown(roomInfo.startTime, timer, 1000, (lessTime: any) => {
            if (lessTime) {
                setCountTime(lessTime)
            } else {
                // 倒计时结束自动调整房间状态
                dispatch({
                    type: 'room/save',
                    payload: {
                        roomInfo: {
                            ...roomInfo,
                            status: 1
                        }
                    }
                })
            }
        }, curTime)
    }, [roomInfo.startTime])

    const [reviewStart, setReviewStart] = useState(false)
    const [isFullScreen, setIsFullScreen] = useState(false)

    /** handle toggle full screen of media element */
    function toggleFullScreen() {
        if (isFullScreen) {
            exitFullScreen()
            setIsFullScreen(false)
        } else {
            fullScreenEle(videoBoxRef.current)
            setIsFullScreen(true)
        }
    }

    // 远端摄像头画面切换
    const remoteCameraToggle = roomOpenCameraOther ? <VideoPlayer className="anchor-video"
        options={{
            flv: {
                sources: {
                    type: 'flv',
                    url: videoStreamSrc
                }
            }
        }} /> : <div className="anchor-poster"></div>

    // 远端摄像头 | 摄像机画面
    const remoteCameraOrVideo = videoStreamType === 'video' ? <VideoPlayer className="anchor-video"
        options={{
            flv: {
                sources: {
                    type: 'flv',
                    url: videoStreamSrc
                }
            }
        }} /> : remoteCameraToggle

    // 开播中未上麦展示封面 | 主播推流画面
    const isAnchorVideoOrPoster = roomIsBeginOther ?
        remoteCameraOrVideo
        :
        <img src={roomInfo.bgUrl} alt="video-poster" className="cover" />

    return <section className="section-video">
        {/* 开播 */}
        {
            roomInfo.status === 1 && <div className="video-box" ref={videoBoxRef}>
                {
                    roomIsBegin ? <>
                        <div className="guest-video" ref={guestVideoRef} id="liveVideo"></div>
                        {roomOpenCamera && <i className="icon icon-full-screen" title={isFullScreen ? '取消全屏' : '全屏'} onClick={toggleFullScreen}></i>}
                    </> : isAnchorVideoOrPoster
                }
            </div>
        }
        {/* 直播结束 | 预告 */}
        {
            !reviewStart && roomInfo.status !== 1 && <div className="video-poster flex-center">
                <img src={roomInfo.bgUrl} alt="video-poster" className="cover" />
                <div className="video-mask flex-center">
                    <div className={`status-desc${roomInfo.status === 3 ? " will" : " end"}`}>
                        {
                            roomInfo.status === 3 ?
                                <>
                                    <h1>开播倒计时</h1>
                                    <p className="countdown">
                                        <label>{countTime.day}</label>
                                        <span>天</span>
                                        <label>{countTime.hour}</label>
                                        <span>时</span>
                                        <label>{countTime.minutes}</label>
                                        <span>分</span>
                                        <label>{countTime.second}</label>
                                        <span>秒</span>
                                    </p>
                                </>
                                :
                                <>
                                    {
                                        // 结束状态展示回放||直播已结束
                                        roomInfo.isViewVideo && videoReviewList && videoReviewList.length ?
                                            <a onClick={() => setReviewStart(true)} className="review-btn">直播回顾</a>
                                            : <p>
                                                直播已结束
                                        </p>
                                    }
                                </>
                        }
                    </div>
                </div>
            </div>
        }
        {/* 视频回顾 */}
        {
            reviewStart && <VideoPlayer
                className="review-video"
                options={{}}
                videoList={videoReviewList}
            />
        }
    </section>
}
export default GuestVideo
