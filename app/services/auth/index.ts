/**
 * @desc api services of auth
 */

const request = require('@/utils/request')
type ParamType = {
    [key: string]: any
}
export function login({ params, ...handler }: ParamType): any {
    return request('/login/memberlogin', {
        mathod: 'post',
        body: JSON.stringify(params)
    }, handler)
}