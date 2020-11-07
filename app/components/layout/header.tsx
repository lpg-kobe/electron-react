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
  return <>{userInfo ? <><TitleBar /><Header id="common-header">
    <div className="header-l">logo</div>
    <div className="header-r">
      欢迎您
        {userInfo.completeInfoDto.nick}
    </div>
  </Header></> : null
  }</>
};
export default connect(({ auth }: any) => ({ auth: auth.toJS() }))(
  CommonHeader
);
