import React, { useState } from 'react';
import { Popover } from 'antd';
import { UnorderedListOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import ShareRoom from './components/shareRoom';
import Settings from './components/settings';

const Menu = (props: any) => {
  const { menus } = props;
  const { t } = useTranslation();

  const [shareShow, setShareShow] = useState(false);
  const [settingShow, setSettingShow] = useState(false);

  function handleMenuClick({ onClick, label }: any) {
    if (onClick) {
      onClick();
      return;
    }
    const actionMap: any = {
      share: () => setShareShow(!shareShow),
      setting: () => setSettingShow(!settingShow),
    };
    actionMap[label]?.();
  }

  return (
    <>
      <Popover
        arrowPointAtCenter
        placement="bottom"
        content={
          <ul>
            {menus?.map((menu: any) => (
              <li
                key={menu.label}
                title={t(menu.title)}
                className={`popover-menu-item ${menu.label}`}
                onClick={() => handleMenuClick(menu)}
              >
                {menu.children ? (
                  menu.children
                ) : (
                  <>
                    {menu.icon}
                    <span>{t(menu.title)}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        }
      >
        <UnorderedListOutlined />
      </Popover>
      {/* 直播间分享 */}
      <ShareRoom visible={shareShow} onCancel={() => setShareShow(false)} />
      {/* 应用设置 */}
      <Settings
        visible={settingShow}
        onOk={() => setSettingShow(false)}
        onCancel={() => setSettingShow(false)}
      />
    </>
  );
};

export default Menu;
