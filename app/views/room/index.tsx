import React from 'react';
import { connect } from 'dva';
// @ts-ignore
import CommonHeader from '@/components/layout/header';
import VideoInfo from './video'
import DetailInfo from './detail'
import ChatInfo from './chat'
import Activity from './activity'
import './style.less';

function RoomInfo() {
  return <>
    <CommonHeader />
    <main className="room-page-container main-container clearfix">
      <section className="section-wrap-l">
        <VideoInfo />
        <DetailInfo />
      </section>
      <section className="section-wrap-r">
        <ChatInfo />
        <Activity />
      </section>
    </main>
  </>
}
export default connect(({ room }: any) => ({
  room: room.toJS(),
}))(RoomInfo);
