import React, { ReactNode, Fragment } from 'react';
import { connect } from 'dva';
import { AppContainer as ReactHotAppContainer } from 'react-hot-loader';

type Props = {
  children: ReactNode;
};

const AppContainer = process.env.PLAIN_HMR ? Fragment : ReactHotAppContainer;

function Layout(props: Props) {
  const { children } = props;
  return (
    <AppContainer>
      <>{children}</>
    </AppContainer>
  );
}
export default connect(({ system }: Record<string, unknown>) => ({
  system: system.toJS(),
}))(Layout);
