/**
 * @desc common video-player base on DPlayer.js, see https://github.com/DIYgod/DPlayer
 * @stream default used stream of flv not rtmp because electron didn't recommend swf any more
 * @author pika
 */

import React, { useState, useEffect, useRef } from 'react';
import { ReloadOutlined } from '@ant-design/icons'
// @ts-ignore
import DPlayer from 'dplayer'
import flvJs from 'flv.js'
import FlvJs from 'flv.js/d.ts/flv.d'
// @ts-ignore
import { ErrorTypes, ErrorDetails } from 'flv.js/src/player/player-errors'
// @ts-ignore
import PlayerEvents from 'flv.js/src/player/player-events'
import Loading from '../loading'

type CustomStream = {
    customHls?: () => void; // see https://github.com/video-dev/hls.js
    customDash?: () => void; // see https://github.com/Dash-Industry-Forum/dash.js
    customFlv?: () => void; // see http://bilibili.github.io/flv.js/
    customWebTorrent?: () => void; // see https://github.com/webtorrent/webtorrent
}

type VQuality = {
    name: 'HD' | 'SD'; // quality of video
    url: string; // url of each quality of video
    type: string
}

interface DPConfigs {
    container?: HTMLElement; // video container
    live?: boolean; // 直播？
    autoplay?: boolean; // autoplay video?
    theme?: string; // main color of player
    loop?: boolean; // loop to play video?
    lang?: 'en' | 'zh-cn' | 'zh-tw'; // language of player
    screenshot?: boolean; // enable shotcut width screen?
    airplay?: boolean; // enable airplay in Safari?
    hotkey?: boolean; // hot key to controll player,support FF, FR, volume control, play & pause
    preload?: 'none' | 'metadata' | 'auto';
    volume?: number;
    playbackSpeed?: Array<number>;// speed to play video
    video?: {
        type?: 'auto' | 'hls' | 'flv' | 'dash' | 'webtorrent' | 'normal' | 'customHls' | 'customDash' | 'customFlv' | 'customWebTorrent',
        customType?: CustomStream;
        quality?: Array<VQuality>;
        defaultQuality?: Array<VQuality>;
        url?: string
        pic?: string // video poster
    };
    subtitle?: any // external subtitle
    danmaku?: any // showing danmaku
    contextmenu?: Array<any> // custom contextmenu
    mutex?: boolean // prevent to play multiple player at the same time, pause other players when this player start play
}

interface FlvVideoSource extends FlvJs.MediaDataSource {

}
interface FlvVideoOptions extends FlvJs.Config {

}

type VideoProps = {
    options: {
        url?: string;
        flv?: {
            sources: FlvVideoSource
            config?: FlvVideoOptions
        }
    };
    className?: string;
    videoList?: Array<string> // multify video to play
}

// 播放器监测指标
type PlayerPerformance = {
    loadStartTime?: number;  // 开始加载资源时间
    loadErrorTime?: number;  // 开始加载失败时间
    loadStatus?: 0 | 1;  // 资源加载状态 0失败 1成功
}

// play index when set multify video sources
let videoIndex: number = 0
let prevVideoUrl: string | undefined = ''
// player info
let VPlayer: DPlayer = null
// performance widthout rerender page
let playerPerformance: PlayerPerformance = {
    loadStartTime: new Date().getTime(),
    loadErrorTime: new Date().getTime(),
    loadStatus: 0
}

export default function VideoPlayer(props: VideoProps) {
    let {
        options,
        className,
        videoList
    } = props

    const videoRef: any = useRef(null)
    const [loading, setLoading]: any = useState({
        visible: false
    })

    const defaultOpts: DPConfigs = {
        live: true,
        autoplay: true,
        theme: '#2691E9',
        loop: false,
        lang: 'zh-cn',
        screenshot: false,
        airplay: true,
        hotkey: true,
        preload: 'auto',
        volume: 0.7,
        playbackSpeed: [0.5, 0.75, 1, 1.25, 1.5, 2],
        danmaku: false,
        mutex: true
    }

    const defaultFlvSrcs: FlvVideoSource = {
        isLive: true,
        type: 'flv',
    }
    const defaultFlvOpts: FlvVideoOptions = {
        lazyLoadMaxDuration: 3 * 60,
    }

    useEffect(() => {
        if (!flvJs.isSupported()) {
            throw new Error('Error of flv.js~~')
        }

        if (videoList && videoList.length) { // play multify videos mode
            VPlayer = new DPlayer({
                ...defaultOpts,
                container: videoRef.current,
                live: false,
                ...options,
                video: {
                    url: videoList[videoIndex],
                    type: 'auto'
                }
            })
            VPlayer.on('ended', loopToPlayVideos)
        } else { // live mode
            switch (true) {
                // @ts-ignore
                case !!options.flv:
                    initFlv()
                    break;

                default:
                    // @TODO, add more stream support to play video
                    const { url, ...dPlayerOpts } = options
                    VPlayer = new DPlayer({
                        ...defaultOpts,
                        container: videoRef.current,
                        ...dPlayerOpts,
                        video: {
                            url,
                            type: 'auto'
                        }
                    })
                    break;
            }
        }

        return () => {
            destroyPlayer()
        };

    }, []);

    useEffect(() => {
        // reload player after url changed
        const { flv } = options

        if (!flv) {
            return
        }

        const { sources: { url } } = flv

        if (!url) {
            return
        }

        if (prevVideoUrl !== url) {
            prevVideoUrl = url
            destroyPlayer()
            initFlv()
        }

    }, [options.flv]);

    /** init flv.js and config to DPlayer */
    function initFlv() {
        const { flv, ...dPlayerOpts } = options

        if (!flv) {
            return
        }

        const { sources, config } = flv
        VPlayer = new DPlayer({
            ...defaultOpts,
            container: videoRef.current,
            ...dPlayerOpts,
            video: {
                type: 'customFlv',
                customType: {
                    'customFlv': (video: HTMLMediaElement, player: DPlayer) => {
                        const flvPlayer = flvJs.createPlayer({
                            ...defaultFlvSrcs,
                            ...sources
                        }, {
                            ...defaultFlvOpts,
                            ...config
                        })
                        flvPlayer.attachMediaElement(video);
                        // uodate performance of player
                        updatePerformance([{
                            key: 'loadStartTime',
                            value: new Date().getTime()
                        }])
                        flvPlayer.load()
                        player.flv = flvPlayer
                    }
                }
            }
        })
        bindEvent(VPlayer)
    }

    /** bind event of player */
    function bindEvent(player: DPlayer) {
        // VPlayer.on('play', () => { //@TODO 定时检测video缓冲区大小并跳到最新帧
        //     if (VPlayer.video.buffered.length > 0) {
        //         const distand = VPlayer.video.buffered.end(0) - VPlayer.video.currentTime
        //         distand > 0 && VPlayer.seek(distand)
        //     }
        // })

        player.on('error', () => { // error by DPlayer
            // uodate performance of player
            updatePerformance([{
                key: 'loadErrorTime',
                value: new Date().getTime()
            }, {
                key: 'loadStatus',
                value: 0
            }])

            destroyPlayer()
            setLoading({
                ...loading,
                visible: true,
                loadStatus: 0,
                loadDesc: <p>
                    播放器出现异常，<ReloadOutlined title="重载播放器" style={{ cursor: 'pointer', margin: '0 5px' }} onClick={initFlv} />
                    看看
                </p>
            })
        })

        player.on('stalled', () => {
            // @TODO
        })

        if (player.flv) {
            const { ERROR, MEDIA_INFO } = PlayerEvents

            // handle error
            player.flv.on(ERROR, (type: ErrorTypes, detail: ErrorDetails) => {
                // uodate performance of player
                updatePerformance([{
                    key: 'loadErrorTime',
                    value: new Date().getTime()
                }, {
                    key: 'loadStatus',
                    value: 0
                }])
                const { NETWORK_ERROR, MEDIA_ERROR, OTHER_ERROR } = ErrorTypes
                const errorHandle: any = {
                    [NETWORK_ERROR]: () => { // fail to load 
                        // @ts-ignore
                        const { flv: { sources: { url } } } = options
                        const { loadStartTime, loadErrorTime } = playerPerformance
                        // fail to reload video if errored during 30 seconds
                        // @ts-ignore
                        if (loadErrorTime - loadStartTime > 30 * 1000) {
                            setLoading({
                                ...loading,
                                visible: true,
                                loadStatus: 0,
                                loadDesc: <p>
                                    网络不给力，<ReloadOutlined title="刷新" style={{ cursor: 'pointer', margin: '0 5px' }} onClick={() => {
                                        updatePerformance([{
                                            key: 'loadStartTime',
                                            value: new Date().getTime()
                                        }])
                                        reLoad(player)
                                    }} />
                                    看看
                                </p>
                            })
                            return
                        }

                        reLoad(player)
                    },

                    [MEDIA_ERROR]: () => { // media error
                        destroyPlayer()
                        setLoading({
                            ...loading,
                            visible: true,
                            loadStatus: 0,
                            loadDesc: <p>视频资源出现异常-{detail}</p>
                        })
                    },

                    [OTHER_ERROR]: () => { // other error
                        destroyPlayer()
                        setLoading({
                            ...loading,
                            visible: true,
                            loadStatus: 0,
                            loadDesc: <p>播放器出现未知异常-{detail}</p>
                        })
                    },
                }
                errorHandle[type] && errorHandle[type]()
            })

            // handle get media success
            player.flv.on(MEDIA_INFO, () => {
                const { options: { autoplay } } = player
                autoplay && tryToPlay(player)
                setLoading({
                    ...loading,
                    visible: false,
                    loadStatus: 1
                })
                updatePerformance([{
                    key: 'loadStatus',
                    value: 1
                }])
            })
        }
    }

    /** update performance of player */
    function updatePerformance(keys: Array<any>) {
        keys.forEach(({ key, value }: any) => {
            playerPerformance = {
                ...playerPerformance,
                [key]: value
            }
        })
    }

    /** try to auto play video if permit */
    function tryToPlay(player: DPlayer) {
        const playPromise = player.play()
        if (playPromise) {
            playPromise.then(() => {
                console.log('yes!! success to play video')
            }, () => {
                console.warn('ooh~~ fail to autoplay video')
            })
        }
    }

    /** reLoad player by video type */
    function reLoad(player: DPlayer) {
        setLoading({
            ...loading,
            visible: true,
            loadStatus: 0.5
        })
        const { flv } = player
        switch (true) {
            case !!flv:
                flv.unload()
                flv.load()
                break;
        }
    }

    /** destroy all things about player */
    function destroyPlayer() {
        if (!VPlayer) {
            return
        }
        VPlayer.destroy()
        if (VPlayer.flv) {
            VPlayer.flv.destroy()
            VPlayer.flv = null
        }
        VPlayer = null
    }

    /** handle loop to play multify video-source */
    function loopToPlayVideos() {
        videoList = videoList || []
        if (videoIndex !== videoList.length - 1) {
            videoIndex += 1
            VPlayer.switchVideo({
                url: videoList[videoIndex]
            })
            VPlayer.play()
        } else {
            videoIndex = 0
            VPlayer.switchVideo({
                url: videoList[videoIndex]
            })
        }
    }

    return <>
        {
            <Loading options={{ ...loading }} />
        }
        <div id="dPlayer" ref={videoRef} className={`ofweek-player ${className || ''}`} />
    </>

}
