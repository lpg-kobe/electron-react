import React from 'react';
import { connect } from 'dva';
// @ts-ignore
import { SDK_APP_ID } from '@/constants';
import styles from './style.less';

type Props = {
  [key: string]: any;
};

function HomePage(props: Props) {
  return (
    <div className={styles.container} data-tid="container">

    </div>
  );
}
export default connect(({ system }: any) => ({
  system: system.toJS(),
}))(HomePage);
