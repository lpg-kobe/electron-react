/**
 * @desc 公用modal模态窗空间，基于antd Modal
 */

import React from 'react'
import { Modal } from 'antd'
import Draggable from 'react-draggable';

type PropsType = {
    draggable?: boolean, // 是否支持拖拽
    centered?: boolean, // 是否居中
    children?: any, // 子组件
    className?: string, // class
    cancelButtonProps?: any,
    modalRender: any // 自定义modal渲染方式
}

export default function AModal(props: PropsType) {
    const { draggable, children, className } = props
    return <Modal
        className={`ofweek-modal ${className || ''}`}
        destroyOnClose width={900}
        // @ts-ignore
        modalRender={
            (modal: any) => draggable ? <Draggable>{modal}</Draggable> : modal
        }
        cancelButtonProps={null}
        centered={true}
        {...props}>
        {children}
    </Modal>
}