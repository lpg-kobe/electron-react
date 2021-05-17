/**
 * @desc 直播间聊天&互动&成员模块
 */

import React, { useState } from 'react';
import ActiveTab from './activeTab';
import QaaTab from './qaaTab';
import MemberTab from './memberTab';
import { useTranslation } from 'react-i18next';
import { eventEmitter } from '../../../utils/event';

interface MenuType {
  menuType: number;
  name?: string;
  sort?: number | undefined;
}

interface PropsType {
  room: any;
  dispatch: any;
  chat: any;
  match: any;
}

const DetailInfo = (props: PropsType) => {
  const {
    room: { chatMenu, roomInfo },
  } = props;
  const { t } = useTranslation();

  const [activeIndex, setActiveIndex] = useState(0);
  const chatMenuMap: any = {
    1: <ActiveTab key="activeTab" {...props} />,
    3: <QaaTab key="qaaTab" {...props} />,
  };

  // handle menu tab click
  function handleOpentab(index: number) {
    const {
      event: {
        editor: { setValue },
      },
    } = eventEmitter;
    // 清空聊天框
    eventEmitter.emit(setValue, { value: '' });
    setActiveIndex(index);
  }

  return (
    <div className="live-info-container">
      <div className="flex-between nav-panel">
        <nav>
          {chatMenu?.map((menu: MenuType, index: number) => (
            <a
              title={t(menu.name)}
              key={menu.menuType}
              onClick={() => handleOpentab(index)}
              className={activeIndex === index ? 'active' : ''}
            >
              {t(menu.name)}
            </a>
          ))}
          <a
            title={t('成员')}
            onClick={() => {
              handleOpentab(999);
            }}
            className={activeIndex === 999 || !chatMenu.length ? 'active' : ''}
          >
            {t('成员')}
          </a>
        </nav>
        <label className="hot-label flex-center">{roomInfo.pv}</label>
      </div>
      <div
        className="swiper-panel"
        style={{
          transform: `translateX(-${
            activeIndex === 999 ? chatMenu.length * 100 : activeIndex * 100
          }%)`,
        }}
      >
        <div style={{ width: `${(chatMenu.length + 1) * 100}%` }}>
          {chatMenu?.map((menu: any) => chatMenuMap[menu.menuType])}
          <MemberTab {...props} />
        </div>
      </div>
    </div>
  );
};
export default DetailInfo;
