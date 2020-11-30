/**
 * @desc 直播间成员区
 */
import React, { useEffect } from 'react';
import { connect } from 'dva';
import { withRouter } from 'dva/router';
import { Popover, message, Modal } from 'antd'

type PropsType = {
    room: any,
    chat: any,
    match: any,
    dispatch(action: any): void,
}

function MemberInfo(props: PropsType) {
    const { room: { userStatus }, chat: { memberList }, dispatch, match: { params: { id: roomId } } } = props
    useEffect(() => {
        dispatch({
            type: 'chat/getMemberList',
            payload: {
                params: { roomid: roomId }
            }
        })
    }, []);

    // handle filter right menu of item
    function handleFilterMenu(item: any) {
        const { role, imAccount } = userStatus
        const { memberId: msgOwner } = item
        let menus = [{
            label: '上麦',
            value: 'online',
        },
        {
            label: '下麦',
            value: 'offline',
        },
        {
            label: '邀请上麦',
            value: 'send-online',
        },
        {
            label: '申请上麦',
            value: 'req-online',
        },
        {
            label: '申请下麦',
            value: 'req-offline',
        },
        {
            label: '取消禁言',
            value: 'cancelForbit',
        },
        {
            label: '禁言用户',
            value: 'forbit',
        },
        {
            label: '踢出用户',
            value: 'kick',
        }]

        // 消息禁言状态过滤禁言 || 非禁言菜单
        menus = menus.filter((menu: any) => item.isForbit === 1 ? menu.value !== 'forbit' : menu.value !== 'cancelForbit')

        // 根据主播上麦状态过滤上下麦菜单
        menus = menus.filter((menu: any) => true ? menu.value !== 'online' : menu.value !== 'offline')

        // 根据嘉宾申请上下麦状态过滤申请上下麦菜单
        menus = menus.filter((menu: any) => true ? menu.value !== 'req-online' : menu.value !== 'req-offline')

        // 身份筛选消息菜单
        const isUserSelf = String(msgOwner) === String(imAccount)
        let menuMap: any = {
            // 主播
            1: isUserSelf ? menus.filter(item => ['online', 'offline'].includes(item.value)) : menus.filter(item => ['offline', 'send-online', 'forbit', 'cancelForbit', 'kick'].includes(item.value)),
            // 嘉宾
            2: isUserSelf ? menus.filter(item => ['req-online', 'req-offline'].includes(item.value)) : []
        }

        const userRowMenus = menuMap[role]
        return userRowMenus && userRowMenus.length ?
            <ul>
                {
                    userRowMenus.map((menu: any) => <li className="popover-menu-item" key={menu.value} onClick={() => handleMsgClick({ ...menu, ...item })}>
                        {menu.label}
                    </li>)
                }
            </ul> : null
    }

    function handleMsgClick({ value, nick, roomId, memberId }: any) {
        const actionObj: any = {
            // 上麦
            'online': () => { },
            // 下麦
            'offline': () => { },
            // 邀请上麦
            'send-online': () => {
                dispatch({
                    type: 'chat/inviteJoinRoom',
                    payload: {
                        params: {
                            anthorid: memberId,
                            roomId
                        },
                        onSuccess: {
                            operate: () => {
                                message.success('上麦邀请已发送')
                            }
                        }
                    }
                })
            },
            // 申请上麦
            'req-online': () => { },
            // 申请下麦
            'res-offline': () => { },
            // 禁言
            'forbit': () => {
                dispatch({
                    type: 'chat/forbitChat',
                    payload: {
                        params: {
                            memberId,
                            roomId,
                            type: 1
                        },
                        onSuccess: {
                            operate: true
                        }
                    }
                })
            },
            // 取消禁言
            'cancelForbit': () => {
                dispatch({
                    type: 'chat/forbitChat',
                    payload: {
                        params: {
                            memberId: memberId,
                            roomId,
                            type: 2
                        },
                        onSuccess: {
                            operate: true
                        }
                    }
                })
            },
            // 踢出用户
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
                                    memberId,
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
        actionObj[value] && actionObj[value]()
    }

    return <div className="tab-container member">
        <ul className={`panel-contain member-panel${!memberList.length ? ' empty flex-center' : ''}`}>
            {
                memberList && memberList.map((item: any) => <li key={Math.random()} className="wrap-item">
                    <div className={`item-l${item.role === 1 || item.role === 2 ? ' anchor' : ''}`}>
                        <label>{item.nick}</label>
                        <span>[{item.identity}]</span>
                    </div>
                    <div className="item-r">
                        {
                            item.isForbit === 1 && <i className='icon forbit'></i>
                        }
                        <i className={`icon ${true ? 'mic' : 'unmic'}`}></i>
                        {
                            handleFilterMenu(item) && <Popover content={handleFilterMenu(item)} placement="bottomLeft">
                                <i className='icon menu'></i>
                            </Popover>
                        }
                    </div>
                </li>)
            }
        </ul>
    </div>
}
export default withRouter(connect(({ room, chat }: any) => ({
    room: room.toJS(),
    chat: chat.toJS()
}))(MemberInfo));
