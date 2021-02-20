/**
 * @desc 直播间互动区
 */
import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'dva';
import { Popover, Modal } from 'antd'
import { withRouter } from 'dva/router';
import Editor from '../../../../components/editor'
import BreakWord from '../../../../components/breakWord'
import { scrollElement, tottle, nextTick, filterBreakWord, formatInput } from '../../../../utils/tool'
// @ts-ignore
import { FACE_URL } from '@/constants'

type PropsType = {
    room: any,
    chat: any,
    match: any,
    dispatch(action: any): void
}

function ActiveInfo(props: PropsType) {
    const {
        chat: { list: chatList, chatLoading, hasMore: dataHasMore, chatScrollTop },
        dispatch,
        match: { params: { id: roomId } },
        room: { userStatus }
    } = props
    const faceRegExp = /\[[a-zA-Z0-9\/\u4e00-\u9fa5]+\]/g
    const userIsForbit = userStatus.isForbit === 1

    const [editorRef, setEditorRef]: any = useState(null)
    const scrollRef: any = useRef(null)

    useEffect(() => {
        // init data and scroll to bottom
        dispatch({
            type: 'chat/getChatList',
            payload: {
                params: {
                    roomId,
                    msgId: chatList[0] && chatList[0].msgId,
                    size: 50
                },
                onSuccess: {
                    search: () => {
                        window.requestAnimationFrame(() => {
                            dispatch({
                                type: 'chat/save',
                                payload: {
                                    chatScrollTop: 'scroll:bottom'
                                }
                            })
                        })
                    }
                }
            }
        })
    }, [])

    // 条件性触发聊天窗口滚动
    useEffect(() => {
        scrollElement(scrollRef.current, chatScrollTop.split(':')[1])
    }, [chatScrollTop])

    function faceToHtml(content: any) {
        return filterBreakWord(content).replace(faceRegExp, (word: any) => `<img src="${FACE_URL}${word}@2x.png" />`)
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
        if (chatLoading || !dataHasMore) {
            return
        }
        dispatch({
            type: 'chat/save',
            payload: {
                chatLoading: true
            }
        })
        const prevScrollHeight = scrollRef.current.scrollHeight
        dispatch({
            type: 'chat/getChatList',
            payload: {
                params: {
                    roomId,
                    msgId: chatList[0].msgId,
                    size: 50
                },
                onSuccess: {
                    search: () => {
                        // dom元素位置更新后滚动至追加数据前第一条消息位置
                        nextTick(scrollRef.current, ({ scrollHeight }: any) => {
                            dispatch({
                                type: 'chat/save',
                                payload: {
                                    chatScrollTop: `scroll${new Date().getTime()}:${scrollHeight - prevScrollHeight}`
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
        const { role, imAccount } = userStatus
        // 用户禁言时隐藏所有菜单
        if (userIsForbit) {
            return null
        }
        const { senderId: msgOwner } = msg
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
            label: '解除禁言',
            value: 'cancelForbit',
        },
        {
            label: '踢出用户',
            value: 'kick',
        }]

        // 消息禁言状态过滤禁言 || 非禁言菜单
        menus = menus.filter((menu: any) => msg.isForbit === 1 ? menu.value !== 'forbit' : menu.value !== 'cancelForbit')

        // 身份筛选消息菜单
        const isUserSelf = String(msgOwner) === String(imAccount)
        let menuMap: any = {
            // 主播
            1: isUserSelf ? menus.filter(item => item.value === 'delete') : menus,
            // 嘉宾
            2: isUserSelf ? menus.filter(item => item.value === 'delete') : menus.filter(item => item.value === 'reply')
        }

        const userRowMenus = menuMap[role]
        return userRowMenus && userRowMenus.length ?
            <ul>
                {userRowMenus.map((menu: any) => <li className="popover-menu-item" key={menu.value} onClick={() => handleMsgClick({ ...menu, ...msg })}>
                    {menu.label}
                </li>)}
            </ul> : null
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
                const chatInput = document.getElementById('chatEditor')
                const valToEditor = formatInput(chatInput, `@${nick}`)
                dispatch({
                    type: 'chat/save',
                    payload: {
                        editorValue: [valToEditor]
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
                            operate: true
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
                            operate: true
                        }
                    }
                })
            },
            // 踢用户出房间
            'kick': () => {
                Modal.confirm({
                    centered: true,
                    content: `是否把${nick} 踢出房间`,
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

    return <div className="tab-container interactive">
        <div className={`panel-contain chat-panel${!chatList.length ? ' empty flex-center' : ''} `} ref={scrollRef} onScroll={() => tottle(animateToScroll)}>
            {chatList.length ? <>
                {
                    chatLoading || dataHasMore ? null : <div className="wrap-item no-more">加载完毕</div>
                }
                {
                    chatList.map((msg: any, index: number) =>
                        String(msg.msgCode) !== '1020' ? <div className="wrap-item" key={index} id={`msg - ${msg.msgId} `}>
                            {
                                handleFilterMenu(msg) ? <Popover content={handleFilterMenu(msg)} arrowPointAtCenter placement="bottom">
                                    <label className={msg.role === 1 || msg.role === 2 ? 'role' : ''}>
                                        {msg.nick}{msg.role === 1 || msg.role === 2 ? `  [${msg.identity}]` : null}
                                    </label>
                                </Popover> : <label className={msg.role === 1 || msg.role === 2 ? 'role' : ''}>
                                        {msg.nick}{msg.role === 1 || msg.role === 2 ? `  [${msg.identity}]` : null}
                                    </label>
                            }
                            <BreakWord options={{
                                text: faceToHtml(msg.content)
                            }} />
                        </div> : <div className="wrap-item notice" key={index} id={`msg - ${msg.msgId} `}>{msg.nick}进入直播间</div>
                    )
                }
            </>
                :
                <h3>暂时无人发言，快来抢占沙发~</h3>
            }
            {
                chatLoading && <div className="list-loading">{'加载中...'}</div>
            }
        </div>
        <Editor menuList={[{ label: 'emoji' }]} editorId="chatEditor" />
    </div>
}
export default withRouter(connect(({ room, chat }: any) => ({
    room: room.toJS(),
    chat: chat.toJS(),
}))(ActiveInfo))
