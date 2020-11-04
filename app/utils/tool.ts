/**
 * @desc common tool
 * @author pika
 */

// @ts-nocheck
import { v4 as uuidv4 } from 'uuid';

// random guid base Number(16)
export function createGUID() { return uuidv4() };

export function getStore(name: any) { return localStorage.getItem(name) }

export function setStore(key: any, value: any) { return localStorage.setItem(key, value) }
