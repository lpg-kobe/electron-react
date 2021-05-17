/**
 * @desc 演讲稿弹窗
 * @author pika
 */

import React, { memo, useEffect } from 'react';
import { Button, message } from 'antd';
import immutable from 'immutable';
import { useTranslation } from 'react-i18next';
// @ts-ignore
import AModal from '@/components/modal';
// @ts-ignore
import ATable from '@/components/table';

const SpeechList = (props: any) => {
  const {
    dispatch,
    speech: { list },
    room: { roomWatchMode },
    match: {
      params: { id: roomId },
    },
  } = props;
  const { t } = useTranslation();

  useEffect(() => {
    dispatch({
      type: 'speech/getList',
      payload: {
        params: {
          roomid: roomId,
        },
      },
    });
    return () => {};
  }, []);

  const tableOpts = {
    showIndex: false,
    size: 'small',
    scroll: {
      y: 520,
    },
    rowKey: 'id',
    columns: [
      {
        title: t('名称'),
        key: 'name',
        ellipsis: true,
        textWrap: 'no-wrap',
        dataIndex: 'name',
      },
      {
        title: t('大小'),
        key: 'fileSize',
        dataIndex: 'fileSize',
      },
      {
        title: t('操作'),
        key: 'operate',
        render: (row: Object) => (
          <Button
            size="small"
            type="primary"
            ghost
            onClick={() => handleOpenSpeech(row)}
          >
            {t('演示')}
          </Button>
        ),
      },
    ],
    dataSource: list || [],
  };

  /** handle open speech */
  function handleOpenSpeech(speech: any) {
    const { id } = speech;
    dispatch({
      type: 'speech/save',
      payload: {
        speechInfo: speech,
        speechModalShow: false,
        speechPageIndex: 1,
      },
    });
    dispatch({
      type: 'speech/getInfo',
      payload: {
        params: { speechid: id },
        onSuccess: {
          operate: ({ data: { pages } }: any) => {
            // api翻页接口通知后台开启ppt直播
            dispatch({
              type: 'speech/turnPage',
              payload: {
                params: {
                  pageNum: 1,
                  pageUrl: pages[0].url,
                  roomId,
                  speechId: id,
                },
              },
            });
            dispatch({
              type: 'room/save',
              payload: {
                roomWatchMode: Math.max(roomWatchMode, 1),
                roomOpenSpeech: true,
                roomOpenSpeechOther: false,
              },
            });
          },
        },
        onError: {
          operate: () => {
            message.error(t('当前网络状态不佳，请检查网络后重试'));
          },
        },
      },
    });
  }

  return (
    <AModal
      width={600}
      footer={null}
      visible={true}
      title={<h1 className="ofweek-modal-title z2">{t('演讲稿')}</h1>}
      onCancel={() =>
        dispatch({
          type: 'speech/save',
          payload: {
            speechModalShow: false,
          },
        })
      }
      className="ofweek-modal speech-list small"
    >
      <ATable {...tableOpts} />
    </AModal>
  );
};

export default memo(SpeechList, (prevProps, nextProps) => {
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
