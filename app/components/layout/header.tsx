/**
 * @desc common component of header
 */
import React from 'react';
import { connect } from 'dva';
import { Layout } from 'antd';
import './style.less';

const CommonHeader = (props: any) => {
  const {
    auth: {
      userInfo: { completeInfoDto },
    },
  } = props;
  const { Header } = Layout;
  return (
    <Header id="common-header">
      <div className="header-l">logo</div>
      <div className="header-r">
        欢迎您
        {completeInfoDto.nick}
      </div>
    </Header>
  );
};
export default connect(({ auth }: any) => ({ auth: auth.toJS() }))(
  CommonHeader
);
