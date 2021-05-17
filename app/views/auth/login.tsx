import React, { useState, useEffect } from 'react';
import { connect } from 'dva';
import { withRouter } from 'dva/router';
import AForm from '@/components/form';
import TitleBar from '@/components/layout/titleBar';
import { Form, Input, Button, Row, Checkbox, message } from 'antd';
import { shell } from 'electron';
import { useTranslation } from 'react-i18next';
import {
  setStore,
  getStore,
  removeStore,
  loopToInterval,
  judgeRouterUrl,
} from '@/utils/tool';
import { saveUserSession } from '@/utils/session';
import logger from '@/utils/log';
import { rendererSend, rendererInvoke, MAIN_EVENT } from '@/utils/ipc';
import { DEFAULT_WINDOW_SIZE } from '@/constants';
import './style.less';

interface PropsType {
  [key: string]: any;
}

interface FormType {
  [key: string]: any;
}

const OFweekLog = logger('______Login Page______');

// close luanch-page after drawed this page
window.setTimeout(() => {
  rendererSend(MAIN_EVENT.MAIN_LOAD_READY);
}, 2400);

function Login(props: PropsType) {
  const { t } = useTranslation();
  const { dispatch } = props;
  const smsTotal = 60;
  let smsTimer: any = null;
  const [form]: [FormType] = Form.useForm();
  const [smsText, setSmsText] = useState(t('获取验证码'));
  const [smsBtnDisable, setSmsBtnDisable] = useState(true);
  const [smsLogin, setSmsLogin] = useState(false);
  const formOptions = {
    options: {
      name: 'loginForm',
      // preserve: false,
      form,
      onFinish: handleSubmit,
      initialValues: getStore('userAccount')
        ? {
            remember: true,
            account: getStore('userAccount').account,
            password: getStore('userAccount').password,
          }
        : {
            remember: false,
            account: '',
            password: '',
          },
    },
    items: [
      {
        options: {},
        component: (
          <div className="login-tab">
            <a
              className={smsLogin ? '' : 'active'}
              data-type="account"
              title={t('密码登录')}
              onClick={handleLoginChange}
            >
              {t('密码登录')}
            </a>
            <a
              className={smsLogin ? 'active' : ''}
              data-type="sms"
              title={t('验证码登录')}
              onClick={handleLoginChange}
            >
              {t('验证码登录')}
            </a>
          </div>
        ),
      },
      {
        options: {
          name: smsLogin ? 'phone' : 'account',
          rules: [
            {
              required: true,
              message: t('请输入手机号'),
            },
            {
              pattern: /^1\d{10,11}/,
              message: t('请输入正确的手机号'),
            },
          ],
        },
        component: smsLogin ? (
          <Input
            placeholder={t('手机号')}
            maxLength={11}
            onChange={({ target: { value } }: any) =>
              handlePhoneChange('phone', value)
            }
          />
        ) : (
          <Input
            placeholder={t('手机号')}
            maxLength={11}
            onChange={({ target: { value } }: any) =>
              handlePhoneChange('account', value)
            }
          />
        ),
      },
      {
        options: {
          name: smsLogin ? 'code' : 'password',
          rules: smsLogin
            ? [
                {
                  required: true,
                  message: t('请输入验证码'),
                },
                {
                  pattern: /\d/,
                  message: t('请输入正确的验证码'),
                },
              ]
            : [
                {
                  required: true,
                  message: t('请输入密码'),
                },
              ],
        },
        component: smsLogin ? (
          <Row>
            <Input
              className="sms-input"
              placeholder={t('验证码')}
              maxLength={6}
              onChange={({ target: { value } }: any) =>
                formatNumber('code', value)
              }
            />
            <Button
              onClick={handleSendSms}
              disabled={smsBtnDisable}
              className="sms-btn"
            >
              {smsText}
            </Button>
          </Row>
        ) : (
          <Input placeholder={t('密码')} type="password" maxLength={20} />
        ),
      },
      {
        options: {},
        component: (
          <Button type="primary" htmlType="submit" className="login-btn">
            {t('登录')}
          </Button>
        ),
      },
      {
        items: [
          {
            options: {
              name: 'remember',
              valuePropName: 'checked',
            },
            component: smsLogin ? null : <Checkbox>{t('记住密码')}</Checkbox>,
          },
          {
            options: {},
            component: (
              <a className="ofweek-link" onClick={handleOpenWindow}>
                {t('申请直播')}
              </a>
            ),
          },
        ],
      },
    ],
  };

  /** 打开默认浏览器申请直播 */
  function handleOpenWindow() {
    shell.openExternal('https://live.ofweek.com');
  }

  /**
   * @desc format formitem to number
   * @param {String} key item name to set
   * @param {String} value item value to set
   */
  function formatNumber(key: string, value: any) {
    form.setFieldsValue({
      [key]: value.replace(/\D/g, ''),
    });
  }

  // validate phone or not
  function isValidatePhone(phone?: any) {
    const reg = new RegExp(/^1\d{10,11}/);
    return reg.test(phone);
  }

  // handle login type change
  function handleLoginChange({
    target: {
      dataset: { type },
    },
  }: any) {
    const smsType = type === 'sms';
    setSmsLogin(smsType);
    // form.resetFields()
  }

  // handle submit form
  function handleSubmit(values: any) {
    dispatch({
      type: smsLogin ? 'auth/smsLogin' : 'auth/login',
      payload: {
        params: smsLogin
          ? {
              mobile: values.phone,
              code: values.code,
            }
          : values,
        onSuccess: {
          login: ({ data }: any) => {
            if (data && data.isAuthorOrGuest === 0) {
              message.error(t('您还不是主播，请点击右下方申请直播'));
              return;
            }

            OFweekLog.info('user login by application:', __PACKAGE_DATE__);
            message.success(t('登录成功'));
            saveUserSession(data);

            // 登录之后将之前上麦的房间挤下线并发送下麦广播
            if (data?.needOverRoomIds?.length) {
              dispatch({
                type: 'room/exitRoom',
                payload: {
                  params: {
                    roomid: data.needOverRoomIds[0],
                  },
                  onSuccess: {
                    offLine: () => {},
                  },
                  onError: {
                    offLine: () => {},
                  },
                },
              });
            }

            // 账号密码登录成功后记录记住的密码，目前只记住一个账号
            if (!smsLogin) {
              if (form.getFieldValue('remember')) {
                setStore('userAccount', {
                  account: values.account,
                  password: values.password,
                });
              } else {
                removeStore('userAccount');
              }
            }
            rendererInvoke(
              MAIN_EVENT.MAIN_OPEN_PAGE,
              {
                ...DEFAULT_WINDOW_SIZE.MAIN,
                maximizable: false,
                namespace: 'mainWindow',
                closeNamespace: 'loginWindow',
                url: judgeRouterUrl(''),
              },
              () => {}
            );
          },
        },
      },
    });
  }

  // send sms
  function handleSendSms() {
    const mobile = form.getFieldValue('phone');
    dispatch({
      type: 'auth/sendSms',
      payload: {
        params: {
          mobile,
        },
        onSuccess: {
          sms: () => {
            message.success(t('验证码已发送'));
            handleSmsCount(Math.ceil(new Date().getTime() / 1000));
          },
        },
      },
    });
  }

  useEffect(() => {
    if (getStore('smsSendTime')) {
      handleSmsCount(getStore('smsSendTime'));
    }
    return () => {};
  }, []);

  // sms countdown
  function handleSmsCount(time?: any) {
    if (time) {
      setStore('smsSendTime', time);
    }
    smsTimer = loopToInterval(
      () => {
        const now = Math.ceil(new Date().getTime() / 1000);
        // @ts-ignore
        const smsSendTime = getStore('smsSendTime') || now;
        const distance = smsTotal - (now - smsSendTime);
        if (distance > 0) {
          setSmsText(`${distance}s${t('后重新发送')}`);
          setSmsBtnDisable(true);
          return true;
        } else {
          setSmsText(t('获取验证码'));
          removeStore('smsSendTime');
          setSmsBtnDisable(false);
          return false;
        }
      },
      smsTimer,
      1000
    );
  }

  // handle phone change
  function handlePhoneChange(type: string, value: any) {
    formatNumber(type, value);
    // 验证码倒计时不做处理
    if (!getStore('smsSendTime')) {
      setSmsBtnDisable(!isValidatePhone(value));
    }
  }
  return (
    <main className="login-page-container flex">
      <div className="panel-l">
        <div className="login-desc">
          <div className="notice">
            <i className="icon-camera" />
            <h3>{t('企业便捷的直播平台')}</h3>
          </div>
          <label className="version">V1.0</label>
        </div>
      </div>
      <div className="panel-r">
        <TitleBar />
        <AForm {...formOptions} />
      </div>
    </main>
  );
}
export default withRouter(
  connect(({ auth, room }: any) => ({
    auth: auth.toJS(),
    room: room.toJS(),
  }))(Login)
);
