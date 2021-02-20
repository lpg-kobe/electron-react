/**
 * @desc common loading @TODO
 */

import React from 'react'
import './style.less'

interface PropsType {
    options?: {
        visible: boolean; // show or not
        mask?: boolean; // 是否需要遮罩
        loadStatus?: number; // 加载状态 0 fail 0.5 loading 1 success
        loadDesc?: null | React.ReactNode // 加载tips
    }
}

export default function OfweekLoading(props: PropsType) {
    const { options } = props
    const defaultOpts = {
        visible: true,
        mask: true,
        loadStatus: 0.5,
        loadDesc: null
    }
    const setting = { ...defaultOpts, ...options }
    let { mask, visible, loadDesc, loadStatus } = setting

    return visible ? <div className="ofweek-loading">
        {mask && <div className="loading-mask" />}
        {
            loadStatus === 0.5 && <div className="loader loader--fade">
                <i className="icon icon-loading"></i>
                <span className="loader-item"></span>
                <span className="loader-item"></span>
                <span className="loader-item"></span>
                <span className="loader-item"></span>
                <span className="loader-item"></span>
                <span className="loader-item"></span>
            </div>
        }
        {
            loadDesc
        }
    </div> : null
}