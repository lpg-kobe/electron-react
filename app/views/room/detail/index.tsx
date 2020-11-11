import React from 'react';
import { connect } from 'dva';

function DetailInfo() {
    return <section className="section-detail">

    </section>
}
export default connect(({ room }: any) => ({
    room: room.toJS(),
}))(DetailInfo);
