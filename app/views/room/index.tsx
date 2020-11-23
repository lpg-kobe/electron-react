import React, { useEffect } from 'react';
import { connect } from 'dva';
import { withRouter } from 'dva/router';
// @ts-ignore
import CommonHeader from '@/components/layout/header';
// @ts-ignore
import CommonFooter from '@/components/layout/footer';
import VideoInfo from './video'
import ChatInfo from './chat'
// @ts-ignore
import MenuInfo from './menu'
import ThumbInfo from './thumb'
// @ts-ignore
import TrtcElectronVideocast from '@/sdk/trtc-electron-videocast'
// @ts-ignore
import { SDK_APP_ID } from '@/constants'
// @ts-ignore
import { MAIN_EVENT, rendererSend, closeWindow } from '@/utils/ipc'
import { message, Modal } from 'antd'
import './style.less';


type PropsType = {
  dispatch(action: any): void,
  auth: any,
  room: any,
  chat: any,
  match: any
}

type MsgReceiveType = {
  eventCode: string // 订阅事件名称,
  data: Array<any> // 接收到的消息推送数组
}

let rtcClient: any = null

function RoomInfo(props: PropsType) {
  const { dispatch, auth: { userInfo: { userSig, imAccount } }, match: { params: { id: roomId } }, chat: { list: chatList, qaaList, memberList } } = props

  useEffect(() => {
    // handleKickedOut()
    if (!rtcClient) {
      rtcClient = new TrtcElectronVideocast({
        sdkAppId: SDK_APP_ID,
        userID: imAccount,
        userSig
      })
      bindEvent(rtcClient)
      // @todo 是否需要在sdk初始化之后通过sendCustomCmdMsg发送一条广播通知?
      // sendCustomCmdMsg < msgId:number, msgData:string, reliable, ordered >
      // const EVENT = rtcClient.EVENT;
      // rtcClient.on(EVENT.SDK_READY, () => {
      //   const { trtcInstance: { sendCustomCmdMsg } } = rtcClient
      //   sendCustomCmdMsg(Math.ceil(Math.random() * 10), JSON.stringify({
      //     msgCode: 1024,
      //     payload: {
      //       imAccount,
      //       contain: '进入直播间'
      //     }
      //   }), false, false)
      // })
    }
    return () => {
      rtcClient.tim.logout()
      rtcClient.trtcInstance.destroy()
      rtcClient = null
      unBindEvent()
    }
  }, [])

  useEffect(() => {
    // 事件綁定必須發生在數據更新之後，否則會產生綁定事件響應時拿到的數據不是最新的
    const EVENT = rtcClient.EVENT;
    // 绑定之前解除多余绑定
    rtcClient.off(EVENT.MESSAGE_RECEIVED, handleMsgReceive)
    rtcClient.on(EVENT.MESSAGE_RECEIVED, handleMsgReceive)
    return () => {
      rtcClient.off(EVENT.MESSAGE_RECEIVED, handleMsgReceive)
    }
  }, [chatList, qaaList])

  function handleError(event: { data: { errmsg: string; errcode: number; } }) {
    message.error(event.data.errmsg + event.data.errcode);
  }

  function handleWarning(event: { data: { errmsg: string; errcode: string; } }) {
    message.warning(event.data.errmsg + event.data.errcode)
  }

  function handleKickedOut() {
    Modal.confirm({
      centered: true,
      content: '您的账号在其它设备登录，您已下线',
      title: '提示',
      onOk: () => rendererSend(MAIN_EVENT.MAIN_CLOSE_TOLOG)
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

  function handleMsgReceive({ data: messageData }: MsgReceiveType) {
    try {
      for (let i = 0, len = messageData.length; i < len; i++) {
        const msg = messageData[i]
        const payloadData = JSON.parse(msg.payload.data)

        if (String(payloadData.roomId) !== String(roomId)) {
          return
        }
        switch (String(payloadData.msgCode)) {
          // 接收到群推送聊天消息
          case "1000":
            console.log('群推送消息1000')
            dispatch({
              type: 'chat/save',
              payload: {
                list: [...chatList, payloadData],
                chatScrollTop: `scroll${new Date().getTime()}:bottom`
              }
            })
            break

          // 审核通过互动聊天消息
          case "1010":
            console.log('审核通过互动聊天消息1010')
            dispatch({
              type: 'chat/save',
              payload: {
                list: [...chatList, payloadData],
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
                list: chatList.filter((msg: any) => msg.msgId !== payloadData.msgId)
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

          // 禁言/取消禁言用户消息
          case "1017":
            console.log('禁言/取消禁言用户消息1017')
            if (String(payloadData.memberId) === String(imAccount)) {
              if (payloadData.type === 1) {
                message.warning('对不起，您已被禁言')
                dispatch({
                  type: 'chat/save',
                  payload: {
                    inputDisabled: true
                  }
                })
              } else if (payloadData.type === 2) {
                message.success('您已被解除禁言')
                dispatch({
                  type: 'chat/save',
                  payload: {
                    inputDisabled: false
                  }
                })
              }
            }
            // 同步列表消息状态值
            handleUpdateMsg(chatList, [{
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
              Modal.warning({
                centered: true,
                content: '对不起，您被踢出该直播间',
                title: '提示',
                onOk: () => {
                  closeWindow()
                }
              })
            }
            break

          // 进入直播间广播消息
          case "1020":
            // console.log('进入直播间广播消息1020')
            break

          // 在线用户变化广播消息
          case "1021":
            // console.log('在线用户变化广播消息1021')
            break
        }
      }
    } catch (e) { }
  }

  function bindEvent(rtcClient: any) {
    const EVENT = rtcClient.EVENT;
    rtcClient.on(EVENT.ERROR, handleError)
    rtcClient.on(EVENT.WARNING, handleWarning)
    // rtcClient.on(EVENT.MESSAGE_RECEIVED, handleMsgReceive)
    rtcClient.on(EVENT.KICKED_OUT, handleKickedOut)
  }

  function unBindEvent() {
    const EVENT = rtcClient.EVENT;
    rtcClient.off(EVENT.ERROR, handleError)
    // rtcClient.off(EVENT.MESSAGE_RECEIVED, handleMsgReceive)
    rtcClient.off(EVENT.WARNING, handleWarning)
    rtcClient.off(EVENT.KICKED_OUT, handleKickedOut)
  }

  return <>
    <div className="flex room-page-container">
      <CommonHeader className="room-page-header" />
      <main>
        <section className="section-wrap-l"></section>
        <section className="section-wrap-m">
          <VideoInfo />
          <MenuInfo />
        </section>
        <section className="section-wrap-r">
          <ThumbInfo />
          <ChatInfo />
        </section>
      </main>
      <CommonFooter />
    </div>
  </>
}
export default withRouter(connect(({ room, auth, chat }: any) => ({
  room: room.toJS(),
  auth: auth.toJS(),
  chat: chat.toJS()
}))(RoomInfo));
