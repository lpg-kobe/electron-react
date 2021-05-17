/**
 * @desc 主播 | 嘉宾插播视频
 */

import { message } from 'antd';
import React, { memo, useRef, useEffect } from 'react';
import immutable from 'immutable';
import { useTranslation } from 'react-i18next';
import Loading from '../../../components/loading';
import VideoPlayer from '../../../components/videoPlayer';
import logger from '../../../utils/log';

const OFweekLog = logger('______Insert video Info______');

const InsertVideo = (props: any) => {
  const {
    dispatch,
    video: { videoInsertInfo },
    room: { roomOpenInsertVideo },
    match: {
      params: { id: roomId },
    },
  } = props;
  const { t } = useTranslation();

  const playerRef: any = useRef(null);

  useEffect(() => {
    // reload player by key change of videoInsertInfo
    window.requestAnimationFrame(() => {
      const { initMultiPlayer } = playerRef.current;
      OFweekLog.info('ready to insert videos:', videoInsertInfo);
      initMultiPlayer();
    });
  }, [videoInsertInfo.key]);

  /** close insert video */
  function handleClose() {
    dispatch({
      type: 'video/closeInsertVideo',
      payload: {
        params: {
          roomid: roomId,
        },
        onSuccess: {
          operate: () => {
            message.success(t('插播视频已关闭'));
          },
        },
      },
    });
  }

  const { videoUrlDtoList, type } = videoInsertInfo;

  return videoUrlDtoList?.length ? (
    <div className="insert-video-container">
      {roomOpenInsertVideo && (
        <i
          className="icon icon-close"
          title={t('关闭插播视频')}
          onClick={handleClose}
        />
      )}
      <VideoPlayer
        className="insert-video"
        id="insertVideoPlayer"
        ref={playerRef}
        options={{}}
        videoLoop={type}
        videoList={videoUrlDtoList.map(({ url }: any) => url)}
      />
    </div>
  ) : (
    <Loading />
  );
};

export default memo(InsertVideo, (prevProps, nextProps) => {
  const prevMap = immutable.fromJS({
    video: prevProps.video,
    room: prevProps.room,
  });
  const nextMap = immutable.fromJS({
    video: nextProps.video,
    room: nextProps.room,
  });
  return immutable.is(prevMap, nextMap);
});
