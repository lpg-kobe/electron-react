/**
 * @desc 直播间聊天&互动&成员模块
 */
'use strict'
import React, { useState } from 'react';
import { connect } from 'dva';
import { withRouter } from 'dva/router';
import ActiveTab from './activeTab'
import QaaTab from './qaaTab'
// @ts-ignore
import MemberTab from './memberTab'

type MenuType = {
    menuType: number,
    name?: string,
    sort?: number | undefined
}

type PropsType = {
    room: any,
    dispatch: any,
    chat: any,
    match: any
}

function DetailInfo(props: PropsType) {
    const {
        room: { chatMenu, roomInfo },
        dispatch
    } = props

    const [activeIndex, setActiveIndex] = useState(0)
    const chatMenuMap: any = {
        1: <ActiveTab key='activeTab' />,
        3: <QaaTab key='qaaTab' />
    }

    // handle menu tab click
    function handleOpentab(index: number) {
        // 清空聊天框
        dispatch({
            type: 'chat/save',
            payload: {
                editorValue: ['']
            }
        })
        setActiveIndex(index)
    }

    return <div className="live-info-container">
        <div className="flex-between nav-panel">
            <nav>
                {
                    chatMenu && chatMenu.map((menu: MenuType, index: number) => <a key={menu.menuType} onClick={() => handleOpentab(index)} className={activeIndex === index ? 'active' : ''}>
                        {
                            menu.name
                        }
                    </a>)
                }
                <a onClick={() => {
                    handleOpentab(999)
                }} className={activeIndex === 999 || !chatMenu.length ? 'active' : ''}>成员</a>
            </nav>
            <label className="hot-label flex-center">{roomInfo.pv}</label>
        </div>
        <div className="swiper-panel" style={{ transform: `translateX(-${activeIndex === 999 ? (chatMenu.length * 100) : (activeIndex * 100)}%)` }}>
            <div style={{ width: `${(chatMenu.length + 1) * 100}%` }}>
                {
                    chatMenu.map((menu: any) => chatMenuMap[menu.menuType])
                }
                <MemberTab />
            </div>
        </div>
    </div >
}
export default withRouter(connect(({ room, chat }: any) => ({
    room: room.toJS(),
    chat: chat.toJS(),
}))(DetailInfo))
