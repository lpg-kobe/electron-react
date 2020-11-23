/**
 * @desc 公用modal模态窗空间，基于antd Modal
 */

import React from 'react'
import { Modal } from 'antd'

export default function AModal(props: any) {
    return <Modal className={`ofweek-modal ${props.className || ''}`} destroyOnClose {...props} cancelButtonProps={null} centered={true}>{props.children}</Modal>
}