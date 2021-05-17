import React, { Fragment } from 'react';
import { ConfigProvider } from 'antd';
import { AppContainer as ReactHotAppContainer } from 'react-hot-loader';
import zhCN from 'antd/lib/locale/zh_CN';

const AppContainer = process.env.PLAIN_HMR ? Fragment : ReactHotAppContainer;

function Layout(props: any) {
  const { children } = props;
  return (
    <AppContainer>
      <ConfigProvider locale={zhCN}>{children}</ConfigProvider>
    </AppContainer>
  );
}
export default Layout;
