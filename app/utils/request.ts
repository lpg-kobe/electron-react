import { message } from 'antd';
// @ts-ignore
import { MAIN_EVENT, rendererSend } from '@/utils/ipc'

/**
 * @desc common request of fetch
 * @author pika
 */
const fetch = require('dva/fetch');
const { API_HOST } = require('@/constants');
const { handleSuccess, handleError } = require('./reponseHandler');
const { removeUserSession } = require('./session');

const expireValveDuration = 10e3; // 接口过期处理后多少秒内保持静默，默认10秒
let expireValveOn = false; // 接口过期处理开关

type HandlerType = {
  onSuccess?: any;
};

type ErrorType = {
  response?: any;
  message?: any;
};

function parseJSON(response: any): any {
  return response.json();
}

function checkStatus(response: any): any {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }

  const error: ErrorType = new Error(response.statusText);
  error.response = response;
  throw error;
}

/**
 * Requests a URL, returning a promise.
 *
 * @param  {string} url       The URL we want to request
 * @param  {object} [options] The options we want to pass to "fetch"
 * @param  {object} [handler] The handler callback after "fetch"
 * @return {object}           An object containing either "data" or "err"
 */
export default function request(
  url: string,
  options: any,
  handler: HandlerType
) {
  const token = '';
  // 配置默认headers
  const headers = {
    'Content-Type': 'application/json;charset=UTF-8',
    ...options?.headers,
  };
  if (options?.body && options.body instanceof FormData) {
    delete headers['Content-Type'];
  }
  if (token) {
    headers['header-token'] = token;
  }

  // 配置默认设置
  const settings = {
    method: 'GET',
    mode: 'cors',
    credentials: 'include',
    ...options,
    headers,
  };
  // 修复url中多余的斜杠
  const fixUrl = (API_HOST + url)
    .replace(/\/\//g, '/')
    .replace(/:\/([^/])/, '://$1');
  // 非GET方式不允许缓存
  if (settings.method.toUpperCase() !== 'GET') {
    settings['Cache-Control'] = 'no-cache';
  }
  return fetch(fixUrl, settings)
    .then(checkStatus)
    .then(parseJSON)
    .then((data: any) => {
      if ((data.code === -10 || data.code === -20 || data.code === -22) && !expireValveOn) {
        // 会话已失效
        message.error('登录已过期，请重新登录')
        expireValveOn = true;
        removeUserSession();
        // rendererSend(MAIN_EVENT.MAIN_CLOSE_TOLOG)
        setTimeout(() => (expireValveOn = false), expireValveDuration);
      } else if (data.code !== 0) {
        message.error(data.message);
        return {
          status: false,
          data,
        };
      }

      if (handler && handler.onSuccess) {
        handleSuccess(handler, data);
      }

      return { status: true, data };
    })
    .catch((err: any) => {
      handleError(handler);
      return {
        err,
        status: false,
        data: {},
      };
    });
}
