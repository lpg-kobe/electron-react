/**
 * @desc main config of i18n
 * @author pika
 */

import i18n from "i18next";
import zhCnTrans from "../../resources/locales/zh.json";
import enUsTrans from "../../resources/locales/en.json";
import jaTrans from "../../resources/locales/ja.json";
import esTrans from "../../resources/locales/es.json";
import { getStore } from './tool'
import {
  initReactI18next
} from 'react-i18next';

i18n.use(initReactI18next)
  .init({
    resources: {
      zh: {
        translation: zhCnTrans,
      },
      en: {
        translation: enUsTrans,
      },
      ja: {
        translation: jaTrans,
      },
      es: {
        translation: esTrans,
      },
    },
    // default lang of key in resources,语言展示优先级 => userConfig(用户设置) > roomLanguage(房间语言) > language(ip所属)
    fallbackLng: getStore('userConfig')?.language || getStore('language') || 'zh',
    debug: false,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
  })

