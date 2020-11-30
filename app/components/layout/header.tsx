/**
 * @desc common component of header
 */
import React, { useState, ReactNode } from 'react';
import { connect } from 'dva';
import { Layout, Popover } from 'antd';
import TitleBar from './titleBar'
import './style.less';
import { TitleMenusType, HeaderBtnsType } from '../../utils/type'
// @ts-ignore
import { rendererSend, MAIN_EVENT } from '@/utils/ipc';

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

  const headerMenuCtx = <ul>
    <li className="popover-menu-item" onClick={() => rendererSend(MAIN_EVENT.MAIN_CLOSE_TOLOG)}>退出登录</li>
  </ul>

  return <ul>{userInfo ? <><Header id="commonHeader" className={props.className || ""}>
    <div className="header-l">
      <i className="logo"></i>
      <span>直播</span>
      {
        headerTitle && <label className="title">{headerTitle.value}</label>
      }
    </div>
    <div className="header-r">
      {
        headerButtons && headerButtons.value.map((btn: ReactNode) => btn)
      }
      {
        headerAvatar && <Popover arrowPointAtCenter placement="bottom" content={headerMenuCtx}>
          <div className="user-bar">
            <div className="avatar">
              <img src={userInfo.logoUrl} alt="头像" data-img={imgError ? 'unloaded' : 'loaded'} onError={() => setImgError(true)} />
            </div>
            <span>
              {userInfo.completeInfoDto.nick}
            </span>
          </div>
        </Popover>
      }
      <TitleBar titleBarProps={titleBarProps} />
    </div>
  </Header></> : null
  }</ul>
};
export default connect(({ auth }: any) => ({ auth: auth.toJS() }))(
  CommonHeader
);
