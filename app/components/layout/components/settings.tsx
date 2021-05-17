/**
 * @desc 公用设置组件
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, Select, Form, Button } from 'antd';
import { connect } from 'dva';
import AModal from '@/components/modal';
import AForm from '@/components/form';
import { getStore, setStore } from '@/utils/tool';
import { rendererSend, RENDERER_EVENT, RENDERER_CODE } from '@/utils/ipc';

const Settings = (props: any) => {
  const {
    visible,
    onOk,
    onCancel,
    room: { roomLanguage },
  } = props;

  const { TabPane } = Tabs;
  const { Option } = Select;
  const [langForm] = Form.useForm();

  const { t } = useTranslation();
  const langs = [
    {
      label: t('中文'),
      value: 'zh',
      key: 'chinese',
    },
    {
      label: t('英语'),
      value: 'en',
      key: 'english',
    },
    {
      label: t('日语'),
      value: 'ja',
      key: 'japanese',
    },
    {
      label: t('西班牙语'),
      value: 'es',
      key: 'spanish',
    },
  ];
  const langFormOpts = {
    options: {
      name: 'langForm',
      form: langForm,
      onFinish: handleSubmit,
      initialValues: {
        language:
          getStore('userConfig')?.language ||
          roomLanguage ||
          getStore('language') ||
          langs[0].value,
      },
    },
    items: [
      {
        options: {
          name: 'language',
          label: t('直播语言'),
          rules: [
            {
              required: true,
              message: t('请选择直播语言'),
            },
          ],
        },
        component: (
          <Select placeholder={t('选择直播语言')}>
            {langs.map(({ key, value, label }: any) => (
              <Option value={value} key={key}>
                {label}
              </Option>
            ))}
          </Select>
        ),
      },
    ],
  };
  const tabs = [
    {
      key: 'lang',
      title: t('语言设置'),
      component: (
        <div className="setting-panel lang">
          <AForm {...langFormOpts} />
        </div>
      ),
    },
  ];

  function handleSubmit() {
    langForm.validateFields().then(({ language }: any) => {
      // update local setting of user
      const config = getStore('userConfig');
      setStore('userConfig', {
        ...config,
        language,
      });
      onOk?.();

      const { CHANGE_SETTING } = RENDERER_CODE;
      const { RENDERER_SEND_CODE } = RENDERER_EVENT;
      // send msg to other window to change setting
      rendererSend(RENDERER_SEND_CODE, {
        code: CHANGE_SETTING,
        data: {
          value: {
            language,
          },
        },
      });
    });
  }

  return (
    <AModal
      width={600}
      title={<h1 className="ofweek-modal-title z2">{t('设置')}</h1>}
      footer={[
        <Button type="primary" key="save" onClick={handleSubmit}>
          {t('保存')}
        </Button>,
      ]}
      visible={visible}
      onCancel={onCancel}
      className="ofweek-modal settings small"
    >
      <Tabs tabPosition="left" defaultActiveKey={tabs[0]?.key}>
        {tabs.map((tab) => (
          <TabPane key={tab.key} tab={tab.title}>
            {tab.component}
          </TabPane>
        ))}
      </Tabs>
    </AModal>
  );
};

export default connect(({ room }: any) => ({
  room: room.toJS(),
}))(Settings);
