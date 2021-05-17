/**
 * @desc common component of header
 */
import React, { ReactNode } from 'react';
import { connect } from 'dva';
import { Layout, Popover } from 'antd';
import { useTranslation } from 'react-i18next';
import TitleBar from './titleBar';
import './style.less';
import { TitleMenusType, HeaderBtnsType } from '../../utils/type';
import Img from '../../components/img';

interface PropsType {
  dispatch: (action: any) => void;
  auth: any; // state
  room: any; // state
  className?: string; // class
  titleBarProps?: TitleMenusType; // 窗口按钮
  headerProps: HeaderBtnsType; // 头部配置
}

const CommonHeader = (props: PropsType) => {
  const {
    auth: { userInfo },
    headerProps,
    dispatch,
    titleBarProps,
  } = props;
  const { t } = useTranslation();
  const { Header } = Layout;

  // get header config of props
  const headerTitle = headerProps.find((ele: any) => ele.key === 'title');
  const headerTips = headerProps.find((ele: any) => ele.key === 'tips');
  const headerAvatar = headerProps.find((ele: any) => ele.key === 'avatar');
  const headerButtons: any = headerProps.find(
    (ele: any) => ele.key === 'button'
  );

  const headerMenuCtx = (
    <ul>
      <li className="popover-menu-item" onClick={handleLogOut}>
        {t('退出登录')}
      </li>
    </ul>
  );

  /** handle log out */
  function handleLogOut() {
    dispatch({
      type: 'auth/logout',
      payload: {
        params: {},
      },
    });
  }

  return (
    userInfo && (
      <Header id="commonHeader" className={props.className || ''}>
        <div className="header-l">
          <i className="logo" />
          <span>{t('直播')}</span>
          {headerTitle && <label className="title">{headerTitle.value}</label>}
          {headerTips?.value}
        </div>
        <div className="header-r">
          {headerButtons?.value?.map((btn: ReactNode) => btn)}
          {headerAvatar && (
            <Popover
              arrowPointAtCenter
              placement="bottom"
              content={headerMenuCtx}
            >
              <div className="user-bar">
                <div className="avatar">
                  <Img
                    options={{
                      src: userInfo.logoUrl,
                      alt: t('头像'),
                    }}
                  />
                </div>
                <span>{userInfo.completeInfoDto.nick}</span>
              </div>
            </Popover>
          )}
          <TitleBar titleBarProps={titleBarProps} />
        </div>
      </Header>
    )
  );
};
export default connect(({ auth }: any) => ({ auth: auth.toJS() }))(
  CommonHeader
);
