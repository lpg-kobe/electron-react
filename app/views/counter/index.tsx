/* eslint-disable */
import React from 'react';
import { Link } from 'dva/router';
import styles from './style.css';

export default function Counter() {
  return (
    <div>
      <div className={styles.backButton} data-tid="backButton">
        <Link to='/'>
          <i className="fa fa-arrow-left fa-3x" />
        </Link>
      </div>
      <div className={`counter ${styles.counter}`} data-tid="counter">
      </div>
      <div className={styles.btnGroup}>
        <button
          className={styles.btn}
          data-tclass="btn"
          type="button">
          <i className="fa fa-plus" />
        </button>
        <button
          className={styles.btn}
          data-tclass="btn"
          type="button"
        >
          <i className="fa fa-minus" />
        </button>
        <button
          className={styles.btn}
          data-tclass="btn"
          type="button"
        >
          odd
        </button>
        <button
          className={styles.btn}
          data-tclass="btn"
          type="button"
        >
          async
        </button>
      </div>
    </div>
  );
}
/* eslint-enable */
