import React, { ReactNode, Fragment } from 'react';
import { connect } from 'dva';
import { AppContainer as ReactHotAppContainer } from 'react-hot-loader';
import './style.less'

type PropsType = {
  children: ReactNode;
};

type MapStateType = {
  [key: string]: any
};

const AppContainer = process.env.PLAIN_HMR ? Fragment : ReactHotAppContainer;

function Layout(props: PropsType) {
  const { children } = props;
  return (
    <AppContainer>
      <>{children}</>
    </AppContainer>
  );
}
export default connect(({ system }: MapStateType) => ({
  system: system.toJS(),
}))(Layout);
