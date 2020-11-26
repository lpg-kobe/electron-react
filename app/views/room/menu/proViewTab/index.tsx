/**
 * @desc 直播间产品展示，暂不开发
 */
'use strict'
import React from 'react';
import { connect } from 'dva';

// type MenuType = {
//     menuType: number,
//     name: string,
//     sort: number
// }

const ProViewTab = () => {
    return (<div className="tab-container product-view">

    </div>)
}
export default connect(({ room }: any) => ({
    room: room.toJS(),
}))(ProViewTab);