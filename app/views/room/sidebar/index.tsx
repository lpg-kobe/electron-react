/**
 * @desc 直播间左侧菜单栏
 */
import React from 'react';
import { Switch, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { SidebarType } from '../../../utils/type';
import { debounce } from '../../../utils/tool';

const Sidebar = (props: any) => {
  const {
    dispatch,
    speech: { speechModalShow },
    room: {
      roomIsBegin,
      roomInfo,
      roomOpenMic,
      roomOpenCamera,
      roomOpenInsertVideo,
      roomIsBeginOther,
      userStatus,
      roomQuesVisible,
    },
    video: { videoStreamType, videoInsertShow },
    match: {
      params: { id: roomId },
    },
  } = props;
  const { t } = useTranslation();

  const isAnchor = userStatus.role === 1;
  const isCameraLive = videoStreamType === 'camera';
  const roomActive = roomInfo.status === 1;

  // 主播侧边栏
  const anchorBars = [
    {
      key: 'camera',
      value:
        roomIsBegin && isCameraLive ? (
          <>
            <Switch
              checked={roomIsBegin && roomOpenCamera}
              className="ofweek-switch"
              onChange={debounce(handleCameraChange)}
            />
            <label>{t('摄像头')}</label>
          </>
        ) : null,
    },
    {
      key: 'mic',
      value:
        roomIsBegin && isCameraLive ? (
          <>
            <Switch
              checked={roomIsBegin && roomOpenMic}
              className="ofweek-switch"
              onChange={debounce(handleMicChange)}
            />
            <label>{t('麦克风')}</label>
          </>
        ) : null,
    },
    {
      key: 'ppt',
      value:
        roomIsBeginOther || !roomIsBegin || roomOpenInsertVideo ? null : (
          <>
            <i className="icon ppt" onClick={handleSwitchSpeech} />
            <label>{t('演讲稿')}</label>
          </>
        ),
    },
    {
      key: 'video',
      value:
        (roomIsBegin && isCameraLive) ||
        (!roomIsBegin && roomActive && isCameraLive && !roomIsBeginOther) ? (
          <>
            <i className="icon video" onClick={handleInsertVideo} />
            <label>{t('插播视频')}</label>
          </>
        ) : null,
    },
    {
      key: 'ques',
      value: roomActive ? (
        <>
          <i className="icon ques" onClick={handleSwitchQaa} />
          <label>{t('问卷调查')}</label>
        </>
      ) : null,
    },
  ];

  // 嘉宾侧边栏
  const guestBars = [
    {
      key: 'camera',
      value: roomIsBegin ? (
        <>
          <Switch
            checked={roomIsBegin && roomOpenCamera}
            className="ofweek-switch"
            onChange={debounce(handleCameraChange)}
          />
          <label>{t('摄像头')}</label>
        </>
      ) : null,
    },
    {
      key: 'mic',
      value: roomIsBegin ? (
        <>
          <Switch
            checked={roomIsBegin && roomOpenMic}
            className="ofweek-switch"
            onChange={debounce(handleMicChange)}
          />
          <label>{t('麦克风')}</label>
        </>
      ) : null,
    },
    {
      key: 'ppt',
      value:
        roomIsBeginOther || roomOpenInsertVideo || !roomIsBegin ? null : (
          <>
            <i className="icon ppt" onClick={handleSwitchSpeech} />
            <label>{t('演讲稿')}</label>
          </>
        ),
    },
    {
      key: 'video',
      value:
        roomIsBegin && isCameraLive ? (
          <>
            <i className="icon video" onClick={handleInsertVideo} />
            <label>{t('插播视频')}</label>
          </>
        ) : null,
    },
  ];
  const inititalSideBar = isAnchor ? anchorBars : guestBars;

  /** handle close mic or not */
  function handleMicChange(value: boolean) {
    message.success(`${t('麦克风已')}${value ? t('开启') : t('关闭')}`);
    dispatch({
      type: 'room/save',
      payload: {
        roomOpenMic: value,
      },
    });
  }

  /** handle get list of insert video */
  function handleInsertVideo() {
    dispatch({
      type: 'video/getInsertVideos',
      payload: {
        params: {
          roomid: roomId,
        },
        onSuccess: {
          search: () => {
            dispatch({
              type: 'video/save',
              payload: {
                videoInsertShow: !videoInsertShow,
              },
            });
          },
        },
      },
    });
  }

  /** handle close camera or not  */
  function handleCameraChange(value: boolean) {
    // 发送摄像头广播通知
    dispatch({
      type: 'video/broatRoomCamera',
      payload: {
        params: {
          roomid: roomId,
          openorclose: value ? 1 : 2,
        },
        onSuccess: {
          operate: () => {
            message.success(`${t('摄像头已')}${value ? t('开启') : t('关闭')}`);
            dispatch({
              type: 'room/save',
              payload: {
                roomOpenCamera: value,
              },
            });
          },
        },
        onError: {
          operate: () => {
            message.error(t('操作频繁，请稍后重试'));
          },
        },
      },
    });
  }

  /** handle open quetion or not */
  function handleSwitchQaa() {
    dispatch({
      type: 'room/save',
      payload: {
        roomQuesVisible: !roomQuesVisible,
      },
    });
    dispatch({
      type: 'room/fetchRoomQuestion',
      payload: {
        params: {
          roomid: roomId,
        },
      },
    });
  }

  /** handle open speech live or not */
  function handleSwitchSpeech() {
    dispatch({
      type: 'speech/save',
      payload: {
        speechModalShow: !speechModalShow,
      },
    });
  }

  return (
    <div className="sidebar-container">
      <ul>
        {inititalSideBar.map(
          (bar: SidebarType) =>
            bar.value && (
              <li className="sidebar-item" key={bar.key}>
                {bar.value}
              </li>
            )
        )}
      </ul>
    </div>
  );
};
export default Sidebar;
