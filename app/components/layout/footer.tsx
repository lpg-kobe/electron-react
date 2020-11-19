/**
 * @desc common component of footer
 */
import React from 'react';
import { connect } from 'dva';
import { Layout } from 'antd';
import './style.less';

const CommonFooter = () => {
  const { Footer } = Layout;
  return <>
    <Footer id="commonFooter">
      <label>CPU</label>
    </Footer>
  </>
};
export default connect()(CommonFooter);
