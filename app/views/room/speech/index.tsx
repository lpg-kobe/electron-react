/**
 * @desc 主播 | 嘉宾演讲稿演示
 * @author pika
 */

import React, { memo } from 'react';
import immutable from 'immutable';
import { useTranslation } from 'react-i18next';
import Loading from '../../../components/loading';
import logger from '../../../utils/log';

const OFweekLog = logger('______Speech Info______');

const Speech = (props: any) => {
  const {
    dispatch,
    speech: {
      speechPageIndex,
      speechFullScreen,
      speechPageLoading,
      speechInfo: { pages, id: speechId },
    },
    room: { roomOpenSpeechOther },
    match: {
      params: { id: roomId },
    },
  } = props;
  const { t } = useTranslation();

  /** handle change page of speech */
  function handleTurnSpeech(count: number) {
    OFweekLog.info('点击演讲稿翻页:');

    const toPage = Math.max(1, Math.min(pages.length, speechPageIndex + count));
    if (toPage === speechPageIndex || speechPageLoading) {
      return;
    }
    dispatch({
      type: 'speech/save',
      payload: {
        speechPageLoading: true,
      },
    });
    dispatch({
      type: 'speech/turnPage',
      payload: {
        params: {
          pageNum: toPage,
          pageUrl: pages[toPage - 1].url,
          roomId,
          speechId,
        },
        onSuccess: {
          operate: () => {
            dispatch({
              type: 'speech/save',
              payload: {
                speechPageIndex: toPage,
              },
            });
          },
        },
      },
    });
  }

  /** close speech */
  function handleCloseSpeech() {
    OFweekLog.info('点击演讲稿关闭:');

    dispatch({
      type: 'speech/closeSpeech',
      payload: {
        params: {
          roomid: roomId,
          speechid: speechId,
        },
      },
    });
  }

  /** full screen speech */
  function handleFullSpeech() {
    OFweekLog.info('切换演讲稿全屏:');

    dispatch({
      type: 'speech/save',
      payload: {
        speechFullScreen: true,
      },
    });
  }

  return pages?.length ? (
    <div className="speech-container">
      {!speechFullScreen && !roomOpenSpeechOther ? (
        <i
          className="icon icon-close"
          title={t('关闭演讲稿')}
          onClick={handleCloseSpeech}
        />
      ) : null}
      {!speechFullScreen && (
        <i
          className="icon icon-full-screen"
          title={t('全屏演示')}
          onClick={handleFullSpeech}
        />
      )}
      <div
        className="speech-wrap"
        style={{ transform: `translateX(-${(speechPageIndex - 1) * 100}%)` }}
      >
        <ul style={{ width: `${pages.length * 100}%` }}>
          {pages.map((ppt: any) => (
            <li key={Math.random()} className="wrap-item">
              <img src={ppt.url} alt={`page-${ppt.page}`} />
            </li>
          ))}
        </ul>
      </div>
      <div className="speech-controll">
        {!roomOpenSpeechOther && (
          <i
            title={t('上一页')}
            className={`icon icon-prev${
              speechPageIndex <= 1 || speechPageLoading ? ' disabled' : ''
            }`}
            onClick={() => handleTurnSpeech(-1)}
          />
        )}
        <label>
          {speechPageIndex}/{pages.length}
        </label>
        {!roomOpenSpeechOther && (
          <i
            title={t('下一页')}
            className={`icon icon-next${
              speechPageIndex >= pages.length || speechPageLoading
                ? ' disabled'
                : ''
            }`}
            onClick={() => handleTurnSpeech(1)}
          />
        )}
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default memo(Speech, (prevProps, nextProps) => {
  const prevMap = immutable.fromJS({
    speech: prevProps.speech,
    room: prevProps.room,
  });
  const nextMap = immutable.fromJS({
    speech: nextProps.speech,
    room: nextProps.room,
  });
  return immutable.is(prevMap, nextMap);
});
