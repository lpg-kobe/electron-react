/**
 * @desc 直播间文件下载
 */
'use strict'
import React from 'react';
import { connect } from 'dva';

// type MenuType = {
//     menuType: number,
//     name: string,
//     sort: number
// }

const FileDownTab = () => {
    return (<div className="tab-container file-download">

    </div>)
}
export default connect(({ room }: any) => ({
    room: room.toJS(),
}))(FileDownTab);