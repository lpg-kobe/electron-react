/**
 * @desc 直播间小窗口模块
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import AnchorVideo from '../video/anchorVideo';
import GuestVideo from '../video/guestVideo';
import Speech from '../speech';
import InsertVideo from '../insertVideo';
import { debounce } from '../../../utils/tool';

const ThumbView = (props: any) => {
  const {
    room: {
      roomWatchMode,
      roomOpenInsertVideo,
      roomOpenInsertVideoOther,
      userStatus,
    },
    rtcClient,
    dispatch,
  } = props;
  const { t } = useTranslation();

  const isCameraMode = roomWatchMode === 0;
  const iAnchor = userStatus.role === 1;
  const VideoRender = iAnchor ? AnchorVideo : GuestVideo;
  const openInsertVideo = roomOpenInsertVideo || roomOpenInsertVideoOther;
  const speechOrInsertVideo = openInsertVideo ? (
    <InsertVideo {...props} />
  ) : (
    <Speech {...props} />
  );

  /** siwtch current user watch mote of video | speech */
  function handleSwitchMote() {
    dispatch({
      type: 'room/save',
      payload: {
        roomWatchMode: isCameraMode ? (openInsertVideo ? 2 : 1) : 0,
      },
    });
  }

  return rtcClient ? (
    <div className="thumb-view-container">
      {isCameraMode ? (
        speechOrInsertVideo
      ) : (
        <VideoRender rtcClient={rtcClient} {...props} />
      )}
      <i
        title={`${t('切换到')}${
          isCameraMode
            ? t('视频')
            : `${openInsertVideo ? t('插播视频') : t('演讲稿')}`
        }`}
        className="icon icon-switch-video"
        onClick={debounce(handleSwitchMote)}
      />
    </div>
  ) : null;
};
export default ThumbView;
