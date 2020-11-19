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
    sort?: number
}

type PropsType = {
    room: any,
    dispatch: any,
    match: any
}

function DetailInfo(props: PropsType) {
    const { room: { chatMenu, roomInfo } } = props
    const [curMenu, setCurMenu] = useState(chatMenu[0])

    // handle menu tab click
    function handleOpentab(menu: MenuType) {
        setCurMenu(menu)
    }

    return <div className="live-info-container">
        <div className="flex-between nav-panel">
            <nav>
                {
                    chatMenu && chatMenu.map((menu: MenuType) => <a key={menu.menuType} onClick={() => handleOpentab(menu)} className={curMenu.menuType === menu.menuType ? 'active' : ''}>
                        {
                            menu.name
                        }
                    </a>)
                }
                <a onClick={() => {
                    handleOpentab({ menuType: 999 })
                }} className={curMenu.menuType === 999 ? 'active' : ''}>成员</a>
            </nav>
            <label className="hot-label flex-center">{roomInfo.pv}</label>
        </div>
        {
            curMenu.menuType === 1 ?
                <ActiveTab />
                : null
        }
        {
            curMenu.menuType === 3 ?
                <QaaTab /> : null
        }
        {
            curMenu.menuType === 999 ?
                <MemberTab /> : null
        }
    </div >
}
export default withRouter(connect(({ room }: any) => ({
    room: room.toJS(),
}))(DetailInfo))
