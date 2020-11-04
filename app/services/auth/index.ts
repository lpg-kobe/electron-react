/**
 * @desc api services of auth
 */

import request from '../../utils/request';

type ParamType = {
  [key: string]: any;
};

export function login({ params, ...handler }: ParamType): any {
  return request(
    '/login/memberlogin',
    {
      method: 'post',
      body: JSON.stringify(params),
    },
    handler
  );
}
