import React from 'react';
import { Link } from 'dva/router';
import styles from './style.less';

export default function HomePage() {
  return (
    <div className={styles.container} data-tid="container">
      <h2>Home</h2>
      <Link to="/counter">to Counter</Link>
    </div>
  );
}
