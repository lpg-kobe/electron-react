import React, { useEffect } from 'react';
import { connect } from 'dva';
import { withRouter } from 'dva/router';
import { message, Modal } from 'antd'

// @ts-ignore
import { SDK_APP_ID } from '@/constants'

import TrtcElectronVideocast, { EVENT } from '../../sdk/trtc-electron-videocast'
import AnchorRoom from './components/anchorRoom'
import GuestRoom from './components/guestRoom'
import { closeWindow, rendererListen, rendererOffListen, RENDERER_EVENT, RENDERER_CODE } from '../../utils/ipc'
import { loopToInterval, setStore, getStore } from '../../utils/tool'
import { MsgReceiveType, RendererCode } from '../../utils/type'

import './style.less';

type PropsType = {
  dispatch(action: any): void,
  auth: any,
  room: any,
  chat: any,
  detail: any,
  system: any,
  video: any,
  match: any
}

// room trtc instance,widthout setted imLogin
let roomRtcClient: any = null

function RoomInfo(props: PropsType) {
  const {
    dispatch,
    system: { rtcClient: sysRtcClient },
    auth: { userInfo: { userSig, imAccount } },
    match: { params: { id: roomId } },
    room: { roomInfo, userStatus }
  } = props

  useEffect(() => {
    // 进直播间就发送心跳 
    let timer: any = null
    timer = loopToInterval(sendHeartBeat, timer)

    if (!roomRtcClient) {
      // 直播间trtc无需登录im，该trtc只处理房间trtc直播相关逻辑。im-sdk相关事件监听由已登录im的system-modal的trtc处理
      roomRtcClient = new TrtcElectronVideocast({
        sdkAppId: SDK_APP_ID,
        userId: imAccount,
        imLogin: false,
        userSig
      })
      bindEvent(roomRtcClient)
    }

    return () => {
      unBindEvent()
      roomRtcClient = null
    }
  }, [])

  useEffect(() => {
    // register operate code msg from main process
    // @ts-ignore
    rendererListen(RENDERER_EVENT.RENDERER_SEND_CODE, onRendererCode)
    return () => {
      // @ts-ignore
      rendererOffListen(RENDERER_EVENT.RENDERER_SEND_CODE, onRendererCode)
    };
  }, []);

  useEffect(() => {
    // init system trtc after get roomInfo.groupIdString when handleSdkReady happened
    if (!roomInfo.groupIdString || sysRtcClient) {
      return
    }
    dispatch({
      type: 'system/initRtcClient',
      payload: {
        eventHandlers: {
          [EVENT.tim.SDK_READY]: handleSdkReady,
          [EVENT.tim.MESSAGE_RECEIVED]: handleMsgReceive
        }
      }
    })
  }, [roomInfo.groupIdString])

  useEffect(() => {
    // 房间结束拉取回顾视频
    if (roomInfo.status && roomInfo.status === 6) {
      dispatch({
        type: 'video/getReviewVideos',
        payload: {
          params: {
            roomid: roomId
          }
        }
      })
    }
    return () => { };
  }, [roomInfo.status]);

  /** IM-SDK 加载完毕 */
  function handleSdkReady({ data: systemRtc }: any) {
    const { groupIdString } = roomInfo
    // get state from modal because data may not be the newest when sdk event happened
    dispatch({
      type: 'system/getLatestState',
      payload: {
        params: {
          namespace: ['room', 'chat']
        },
        callback: ({ room: roomState, chat: chatState }: any) => {
          const { userStatus: { isForbit, identity, role, nick } } = roomState
          const { list } = chatState
          // 发送进入房间广播
          const customMsgData = {
            msgCode: 1020,
            memberId: imAccount,
            identity,
            isForbit,
            role,
            nick,
            msgId: Math.random().toString(36).substring(6),
            roomId
          }
          const { tim: { createCustomMessage, sendMessage }, TIM: { TYPES } } = systemRtc
          const msg = createCustomMessage({
            to: groupIdString,
            conversationType: TYPES.CONV_GROUP,
            payload: {
              data: JSON.stringify(customMsgData)
            }
          })

          sendMessage(msg, {
            onlineUserOnly: true
          }).then(() => {
            // 只在本地显示嘉宾 || 观众进入房间消息，且每个账号每个直播间只推送一次
            const enterRoom = getStore('enterRoom')

            if ((![2, 3].includes(+role)) || (enterRoom && enterRoom[imAccount] && enterRoom[imAccount][roomId])) {
              return
            }

            setStore('enterRoom', {
              ...enterRoom,
              [imAccount]: {
                ...(enterRoom || {})[imAccount],
                [roomId]: {}
              }
            })
            dispatch({
              type: 'chat/save',
              payload: {
                list: [...list, customMsgData]
              }
            })
          })

        }
      }
    })
  }

  /** handle error of TRTC-SDK */
  function handleError(errcode: number, errmsg: string) {
    message.error(errmsg + errcode);
  }

  /** handle warning of TRTC-SDK  */
  function handleWarning(warningCode: number, warningMsg: string) {
    message.warning(warningMsg + warningCode)
  }

  /** 发送房间心跳保持连接,用于房间内维持成员列表在线状态，出现异常统一认为登录被挤下线，通过fetch拦截弹窗告知用户并提前销毁房间 */
  function sendHeartBeat() {
    return new Promise((resolve, reject) => {
      dispatch({
        type: 'system/sendHeartBeat',
        payload: {
          params: {
            memberId: imAccount,
            roomId,
            time: new Date()
          },
          onSuccess: {
            operate: () => {
              resolve(true)
            }
          },
          onError: {
            operate: async () => {
              try {
                await destroyRoom()
                reject(false)
              } catch (err) {
                reject(false)
              }
            }
          }
        }
      })
    })
  }

  /**
   * @desc 键值对更改同个发送者所有消息状态 
   * @param {Array} filterList 过滤的数组 
   * @param {Array<Object<key:value>>} attrs 更改的属性集合
   * @param {String} id 比对id
   * @param {String} judgeKey 比对的键值
   * @param {String} updateKey 要更新state的key值
   */
  function handleUpdateMsg(filterList: Array<any>, attrs: Array<any>, id: any, judgeKey: string, updateKey: string) {
    dispatch({
      type: 'chat/save',
      payload: {
        [updateKey]: filterList.map((msg: any) => {
          const matchMsg = String(msg[judgeKey]) === String(id)
          if (matchMsg) {
            let updateObj: any = {}
            attrs.forEach(({ key, value }: any) => {
              updateObj[key] = value
            })
            return {
              ...msg,
              ...updateObj
            }
          } else {
            return msg
          }
        })
      }
    })
  }

  /** 房间所有socket推送消息，视频上下麦相关推送消息在主播||嘉宾房间单独处理 */
  function handleMsgReceive({ data: messageData }: MsgReceiveType) {
    try {
      for (let i = 0, len = messageData.length; i < len; i++) {
        const msg = messageData[i]
        const payloadData = JSON.parse(msg.payload.data)

        if (String(payloadData.roomId) !== String(roomId)) {
          return
        }

        // need to get latest state from modal because data may not be the newest when event listener happended
        dispatch({
          type: 'system/getLatestState',
          payload: {
            params: {
              namespace: ['room', 'chat', 'detail']
            },
            callback: ({ room: roomState, chat: chatState, detail: detailState }: any) => {

              const { userStatus, roomInfo } = roomState
              const { list, qaaList, memberList } = chatState
              const { imgTextList } = detailState

              switch (String(payloadData.msgCode)) {
                // 接收到群推送聊天消息
                case "1000":
                  console.log('群推送消息1000')

                  dispatch({
                    type: 'chat/save',
                    payload: {
                      list: [...list, payloadData],
                      chatScrollTop: `scroll${new Date().getTime()}:bottom`
                    }
                  })

                  break

                // 新增一条图文消息
                case "1001":
                  console.log('群推送图文消息1001')

                  dispatch({
                    type: 'detail/save',
                    payload: {
                      imgTextList: [payloadData, ...imgTextList]
                    }
                  })

                  break

                // 审核通过互动聊天消息
                case "1010":
                  console.log('审核通过互动聊天消息1010')

                  dispatch({
                    type: 'chat/save',
                    payload: {
                      list: [...list, payloadData],
                      chatScrollTop: `scroll${new Date().getTime()}:bottom`
                    }
                  })

                  break

                // 审核不通过互动聊天消息
                case "1011":
                  console.log('审核不通过互动聊天消息1011')
                  break

                // 接收到群推送问答消息 
                case "1002":
                  console.log('接收到群推送问答消息1002')

                  const actionObj: any = {
                    // 新增一条问题
                    1: () => {
                      dispatch({
                        type: 'chat/save',
                        payload: {
                          qaaList: [...qaaList, payloadData],
                          qaaScrollTop: `scroll${new Date().getTime()}:bottom`
                        }
                      })
                    },

                    // 新增一条回答
                    2: () => {
                      dispatch({
                        type: 'chat/save',
                        payload: {
                          // 找到questionId的子集并添加数据
                          qaaList: qaaList.map((msg: any) => msg.msgId === payloadData.questionId ? {
                            ...msg,
                            answerList: [...(msg.answerList || []), payloadData]
                          } : msg),
                          qaaScrollTop: `scroll${new Date().getTime()}:bottom`
                        }
                      })
                    }
                  }

                  actionObj[payloadData.type] && actionObj[payloadData.type]()

                  break

                // 广播更新了直播间回答消息
                case "1003":
                  console.log('广播更新了直播间回答消息1003')

                  dispatch({
                    type: 'chat/save',
                    payload: {
                      qaaList: qaaList.map((msg: any) => msg.msgId === payloadData.questionId ? {
                        ...msg,
                        answerList: (msg.answerList || []).map((answer: any) => answer.msgId === payloadData.msgId ? {
                          ...answer,
                          content: payloadData.content
                        } : answer)
                      } : msg)
                    }
                  })

                  break

                // 审核通过直播间问答消息
                case "1012":
                  console.log('审核通过问答消息1012')

                  dispatch({
                    type: 'chat/save',
                    payload: {
                      qaaList: [...qaaList, payloadData],
                      qaaScrollTop: `scroll${new Date().getTime()}:bottom`
                    }
                  })

                  break

                // 删除群互动消息
                case "1014":
                  console.log('删除群互动消息1014')

                  dispatch({
                    type: 'chat/save',
                    payload: {
                      list: list.filter((msg: any) => msg.msgId !== payloadData.msgId)
                    }
                  })

                  break

                // 删除直播间问答消息 
                case "1015":
                  console.log('删除直播间问答消息1015')

                  const reactObj: any = {
                    // 删除问题
                    1: () => {
                      dispatch({
                        type: 'chat/save',
                        payload: {
                          qaaList: qaaList.filter((msg: any) => msg.msgId !== payloadData.msgId)
                        }
                      })
                    },

                    // 删除回答
                    2: () => {
                      dispatch({
                        type: 'chat/save',
                        payload: {
                          // 找到questionId的消息并将其子集过滤
                          qaaList: qaaList.map((msg: any) => msg.msgId === payloadData.questionId ? {
                            ...msg,
                            answerList: (msg.answerList || []).filter((ele: any) => ele.msgId !== payloadData.msgId)
                          } : msg)
                        }
                      })
                    }
                  }

                  reactObj[payloadData.type] && reactObj[payloadData.type]()

                  break

                // 删除直播间图文消息 
                case "1016":
                  console.log('删除直播间图文消息1016')

                  dispatch({
                    type: 'detail/save',
                    payload: {
                      imgTextList: imgTextList.filter((msg: any) => msg.msgId !== payloadData.msgId)
                    }
                  })

                  break

                // 禁言/取消禁言用户消息
                case "1017":
                  console.log('禁言/取消禁言用户消息1017')

                  if (String(payloadData.memberId) === String(imAccount)) {
                    if (payloadData.type === 1) {
                      message.warning('对不起，您已被禁言')
                      dispatch({
                        type: 'room/save',
                        payload: {
                          userStatus: {
                            ...userStatus,
                            isForbit: 1
                          }
                        }
                      })
                    } else if (payloadData.type === 2) {
                      message.success('您已被解除禁言')
                      dispatch({
                        type: 'room/save',
                        payload: {
                          userStatus: {
                            ...userStatus,
                            isForbit: 2
                          }
                        }
                      })
                    }
                  }

                  // 同步成员跟聊天菜单消息状态值
                  handleUpdateMsg(list, [{
                    key: 'isForbit',
                    value: payloadData.type
                  }], payloadData.memberId, 'senderId', 'list')
                  handleUpdateMsg(memberList, [{
                    key: 'isForbit',
                    value: payloadData.type
                  }], payloadData.memberId, 'memberId', 'memberList')

                  break

                // 被踢出房间
                case "1018":
                  if (String(payloadData.memberId) === String(imAccount)) {
                    (async () => {
                      try {
                        await destroyRoom()
                        Modal.warning({
                          centered: true,
                          content: '对不起，您被踢出该直播间',
                          title: '提示',
                          onOk: () => {
                            closeWindow()
                          }
                        })
                      } catch (error) {
                        Modal.warning({
                          centered: true,
                          content: '对不起，您被踢出该直播间',
                          title: '提示',
                          onOk: () => {
                            closeWindow()
                          }
                        })
                      }
                    })()
                  }
                  break

                // 用户离开房间 
                case "1019":
                  console.log('用户离开房间消息1019')

                  // 在成员列表筛选退出用户
                  const { leaveMemberList } = payloadData
                  dispatch({
                    type: 'chat/save',
                    payload: {
                      memberList: memberList.filter((member: any) => leaveMemberList.some((user: any) => String(user.memberId) !== String(member.memberId)))
                    }
                  })
                  break

                // 进入直播间广播消息
                case "1020":
                  console.log('进入直播间广播消息1020')

                  const { role, memberId } = payloadData
                  const userInMembers = memberList.some((member: any) => +member.memberId === +memberId)
                  !userInMembers && dispatch({
                    type: 'room/sortMember',
                    payload: {
                      list: [...memberList, payloadData]
                    }
                  })

                  // 同个账号在同个房间只显示一次嘉宾 || 观众进房间通知
                  const enterRoom = getStore('enterRoom')

                  if ((![2, 3].includes(+role)) || (enterRoom && enterRoom[memberId] && enterRoom[memberId][roomId])) {
                    return
                  }

                  setStore('enterRoom', {
                    ...enterRoom,
                    [memberId]: {
                      ...(enterRoom || {}).memberId,
                      [roomId]: {}
                    }
                  })
                  dispatch({
                    type: 'chat/save',
                    payload: {
                      list: [...list, payloadData],
                      chatScrollTop: `scroll${new Date().getTime()}:bottom`
                    }
                  })
                  break

                // 在线用户变化广播消息
                case "1021":
                  // console.log('在线用户变化广播消息1021')
                  break

                // 修改直播间图文消息 
                case "1022":
                  console.log('修改直播间图文消息1022')

                  dispatch({
                    type: 'detail/save',
                    payload: {
                      imgTextList: imgTextList.map((imgText: any) => (
                        imgText.msgId === payloadData.msgId ? {
                          ...imgText,
                          ...payloadData
                        } : imgText
                      ))
                    }
                  })
                  break

                // 直播间结束推送
                case "1027":
                  console.log('主动结束直播间消息1027');

                  dispatch({
                    type: 'room/save',
                    payload: {
                      roomIsBegin: false,
                      roomIsBeginOther: false,
                      roomOpenSpeech: false,
                      roomOpenSpeechOther: false,
                      roomInfo: {
                        ...roomInfo,
                        status: 6
                      }
                    }
                  })

                  break;

                // 直播间信息后台修改
                case "1028":
                  console.log('直播间信息后台修改消息1028');

                  break;
              }
            }
          }
        })
      }
    } catch (e) { }
  }

  /** bind event notice of TRTC-SDK */
  function bindEvent(rtcClient: any) {
    const { trtc: { ERROR, WARNING } } = EVENT
    rtcClient.trtcInstance.on(ERROR, handleError)
    rtcClient.trtcInstance.on(WARNING, handleWarning)
  }

  /** unbind event of TRTC-SDK */
  function unBindEvent() {
    const { trtc: { ERROR, WARNING } } = EVENT
    roomRtcClient.trtcInstance.off(ERROR, handleError)
    roomRtcClient.trtcInstance.off(WARNING, handleWarning)
  }

  /** listen operate code msg message from main process */
  function onRendererCode(event: any, { code }: RendererCode) {
    const { CLOSE_PAGE, OPEN_ROOM } = RENDERER_CODE
    const codeAction: any = {
      [CLOSE_PAGE]: async () => {
        try {
          await destroyRoom()
          closeWindow()
        } catch (err) {
          closeWindow()
        }
      },
      [OPEN_ROOM]: async () => {
        await destroyRoom()
      }
    }
    codeAction[code] && codeAction[code]()
  }

  /** destroy room if sone alive */
  function destroyRoom() {
    // api leave room
    const exitRoomQueue = () => new Promise((resolve, reject) => {
      dispatch({
        type: 'room/exitRoom',
        payload: {
          params: {
            roomid: roomId
          },
          onSuccess: {
            offLine: () => resolve(true)
          },
          onError: {
            offLine: () => reject(false)
          }
        }
      })
    })

    // send member leave socket 
    const memberLeaveQueue = () => new Promise((resolve, reject) => {
      dispatch({
        type: 'room/leaveRoom',
        payload: {
          params: {
            roomid: roomId
          },
          onSuccess: {
            operate: () => resolve(true)
          },
          onError: {
            operate: () => reject(false)
          }
        }
      })
    })

    // get newest state from modal because data may not update before event listener happened
    dispatch({
      type: 'system/getLatestState',
      payload: {
        params: {
          namespace: 'room',
          stateKey: 'roomIsBegin'
        },
        callback: (roomIsBegin: boolean) => {
          if (roomIsBegin) {
            // trtc leave room & api leave room if yourSelf is alive
            roomRtcClient.exitRoom()
            return Promise.all([exitRoomQueue(), memberLeaveQueue()])
          } else {
            // only send member leave socket if not
            return memberLeaveQueue()
          }
        }
      }
    })
  }

  const isAnchor = userStatus.role === 1
  return userStatus.role ?
    isAnchor ? <AnchorRoom {...props} rtcClient={roomRtcClient} /> : <GuestRoom {...props} rtcClient={roomRtcClient} />
    : null
}
export default withRouter(connect(({ room, auth, chat, detail, video, speech, system }: any) => ({
  system: system.toJS(),
  room: room.toJS(),
  auth: auth.toJS(),
  detail: detail.toJS(),
  video: video.toJS(),
  speech: speech.toJS(),
  chat: chat.toJS()
}))(RoomInfo));
