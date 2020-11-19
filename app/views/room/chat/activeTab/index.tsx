/**
 * @desc 直播间互动区
 */
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { connect } from 'dva';
import { Popover, Modal, message } from 'antd'
import { withRouter } from 'dva/router';
// @ts-ignore
import Editor from '@/components/editor'
// @ts-ignore
import { scrollElement, tottle, rqaToGetElePos } from '@/utils/tool'
// @ts-ignore
import { FACE_URL } from '@/constants'

type PropsType = {
    room: any,
    chat: any,
    match: any,
    dispatch(action: any): void
}

function ActiveInfo(props: PropsType) {
    const [msgId, setMsgId] = useState('')
    const [dataLoading, setDataLoading] = useState(true)
    const scrollRef: any = useRef(null)
    const { chat: { list: chatList, hasMore: dataHasMore, chatScrollTop, inputValue }, dispatch, match: { params: { id: roomId } }, room: { userStatus } } = props
    const faceRegExp = /\[[a-zA-Z0-9\/\u4e00-\u9fa5]+\]/g

    useLayoutEffect(() => {
        dispatch({
            type: 'chat/getChatList',
            payload: {
                params: {
                    roomId,
                    msgId,
                    size: 50
                },
                isInit: true,
                onSuccess: {
                    search: () => setDataLoading(false)
                }
            }
        })
    }, [])

    useEffect(() => {
        // 实时更新最后一条消息id
        chatList[0] && setMsgId(chatList[0].msgId)
    }, [chatList])

    // 条件性触发聊天窗口滚动
    useEffect(() => {
        scrollElement(scrollRef.current, chatScrollTop.split(':')[1])
    }, [chatScrollTop])

    function faceToHtml(content: any) {
        return content
        // return content.replace(faceRegExp, (word: any) => <img src={`${FACE_URL}${word}@2x.png`} />)
    }

    // 滚动跟随屏幕帧率刷新
    function animateToScroll() {
        const scrollTop = scrollRef.current.scrollTop
        if (scrollTop <= 0) {
            handleScrollTop()
        }
    }

    // handle scroll top of chat area
    function handleScrollTop() {
        if (dataLoading || !dataHasMore) {
            return
        }
        setDataLoading(true)
        dispatch({
            type: 'chat/getChatList',
            payload: {
                params: {
                    roomId,
                    msgId,
                    size: 50
                },
                onSuccess: {
                    search: async () => {
                        const scrollDom = document.getElementById(`msg-${msgId}`)
                        setDataLoading(false)
                        // dom元素位置更新后滚动至追加数据前第一条消息位置
                        rqaToGetElePos(scrollDom, ({ offsetTop }: any) => {
                            dispatch({
                                type: 'chat/save',
                                payload: {
                                    chatScrollTop: `scroll${new Date().getTime()}:${offsetTop}`
                                }
                            })
                        })
                    }
                }
            }
        })
    }

    // handle filter right menu of msg
    function handleFilterMenu(msg: any) {
        const { role } = userStatus
        const { role: msgRole } = msg
        let menus = [{
            label: '删除聊天',
            value: 'delete',
        },
        {
            label: '回复聊天',
            value: 'reply',
        },
        {
            label: '禁言用户',
            value: 'forbit',
        },
        {
            label: '取消禁言',
            value: 'cancelForbit',
        },
        {
            label: '踢出用户',
            value: 'kick',
        }]

        // 消息禁言状态过滤禁言 || 非禁言菜单
        menus = menus.filter((menu: any) => msg.isForbit === 1 ? menu.value !== 'forbit' : menu.value !== 'cancelForbit')

        // 身份筛选消息菜单
        let menuMap: any = {
            // 主播
            1: msgRole === 1 ? menus.filter(item => item.value === 'delete') : menus,
            // 嘉宾
            2: msgRole === 2 ? menus.filter(item => item.value === 'delete') : menus.filter(item => item.value === 'reply')
        }

        return <ul>
            {
                menuMap[role] && menuMap[role].map((menu: any) => <li className="msg-menu-item" key={menu.value} onClick={() => handleMsgClick({ ...menu, ...msg })}>
                    {menu.label}
                </li>)
            }
        </ul>
    }

    // handle click menu of msg
    function handleMsgClick({ value, nick, msgId, roomId, senderId }: any) {
        const reactObj: any = {
            // 删除聊天
            'delete': () => {
                Modal.confirm({
                    centered: true,
                    content: '确认删除聊天信息？',
                    title: '提示',
                    onOk: () => {
                        dispatch({
                            type: 'chat/deleteMsg',
                            payload: {
                                params: {
                                    msgId,
                                    roomId
                                },
                                onSuccess: {
                                    operate: true
                                }
                            }
                        })
                    }
                })
            },

            // 回复聊天
            'reply': () => {
                dispatch({
                    type: 'chat/save',
                    payload: {
                        inputValue: `${inputValue}@${nick}`
                    }
                })
            },

            // 禁言用户
            'forbit': () => {
                dispatch({
                    type: 'chat/forbitChat',
                    payload: {
                        params: {
                            memberId: senderId,
                            roomId,
                            type: 1
                        },
                        onSuccess: {
                            operate: () => {
                                message.success('已禁言')
                                handleUpdateMsg([{
                                    key: 'isForbit',
                                    value: 1
                                }], senderId)
                            }
                        }
                    }
                })
            },

            // 取消禁言用户
            'cancelForbit': () => {
                dispatch({
                    type: 'chat/forbitChat',
                    payload: {
                        params: {
                            memberId: senderId,
                            roomId,
                            type: 2
                        },
                        onSuccess: {
                            operate: () => {
                                message.success('已取消禁言')
                                handleUpdateMsg([{
                                    key: 'isForbit',
                                    value: 2
                                }], senderId)
                            }
                        }
                    }
                })
            },
            // 踢用户出房间
            'kick': () => {
                Modal.confirm({
                    centered: true,
                    content: `确定把${nick}踢出房间`,
                    title: '提示',
                    onOk: () => {
                        dispatch({
                            type: 'chat/kickOutUser',
                            payload: {
                                params: {
                                    memberId: senderId,
                                    msgId,
                                    roomId
                                },
                                onSuccess: {
                                    operate: true
                                }
                            }
                        })
                    }
                })

            },
        }
        reactObj[value] && reactObj[value]()
    }

    /**
     * @desc 键值对更改同个发送者所有消息状态 
     * @param {Array<Object<key:value>>} attrs 更改的属性集合
     * @param {String} senderId 单条消息体
     */
    function handleUpdateMsg(attrs: Array<any>, senderId: any) {
        dispatch({
            type: 'chat/save',
            payload: {
                list: chatList.map((msg: any) => {
                    const matchMsg = String(msg.senderId) === String(senderId)
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


    return <div className="tab-container interactive">
        <div className={`chat-panel${!chatList.length ? ' empty flex-center' : ''}`} onScroll={() => tottle(animateToScroll)} ref={scrollRef}>
            {chatList.length ? <>
                {
                    dataLoading || dataHasMore ? null : <div className="wrap-item no-more">加载完毕~~</div>
                }
                {
                    chatList.map((msg: any, index: number) =>
                        <div className="wrap-item" key={index} id={`msg-${msg.msgId}`}>
                            <Popover content={handleFilterMenu(msg)}>
                                <label className={msg.role === 1 || msg.role === 2 ? 'role' : ''}>
                                    {msg.nick}{msg.role === 1 || msg.role === 2 ? `  [${msg.identity}]` : null}
                                </label>
                            </Popover>
                            <p>
                                {faceToHtml(msg.content)}
                            </p>
                        </div>)
                }
            </>
                :
                <h3>暂时无人发言，快来抢占沙发~</h3>
            }
        </div>
        {
            dataLoading && <div className="chat-loading">{'加载中...'}</div>
        }
        <Editor />
    </div>
}
export default withRouter(connect(({ room, chat }: any) => ({
    room: room.toJS(),
    chat: chat.toJS(),
}))(ActiveInfo))
