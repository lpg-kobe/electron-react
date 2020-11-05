import React from 'react';
import { connect } from 'react-redux';
import './style.less';

function RoomInfo() {
  return <main className="room-page-container" />;
}
export default connect(({ room }: any) => ({
  room: room.toJS(),
}))(RoomInfo);
