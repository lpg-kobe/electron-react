/**
 * @desc 公用标题栏组件
 */
import React, { ReactNode } from 'react'
import './style.less'
// @ts-ignore
import { isWindowMax, maxWindow, unMaxWindow, minWindow, closeWindow } from '@/utils/ipc'
import { TitleMenusType } from '../../utils/type'

type PropsTypes = {
    children?: ReactNode,
    titleBarProps?: TitleMenusType // 要展示的窗口操作按钮
}

export default function TitleBar(props: PropsTypes) {
    /**
     * @desc handle click of titlebar btn
     * @param {String} type event type
     * @param {Function} click callback of click
     */
    function handleBtnClick({ type, click }: any) {
        const btnReact: any = {
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
        click ? click(type) : btnReact[type] && btnReact[type]()
    }

    const {
        //@ts-ignore
        titleBarProps = titleBarProps || [{
            type: 'min'
        }, {
            type: 'close'
        }],
    } = props
    return <div className="title-bar-container">
        <div className="bar-l">
            {props.children}
        </div>
        <div className="bar-r">
            {
                titleBarProps && titleBarProps.map((btn: any, index: number) => <i key={index} className={`icon icon-${btn.type}-win`} onClick={() => handleBtnClick(btn)} />)
            }
        </div>
    </div>
}