/**
 * @desc api services of common
 */

// @ts-ignore
import request from '@/utils/request';
// @ts-ignore
import qs from 'qs';

type ParamType = {
  [key: string]: any;
};

// get list of table
export function getTableData({ url, tableId, ...params }: ParamType): any {
  return request(`${url}?${qs.stringify(params)}`, { method: 'get' });
}
