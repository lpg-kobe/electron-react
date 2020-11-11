import React from 'react';
import { connect } from 'dva';

function VideoInfo() {
    return <section className="section-video">

    </section>
}
export default connect(({ room }: any) => ({
    room: room.toJS(),
}))(VideoInfo);
