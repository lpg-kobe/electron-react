/**
 * @desc common tool
 * @author pika
 */

import { v4 as uuidv4 } from 'uuid';
// random guid base Number(16)
export const createGUID = () => {
  return uuidv4();
};
