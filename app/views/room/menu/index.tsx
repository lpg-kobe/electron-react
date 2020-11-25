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
// @ts-ignore
import AModal from '@/components/modal';

type MenuType = {
    menuType: number,
    name: string,
    sort: number
}

type PropsType = {
    room: any,
    detail: any,
    dispatch(action: any): void,
    match: any
}

function MenuInfo(props: PropsType) {
    const { room: { detailMenu }, detail: { imgTextList }, dispatch, match: { params: { id: roomId } } } = props
    const initVisible: any = {
        2: false,
        4: false,
        5: false,
        6: false
    }
    const [visible, setVisible] = useState(initVisible)

    // handle menu tab click
    function handleOpentab(menu: MenuType) {
        setVisible({
            ...initVisible,
            [menu.menuType]: !initVisible[menu.menuType]
        })
        const actionObj: any = {
            // 图文直播
            2: () => {
                dispatch({
                    type: 'detail/getImgTextList',
                    payload: {
                        params: {
                            roomId,
                            msgId: imgTextList[0] && imgTextList[0].msgId,
                            size: 20
                        },
                        onSuccess: {
                            search: () => {
                                dispatch({
                                    type: 'detail/save',
                                    payload: {
                                        imgTextLoading: false
                                    }
                                })
                            }
                        }
                    }
                })
            },
            // 产品
            4: () => {

            },
            // 文件下载
            5: () => {

            },
            // 活动介绍
            6: () => {
                dispatch({
                    type: 'room/getRoomIntroduce',
                    payload: {
                        roomid: roomId
                    }
                })
            }
        }
        actionObj[menu.menuType] && actionObj[menu.menuType]()
    }

    return <section className="section-menu">
        <nav>
            {
                detailMenu && detailMenu.map((menu: MenuType) => <a key={menu.menuType} onClick={() => handleOpentab(menu)} className={`${visible[menu.menuType] ? 'active' : ''}`}>
                    {
                        menu.name
                    }
                </a>)
            }
        </nav>
        <AModal className="ofweek-modal big draggable" draggable={true} footer={null} title={
            <h1 className="ofweek-modal-title">
                活动介绍
            </h1>
        } visible={visible[6]} onCancel={() => setVisible({
            ...initVisible,
            6: false
        })}>
            <DescTab />
        </AModal>
        <AModal className="ofweek-modal img-text big draggable" draggable={true} footer={null} title={
            <h1 className="ofweek-modal-title">
                图文直播
            </h1>
        } visible={visible[2]} onCancel={() => setVisible({
            ...initVisible,
            2: false
        })}>
            <ImgTextTab />
        </AModal>
        <AModal className="ofweek-modal big draggable" draggable={true} footer={null} visible={visible[4]} onCancel={() => setVisible({
            ...initVisible,
            4: false
        })}>
            <ProViewTab />
        </AModal>
        <AModal className="ofweek-modal big draggable" draggable={true} footer={null} visible={visible[5]} onCancel={() => setVisible({
            ...initVisible,
            5: false
        })}>
            <FileDownTab />
        </AModal>
    </section >
}
export default withRouter(connect(({ room, detail }: any) => ({
    room: room.toJS(),
    detail: detail.toJS()
}))(MenuInfo))
