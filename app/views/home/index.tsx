import React, { ReactNode, useRef } from 'react';
import { Link } from 'dva/router';
import { connect } from 'dva';
import { Button } from 'antd';
// @ts-ignore
import { SDK_APP_ID } from '@/constants';
import styles from './style.less';

type Props = {
  children: ReactNode;
  [key: string]: any;
};

function HomePage(props: Props) {
  const {
    system: { TRTCCloud },
  } = props;
  const cameraRef = useRef(null);
  const trtcCloud = new TRTCCloud({
    sdkAppId: SDK_APP_ID,
  });
  return (
    <div className={styles.container} data-tid="container">
      <Button onClick={() => trtcCloud.openCamera(cameraRef.current)}>
        open cemara
      </Button>
      <div className="video-area" ref={cameraRef} />
      <Link to="/counter">to Counter</Link>
    </div>
  );
}
export default connect(({ system }: any) => ({
  system: system.toJS(),
}))(HomePage);
