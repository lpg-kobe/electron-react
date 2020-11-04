import React, { useState, useEffect } from 'react';
import { connect } from 'dva'
// @ts-ignore
import AForm from '@/components/form'
import { Form, Input, Button, Radio, Row, Col, message } from 'antd'
// @ts-ignore
import { setStore, getStore } from '@/utils/tool'
import styles from './style.less'

type PropsType = {
    [key: string]: any
}
function Login(props: PropsType) {
    const smsTotal: number = 60
    let smsInterVal: any = null
    const { dispatch } = props
    const [form] = Form.useForm()
    const [smsText, setSmsText] = useState('获取验证码')
    const [smsBtnDisable, setSmsBtnDisable] = useState(false)
    const [smsLogin, setSmsLogin] = useState(false)
    const formOptions = {
        options: {
            name: 'loginForm',
            form,
            onFinish: handleSubmit
        },
        items: [{
            options: {
                name: 'type',
                initialValue: 'account'
            },
            component: <Radio.Group onChange={(event) => setSmsLogin(event.target.value === 'sms')}>
                <Radio.Button value="account">账号登录</Radio.Button>
                <Radio.Button value="sms">验证码登录</Radio.Button>
            </Radio.Group>
        }, {
            options: {
                name: 'phone',
                rules: [{
                    required: true,
                    message: '手机号不能为空'
                }, {
                    pattern: /^1\d{10,11}/,
                    message: '请输入正确的手机号'
                }]
            },
            component: <Input placeholder="请输入手机号" maxLength={11} onChange={handlePhoneChange} />
        }, {
            options: {
                name: smsLogin ? 'sms' : 'password',
                rules: [{
                    required: true,
                    message: smsLogin ? '验证码不能为空' : '密码不能为空'
                }]
            },
            component: smsLogin ? <Row>
                <Col span={12}>
                    <Input placeholder="请输入验证码" maxLength={6} />
                </Col>
                <Col span={12}>
                    <Button onClick={handleSendSms} disabled={smsBtnDisable}>{smsText}</Button>
                </Col>
            </Row> : <Input placeholder="请输入密码" type="password" maxLength={20} />
        }, {
            options: {},
            component: <Button type="primary" htmlType="submit">登录</Button>
        }, {
            options: {},
            component: <a href='https://live.ofweek.com'>申请直播</a>
        }]
    }

    // handle submit form
    function handleSubmit(values: any) {
        dispatch({
            type: 'auth/login',
            payload: {
                params: values,
                onSuccess: {
                    login: () => {
                        message.success('登录成功')
                    }
                }
            }
        })
    }

    // send sms
    function handleSendSms() {
        handleSmsCount(Math.ceil(new Date().getTime() / 1000))
    }

    useEffect(() => {
        if (getStore('smsSendTime')) {
            handleSmsCount(getStore('smsSendTime'))
        }
        return () => { };
    }, []);

    // sms countdown
    function handleSmsCount(time?: any) {
        if (time) {
            setStore('smsSendTime', time)
        }
        if (smsInterVal) {
            // 清除叠加的定时器
            clearInterval(smsInterVal)
            smsInterVal = null
        }
        smsInterVal = setInterval(() => {
            const now = Math.ceil(new Date().getTime() / 1000)
            // @ts-ignore
            const smsSendTime = getStore('smsSendTime') || now
            const distance = smsTotal - (now - smsSendTime)
            if (distance > 0) {
                setSmsText(`${distance}S后重新发送`)
                setSmsBtnDisable(true)
            } else {
                setSmsText('获取验证码')
                localStorage.removeItem('smsSendTime')
                setSmsBtnDisable(false)
                clearInterval(smsInterVal)
                smsInterVal = null
            }
        }, 1000)
    }

    // handle phone change
    function handlePhoneChange(value: any) {
        const reg = new RegExp(/^1\d{10,}/)
        setSmsBtnDisable(!reg.test(value))
    }
    return <main className={`flex ${styles['login-container']}`}>
        <div className={styles['panel-l']}>企业便捷的直播平台</div>
        <div className={styles['panel-r']}>
            <div className="panel-tag">

            </div>
            <div className="panel-login">
                <AForm {...formOptions} />
            </div>
        </div>
    </main>
}
export default connect(({ auth }: any) => ({
    auth: auth.toJS()
}))(Login)