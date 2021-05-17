/**
 * @desc 直播间菜单模块
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DescTab from './descTab';
import ImgTextTab from './imgTextTab';
import ProViewTab from './proViewTab';
import FileDownTab from './fileDownTab';
import AModal from '@/components/modal';

interface MenuType {
  menuType: number;
  name: string;
  sort: number;
}

function MenuInfo(props: any) {
  const {
    room: { detailMenu },
    detail: { imgTextList },
    dispatch,
    match: {
      params: { id: roomId },
    },
  } = props;
  const { t } = useTranslation();
  const initVisible: any = {
    2: false,
    4: false,
    5: false,
    6: false,
  };
  const [visible, setVisible] = useState(initVisible);
  const [dragDisabled, setDragDisabled] = useState({
    activityDesc: true,
    imgText: true,
  });

  // handle menu tab click
  function handleOpentab(menu: MenuType) {
    setVisible({
      ...initVisible,
      [menu.menuType]: !initVisible[menu.menuType],
    });
    const actionObj: any = {
      // 图文直播
      2: () => {
        dispatch({
          type: 'detail/getImgTextList',
          payload: {
            params: {
              roomId,
              msgId: imgTextList[0]?.msgId,
              size: 20,
            },
            onSuccess: {
              search: () => {
                dispatch({
                  type: 'detail/save',
                  payload: {
                    imgTextLoading: false,
                  },
                });
              },
            },
          },
        });
      },
      // 产品，暂无该需求
      4: () => {},
      // 文件下载，暂无该需求
      5: () => {},
      // 活动介绍
      6: () => {
        dispatch({
          type: 'room/getRoomIntroduce',
          payload: {
            params: {
              roomid: roomId,
            },
          },
        });
      },
    };
    actionObj[menu.menuType]?.();
  }

  return (
    <section className="section-menu">
      <nav>
        {detailMenu.length && typeof detailMenu[0].sort !== 'undefined'
          ? detailMenu.map((menu: MenuType) => (
              <a
                key={menu.menuType}
                onClick={() => handleOpentab(menu)}
                className={`${visible[menu.menuType] ? 'active' : ''}`}
              >
                {t(menu.name)}
              </a>
            ))
          : null}
      </nav>
      <AModal
        className="ofweek-modal introduce big draggable"
        draggable={true}
        dragDisabled={dragDisabled['activityDesc']}
        footer={null}
        title={
          <h1
            className={`ofweek-modal-title${
              dragDisabled['activityDesc'] ? '' : ' drag'
            }`}
            onMouseOver={() =>
              setDragDisabled({
                ...dragDisabled,
                activityDesc: false,
              })
            }
            onMouseLeave={() =>
              setDragDisabled({
                ...dragDisabled,
                activityDesc: true,
              })
            }
          >
            {t('活动介绍')}
          </h1>
        }
        visible={visible[6]}
        onCancel={() =>
          setVisible({
            ...initVisible,
            6: false,
          })
        }
      >
        <DescTab {...props} />
      </AModal>
      <AModal
        className="ofweek-modal img-text big draggable"
        draggable={true}
        dragDisabled={dragDisabled['imgText']}
        footer={null}
        title={
          <h1
            className={`ofweek-modal-title${
              dragDisabled['imgText'] ? '' : ' drag'
            }`}
            onMouseOver={() =>
              setDragDisabled({
                ...dragDisabled,
                imgText: false,
              })
            }
            onMouseLeave={() =>
              setDragDisabled({
                ...dragDisabled,
                imgText: true,
              })
            }
          >
            {t('图文直播')}
          </h1>
        }
        visible={visible[2]}
        onCancel={() =>
          setVisible({
            ...initVisible,
            2: false,
          })
        }
      >
        <ImgTextTab {...props} />
      </AModal>
      <AModal
        className="ofweek-modal big draggable"
        draggable={true}
        footer={null}
        visible={visible[4]}
        onCancel={() =>
          setVisible({
            ...initVisible,
            4: false,
          })
        }
      >
        <ProViewTab {...props} />
      </AModal>
      <AModal
        className="ofweek-modal big draggable"
        draggable={true}
        footer={null}
        visible={visible[5]}
        onCancel={() =>
          setVisible({
            ...initVisible,
            5: false,
          })
        }
      >
        <FileDownTab {...props} />
      </AModal>
    </section>
  );
}

export default MenuInfo;
