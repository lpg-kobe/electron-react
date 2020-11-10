/**
 * @desc common component of header
 */
import React from 'react';
import { connect } from 'dva';
import { Layout } from 'antd';
import TitleBar from './titleBar'
import './style.less';

const CommonHeader = (props: any) => {
  const { auth: { userInfo } } = props;
  const { Header } = Layout;
  return <>{userInfo ? <><Header id="common-header">
    <div className="header-l">
      <i className="logo"></i>
      <span>直播</span>
    </div>
    <div className="header-r">
      <div className="user-bar">
        <img src={userInfo.logoUrl} alt="头像" />
        <span>
          {userInfo.completeInfoDto.nick}
        </span>
      </div>
      <TitleBar />
    </div>
  </Header></> : null
  }</>
};
export default connect(({ auth }: any) => ({ auth: auth.toJS() }))(
  CommonHeader
);
