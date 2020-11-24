/**
 * @desc api services of auth
 */

// @ts-ignore
import request from '@/utils/request';
// @ts-ignore
import qs from 'qs';

type ParamType = {
  [key: string]: any;
};

// 用户登录
export function login({ params, ...handler }: ParamType): any {
  return request(
    `/web/login/memberlogin?${qs.stringify(params)}`,
    { method: 'post' },
    handler
  );
}

// 验证码登录
export function smsLogin({ params, ...handler }: ParamType): any {
  return request(
    `/web/login/quickRegOrLogin?${qs.stringify(params)}`,
    { method: 'post' },
    handler
  );
}

// 发送验证码
export function sendSms({ params, ...handler }: ParamType): any {
  return request(
    `/web/login/sendSMSValicode?${qs.stringify(params)}`,
    {
      method: 'post',
    },
    handler
  );
}
