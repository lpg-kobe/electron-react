/**
 * @desc 直播间文件下载，暂不开发
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