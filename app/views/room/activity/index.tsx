import React from 'react';
import { connect } from 'dva';

function ActivityInfo() {
    return <section className="section-activity">

    </section>
}
export default connect(({ room }: any) => ({
    room: room.toJS(),
}))(ActivityInfo);
