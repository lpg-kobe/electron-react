/**
 * @desc common request of fetch
 * @author pika
 */

import { RENDERER_EVENT, rendererSend, RENDERER_CODE } from './ipc';
import { getUserSession } from './session';
import { getStore } from './tool';
import fetch from 'dva/fetch';
import i18n from 'i18next'
import { API_HOST } from '../constants';
import { handleSuccess, handleError } from './reponseHandler';
const fetchController = new AbortController(); // 实验性功能

interface HandlerType {
  onSuccess?: any;
}

interface ErrorType {
  response?: any;
  message?: any;
}

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
  // staus of request 0waiting 1success 2timeout
  let fetchStatus = 0;

  // 配置默认headers
  const headers = {
    'Content-Type': 'application/json;charset=UTF-8',
    devType: 6,
    'Accept-Language': getStore('userConfig')?.language || getStore('language') || 'zh',
    userToken: getUserSession()?.userToken,
    ...options?.headers,
  };

  if (options?.body && options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  // 配置默认设置
  const settings = {
    method: 'GET',
    mode: 'cors',
    signal: fetchController.signal,
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

  // 超时设置
  setTimeout(() => {
    if (fetchStatus !== 1) {
      fetchStatus = 2;
    }
  }, 5 * 1000);

  return fetch(fixUrl, settings)
    .then(checkStatus)
    .then(parseJSON)
    .then(
      (data: any) => {
        if (fetchStatus === 2) {
          handleError(handler, { message: `${i18n.t('网络不给力')}~~` });
          return {
            status: false,
            data: new Response('timeout', {
              status: 504,
              statusText: 'timeout',
            }),
          };
        } else {
          fetchStatus = 1;
        }

        if (data.code !== 0) {
          // 登录过期
          if (data.code === -10 || data.code === -20 || data.code === -22) {
            fetchController.abort();
            const { KICKED_OUT } = RENDERER_CODE;
            handleError(handler, data);
            // send kicked out notice to all window
            rendererSend(RENDERER_EVENT.RENDERER_SEND_CODE, {
              code: KICKED_OUT,
              data,
            });
            return { status: false, data };
          }
          handleError(handler, data);
          return { status: false, data };
        }

        if (handler?.onSuccess) {
          handleSuccess(handler, data);
        }

        return { status: true, data };
      },
      (err: any) => {
        handleError(handler, { message: `${i18n.t('网络不给力')}~~` });
        return {
          err,
          status: false,
          data: {},
        };
      }
    );
}
