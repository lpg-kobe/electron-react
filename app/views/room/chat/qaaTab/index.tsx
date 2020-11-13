/**
 * @desc 直播间问答区
 */
import React from 'react';
import { connect } from 'dva';

type PropsType = {
    room: any
}

function QAndAInfo(props: PropsType) {
    const { room: { } } = props
    return <div className="tab-contain quest-and-answer">

    </div>
}
export default connect(({ room }: any) => ({
    room: room.toJS(),
}))(QAndAInfo);
