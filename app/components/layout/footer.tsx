/**
 * @desc common component of footer
 * @author pika
 */

import React, { memo, useState, useEffect } from 'react';
import immutable from 'immutable';
import { useTranslation } from 'react-i18next';
import { Layout } from 'antd';
import { checkFps, loopToInterval } from '../../utils/tool';
import './style.less';

const CommonFooter = (props: any) => {
  const { Footer } = Layout;
  const { t } = useTranslation();
  let curFps = 60;
  const {
    system: {
      rtcClient,
      qualityMap,
      netQuality,
      statistics: { rtt, systemCpu, upLoss, downLoss },
    },
    // chat: { memberList },
    room: { roomIsBegin },
    video: { videoStreamType },
  } = props;

  const [fps, setFps] = useState(60);

  useEffect(() => {
    let timer = null;

    checkFps((num: number) => {
      curFps = num;
    })();

    timer = loopToInterval(
      () => {
        setFps(curFps);
        return curFps;
      },
      timer,
      3 * 1000
    );
  }, []);

  return (
    <Footer id="commonFooter">
      {roomIsBegin && videoStreamType === 'camera' && (
        <>
          <label>
            {t('CPU使用率')}：{systemCpu}%
          </label>
          <label>
            {t('延迟')}：{rtt}ms
          </label>
          <label>
            {t('上行丢包率')}：{upLoss}%
          </label>
          <label>
            {t('下行丢包率')}：{downLoss}%
          </label>
          <label>
            {t('上行码率')}：
            {rtcClient?.trtcInstance?.videoEncParam?.videoBitrate}
            kbps
          </label>
          <label>
            {t('当前网络')}：{t(qualityMap[netQuality])}
          </label>
        </>
      )}
      {/* <label>房间人数：{memberList.length}</label> */}
      <label>
        {t('当前帧率')}：{fps}fps
      </label>
    </Footer>
  );
};
export default memo(CommonFooter, (prevProps, nextProps) => {
  const prevMap = immutable.fromJS({
    system: prevProps.system,
    chat: prevProps.chat,
    room: prevProps.room,
    video: prevProps.video,
  });
  const nextMap = immutable.fromJS({
    system: nextProps.system,
    chat: nextProps.chat,
    room: nextProps.room,
    video: nextProps.video,
  });
  return immutable.is(prevMap, nextMap);
});
