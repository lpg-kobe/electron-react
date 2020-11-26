/**
 * @desc common component of header
 */
import React, { useState } from 'react';
import { connect } from 'dva';
import { Layout } from 'antd';
import TitleBar from './titleBar'
import './style.less';
import { TitleMenusType, HeaderBtnsType } from '../../utils/type'

type PropsType = {
  auth: any, // state
  className?: string, // class
  titleBarProps?: TitleMenusType, // 窗口按钮
  headerProps: HeaderBtnsType // 头部配置
}

const CommonHeader = (props: PropsType) => {
  const { auth: { userInfo }, headerProps, titleBarProps } = props;
  const { Header } = Layout;
  const [imgError, setImgError] = useState(false)
  const headerTitle = headerProps.find((ele: any) => ele.key === 'title')
  const headerAvatar = headerProps.find((ele: any) => ele.key === 'avatar')
  const headerButtons: any = headerProps.find((ele: any) => ele.key === 'button')

  function renderBtnComponent(btn: any) {
    return function HooksCom() {
      const BtnCom = btn
      return <BtnCom />
    }
  }

  return <>{userInfo ? <><Header id="commonHeader" className={props.className || ""}>
    <div className="header-l">
      <i className="logo"></i>
      <span>直播</span>
      {
        headerTitle && <label className="title">{headerTitle.value}</label>
      }
    </div>
    <div className="header-r">
      {
        headerButtons && headerButtons.value.map((btn: any) => renderBtnComponent(btn))
      }
      {
        headerAvatar && <div className="user-bar">
          <div className="avatar">
            <img src={userInfo.logoUrl} alt="头像" data-img={imgError ? 'unloaded' : 'loaded'} onError={() => setImgError(true)} />
          </div>
          <span>
            {userInfo.completeInfoDto.nick}
          </span>
        </div>
      }
      <TitleBar titleBarProps={titleBarProps} />
    </div>
  </Header></> : null
  }</>
};
export default connect(({ auth }: any) => ({ auth: auth.toJS() }))(
  CommonHeader
);
