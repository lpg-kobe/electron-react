import React from 'react';
import { connect } from 'dva';

function ChatInfo() {
    return <section className="section-chat">

    </section>
}
export default connect(({ room }: any) => ({
    room: room.toJS(),
}))(ChatInfo);
