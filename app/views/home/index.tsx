import React, { ReactNode } from 'react';
import { Link } from 'dva/router';
import { connect } from 'dva';
import { Button } from 'antd';
import styles from './style.less';

type Props = {
  children: ReactNode;
};

function HomePage(props: Props) {
  console.log(props);
  return (
    <div className={styles.container} data-tid="container">
      <h2>ELECTRON-REACT</h2>
      <Button>antd</Button>
      <Link to="/counter">to Counter</Link>
    </div>
  );
}
export default connect(({ system }: any) => ({
  system: system.toJS(),
}))(HomePage);
