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
  const { dispatch, auth: { userInfo: { userSig, imAccount } }, match: { params: { id: roomId } }, chat: { list: chatList } } = props

  useEffect(() => {
    // handleKickedOut()
    if (!rtcClient) {
      rtcClient = new TrtcElectronVideocast({
        sdkAppId: SDK_APP_ID,
        userID: imAccount,
        userSig
      })
      bindEvent(rtcClient)
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
  }, [chatList])

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

  function handleMsgReceive({ data: messageData }: MsgReceiveType) {
    try {
      for (let i = 0, len = messageData.length; i < len; i++) {
        const msg = messageData[i]
        const payloadData = JSON.parse(msg.payload.data)

        if (String(payloadData.roomId) !== String(roomId)) {
          return
        }
        switch (String(payloadData.msgCode)) {
          // 接收到群推送消息
          case "1000":
            console.log('群推送消息1000')
            // 自己推送的消息不做处理
            if (String(payloadData.senderId) === String(imAccount)) {
              return
            }
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
