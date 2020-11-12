/**
 * @desc 图文直播描述
 */
'use strict'
import React from 'react';
import { connect } from 'dva';

type PropsType = {
    room: any,
    dispatch: any
}

const ImgTextTab = (props: PropsType) => {
    return (<div className="tab-container img-text">

    </div>)
}
export default connect(({ room }: any) => ({
    room: room.toJS(),
}))(ImgTextTab);