/**
 * @desc common component of header
 */
import React, { useState } from 'react';
import { connect } from 'dva';
import { Layout } from 'antd';
import TitleBar from './titleBar'
import './style.less';

const CommonHeader = (props: any) => {
  const { auth: { userInfo } } = props;
  const { Header } = Layout;
  const [imgError, setImgError] = useState(false)
  return <>{userInfo ? <><Header id="commonHeader" className={props.className || ""}>
    <div className="header-l">
      <i className="logo"></i>
      <span>直播</span>
    </div>
    <div className="header-r">
      <div className="user-bar">
        <div className="avatar">
          <img src={userInfo.logoUrl} alt="头像" data-img={imgError ? 'unloaded' : 'loaded'} onError={() => setImgError(true)} />
        </div>
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
