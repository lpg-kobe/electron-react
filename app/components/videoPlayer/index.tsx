/**
 * @desc common video-player base on DPlayer.js, see https://github.com/DIYgod/DPlayer
 * @stream default used stream of flv not rtmp because electron didn't recommend swf any more
 * @author pika
 */

import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { connect } from 'dva';
import { ReloadOutlined } from '@ant-design/icons';
import DPlayer from 'dplayer';
import flvJs from 'flv.js';
import FlvJs from 'flv.js/d.ts/flv.d';
import { useTranslation } from 'react-i18next';
import { ErrorTypes, ErrorDetails } from 'flv.js/src/player/player-errors';
import PlayerEvents from 'flv.js/src/player/player-events';
import logger from '../../utils/log';
import Loading from '../loading';
import './style.less';

const OFweekLog = logger('______Video Player______');

interface CustomStream {
  customHls?: () => void; // see https://github.com/video-dev/hls.js
  customDash?: () => void; // see https://github.com/Dash-Industry-Forum/dash.js
  customFlv?: () => void; // see http://bilibili.github.io/flv.js/
  customWebTorrent?: () => void; // see https://github.com/webtorrent/webtorrent
}

interface VQuality {
  name: 'HD' | 'SD'; // quality of video
  url: string; // url of each quality of video
  type: string;
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
  playbackSpeed?: Array<number>; // speed to play video
  video?: {
    type?:
      | 'auto'
      | 'hls'
      | 'flv'
      | 'dash'
      | 'webtorrent'
      | 'normal'
      | 'customHls'
      | 'customDash'
      | 'customFlv'
      | 'customWebTorrent';
    customType?: CustomStream;
    quality?: Array<VQuality>;
    defaultQuality?: Array<VQuality>;
    url?: string;
    pic?: string; // video poster
  };
  subtitle?: any; // external subtitle
  danmaku?: any; // showing danmaku
  contextmenu?: Array<any>; // custom contextmenu
  mutex?: boolean; // prevent to play multiple player at the same time, pause other players when this player start play
}

type FlvVideoSource = FlvJs.MediaDataSource;

interface FlvStatic {
  url: string;
  hasRedirect: boolean;
  speed: number; // current speed of media frame
  decodedFrames: number;
  droppedFrames: number;
}

type FlvVideoOptions = FlvJs.Config;

interface VideoProps {
  id: string; // 播放器唯一id，创建多个播放器用到
  refInstance?: any;
  system?: any;
  options: {
    url?: string;
    flv?: {
      sources: FlvVideoSource;
      config?: FlvVideoOptions;
    };
  };
  className?: string;
  videoLoop?: number; // 多条视频播放循环方式 0顺序播放 1列表循环
  videoList?: Array<string>; // multify video to play
}

// 播放器监测指标
interface PlayerPerformance {
  loadCheckTimer?: any; // 资源加载计时器
  loadStartTime?: number; // 开始加载资源时间
  loadErrorTime?: number; // 开始加载失败时间
  loadWaitingTime?: number; // 开始等待缓冲时间
  loadStatus?: 0 | 1; // 资源加载状态 0失败 1成功
  loadDeadline: number; // 默认加载超时时间
  waitSpeedDuration: number; // waiting缓冲speed持续时间
  waitSpeedCollection: Array<any>; // waiting缓冲speed集合
  waitSpeedColMinLen: number; // waiting缓冲speed集合最小长度
}

// player info
let VPlayer: DPlayer = Object.create(null);

const VideoPlayer = (props: VideoProps) => {
  let {
    id,
    refInstance,
    options,
    className,
    videoLoop,
    videoList,
    system: { networkStatus },
  } = props;
  const { t } = useTranslation();

  useImperativeHandle(refInstance, () => ({
    initMultiPlayer: initMultiPlayer,
  }));

  const videoRef: any = useRef(null);
  const [loading, setLoading]: any = useState({
    visible: false,
    loadStatus: 0.5,
  });

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
    mutex: false,
  };

  const defaultFlvSrcs: FlvVideoSource = {
    isLive: true,
    type: 'flv',
  };
  const defaultFlvOpts: FlvVideoOptions = {
    // always seek to newest time when is live of flv, not limited to video IDR frame, but may a bit slower
    accurateSeek: true,
    // Set to false if you need realtime (minimal latency) for live stream
    enableStashBuffer: false,
    // time to interval to emit statistics to player
    statisticsInfoReportInterval: 500,
  };

  useEffect(() => {
    if (!flvJs.isSupported()) {
      throw new Error('Error of flv.js~~');
    }

    init();

    return () => {
      destroyPlayer();
    };
  }, []);

  useEffect(() => {
    // reload flv player after single url changed
    const { flv } = options;

    if (!flv || !VPlayer[id]) {
      return;
    }

    const {
      sources: { url },
    } = flv;

    if (!url) {
      return;
    }

    if (VPlayer[id].prevVideoUrl !== url) {
      VPlayer[id].prevVideoUrl = url;
      initFlv();
    }
  }, [options.flv]);

  useEffect(() => {
    // auto reload source of player if room disconnect once
    if (!VPlayer[id]) {
      return;
    }

    if (!networkStatus) {
      VPlayer[id].connected && (VPlayer[id].connected = false);
    } else {
      if (!VPlayer[id].connected) {
        init();
        VPlayer[id].connected = true;
      }
    }
  }, [networkStatus]);

  /** handle first init after player loaded */
  function init(memo?: boolean) {
    if (videoList?.length) {
      // play multify videos mode
      initMultiPlayer(memo);
    } else {
      // live mode
      switch (true) {
        case !!options.flv:
          initFlv();
          break;

        default:
          // @FEATURE, add more stream support to play video
          const { url, ...dPlayerOpts } = options;
          VPlayer[id] = new DPlayer({
            ...defaultOpts,
            container: videoRef.current,
            ...dPlayerOpts,
            video: {
              url,
              type: 'auto',
            },
          });
          break;
      }
    }
  }

  /** handle init  player of multify videos, use memo to continue play */
  function initMultiPlayer(memo?: boolean) {
    if (memo) {
      // memo video time to seek after init if need
      const memoTime = VPlayer[id]?.video?.currentTime;
      VPlayer[id]?.switchVideo({
        url: videoList?.[VPlayer[id].videoIndex],
      });
      window.requestAnimationFrame(() => {
        VPlayer[id]?.seek(memoTime);
        tryToPlay(VPlayer[id]);
      });
    } else {
      destroyPlayer();
      VPlayer[id] = new DPlayer({
        ...defaultOpts,
        container: videoRef.current,
        live: false,
        ...options,
        video: {
          url: videoList?.[0],
          type: 'auto',
        },
      });
    }

    // performance widthout render page
    VPlayer[id].playerPerformance = {
      loadCheckTimer: null,
      loadStartTime: new Date().getTime(),
      loadErrorTime: new Date().getTime(),
      loadStatus: 0,
      loadDeadline: 10 * 1000,
    };
    VPlayer[id].connected = true;
    VPlayer[id].videoIndex = 0;
    VPlayer[id].on('ended', loopToPlayVideos);
    bindEvent(VPlayer[id]);
  }

  /** init flv.js and config to DPlayer */
  function initFlv() {
    destroyPlayer();
    const { flv, ...dPlayerOpts } = options;

    if (!flv || !flv.sources || !flv.sources.url) {
      setLoading({
        visible: true,
        loadStatus: 0,
        loadDesc: <p>{t('播放地址不能为空')}</p>,
      });
      return;
    }

    const { sources, config } = flv;

    VPlayer[id] = new DPlayer({
      ...defaultOpts,
      container: videoRef.current,
      ...dPlayerOpts,
      video: {
        type: 'customFlv',
        customType: {
          customFlv: (video: HTMLMediaElement, player: DPlayer) => {
            const flvPlayer = flvJs.createPlayer(
              {
                ...defaultFlvSrcs,
                ...sources,
              },
              {
                ...defaultFlvOpts,
                ...config,
              }
            );
            flvPlayer.attachMediaElement(video);
            flvPlayer.load();
            player.flv = flvPlayer;
          },
        },
      },
    });

    // init performance widthout render page when use flv
    VPlayer[id].playerPerformance = {
      loadCheckTimer: null,
      loadStartTime: new Date().getTime(),
      loadErrorTime: new Date().getTime(),
      loadStatus: 0,
      loadDeadline: 30 * 1000,
      waitSpeedDuration: 5 * 1000,
      waitSpeedCollection: [],
      // decinded by statisticsInfoReportInterval setting of flv.js
      waitSpeedColMinLen: 10,
    };
    VPlayer[id].connected = true;
    VPlayer[id].prevVideoUrl = sources.url;
    bindEvent(VPlayer[id]);
  }

  /** bind event of player */
  function bindEvent(player: DPlayer) {
    player.on('timeupdate', () => {
      if (!player.flv) {
        return;
      }

      // auto seek to newest frame of live when load buffered delay is upper 3s after playing 30minutes
      if (player.video.buffered?.length > 0) {
        const bufferedTime = player.video.buffered.end(0);
        const { currentTime } = player.video;
        const frameDelay = bufferedTime - currentTime;
        if (frameDelay >= 3 && currentTime >= 30 * 60) {
          OFweekLog.info(
            'flv will auto seek to newest frame because buffered delay is upper 3 seconds'
          );
          player.seek(bufferedTime);
        }
      }
    });

    player.on('error', () => {
      // error by DPlayer
      OFweekLog.info('DPlayer出现异常:', arguments);
      // faq? => error always callback when first loaded, so don't dosth by this
    });

    player.on('waiting', () => {
      OFweekLog.info('DPlayer出现waiting情况:');

      const {
        playerPerformance: { loadCheckTimer, loadDeadline },
      } = VPlayer[id];

      // clear prev waiting collection
      VPlayer[id].playerPerformance.waitSpeedCollection = [];

      // waiting timeout
      loadCheckTimer && clearTimeout(loadCheckTimer);
      VPlayer[id].playerPerformance.loadCheckTimer = setTimeout(() => {
        if (!VPlayer[id]) {
          return;
        }

        const {
          playerPerformance: { loadStatus },
        } = VPlayer[id];

        loadStatus !== 1 && reInit();
      }, loadDeadline);

      updatePerformance([
        {
          key: 'loadStatus',
          value: 0,
        },
      ]);

      setLoading({
        visible: true,
        loadStatus: 0.5,
      });
    });

    player.on('suspend', () => {
      OFweekLog.info('DPlayer出现suspend情况:', arguments);
    });

    player.on('stalled', () => {
      OFweekLog.info('DPlayer出现stalled情况:', arguments);
    });

    player.on('canplaythrough', () => {
      OFweekLog.info('DPlayer 资源canplaythrough:', arguments);

      handleLoadSuccess();
    });

    if (player.flv) {
      const {
        ERROR,
        MEDIA_INFO,
        METADATA_ARRIVED,
        SCRIPTDATA_ARRIVED,
        STATISTICS_INFO,
      } = PlayerEvents;

      // handle error
      player.flv.on(ERROR, (type: ErrorTypes, detail: ErrorDetails) => {
        // uodate performance of player
        updatePerformance([
          {
            key: 'loadErrorTime',
            value: new Date().getTime(),
          },
          {
            key: 'loadStatus',
            value: 0,
          },
        ]);
        const { NETWORK_ERROR, MEDIA_ERROR, OTHER_ERROR } = ErrorTypes;
        const errorHandle: any = {
          [NETWORK_ERROR]: () => {
            // reload by network err
            const {
              flv: {
                sources: { url },
              },
            } = options;
            const {
              playerPerformance: { loadStartTime, loadErrorTime, loadDeadline },
            } = VPlayer[id];
            // fail to reload video if errored during 30 seconds
            if (loadErrorTime - loadStartTime > loadDeadline) {
              OFweekLog.info('Flv资源加载时间超时:', NETWORK_ERROR, url);

              setLoading({
                visible: true,
                loadStatus: 0,
                loadDesc: (
                  <p>
                    {t('网络不给力')}，
                    <ReloadOutlined
                      title={t('刷新')}
                      style={{ cursor: 'pointer', margin: '0 5px' }}
                      onClick={() => {
                        updatePerformance([
                          {
                            key: 'loadStartTime',
                            value: new Date().getTime(),
                          },
                        ]);
                        reLoad(player);
                      }}
                    />
                    {t('看看')}
                  </p>
                ),
              });
              return;
            }

            reLoad(player);
          },

          [MEDIA_ERROR]: () => {
            // media error
            OFweekLog.info('Flv资源播放出现异常:', MEDIA_ERROR, arguments);
            reInit();
          },

          [OTHER_ERROR]: () => {
            // reInit by other error
            OFweekLog.info('Flv播放出现未知异常:', OTHER_ERROR, arguments);
            reInit();
          },
        };
        errorHandle[type]?.();
      });

      // handle get media success
      player.flv.on(MEDIA_INFO, () => {
        OFweekLog.info('flv.js播放器获取到媒体资源:');

        const {
          options: { autoplay },
        } = player;

        autoplay && tryToPlay(player);
        handleLoadSuccess();
      });

      player.flv.on(METADATA_ARRIVED, () => {
        OFweekLog.info(`flv.js播放器${METADATA_ARRIVED}:`);
      });

      player.flv.on(SCRIPTDATA_ARRIVED, () => {
        OFweekLog.info(`flv.js播放器${SCRIPTDATA_ARRIVED}:`);
      });

      player.flv.on(STATISTICS_INFO, ({ speed }: FlvStatic) => {
        // 直播网络中断视频资源speed实时检测并自动加载恢复，see statisticsInfoReportInterval
        const staticTime = new Date().getTime();
        const {
          playerPerformance: {
            waitSpeedColMinLen,
            waitSpeedDuration,
            loadStatus,
          },
        } = VPlayer[id];

        // filter prev waitSpeedDuration seconds of collection
        VPlayer[id].playerPerformance.waitSpeedCollection = VPlayer[
          id
        ].playerPerformance.waitSpeedCollection.filter(
          ({ time }: any) => time >= staticTime - waitSpeedDuration
        );

        VPlayer[id].playerPerformance.waitSpeedCollection.push({
          speed,
          time: new Date().getTime(),
        });

        // auto reload flv once load status has failed & receive statistics info from stream with speed > 15kpbs during 5S
        const speedSuccess =
          VPlayer[id].playerPerformance.waitSpeedCollection.filter(
            ({ speed }: any) => speed >= 15
          ).length >=
          waitSpeedColMinLen / 2;

        if (
          speedSuccess &&
          VPlayer[id].playerPerformance.waitSpeedCollection.length >=
            waitSpeedColMinLen &&
          loadStatus !== 1
        ) {
          reLoad(VPlayer[id]);
          handleLoadSuccess();
        }
      });
    }
  }

  /** success after load source */
  function handleLoadSuccess() {
    setLoading({
      visible: false,
      loadStatus: 1,
    });

    updatePerformance([
      {
        key: 'loadStatus',
        value: 1,
      },
    ]);
  }

  /** update performance of player */
  function updatePerformance(keys: Array<any>) {
    keys.forEach(({ key, value }: any) => {
      VPlayer[id].playerPerformance = {
        ...VPlayer[id].playerPerformance,
        [key]: value,
      };
    });
  }

  /** destroy & reInit player */
  function reInit() {
    setLoading({
      visible: true,
      loadStatus: 0,
      loadDesc: (
        <p>
          {t('当前网络状态不佳')}，
          <ReloadOutlined
            title={t('重新加载')}
            style={{ cursor: 'pointer', margin: '0 5px' }}
            onClick={() => init()}
          />
          {t('看看')}
        </p>
      ),
    });
  }

  /** try to auto play video if permit */
  function tryToPlay(player: DPlayer) {
    const playPromise = player.play();
    if (playPromise) {
      playPromise.then(
        () => {
          console.log('yes!! success to play video');
        },
        () => {
          console.warn('ooh~~ fail to autoplay video');
        }
      );
    }
  }

  /** reLoad source of player by video type if network break */
  function reLoad(player: DPlayer) {
    setLoading({
      visible: true,
      loadStatus: 0.5,
    });
    const { flv } = player;
    switch (true) {
      case !!flv:
        flv.unload();
        flv.load();
        break;
    }
  }

  /** destroy all things about player */
  function destroyPlayer() {
    OFweekLog.info('播放器被销毁:');

    if (!VPlayer[id]) {
      return;
    }

    VPlayer[id].destroy();
    if (VPlayer[id].flv) {
      VPlayer[id].flv.destroy();
      VPlayer[id].flv = null;
    }
    VPlayer[id] = null;
  }

  /** handle loop to play multify video-source */
  function loopToPlayVideos() {
    videoList = videoList || [];
    videoLoop = videoLoop || 0;

    if (VPlayer[id].videoIndex !== videoList.length - 1) {
      VPlayer[id].videoIndex += 1;
      VPlayer[id].switchVideo({
        url: videoList[VPlayer[id].videoIndex],
      });
      tryToPlay(VPlayer[id]);
    } else {
      VPlayer[id].videoIndex = 0;
      VPlayer[id].switchVideo({
        url: videoList[VPlayer[id].videoIndex],
      });
      videoLoop && tryToPlay(VPlayer[id]);
    }
  }

  return (
    <>
      <Loading options={{ ...loading }} />
      <div
        id={id}
        ref={videoRef}
        className={`ofweek-player ${className || ''}`}
      />
    </>
  );
};

const ConnectPlayer: any = connect(({ system }: any) => ({
  system: system.toJS(),
}))(VideoPlayer);

export default forwardRef((props: VideoProps, ref) => (
  <ConnectPlayer {...props} refInstance={ref} />
));
