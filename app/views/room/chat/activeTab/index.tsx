/**
 * @desc 直播间互动区
 */
import React from 'react';
import { connect } from 'dva';

type PropsType = {
    room: any
}

function ActiveInfo(props: PropsType) {
    const { room: { } } = props
    return <div className="tab-contain interactive">

    </div>
}
export default connect(({ room }: any) => ({
    room: room.toJS(),
}))(ActiveInfo);
