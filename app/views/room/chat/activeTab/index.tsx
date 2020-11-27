/**
 * @desc 直播间互动区
 */
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { connect } from 'dva';
import { Popover, Modal } from 'antd'
import { withRouter } from 'dva/router';
// @ts-ignore
import Editor from '@/components/editor'
// @ts-ignore
import { scrollElement, tottle, rqaToGetElePos, filterBreakWord } from '@/utils/tool'
// @ts-ignore
import { FACE_URL } from '@/constants'

type PropsType = {
    room: any,
    chat: any,
    match: any,
    dispatch(action: any): void
}

function ActiveInfo(props: PropsType) {
    const [dataLoading, setDataLoading] = useState(true)
    const scrollRef: any = useRef(null)
    const {
        chat: { list: chatList, hasMore: dataHasMore, chatScrollTop, inputValue },
        dispatch,
        match: { params: { id: roomId } },
        room: { userStatus }
    } = props
    const faceRegExp = /\[[a-zA-Z0-9\/\u4e00-\u9fa5]+\]/g
    const userIsForbit = userStatus.isForbit === 1

    useLayoutEffect(() => {
        dispatch({
            type: 'chat/getChatList',
            payload: {
                params: {
                    roomId,
                    msgId: chatList[0] && chatList[0].msgId,
                    size: 50
                },
                isInit: true,
                onSuccess: {
                    search: () => setDataLoading(false)
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
        if (dataLoading || !dataHasMore) {
            return
        }
        setDataLoading(true)
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
                        setDataLoading(false)
                        // dom元素位置更新后滚动至追加数据前第一条消息位置
                        rqaToGetElePos(scrollRef.current, ({ scrollHeight }: any) => {
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
                {userRowMenus.map((menu: any) => <li className="msg-menu-item" key={menu.value} onClick={() => handleMsgClick({ ...menu, ...msg })}>
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
                    content: `是否把${nick}踢出房间`,
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
        <div className={`panel-contain chat-panel${!chatList.length ? ' empty flex-center' : ''}`} ref={scrollRef} onScroll={() => tottle(animateToScroll)}>
            {chatList.length ? <>
                {
                    dataLoading || dataHasMore ? null : <div className="wrap-item no-more">加载完毕</div>
                }
                {
                    chatList.map((msg: any, index: number) =>
                        true ? <div className="wrap-item" key={index} id={`msg-${msg.msgId}`}>
                            {
                                handleFilterMenu(msg) ? <Popover content={handleFilterMenu(msg)} arrowPointAtCenter placement="bottom">
                                    <label className={msg.role === 1 || msg.role === 2 ? 'role' : ''}>
                                        {msg.nick}{msg.role === 1 || msg.role === 2 ? `  [${msg.identity}]` : null}
                                    </label>
                                </Popover> : <label className={msg.role === 1 || msg.role === 2 ? 'role' : ''}>
                                        {msg.nick}{msg.role === 1 || msg.role === 2 ? `  [${msg.identity}]` : null}
                                    </label>
                            }
                            <p dangerouslySetInnerHTML={{ __html: faceToHtml(msg.content) }}></p>
                        </div> : <div className="wrap-item notice" key={index} id={`msg-${msg.msgId}`}>{msg.nick}进入直播间</div>
                    )
                }
            </>
                :
                <h3>暂时无人发言，快来抢占沙发~</h3>
            }
            {
                dataLoading && <div className="list-loading">{'加载中...'}</div>
            }
        </div>
        <Editor menuList={[{ label: 'emoji' }]} />
    </div>
}
export default withRouter(connect(({ room, chat }: any) => ({
    room: room.toJS(),
    chat: chat.toJS(),
}))(ActiveInfo))
