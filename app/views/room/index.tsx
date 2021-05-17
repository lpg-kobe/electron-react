import React, { useState, useEffect } from 'react';
import { connect } from 'dva';
import { withRouter } from 'dva/router';
import { useTranslation } from 'react-i18next';
import { message, Modal } from 'antd';

// @ts-ignore
import { SDK_APP_ID } from '@/constants';

import TrtcElectronVideocast, {
  EVENT,
} from '../../sdk/trtc-electron-videocast';
import AnchorRoom from './components/anchorRoom';
import GuestRoom from './components/guestRoom';
import Loading from '../../components/loading';
import {
  closeWindow,
  rendererListen,
  rendererOffListen,
  RENDERER_EVENT,
  RENDERER_CODE,
} from '../../utils/ipc';
import { loopToInterval, loadImage,getStore } from '../../utils/tool';
import { MsgReceiveType, RendererCode } from '../../utils/type';
import logger from '../../utils/log';
import './style.less';

const OFweekLog = logger('______Room Page______');

interface PropsType {
  dispatch: (action: any) => void;
  auth: any;
  room: any;
  chat: any;
  detail: any;
  system: any;
  video: any;
  match: any;
}

interface LiveMember {
  id: string | number;
}

// room trtc instance,widthout setted imLogin
let roomRtcClient: any = null;

function RoomInfo(props: PropsType) {
  // export function of this component
  RoomInfo.prototype.updateAliveUsers = updateAliveUsers;

  const {
    dispatch,
    system: { networkStatus },
    video: { videoLoading },
    auth: {
      userInfo: { userSig, imAccount },
    },
    match: {
      params: { id: roomId },
    },
    room: {
      roomPageInit,
      roomLanguage,
      roomInfo,
      userStatus,
      roomFunHandler,
      roomOpenMic,
      roomOpenCamera,
      roomIsBegin,
      roomWatchMode,
    },
  } = props;

  // enter room after get must data from api by roomPageInit status
  if (!roomPageInit) {
    return <Loading />;
  }

  const { t, i18n } = useTranslation();
  const [connect, setConnect] = useState(true);

  useEffect(() => {
    // 进直播间就发送心跳
    let timer: any = null;
    timer = loopToInterval(sendHeartBeat, timer);

    if (!roomRtcClient) {
      // 直播间trtc无需登录im，该trtc只处理房间trtc直播相关逻辑。im-sdk相关事件监听由已登录im的system-modal的trtc处理
      roomRtcClient = new TrtcElectronVideocast({
        sdkAppId: SDK_APP_ID,
        userId: imAccount,
        imLogin: false,
        userSig,
      });
      bindEvent(roomRtcClient);
    }

    return () => {
      unBindEvent();
      roomRtcClient = null;
    };
  }, []);

  useEffect(() => {
    //  @ts-ignore register operate code msg from main process
    rendererListen(RENDERER_EVENT.RENDERER_SEND_CODE, onRendererCode);
    return () => {
      // @ts-ignore
      rendererOffListen(RENDERER_EVENT.RENDERER_SEND_CODE, onRendererCode);
    };
  }, []);

  useEffect(() => {
    // init system trtc client and bind event after init room success
    dispatch({
      type: 'system/initRtcClient',
      payload: {
        eventHandlers: {
          [EVENT.tim.MESSAGE_RECEIVED]: handleMsgReceive,
        },
      },
    });
  }, []);

  useEffect(() => {
    // 每隔6s拉一次成员列表，确保成员最新
    let timer: any = null;
    timer = loopToInterval(
      () => {
        dispatch({
          type: 'chat/getMemberList',
          payload: {
            params: {
              roomid: roomId,
            },
            onError: {
              operate: () => {},
            },
          },
        });
        return true;
      },
      timer,
      6 * 1000
    );
    return () => {};
  }, []);

  useEffect(() => {
    // 跨组件方法调用
    const {
      key,
      value: { name, args, callback },
    } = roomFunHandler;
    const namespace = 'RoomInfo';
    const fun = RoomInfo.prototype[name];

    if (!key.startsWith(namespace) || typeof fun !== 'function') {
      return;
    }

    (async () => {
      await fun.apply(null, args);
      callback?.();
    })();
  }, [roomFunHandler.key]);

  useEffect(() => {
    // auto change language by room if user not change language
    if (!roomLanguage || getStore('userConfig')?.language) {
      return;
    }
    i18n.changeLanguage(roomLanguage);
  }, [roomLanguage]);

  useEffect(() => {
    // try to reconnect room once network connected after disconnect
    if (networkStatus) {
      if (!connect) {
        reconnectRoom();
        setConnect(true);
      }
    } else {
      connect && setConnect(false);
    }
  }, [networkStatus]);

  useEffect(() => {
    if (videoLoading) {
      // auto close video loading of push stream after 3 seconds event if user frame can't captured by camera
      setTimeout(() => {
        dispatch({
          type: 'video/save',
          payload: {
            videoLoading: false,
          },
        });
      }, 3000);
    }
  }, [videoLoading]);

  useEffect(() => {
    // auto toggle mic in trtc by value of roomOpenMic
    roomOpenMic ? roomRtcClient.openMic() : roomRtcClient.closeMic();
  }, [roomOpenMic]);

  useEffect(() => {
    // auto toggle camera in trtc by value of roomOpenMic
    window.requestAnimationFrame(() => {
      const videoDom: any = document.getElementById('liveVideo');
      roomOpenCamera
        ? roomRtcClient.openCamera(videoDom)
        : roomRtcClient.closeCamera(videoDom);
    });
  }, [roomOpenCamera]);

  useEffect(() => {
    // auto redraw img of anchor once watch mode change after roomIsBegin
    if (roomIsBegin && roomOpenCamera) {
      window.requestAnimationFrame(() => {
        const videoDom: any = document.getElementById('liveVideo');
        roomRtcClient.openCamera(videoDom);
      });
    }
  }, [roomWatchMode]);

  useEffect(() => {
    // 房间结束拉取回顾视频
    if (roomInfo.status && roomInfo.status === 6) {
      dispatch({
        type: 'video/getReviewVideos',
        payload: {
          params: {
            roomid: roomId,
          },
        },
      });
    }
  }, [roomInfo.status]);

  /** handle error of TRTC-SDK */
  function handleError(errcode: number, errmsg: string) {
    OFweekLog.info('error by trtc-sdk:', errmsg + errcode);
    const errorHandle: any = {
      [-1301]: handleCameraError,
      [-1302]: () => {
        message.error(t('麦克风开启失败，请检查设备'));
      },
      [-1314]: () => {
        message.error(t('摄像头被禁用，请检查设备'));
      },
      [-1317]: () => {
        message.error(t('麦克风被禁用，请检查设备'));
      },
      [-1316]: () => {
        message.error(t('摄像头被占用，请开启其他设备'));
      },
      [-1319]: () => {
        message.error(t('麦克风被占用，请开启其他设备'));
      },
      [-3308]: () => {
        message.error(t('网络拥堵，请重新进入房间'));
      },
    };
    errorHandle[errcode]?.();
  }

  /** handle warning of TRTC-SDK  */
  function handleWarning(warningCode: number, warningMsg: string) {
    OFweekLog.info('waring by trtc-sdk:', warningMsg + warningCode);
    const errorHandle: any = {
      1111: () => {
        message.warn(t('没有可用的摄像头，请检查设备'));
      },
      1101: () => {
        message.warn(t('网络拥堵，将自动降低画面质量'));
      },
      2104: () => {
        message.warn(t('网络拥堵，将自动降低画面质量'));
      },
      1201: () => {
        message.warn(t('没有可用的麦克风，请检查设备'));
      },
      5103: () => {
        message.warn(t('网络拥堵，将自动降低画面质量'));
      },
    };
    errorHandle[warningCode]?.();
  }

  /** handle network status of trtc */
  function handleNetwork({ quality }: any) {
    dispatch({
      type: 'system/save',
      payload: {
        netQuality: quality,
      },
    });
  }

  /** handle statistics collection of trtc */
  function handleStatistics(statistics: any) {
    dispatch({
      type: 'system/save',
      payload: {
        statistics,
      },
    });
  }

  /** handle error of camera */
  function handleCameraError() {
    message.error(t('未能开启摄像头，请检查设备'));
    // 发送摄像头广播通知
    dispatch({
      type: 'video/broatRoomCamera',
      payload: {
        params: {
          roomid: roomId,
          openorclose: 2,
        },
        onSuccess: {
          operate: () => {
            dispatch({
              type: 'room/save',
              payload: {
                roomOpenCamera: 2,
              },
            });
          },
        },
      },
    });
  }

  /** reconnect room,refresh all data and keep online status of anchor or guest */
  function reconnectRoom() {
    // init room and user status
    const detailPromise: any = new Promise((resolve, reject) => {
      dispatch({
        type: 'room/getRoomInfo',
        payload: {
          params: {
            roomid: roomId,
          },
          onSuccess: {
            operate: ({ data }: any) => resolve(data),
          },
          onError: {
            operate: () => reject(false),
          },
        },
      });
    });

    const enterPromise: any = new Promise((resolve, reject) => {
      dispatch({
        type: 'room/getUserStatusInRoom',
        payload: {
          params: {
            roomid: roomId,
          },
          onSuccess: {
            operate: ({ data }: any) => resolve(data),
          },
          onError: {
            operate: () => reject(false),
          },
        },
      });
    });

    Promise.all([detailPromise, enterPromise]).then(
      ([detailResult, enterResult]) => {
        // member list data need liveAnthorIds in detailPromise & updated after user enter room by api of enterPromise
        dispatch({
          type: 'room/getMembers',
          payload: {
            params: {
              roomid: roomId,
            },
          },
        });
        const {
          liveAnthorIds,
          isInstallVideoOpen,
          isOpenSpeech,
          streamType,
        } = detailResult;
        const { imAccount, role } = enterResult;

        const isAnchor = Number(role) === 1;
        const isCameraLive = Number(streamType) === 1;
        const isSomeOneLive = Boolean(liveAnthorIds?.length);

        if (isSomeOneLive) {
          const userIsAlive = liveAnthorIds.some(
            (anchorId: string) => String(anchorId) === String(imAccount)
          );
          const roomOpenInsertVideo =
            (isAnchor &&
              !isSomeOneLive &&
              isInstallVideoOpen &&
              isCameraLive) ||
            (isInstallVideoOpen &&
              isCameraLive &&
              isSomeOneLive &&
              userIsAlive);

          if (userIsAlive) {
            // user is alive & keep online
            dispatch({
              type: 'room/save',
              payload: {
                roomFunHandler: {
                  key: isAnchor
                    ? `AnchorRoom:${new Date().getTime()}`
                    : `GuestRoom:${new Date().getTime()}`,
                  value: {
                    name: isAnchor
                      ? 'handleCheckTypeToStart'
                      : 'handleCheckMediaToStart',
                    args: isAnchor ? [] : [0],
                  },
                },
              },
            });
          } else {
            // remote is alive & init remote status
            dispatch({
              type: 'room/save',
              payload: {
                roomFunHandler: {
                  key: isAnchor
                    ? `AnchorRoom:${new Date().getTime()}`
                    : `GuestRoom:${new Date().getTime()}`,
                  value: {
                    name: 'initRemoteEnter',
                    args: [
                      {
                        ...detailResult,
                        roomWatchMode: isInstallVideoOpen
                          ? 2
                          : isOpenSpeech
                          ? 1
                          : 0,
                        roomOpenInsertVideo,
                        roomOpenInsertVideoOther:
                          !roomOpenInsertVideo && isInstallVideoOpen,
                      },
                    ],
                  },
                },
              },
            });
          }
        } else {
          initRoomState([
            'roomWatchMode',
            'roomOpenInsertVideo',
            'roomOpenInsertVideoOther',
          ]);
        }
      }
    );

    // 问答区
    dispatch({
      type: 'chat/getQaaList',
      payload: {
        params: {
          roomId,
          size: 50,
        },
        onSuccess: {
          search: () => {
            window.requestAnimationFrame(() => {
              dispatch({
                type: 'chat/save',
                payload: {
                  qaaScrollTop: 'scroll:bottom',
                },
              });
            });
          },
        },
      },
    });

    // 互动区
    dispatch({
      type: 'chat/getChatList',
      payload: {
        params: {
          roomId,
          size: 50,
        },
      },
    });

    // 图文直播
    dispatch({
      type: 'detail/getImgTextList',
      payload: {
        params: {
          roomId,
          size: 20,
        },
      },
    });
  }

  /** 发送房间心跳保持连接,用于房间内维持成员列表在线状态，出现异常使用重连机制 */
  function sendHeartBeat() {
    return new Promise((resolve) => {
      dispatch({
        type: 'system/sendHeartBeat',
        payload: {
          params: {
            memberId: imAccount,
            roomId,
            time: new Date(),
          },
          onSuccess: {
            operate: () => resolve(true),
          },
          onError: {
            operate: () => {
              // resolve true to keep heartBeat if error
              resolve(true);
            },
          },
        },
      });
    });
  }

  /**
   * @desc 键值对更改同个发送者所有消息状态
   * @param {Array} filterList 过滤的数组
   * @param {Array<Object<key:value>>} attrs 更改的属性集合
   * @param {String} id 比对id
   * @param {String} judgeKey 比对的键值
   * @param {String} updateKey 要更新state的key值
   */
  function handleUpdateMsg(
    filterList: Array<any>,
    attrs: Array<any>,
    id: any,
    judgeKey: string,
    updateKey: string
  ) {
    dispatch({
      type: 'chat/save',
      payload: {
        [updateKey]: filterList.map((msg: any) => {
          const matchMsg = String(msg[judgeKey]) === String(id);
          if (matchMsg) {
            let updateObj: any = {};
            attrs.forEach(({ key, value }: any) => {
              updateObj[key] = value;
            });
            return {
              ...msg,
              ...updateObj,
            };
          } else {
            return msg;
          }
        }),
      },
    });
  }

  /** 房间所有socket推送消息，视频上下麦相关推送消息在主播||嘉宾房间单独处理 */
  function handleMsgReceive({ data: messageData }: MsgReceiveType) {
    try {
      for (let i = 0, len = messageData.length; i < len; i++) {
        const msg = messageData[i];
        const payloadData = JSON.parse(msg.payload.data);

        if (String(payloadData.roomId) !== String(roomId)) {
          return;
        }

        // need to get latest state from modal because data may not be the newest when event listener happended
        dispatch({
          type: 'system/getLatestState',
          payload: {
            params: {
              namespace: ['room', 'chat', 'detail', 'speech'],
            },
            callback: ({
              room: roomState,
              chat: chatState,
              detail: detailState,
              speech: speechState,
            }: any) => {
              const {
                userStatus,
                roomInfo,
                roomAliveUsers,
                roomForbitUsers,
                roomIsBegin,
                roomWatchMode,
                roomOpenSpeech,
                roomOpenSpeechOther,
              } = roomState;
              const { list, qaaList, memberList } = chatState;
              const { imgTextList } = detailState;
              const { speechInfo } = speechState;

              switch (String(payloadData.msgCode)) {
                // 接收到群推送聊天消息
                case '1000':
                  console.log('群推送消息1000');

                  dispatch({
                    type: 'chat/save',
                    payload: {
                      list: [...list, payloadData],
                    },
                  });

                  // scroll bottom after content of msg loaded
                  window.requestAnimationFrame(() => {
                    const { type, content } = payloadData;
                    const isImg = type === 2;
                    const imgContent = isImg ? content : '';
                    loadImage(imgContent, () => {
                      dispatch({
                        type: 'chat/save',
                        payload: {
                          chatScrollTop: `scroll${new Date().getTime()}:bottom`,
                        },
                      });
                    });
                  });

                  break;

                // 直播间统计数据更新
                case '1005':
                  console.log('直播间统计更新消息1005');

                  const { pv, praise } = payloadData;
                  dispatch({
                    type: 'room/save',
                    payload: {
                      roomInfo: {
                        ...roomInfo,
                        pv,
                        praise,
                      },
                    },
                  });

                  break;

                // 新增一条图文消息
                case '1001':
                  console.log('群推送图文消息1001');

                  dispatch({
                    type: 'detail/save',
                    payload: {
                      imgTextList: [payloadData, ...imgTextList],
                    },
                  });

                  break;

                // 审核通过互动聊天消息
                // case '1010':
                //   console.log('审核通过互动聊天消息1010');

                //   dispatch({
                //     type: 'chat/save',
                //     payload: {
                //       list: [...list, payloadData],
                //       chatScrollTop: `scroll${new Date().getTime()}:bottom`,
                //     },
                //   });

                //   break;

                // 审核不通过互动聊天消息
                case '1011':
                  console.log('审核不通过互动聊天消息1011');
                  break;

                // 接收到群推送问答消息
                case '1002':
                  console.log('接收到群推送问答消息1002');

                  const actionObj: any = {
                    // 新增一条问题
                    1: () => {
                      dispatch({
                        type: 'chat/save',
                        payload: {
                          qaaList: [...qaaList, payloadData],
                          qaaScrollTop: `scroll${new Date().getTime()}:bottom`,
                        },
                      });
                    },

                    // 新增一条回答
                    2: () => {
                      dispatch({
                        type: 'chat/save',
                        payload: {
                          // 找到questionId的子集并添加数据
                          qaaList: qaaList.map((msg: any) =>
                            msg.msgId === payloadData.questionId
                              ? {
                                  ...msg,
                                  answerList: [
                                    ...(msg.answerList || []),
                                    payloadData,
                                  ],
                                }
                              : msg
                          ),
                          qaaScrollTop: `scroll${new Date().getTime()}:bottom`,
                        },
                      });
                    },
                  };

                  actionObj[payloadData.type]?.();

                  break;

                // 广播更新了直播间回答消息
                case '1003':
                  console.log('广播更新了直播间回答消息1003');

                  dispatch({
                    type: 'chat/save',
                    payload: {
                      qaaList: qaaList.map((msg: any) =>
                        msg.msgId === payloadData.questionId
                          ? {
                              ...msg,
                              answerList: (msg.answerList || []).map(
                                (answer: any) =>
                                  answer.msgId === payloadData.msgId
                                    ? {
                                        ...answer,
                                        content: payloadData.content,
                                      }
                                    : answer
                              ),
                            }
                          : msg
                      ),
                    },
                  });

                  break;

                // 审核通过直播间问答消息
                case '1012':
                  console.log('审核通过问答消息1012');

                  dispatch({
                    type: 'chat/save',
                    payload: {
                      qaaList: [...qaaList, payloadData],
                      qaaScrollTop: `scroll${new Date().getTime()}:bottom`,
                    },
                  });

                  break;

                // 删除群互动消息
                case '1014':
                  console.log('删除群互动消息1014');

                  dispatch({
                    type: 'chat/save',
                    payload: {
                      list: list.filter(
                        (msg: any) => msg.msgId !== payloadData.msgId
                      ),
                    },
                  });

                  break;

                // 删除直播间问答消息
                case '1015':
                  console.log('删除直播间问答消息1015');

                  const reactObj: any = {
                    // 删除问题
                    1: () => {
                      dispatch({
                        type: 'chat/save',
                        payload: {
                          qaaList: qaaList.filter(
                            (msg: any) => msg.msgId !== payloadData.msgId
                          ),
                        },
                      });
                    },

                    // 删除回答
                    2: () => {
                      dispatch({
                        type: 'chat/save',
                        payload: {
                          // 找到questionId的消息并将其子集过滤
                          qaaList: qaaList.map((msg: any) =>
                            msg.msgId === payloadData.questionId
                              ? {
                                  ...msg,
                                  answerList: (msg.answerList || []).filter(
                                    (ele: any) =>
                                      ele.msgId !== payloadData.msgId
                                  ),
                                }
                              : msg
                          ),
                        },
                      });
                    },
                  };

                  reactObj[payloadData.type]?.();

                  break;

                // 删除直播间图文消息
                case '1016':
                  console.log('删除直播间图文消息1016');

                  dispatch({
                    type: 'detail/save',
                    payload: {
                      imgTextList: imgTextList.filter(
                        (msg: any) => msg.msgId !== payloadData.msgId
                      ),
                    },
                  });

                  break;

                // 禁言/取消禁言用户消息
                case '1017':
                  console.log('禁言/取消禁言用户消息1017');

                  if (String(payloadData.memberId) === String(imAccount)) {
                    if (payloadData.type === 1) {
                      message.warning(t('对不起，您已被禁言'));
                      dispatch({
                        type: 'room/save',
                        payload: {
                          userStatus: {
                            ...userStatus,
                            isForbit: 1,
                          },
                        },
                      });
                    } else if (payloadData.type === 2) {
                      message.success(t('您已被解除禁言'));
                      dispatch({
                        type: 'room/save',
                        payload: {
                          userStatus: {
                            ...userStatus,
                            isForbit: 2,
                          },
                        },
                      });
                    }
                  }

                  // 同步成员跟聊天菜单消息状态值
                  handleUpdateMsg(
                    list,
                    [
                      {
                        key: 'isForbit',
                        value: payloadData.type,
                      },
                    ],
                    payloadData.memberId,
                    'senderId',
                    'list'
                  );

                  updateForbitUsers(payloadData.memberId);

                  break;

                // 被踢出房间
                case '1018':
                  console.log('用户被踢出房间消息1018');
                  OFweekLog.info('用户被踢出:', memberList, payloadData);

                  if (String(payloadData.memberId) === String(imAccount)) {
                    (async () => {
                      try {
                        await destroyRoom();
                        Modal.warning({
                          okText: t('确定'),
                          centered: true,
                          content: t('对不起，您被踢出该直播间'),
                          title: t('提示'),
                          onOk: () => {
                            closeWindow();
                          },
                        });
                        setTimeout(() => {
                          closeWindow();
                        }, 3000);
                      } catch (err) {
                        Modal.warning({
                          okText: t('确定'),
                          centered: true,
                          content: t('对不起，您被踢出该直播间'),
                          title: t('提示'),
                          onOk: () => {
                            closeWindow();
                          },
                        });
                        setTimeout(() => {
                          closeWindow();
                        }, 3000);
                      }
                    })();
                  }
                  break;

                // 用户离开房间
                case '1019':
                  console.log('用户离开房间消息1019');
                  OFweekLog.info('用户离开直播间:', memberList, payloadData);

                  const { leaveMemberList } = payloadData;
                  // filter members who leave room
                  dispatch({
                    type: 'chat/save',
                    payload: {
                      memberList: memberList.filter(
                        (member: any) =>
                          !leaveMemberList.some(
                            (ele: any) =>
                              String(member.memberId) === String(ele.memberId)
                          )
                      ),
                    },
                  });

                  break;

                // 进入直播间广播消息
                case '1020':
                  console.log('进入直播间广播消息1020');
                  OFweekLog.info(
                    '用户进入直播间:',
                    memberList,
                    payloadData,
                    roomAliveUsers
                  );

                  const { role, memberId, isEntry } = payloadData;
                  const userInMembers = memberList.some(
                    (member: any) =>
                      Number(member.memberId) === Number(memberId)
                  );

                  // 成员列表加入当前用户
                  !userInMembers &&
                    dispatch({
                      type: 'room/sortMember',
                      payload: {
                        list: [...memberList, payloadData],
                      },
                    });

                  // 同个账号在同个房间只显示一次嘉宾 || 观众进房间通知
                  if (
                    ![2, 3].includes(Number(role)) ||
                    isEntry ||
                    String(memberId) === String(imAccount)
                  ) {
                    return;
                  }

                  dispatch({
                    type: 'chat/save',
                    payload: {
                      list: [...list, payloadData],
                      chatScrollTop: `scroll${new Date().getTime()}:bottom`,
                    },
                  });

                  break;

                // 在线用户变化广播消息
                case '1021':
                  console.log('在线用户变化广播消息1021');
                  OFweekLog.info(
                    '在线用户变化:',
                    memberList,
                    payloadData,
                    roomAliveUsers
                  );

                  const { onlienRoomUserDtoList } = payloadData;

                  // 匹配上麦/禁言id并同步成员列表状态
                  dispatch({
                    type: 'room/sortMember',
                    payload: {
                      list: onlienRoomUserDtoList.map((member: any) => ({
                        ...member,
                        isLive: roomAliveUsers.some(
                          ({ id }: any) =>
                            String(id) === String(member.memberId)
                        ),
                        isForbit: roomForbitUsers.some(
                          (id: any) => String(id) === String(member.memberId)
                        )
                          ? 1
                          : 2,
                      })),
                    },
                  });

                  break;

                // 修改直播间图文消息
                case '1022':
                  console.log('修改直播间图文消息1022');

                  dispatch({
                    type: 'detail/save',
                    payload: {
                      imgTextList: imgTextList.map((imgText: any) =>
                        imgText.msgId === payloadData.msgId
                          ? {
                              ...imgText,
                              ...payloadData,
                            }
                          : imgText
                      ),
                    },
                  });
                  break;

                // 演讲稿翻页 | 开启演讲稿消息
                case '1023':
                  console.log('演讲稿翻页消息1023');
                  OFweekLog.info('演讲稿翻页消息:', payloadData);

                  const { pageNum, speechId, anthorId } = payloadData;

                  // 自己消息不处理
                  if (String(imAccount) === String(anthorId)) {
                    return;
                  }

                  dispatch({
                    type: 'speech/save',
                    payload: {
                      speechPageIndex: pageNum,
                    },
                  });

                  dispatch({
                    type: 'room/save',
                    payload: {
                      roomWatchMode: Math.max(1, roomWatchMode),
                      roomOpenSpeech: false,
                      roomOpenSpeechOther: true,
                    },
                  });

                  const { id } = speechInfo;
                  if (id && String(id) === String(speechId)) {
                    // speech data has been getted
                    return;
                  }

                  dispatch({
                    type: 'speech/getInfo',
                    payload: {
                      params: { speechid: speechId },
                      onError: {
                        operate: () => {
                          message.error(
                            t('暂时获取不到演讲稿信息，请稍后重试')
                          );
                        },
                      },
                    },
                  });

                  break;

                // 结束演讲稿广播
                case '1024':
                  console.log('结束演讲稿广播1024');
                  OFweekLog.info('演讲稿关闭消息:', payloadData);

                  // update watch mode after close speech
                  dispatch({
                    type: 'room/save',
                    payload: {
                      roomWatchMode: 0,
                    },
                  });

                  // ignore self
                  if (String(anthorId) === String(imAccount)) {
                    return;
                  }

                  dispatch({
                    type: 'room/save',
                    payload: {
                      roomOpenSpeechOther: false,
                    },
                  });

                  break;

                // 直播间结束推送
                case '1027':
                  console.log('主动结束直播间消息1027');

                  initRoomState([
                    'roomWatchMode',
                    'roomOpenInsertVideo',
                    'roomOpenInsertVideoOther',
                  ]);

                  dispatch({
                    type: 'room/save',
                    payload: {
                      roomInfo: {
                        ...roomInfo,
                        status: 6,
                      },
                    },
                  });

                  break;

                // 直播间信息后台修改
                case '1028':
                  console.log('直播间信息后台修改消息1028');

                  break;

                // 开播人摄像头采集改变消息
                case '1716':
                  console.log('开播人摄像头采集改变消息1716');
                  OFweekLog.info('开播人摄像头状态变更消息:', payloadData);

                  // change default poster of current live user
                  const { isCameraOpen, senderHeadUrl } = payloadData;
                  dispatch({
                    type: 'video/save',
                    payload: {
                      videoAvatar: senderHeadUrl,
                    },
                  });

                  dispatch({
                    type: 'room/save',
                    payload: {
                      roomOpenCameraOther: isCameraOpen === 1 ? true : false,
                    },
                  });

                  break;

                // 直播间开启插播视频消息
                case '1717':
                  console.log('直播间开启插播视频消息1717');

                  const isSelfInsert =
                    String(payloadData.senderId) === String(imAccount);

                  // 主播上麦自动关闭麦克风
                  if (isSelfInsert && roomIsBegin) {
                    dispatch({
                      type: 'room/save',
                      payload: {
                        roomOpenMic: false,
                      },
                    });
                  }

                  dispatch({
                    type: 'room/save',
                    payload: {
                      roomWatchMode: 2,
                      roomOpenInsertVideo: isSelfInsert,
                      roomOpenInsertVideoOther: !isSelfInsert,
                    },
                  });

                  dispatch({
                    type: 'video/save',
                    payload: {
                      videoInsertInfo: {
                        ...payloadData,
                        key: new Date().getTime(),
                      },
                    },
                  });

                  break;

                // 直播间结束插播视频消息
                case '1718':
                  console.log('直播间结束插播视频消息1718');

                  const isSelf =
                    String(payloadData.senderId) === String(imAccount);
                  const isSpeech = roomOpenSpeech || roomOpenSpeechOther;

                  // back to speech after close insert video
                  dispatch({
                    type: 'room/save',
                    payload: {
                      roomWatchMode: isSpeech ? 1 : 0,
                    },
                  });

                  if (isSelf) {
                    // 主播上麦中结束插播自动恢复麦克风
                    roomIsBegin &&
                      dispatch({
                        type: 'room/save',
                        payload: {
                          roomOpenMic: true,
                        },
                      });
                    dispatch({
                      type: 'room/save',
                      payload: {
                        roomOpenInsertVideo: false,
                      },
                    });
                  } else {
                    dispatch({
                      type: 'room/save',
                      payload: {
                        roomOpenInsertVideoOther: false,
                      },
                    });
                  }
              }
            },
          },
        });
      }
    } catch (e) {}
  }

  /** bind event notice of TRTC-SDK */
  function bindEvent(rtcClient: any) {
    const {
      trtc: { ERROR, WARNING, NETWORK, STATISTICS },
    } = EVENT;
    rtcClient.trtcInstance.on(ERROR, handleError);
    rtcClient.trtcInstance.on(WARNING, handleWarning);
    rtcClient.trtcInstance.on(NETWORK, handleNetwork);
    rtcClient.trtcInstance.on(STATISTICS, handleStatistics);
  }

  /** unbind event of TRTC-SDK */
  function unBindEvent() {
    const {
      trtc: { ERROR, WARNING },
    } = EVENT;
    roomRtcClient.trtcInstance.off(ERROR, handleError);
    roomRtcClient.trtcInstance.off(WARNING, handleWarning);
  }

  /** listen operate code msg message from main process */
  function onRendererCode(event: any, { code, data }: RendererCode) {
    OFweekLog.info('receive code from renderer in room:', code);

    const { CLOSE_PAGE, OPEN_ROOM, CHANGE_SETTING } = RENDERER_CODE;
    const codeAction: any = {
      [CLOSE_PAGE]: async () => {
        try {
          await destroyRoom();
          closeWindow();
        } catch (err) {
          closeWindow();
        }
      },
      [OPEN_ROOM]: async () => {
        await destroyRoom();
      },
      // change setting of user not only language
      [CHANGE_SETTING]: () => {
        data?.value?.language && i18n.changeLanguage(data?.value?.language);
      },
    };
    codeAction[code]?.();
  }

  /** update alive users of members in room */
  function updateAliveUsers(member: LiveMember) {
    dispatch({
      type: 'system/getLatestState',
      payload: {
        params: {
          namespace: ['room', 'chat'],
        },
        callback: ({ room: roomState, chat: chatState }: any) => {
          const { memberList } = chatState;
          let aliveUsers = [...roomState.roomAliveUsers];

          if (
            aliveUsers.some(({ id }: any) => String(id) === String(member.id))
          ) {
            aliveUsers = aliveUsers.filter(
              ({ id }: any) => String(id) !== String(member.id)
            );
          } else {
            aliveUsers = [member];
          }

          // filter alive status of member list by alive users list
          dispatch({
            type: 'chat/save',
            payload: {
              memberList: memberList.map((ele: any) => ({
                ...ele,
                isLive: aliveUsers.some(
                  ({ id }: any) => String(id) === String(ele.memberId)
                ),
              })),
            },
          });

          dispatch({
            type: 'room/save',
            payload: {
              roomAliveUsers: aliveUsers,
            },
          });
        },
      },
    });
  }

  /** update forbit users of members in room */
  function updateForbitUsers(userId: string | number) {
    dispatch({
      type: 'system/getLatestState',
      payload: {
        params: {
          namespace: ['room', 'chat'],
        },
        callback: ({ room: roomState, chat: chatState }: any) => {
          const { memberList } = chatState;
          let forbitUsers = [...roomState.roomForbitUsers];

          if (forbitUsers.some((id: any) => String(id) === String(userId))) {
            forbitUsers = forbitUsers.filter(
              (id: any) => String(id) !== String(userId)
            );
          } else {
            forbitUsers.push(userId);
          }

          // filter forbit status of member list by forbit user list & update forbit user list
          dispatch({
            type: 'chat/save',
            payload: {
              memberList: memberList.map((ele: any) => ({
                ...ele,
                isForbit: forbitUsers.some(
                  (id: any) => String(id) === String(ele.memberId)
                )
                  ? 1
                  : 2,
              })),
            },
          });
          dispatch({
            type: 'room/save',
            payload: {
              roomForbitUsers: forbitUsers,
            },
          });
        },
      },
    });
  }

  /** destroy room if sone alive */
  function destroyRoom() {
    // api leave room
    const exitRoomQueue = () =>
      new Promise((resolve, reject) => {
        dispatch({
          type: 'room/exitRoom',
          payload: {
            params: {
              roomid: roomId,
            },
            onSuccess: {
              offLine: () => resolve(true),
            },
            onError: {
              offLine: () => reject(false),
            },
          },
        });
      });

    // send member leave socket
    const memberLeaveQueue = () =>
      new Promise((resolve, reject) => {
        dispatch({
          type: 'room/leaveRoom',
          payload: {
            params: {
              roomid: roomId,
            },
            onSuccess: {
              operate: () => resolve(true),
            },
            onError: {
              operate: () => reject(false),
            },
          },
        });
      });

    // get newest state from modal because data may not update before event listener happened
    dispatch({
      type: 'system/getLatestState',
      payload: {
        params: {
          namespace: 'room',
          stateKey: 'roomIsBegin',
        },
        callback: (roomIsBegin: boolean) => {
          if (roomIsBegin) {
            // trtc leave room & api leave room if yourSelf is alive
            roomRtcClient.exitRoom();
            return Promise.all([exitRoomQueue(), memberLeaveQueue()]);
          } else {
            // only send member leave socket if not
            return memberLeaveQueue();
          }
        },
      },
    });
  }

  /** init state in room witch is must */
  function initRoomState(filterKeys: Array<string>) {
    const payloadState: any = {
      roomWatchMode: 0,
      roomAliveUsers: [],
      roomIsBegin: false,
      roomIsBeginOther: false,
      roomOpenCamera: false,
      roomOpenCameraOther: false,
      roomOpenSpeech: false,
      roomOpenSpeechOther: false,
      roomOpenMic: false,
      roomOpenMicOther: false,
      roomOpenInsertVideo: false,
      roomOpenInsertVideoOther: false,
    };

    // filter some state witch not must to init
    filterKeys.forEach((key: string) => {
      delete payloadState[key];
    });

    dispatch({
      type: 'room/save',
      payload: payloadState,
    });
  }

  const isAnchor = userStatus.role === 1;
  return roomRtcClient ? (
    isAnchor ? (
      <AnchorRoom {...props} rtcClient={roomRtcClient} />
    ) : (
      <GuestRoom {...props} rtcClient={roomRtcClient} />
    )
  ) : null;
}
export default withRouter(
  connect(({ room, auth, chat, detail, video, speech, system }: any) => ({
    system: system.toJS(),
    room: room.toJS(),
    auth: auth.toJS(),
    detail: detail.toJS(),
    video: video.toJS(),
    speech: speech.toJS(),
    chat: chat.toJS(),
  }))(RoomInfo)
);
