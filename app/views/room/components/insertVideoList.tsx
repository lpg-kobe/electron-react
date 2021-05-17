/**
 * @desc 侧边栏插播视频弹窗
 * @author pika
 */

import React, { useState } from 'react';
import { Button, Checkbox, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import AModal from '../../../components/modal';
import logger from '../../../utils/log';

const OFweekLog = logger('______Insert Video List______');

const InsertVideoList = (props: any) => {
  const {
    dispatch,
    video: { videoInsertList },
    match: {
      params: { id: roomId },
    },
  } = props;
  const { t } = useTranslation();

  const [checkAll, setCheckAll]: any = useState(false);
  const [loading, setLoading]: any = useState(false);
  const [checkList, setCheckList]: any = useState([]);

  const playWays: any = [
    {
      label: t('顺序播放'),
      key: 'direct',
      value: 0,
    },
    {
      label: t('列表循环'),
      key: 'loop',
      value: 1,
    },
  ];
  const defaultLoop = playWays[0].value;
  const [loop, setLoop]: any = useState(defaultLoop);
  const formatList = videoInsertList.map(({ videoId, videoName }: any) => ({
    label: videoName,
    value: videoId,
    disabled: false,
  }));
  const selectAlls = videoInsertList.map(({ videoId }: any) => videoId);
  const modalFooter = videoInsertList.length
    ? [
        <div className="flex-between align-center" key="modalFooter">
          <Checkbox onChange={handleCheckAll} checked={checkAll}>
            {t('全选')}
          </Checkbox>
          <Button
            disabled={!checkList.length}
            type="primary"
            onClick={handleOpen}
            loading={loading}
          >
            {t('立即播放')}
          </Button>
        </div>,
      ]
    : null;

  /** handle open insert video */
  function handleOpen() {
    OFweekLog.info('open insert video:');

    setLoading(true);
    dispatch({
      type: 'video/openInsertVideo',
      payload: {
        params: {
          roomid: roomId,
          type: loop,
          videoids: checkList.join(','),
        },
        onSuccess: {
          operate: () => {
            setLoading(false);
            dispatch({
              type: 'video/save',
              payload: {
                videoInsertShow: false,
              },
            });
          },
        },
      },
    });
  }

  /** handle toggle of check all */
  function handleCheckAll({ target: { checked } }: any) {
    setCheckList(checked ? selectAlls : []);
    setCheckAll(checked);
  }

  /** handle group change */
  function handleGroupChange(value: Array<any>) {
    setCheckList(value);
    setCheckAll(value.length === selectAlls.length);
  }

  return (
    <AModal
      width={480}
      footer={modalFooter}
      visible={true}
      title={<h1 className="ofweek-modal-title z2">{t('插播视频')}</h1>}
      onCancel={() =>
        dispatch({
          type: 'video/save',
          payload: {
            videoInsertShow: false,
          },
        })
      }
      className="ofweek-modal insert-video small"
    >
      {videoInsertList.length ? (
        <>
          <div className="title-wrap">
            <label>{t('播放方式')}</label>
            <Select
              placeholder={t('请选择播放方式')}
              defaultValue={defaultLoop}
              style={{ minWidth: '250px', marginLeft: '10px' }}
              onChange={(value) => setLoop(value)}
            >
              {playWays.map(({ key, value, label }: any) => (
                <Select.Option key={key} value={value}>
                  {label}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className="list-wrap">
            <Checkbox.Group
              className="check-group-vertical"
              value={checkList}
              options={formatList}
              onChange={handleGroupChange}
            />
          </div>
        </>
      ) : (
        <h3 className="empty">{t('暂无插播视频，请联系管理员添加')}</h3>
      )}
    </AModal>
  );
};

export default InsertVideoList;
