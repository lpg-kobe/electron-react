/**
 * @desc common request of fetch
 * @author pika
 */
const fetch = require('dva/fetch');
const { API_HOST } = require('@/constants');
import { RENDERER_EVENT, rendererSend, RENDERER_CODE } from './ipc'
const { handleSuccess, handleError } = require('./reponseHandler');
import { Modal } from 'antd'
const { removeUserSession } = require('./session');

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
    'devType': 6,
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
      if (data.code !== 0) {
        // 登录过期
        if (data.code === -10 || data.code === -20 || data.code === -22) {
          const { CLOSE_PAGE } = RENDERER_CODE
          handleError(handler, data);
          Modal.warn({
            centered: true,
            content: '您的账号在其它设备登录，您已下线',
            title: '提示',
            onOk: () => {
              removeUserSession()
              rendererSend(RENDERER_EVENT.RENDERER_SEND_CODE, {
                code: CLOSE_PAGE
              })
            },
            onCancel: () => {
              removeUserSession()
              rendererSend(RENDERER_EVENT.RENDERER_SEND_CODE, {
                code: CLOSE_PAGE
              })
            }
          })
          return { status: false, data };
        }
        handleError(handler, data);
        return { status: false, data }
      }

      if (handler && handler.onSuccess) {
        handleSuccess(handler, data);
      }

      return { status: true, data };
    }, (err: any) => {
      handleError(handler, { message: '网络不给力~~' });
      return {
        err,
        status: false,
        data: {},
      };
    })
}
