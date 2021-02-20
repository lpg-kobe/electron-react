/**
 * @desc 房间分享组件
 */
import React, { useRef, useEffect } from 'react'
import { Input, Button, message } from 'antd'
import { withRouter } from 'dva/router'
import { clipboard } from 'electron'

// @ts-ignore
import QRious from 'qrious'
// @ts-ignore
import AModal from '@/components/modal';

function ShareRoom(props: any) {
    const {
        visible,
        onCancel,
        match: { params: { id: roomId } }
    } = props

    const codeRef: any = useRef(null)
    const codeLink = `https://room.ofweek.com/livewap/#/live/${roomId}`

    useEffect(() => {
        let qrCode: any = null
        if (visible) {
            // 元素绘制完毕后再加载code
            window.requestAnimationFrame(() => {
                qrCode = new QRious({
                    element: codeRef.current,
                    value: codeLink
                })
            })
        }
        return () => {
            qrCode && (qrCode = null)
        }
    }, [visible])

    return <>
        {/* 直播间分享 */}
        <AModal
            width={600}
            footer={null}
            visible={visible}
            title={<h1 className="ofweek-modal-title z2">分享</h1>}
            onCancel={onCancel}
            className="ofweek-modal share-room small"
        >
            <div className="share-line flex">
                <label>分享链接</label>
                <Input placeholder="分享链接" readOnly className="share-input" value={codeLink} />
                <Button onClick={() => {
                    clipboard.writeText(codeLink);
                    message.success("复制成功")
                }} type="primary">复制链接</Button>
            </div>
            <div className="share-code">
                <canvas className="code-img" ref={codeRef}></canvas>
                <p>手机观看</p>
            </div>
        </AModal>
    </>
}

export default withRouter(ShareRoom)