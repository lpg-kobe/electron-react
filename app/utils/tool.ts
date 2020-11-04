/**
 * @desc common tool
 * @author pika
 */

const { v4 } = require('uuid');

// random guid base Number(16)
export function createGUID() {
  return v4();
}

export function getStore(name: any) {
  return localStorage.getItem(name);
}

export function setStore(key: any, value: any) {
  return localStorage.setItem(key, value);
}
