/**
 * @desc page only for local demo, don do anything on it
 */
import React, { useRef } from 'react';
import { SDK_APP_ID } from '@/constants';
import { connect } from 'dva';
import TrtcElectronVideocast from '@/sdk/trtc-electron-videocast';
import { Button } from 'antd';
const Demo = (props: any) => {
  const ref: any = useRef(null);
  let client: any = null;
  const userSig =
    'eJwtzF0LgjAUBuD-suuQM-WoE7owKSm8GBSBl8mmHMWQtUqK-ntmu3w-eN7sVB49UvpqqSFtWMo4F2y11HoayWiWckT0AeDf3qidX7V8ZZsiP8gYg*0zy0Uz3M*R2Ve2TKbKdEXdSSjrne1h7bjHwvseuGxp*OERF8gRktjxqr*MI6l5CQGCKBYhfL4KJC*v';
  const { dispatch } = props;
  function enterRoom() {
    // 进房之前获取房间秘钥
    client = new TrtcElectronVideocast({
      sdkAppId: SDK_APP_ID,
      userId: '119',
      imLogin: false,
      userSig,
    });
    dispatch({
      type: 'room/getRoomPrivateKey',
      payload: {
        params: {
          roomid: 104,
        },
        onSuccess: {
          operate: ({ data }: any) => {
            const { trtcPrivateSig } = data;
            client.enterRoom({
              roomId: 104,
              userId: '119',
              userSig,
              privateKey: trtcPrivateSig,
            });
            client.openCamera(ref.current);
          },
        },
      },
    });
  }

  return (
    <>
      <Button onClick={enterRoom}>enterRoom</Button>
      <div
        ref={ref}
        style={{ height: '240px', width: '240px', border: '1px solid #333' }}
      />
    </>
  );
};

export default connect(({ system }: any) => ({ system: system.toJS() }))(Demo);
