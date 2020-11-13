/**
 * @desc 直播间成员区
 */
import React from 'react';
import { connect } from 'dva';

type PropsType = {
    room: any
}

function MemberInfo(props: PropsType) {
    const { room: { } } = props
    return <div className="tab-contain member">

    </div>
}
export default connect(({ room }: any) => ({
    room: room.toJS(),
}))(MemberInfo);
