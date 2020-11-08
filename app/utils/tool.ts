/**
 * @desc common tool
 * @author pika
 */

type StorageType = {
  [key: string]: any;
};

const { v4 } = require('uuid');

// random guid base Number(16)
export function createGUID() {
  return v4();
}

export function getStore(name: any) {
  try {
    // @ts-ignore
    return JSON.parse(localStorage.getItem(name))
  } catch (error) {
    console.warn('can not parse user object witch you want to get...');
    // @ts-ignore
    return {}
  }
}

export function setStore(key: any, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('can not stringify user object witch you want to save...');
    localStorage.setItem(key, JSON.stringify({}));
  }
}

export function removeStore(key: any) {
  return localStorage.removeItem(key);
}
