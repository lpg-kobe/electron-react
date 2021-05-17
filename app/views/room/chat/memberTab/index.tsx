/**
 * @desc member list component, data of it has been filter im room model
 */
import React, { memo } from 'react';
import immutable from 'immutable';
import { Popover, message, Modal } from 'antd';
import { useTranslation } from 'react-i18next';

const MemberInfo = (props: any) => {
  const {
    room: { userStatus, roomInfo },
    chat: { memberList },
    video: { videoStreamType },
    dispatch,
  } = props;
  const { t } = useTranslation();

  // handle filter right menu of item
  function handleFilterMenu(item: any) {
    const { role, imAccount } = userStatus;
    const { status } = roomInfo;
    const { memberId: msgOwner, role: msgOwnerRole, isForbit, isLive } = item;
    const userIsForbit = Number(isForbit) === 1;

    // 初始菜单
    let menus = [
      {
        label: t('上麦'),
        value: 'online',
      },
      {
        label: t('下麦'),
        value: 'offline',
      },
      {
        label: t('邀请上麦'),
        value: 'send-online',
      },
      {
        label: t('申请上麦'),
        value: 'req-online',
      },
      {
        label: t('解除禁言'),
        value: 'cancelForbit',
      },
      {
        label: t('禁言用户'),
        value: 'forbit',
      },
      {
        label: t('踢出用户'),
        value: 'kick',
      },
    ];

    // 非开播状态过滤上下麦菜单
    Number(status) !== 1 &&
      (menus = menus.filter(
        (item) =>
          !['online', 'offline', 'send-online', 'req-online'].includes(
            item.value
          )
      ));

    // 摄像机上麦过滤邀请|申请上下麦功能
    videoStreamType === 'video' &&
      (menus = menus.filter(
        (item) => !['send-online', 'req-online'].includes(item.value)
      ));

    // 消息禁言状态过滤禁言 || 非禁言菜单
    menus = menus.filter((menu: any) =>
      userIsForbit ? menu.value !== 'forbit' : menu.value !== 'cancelForbit'
    );

    // 上麦状态过滤上下麦菜单
    menus = menus.filter((menu: any) =>
      isLive
        ? !['online', 'req-online', 'send-online'].includes(menu.value)
        : !['offline'].includes(menu.value)
    );

    // 身份筛选消息菜单
    const isUserSelf = String(msgOwner) === String(imAccount);
    const memberIsAnchorOrGuest = msgOwnerRole === 1 || msgOwnerRole === 2;
    let menuMap: any = {
      // 主播
      1: isUserSelf
        ? menus.filter((item) => ['online', 'offline'].includes(item.value))
        : memberIsAnchorOrGuest
        ? menus.filter((item) =>
            [
              'offline',
              'send-online',
              'forbit',
              'cancelForbit',
              'kick',
            ].includes(item.value)
          )
        : menus.filter((item) =>
            ['forbit', 'cancelForbit', 'kick'].includes(item.value)
          ),
      // 嘉宾
      2: isUserSelf
        ? menus.filter((item) => ['req-online', 'offline'].includes(item.value))
        : [],
    };

    const userRowMenus = menuMap[role];
    return userRowMenus?.length ? (
      <ul>
        {userRowMenus.map((menu: any) => (
          <li
            className="popover-menu-item"
            key={menu.value}
            onClick={() => handleMsgClick({ ...menu, ...item })}
          >
            {menu.label}
          </li>
        ))}
      </ul>
    ) : null;
  }

  /** handle click of header btn,send roomFunHandler in order to run function witch register on useEffect hooks */
  function handleMsgClick({ value, nick, roomId, memberId }: any) {
    const { role } = userStatus;
    const isAnchor = Number(role) === 1;
    const actionObj: any = {
      // 主播上麦
      online: () => {
        dispatch({
          type: 'room/save',
          payload: {
            roomFunHandler: {
              key: `AnchorRoom:${new Date().getTime()}`,
              value: {
                name: 'handleCheckTypeToStart',
              },
            },
          },
        });
      },
      // 下麦
      offline: () => {
        dispatch({
          type: 'room/save',
          payload: {
            roomFunHandler: {
              key: isAnchor
                ? `AnchorRoom:${new Date().getTime()}`
                : `GuestRoom:${new Date().getTime()}`,
              value: {
                name: 'handleExitRoom',
                callback: () => message.success(t('下麦成功')),
              },
            },
          },
        });
      },
      // 邀请上麦
      'send-online': () => {
        dispatch({
          type: 'chat/inviteJoinRoom',
          payload: {
            params: {
              anthorid: memberId,
              roomid: roomId,
            },
            onSuccess: {
              operate: () => {
                message.success(t('上麦邀请已发送'));
              },
            },
          },
        });
      },
      // 嘉宾申请上麦
      'req-online': () => {
        dispatch({
          type: 'room/save',
          payload: {
            roomFunHandler: {
              key: `GuestRoom:${new Date().getTime()}`,
              value: {
                name: 'handleCheckMediaToStart',
                args: [1],
              },
            },
          },
        });
      },
      // 禁言
      forbit: () => {
        dispatch({
          type: 'chat/forbitChat',
          payload: {
            params: {
              memberId,
              roomId,
              type: 1,
            },
            onSuccess: {
              operate: true,
            },
          },
        });
      },
      // 取消禁言
      cancelForbit: () => {
        dispatch({
          type: 'chat/forbitChat',
          payload: {
            params: {
              memberId: memberId,
              roomId,
              type: 2,
            },
            onSuccess: {
              operate: true,
            },
          },
        });
      },
      // 踢出用户
      kick: () => {
        Modal.confirm({
          centered: true,
          content: `${t('是否把')}${nick}${t('踢出房间')}`,
          title: t('提示'),
          okText: t('确定'),
          cancelText: t('取消'),
          onOk: () => {
            dispatch({
              type: 'chat/kickOutUser',
              payload: {
                params: {
                  memberId,
                  roomId,
                },
                onSuccess: {
                  operate: true,
                },
              },
            });
          },
        });
      },
    };
    actionObj[value]?.();
  }

  return (
    <div className="tab-container member">
      <ul
        className={`panel-contain member-panel${
          !memberList.length ? ' empty flex-center' : ''
        }`}
      >
        {memberList?.map((item: any) => (
          <li
            key={Math.random()}
            className={`wrap-item${
              String(item.memberId) === String(userStatus.imAccount)
                ? ' mine'
                : ''
            }${item.role === 3 ? ' viewer' : ''}`}
          >
            <div
              className={`item-l${
                item.role === 1 || item.role === 2 ? ' anchor' : ''
              }`}
            >
              <label>{item.nick}</label>
              {(item.role === 1 || item.role === 2) && (
                <span>[{t(item.identity)}]</span>
              )}
            </div>
            <div className="item-r">
              {item.isForbit === 1 && (
                <i className="icon forbit" title={t('禁言中')} />
              )}
              <i
                className={`icon ${item.isLive ? 'mic' : 'unmic'}`}
                title={`${item.isLive ? t('上麦中') : t('下麦中')}`}
              />
              {handleFilterMenu(item) && (
                <Popover
                  content={handleFilterMenu(item)}
                  placement="bottomLeft"
                >
                  <i className="icon menu" />
                </Popover>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default memo(MemberInfo, (prevProps, nextProps) => {
  const prevMap = immutable.fromJS({
    room: prevProps.room,
    chat: prevProps.chat,
    video: prevProps.video,
  });
  const nextMap = immutable.fromJS({
    room: nextProps.room,
    chat: nextProps.chat,
    video: nextProps.video,
  });
  return immutable.is(prevMap, nextMap);
});
