import React from 'react';
import { connect } from 'dva';
// @ts-ignore
import { SDK_APP_ID } from '@/constants';
import { withRouter } from 'dva/router';
import styles from './style.less';

type Props = {
  [key: string]: any;
};

function HomePage(props: Props) {
  const { history } = props;
  history.push('/login');
  return (
    <div className={styles.container} data-tid="container">
      {props.children}
    </div>
  );
}
export default withRouter(
  connect(({ system }: any) => ({
    system: system.toJS(),
  }))(HomePage)
);
