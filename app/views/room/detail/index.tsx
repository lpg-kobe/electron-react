import React, { useState, useEffect } from 'react';
import { connect } from 'dva';
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
    dispatch: any
}

function DetailInfo(props: PropsType) {

    const { room: { detailMenu, roomIntroduce } } = props

    const [curMenu, setCurMenu] = useState(detailMenu[0])

    useEffect(() => {
        setCurMenu(detailMenu[0])
        return () => { };
    }, [detailMenu]);

    return <section className="section-detail">
        <nav>
            {
                detailMenu && detailMenu.map((menu: MenuType) => <a key={menu.menuType} className={menu.menuType === curMenu.menuType ? 'active' : ''} onClick={() => setCurMenu(menu)}>
                    {
                        menu.name
                    }
                </a>)
            }
        </nav>
        {
            curMenu.menuType === 6 && Object.keys(roomIntroduce).length ? <DescTab /> : null // you can add com loading here
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
export default connect(({ room }: any) => ({
    room: room.toJS(),
}))(DetailInfo);
