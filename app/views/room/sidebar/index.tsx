/**
 * @desc 直播间左侧菜单栏
 */
import React from 'react'
import { connect } from 'dva'
import { Switch } from 'antd'
import { SidebarType } from '../../../utils/type'

const Sidebar = () => {
    const sidebars = [{
        key: 'camera',
        value: <>
            <Switch defaultChecked={true} className="ofweek-switch" />
            <label>摄像头</label>
        </>
    }, {
        key: 'mic',
        value: <>
            <Switch defaultChecked={false} className="ofweek-switch" />
            <label>麦克风</label>
        </>
    }, {
        key: 'ppt',
        value: <>
            <i className="icon ppt"></i>
            <label>演讲稿</label>
        </>
    }, {
        key: 'ques',
        value: <>
            <i className="icon ques"></i>
            <label>问卷调查</label>
        </>
    }
        //     , {
        //     key: 'video',
        //     value: <>
        //         <i className="icon video"></i>
        //         <label>插播视频</label>
        //     </>
        // }
    ]
    return (<div className="sidebar-container">
        <ul>
            {
                sidebars.map((bar: SidebarType) => <li className="sidebar-item" key={bar.key}>
                    {bar.value}
                </li>)
            }
        </ul>
    </div>)
}
export default connect()(Sidebar)