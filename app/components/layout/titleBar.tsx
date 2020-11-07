/**
 * @desc 公用标题栏组件
 */
import React from 'react'
import './style.less'
// @ts-ignore
import { isWindowMax, maxWindow, unMaxWindow, minWindow, closeWindow } from '@/utils/ipc'

type PropsTypes = {
    btns?: Array<any>// 要展示的菜单操作按钮
}
type OperateTypes = {
    [key: string]: any
}
export default function TitleBar(props: PropsTypes) {
    /**
     * @desc handle click of titlebar btn
     * @parma {Object} 
     */
    function handleBtnClick({ type }: any) {
        const btnReact: OperateTypes = {
            'min': () => minWindow(),
            'max': () => {
                if (isWindowMax()) {
                    unMaxWindow()
                } else {
                    maxWindow()
                }
            },
            'close': () => closeWindow()
        }
        btnReact[type] && btnReact[type]()
    }

    const {
        //@ts-ignore
        btns = btns || [{
            type: 'min'
        }, {
            type: 'close'
        }]
    } = props
    return <div className="title-bar-container">
        <div className="bar-l"></div>
        <div className="bar-r">
            {
                btns && btns.map((btn: any, index: number) => <i key={index} className={`icon-${btn.type}-win`} onClick={() => handleBtnClick(btn)} />)
            }
        </div>
    </div>
}