/**
 * @desc 直播间菜单模块
 */
'use strict'
import React, { useState } from 'react';
import { connect } from 'dva';
import { withRouter } from 'dva/router';
import DescTab from './descTab'
import ImgTextTab from './imgTextTab'
// @ts-ignore
import ProViewTab from './proViewTab'
// @ts-ignore
import FileDownTab from './fileDownTab'

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

function MenuInfo(props: PropsType) {

    const { room: { detailMenu } } = props
    const [curMenu, setCurMenu] = useState(detailMenu[0])

    // handle menu tab click
    function handleOpentab(menu: MenuType) {
        setCurMenu(menu)
    }

    return <section className="section-menu">
        <nav>
            {
                detailMenu && detailMenu.map((menu: MenuType) => <a key={menu.menuType} onClick={() => handleOpentab(menu)}>
                    {
                        menu.name
                    }
                </a>)
            }
        </nav>
        {
            curMenu.menuType === 6 ?
                <DescTab />
                : null
        }
        {
            curMenu.menuType === 2 ? <ImgTextTab /> : null
        }
        {
            curMenu.menuType === 4 ? <ProViewTab /> : null
        }
        {
            curMenu.menuType === 5 ? <FileDownTab /> : null
        }
    </section >
}
export default withRouter(connect(({ room }: any) => ({
    room: room.toJS(),
}))(MenuInfo))
