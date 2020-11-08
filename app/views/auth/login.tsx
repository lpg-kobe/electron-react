import React, { useState, useEffect } from 'react';
import { connect } from 'dva';
// @ts-ignore
import { withRouter } from 'dva/router';
// @ts-ignore
import AForm from '@/components/form';
// @ts-ignore
import TitleBar from '@/components/layout/titleBar';
import { Form, Input, Button, Row, Checkbox, message } from 'antd';
// @ts-ignore
import { setStore, getStore, removeStore } from '@/utils/tool';
import {
  saveUserSession
  // @ts-ignore
} from '@/utils/session';
// @ts-ignore
import { setWindowSize } from '@/utils/ipc';
import './style.less';

type PropsType = {
  [key: string]: any;
};

type FormType = {
  [key: string]: any;
};

function Login(props: PropsType) {
  const smsTotal: number = 60;
  let smsInterVal: any = null;
  const { dispatch } = props;
  const [form]: [FormType] = Form.useForm();
  const [smsText, setSmsText] = useState('获取验证码');
  const [smsBtnDisable, setSmsBtnDisable] = useState(true);
  const [smsLogin, setSmsLogin] = useState(false);
  const [rememberPwd, setRememberPwd] = useState(false);
  const formOptions = {
    options: {
      name: 'loginForm',
      form,
      onFinish: handleSubmit,
    },
    items: [
      {
        options: {},
        component: (
          <div className="login-tab">
            <a className={smsLogin ? '' : 'active'} data-type="account" onClick={handleLoginChange}>账号登录</a>
            <a className={smsLogin ? 'active' : ''} data-type="sms" onClick={handleLoginChange}>手机登录</a>
          </div >
        ),
      },
      {
        options: {
          name: 'account',
          initialValue: smsLogin ? '' : getStore('userAccount') && getStore('userAccount').account,
          rules: [
            {
              required: true,
              message: '请输入手机号',
            },
            {
              pattern: /^1\d{10,11}/,
              message: '请输入正确的手机号',
            },
          ],
        },
        component: (
          <Input
            placeholder="手机号"
            maxLength={11}
            onChange={handlePhoneChange}
          />
        ),
      },
      {
        options: {
          name: smsLogin ? 'code' : 'password',
          initialValue: smsLogin ? '' : getStore('userAccount') && getStore('userAccount').password,
          rules: smsLogin
            ? [
              {
                required: true,
                message: '请输入验证码',
              },
              {
                pattern: /\d/,
                message: '请输入正确的验证码',
              },
            ]
            : [
              {
                required: true,
                message: '请输入密码',
              },
            ],
        },
        component: smsLogin ?
          <Row>
            <Input className="sms-input" placeholder="验证码" maxLength={6} onChange={({ target: { value } }) => formatNumber('sms', value)} />
            <Button onClick={handleSendSms} disabled={smsBtnDisable} className="sms-btn">{smsText}</Button>
          </Row> : <Input placeholder="密码" type="password" maxLength={20} />
      },
      {
        options: {},
        component: (
          <Button type="primary" htmlType="submit">
            登录
          </Button>
        ),
      },
      {
        items: [{
          options: {
            name: 'remember',
            valuePropName: 'checked',
            initialValue: smsLogin ? false : !!getStore('userAccount')
          },
          component: smsLogin ? null : <Checkbox onChange={({ target: checked }: any) => setRememberPwd(!!checked)}>记住密码</Checkbox>
        }, {
          options: {},
          component: <a href="https://live.ofweek.com" className="ofweek-link">申请直播</a>
        }],
      },
    ],
  };

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

  // handle login type change
  function handleLoginChange({ target: { dataset: { type } } }: any) {
    form.resetFields()
    setSmsLogin(type === 'sms');
  }

  // handle submit form
  function handleSubmit(values: any) {
    dispatch({
      type: smsLogin ? 'auth/smsLogin' : 'auth/login',
      payload: {
        params: smsLogin
          ? {
            mobile: values.account,
            code: values.code,
          }
          : values,
        onSuccess: {
          login: ({ data }: any) => {
            saveUserSession(data)
            message.success('登录成功');
            setWindowSize()
            // 账号密码登录成功后记录记住的密码
            if (!smsLogin && rememberPwd) {
              setStore('userAccount', {
                account: values.account,
                password: values.password,
              })
            } else {
              removeStore('userAccount')
            }
            window.location.hash = "#/"
          },
        },
      },
    });
  }

  // send sms
  function handleSendSms() {
    const mobile = form.getFieldValue('account');
    dispatch({
      type: 'auth/sendSms',
      payload: {
        params: {
          mobile,
        },
        onSuccess: {
          sms: () => {
            message.success('验证码已发送');
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
    return () => { };
  }, []);

  // sms countdown
  function handleSmsCount(time?: any) {
    if (time) {
      setStore('smsSendTime', time);
    }
    if (smsInterVal) {
      // 清除叠加的定时器
      clearInterval(smsInterVal);
      smsInterVal = null;
    }
    smsInterVal = setInterval(() => {
      const now = Math.ceil(new Date().getTime() / 1000);
      // @ts-ignore
      const smsSendTime = getStore('smsSendTime') || now;
      const distance = smsTotal - (now - smsSendTime);
      if (distance > 0) {
        setSmsText(`${distance}s后重新发送`);
        setSmsBtnDisable(true);
      } else {
        setSmsText('获取验证码');
        localStorage.removeItem('smsSendTime');
        setSmsBtnDisable(false);
        clearInterval(smsInterVal);
        smsInterVal = null;
      }
    }, 1000);
  }

  // handle phone change
  function handlePhoneChange({ target: { value } }: any) {
    formatNumber('phone', value);
    const reg = new RegExp(/^1\d{10,11}/);
    // 验证码倒计时不做处理
    if (!getStore('smsSendTime')) {
      setSmsBtnDisable(!reg.test(value));
    }
  }
  return (
    <main className="login-page-container flex">
      <div className="panel-l">
        <div className="login-desc">
          <div className="notice">
            <i className="icon-camera"></i>
            <h3>企业便捷的直播平台</h3>
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
  connect(({ auth }: any) => ({
    auth: auth.toJS(),
  }))(Login)
);
