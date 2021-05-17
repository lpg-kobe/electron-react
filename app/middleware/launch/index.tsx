import React from 'react';
import { useTranslation } from 'react-i18next';
import './style.less';

export default function Launch() {
  const { t } = useTranslation();

  return (
    <main className="launch-page-main">
      <div className="launch-page-contain">
        <div>
          <i className="launch-bg" />
          <h1>{t('企业便捷的直播平台')}</h1>
        </div>
      </div>
      <footer className="launch-page-footer">
        {t('OFweek直播客户端')} V1.0
      </footer>
    </main>
  );
}
