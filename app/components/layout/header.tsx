/**
 * @desc common component of header
 */
import React, { useState, ReactNode } from 'react';
import { connect } from 'dva';
import { Layout, Popover, Button } from 'antd';
import TitleBar from './titleBar'
import './style.less';
import { TitleMenusType, HeaderBtnsType } from '../../utils/type'
import { rendererSend, RENDERER_EVENT, RENDERER_CODE } from '../../utils/ipc';
import { removeUserSession } from '../../utils/session';

type PropsType = {
  auth: any, // state
  room: any, // state
  className?: string, // class
  titleBarProps?: TitleMenusType, // 窗口按钮
  headerProps: HeaderBtnsType // 头部配置
}

const CommonHeader = (props: PropsType) => {
  const {
    auth: { userInfo },
    headerProps,
    titleBarProps
  } = props;
  const { Header } = Layout;
  const [imgError, setImgError] = useState(false)

  // get header config of props
  const headerTitle = headerProps.find((ele: any) => ele.key === 'title')
  const headerAvatar = headerProps.find((ele: any) => ele.key === 'avatar')
  const headerButtons: any = headerProps.find((ele: any) => ele.key === 'button')

  const headerMenuCtx = <ul>
    <li className="popover-menu-item" onClick={handleLogOut}>退出登录</li>
  </ul>

  /** handle log out */
  function handleLogOut() {
    const { CLOSE_PAGE } = RENDERER_CODE
    removeUserSession()
    // send close event to all pages and handle by hooks,so you can do sth before close page
    rendererSend(RENDERER_EVENT.RENDERER_SEND_CODE, {
      code: CLOSE_PAGE
    })
  }

  return userInfo && <Header id="commonHeader" className={props.className || ""}>
    <div className="header-l">
      <i className="logo"></i>
      <span>直播</span>
      <Button type="primary" size="small" onClick={() => require('electron').remote.getCurrentWebContents().toggleDevTools()} style={{ margin: '15px 0 0 10px' }}>DEBUGGER</Button>
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
  </Header>
};
export default connect(({ auth }: any) => ({ auth: auth.toJS() }))(
  CommonHeader
);
