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
    name: string,
    sort: number
}

type PropsType = {
    room: any,
    dispatch: any,
    match: any
}

function DetailInfo(props: PropsType) {

    const { room: { chatMenu }, match: { params: { id } } } = props
    const [curMenu, setCurMenu] = useState(chatMenu[0])

    // handle menu tab click
    function handleOpentab(menu: MenuType) {
        setCurMenu(menu)
    }

    return <section className="section-chat">
        <div className="thumb-video-contain"></div>
        <div className="live-info-contain">
            <nav>
                {
                    chatMenu && chatMenu.map((menu: MenuType) => <a key={menu.menuType} onClick={() => handleOpentab(menu)}>
                        {
                            menu.name
                        }
                    </a>)
                }
                <label></label>
            </nav>
            {
                curMenu.menuType === 1 ?
                    <ActiveTab />
                    : null
            }
            {
                curMenu.menuType === 3 ?
                    <QaaTab /> : null
            }
            <MemberTab />
        </div>
    </section>
}
export default withRouter(connect(({ room }: any) => ({
    room: room.toJS(),
}))(DetailInfo))
