/**
 * @desc 直播间活动模块,包含图片直播等
 */
import React from 'react';
import { connect } from 'dva';

function ActivityInfo() {
    return <section className="section-activity">

    </section>
}
export default connect(({ room }: any) => ({
    room: room.toJS(),
}))(ActivityInfo);
