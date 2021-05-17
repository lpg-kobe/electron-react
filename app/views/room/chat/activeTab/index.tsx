/**
 * @desc 直播间互动区
 */
import React, { memo, useState, useEffect, useRef } from 'react';
import immutable from 'immutable';
import { Popover, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import Editor from '../../../../components/editor';
import BreakWord from '../../../../components/breakWord';
import AModal from '../../../../components/modal';
import {
  scrollElement,
  tottle,
  loadImage,
  nextTick,
  filterBreakWord,
  formatInput,
} from '../../../../utils/tool';
import { eventEmitter } from '../../../../utils/event';
import { FACE_URL } from '../../../../constants';
import { emoji } from '../../../../assets/js/emoji';

const ActiveInfo = (props: any) => {
  const {
    chat: {
      list: chatList,
      chatLoading,
      chatLoadEnded,
      hasMore: dataHasMore,
      chatScrollTop,
    },
    dispatch,
    match: {
      params: { id: roomId },
    },
    room: { userStatus },
  } = props;
  const { t } = useTranslation();

  const faceRegExp = /\[[a-zA-Z0-9\/\u4e00-\u9fa5]+\]/g;
  const userIsForbit = userStatus.isForbit === 1;

  const scrollRef: any = useRef(null);
  const [reviewShow, setReviewShow] = useState(false);
  const [reviewList, setReviewList] = useState([]);

  useEffect(() => {
    // init data and scroll to bottom
    dispatch({
      type: 'chat/getChatList',
      payload: {
        params: {
          roomId,
          msgId: chatList?.msgId,
          size: 50,
        },
        onSuccess: {
          search: ({ data }: any) => {
            // scroll bottom after all dom loaded of msg
            loadImage(
              data
                ?.filter(({ type }: any) => type === 2)
                .map(({ content }: any) => content),
              () => {
                dispatch({
                  type: 'chat/save',
                  payload: {
                    chatScrollTop: `scroll${new Date().getTime()}:bottom`,
                  },
                });
              }
            );
          },
        },
      },
    });
  }, []);

  // 条件性触发聊天窗口滚动
  useEffect(() => {
    window.requestAnimationFrame(() => {
      scrollElement(scrollRef.current, chatScrollTop.split(':')[1]);
    });
  }, [chatScrollTop]);

  // format msg by different type
  function formatMsg({ content, type }: any) {
    const isImg = type === 2;
    return isImg
      ? `<img src="${content}" class="img-msg" />`
      : filterBreakWord(content).replace(faceRegExp, (word: any) => {
          const isEmoji = emoji.some((ele) => ele.face_name === word);
          return isEmoji ? `<img src="${FACE_URL}${word}@2x.png" />` : content;
        });
  }

  // handle click of msg content
  function handleMsgContent({ type, content }: any) {
    const actionMap: any = {
      // msg of img
      2: () => {
        setReviewList([content]);
        setReviewShow(true);
      },
    };
    actionMap[type]?.();
  }

  // 滚动跟随屏幕帧率刷新
  function animateToScroll() {
    const scrollTop = scrollRef.current.scrollTop;
    if (scrollTop <= 0) {
      handleScrollTop();
    }
  }

  // handle scroll top of chat area
  function handleScrollTop() {
    if (chatLoading || !dataHasMore) {
      return;
    }
    dispatch({
      type: 'chat/save',
      payload: {
        chatLoading: true,
      },
    });
    const prevScrollHeight = scrollRef.current.scrollHeight;
    dispatch({
      type: 'chat/getChatList',
      payload: {
        params: {
          roomId,
          msgId: chatList[0].msgId,
          size: 50,
        },
        onSuccess: {
          search: ({ data }: any) => {
            // dom元素位置更新后滚动至追加数据前第一条消息位置
            nextTick(scrollRef.current, ({ scrollHeight }: any) => {
              dispatch({
                type: 'chat/save',
                payload: {
                  chatLoadEnded: data?.length < 50,
                  chatScrollTop: `scroll${new Date().getTime()}:${
                    scrollHeight - prevScrollHeight
                  }`,
                },
              });
            });
          },
        },
      },
    });
  }

  // handle filter right menu of msg
  function handleFilterMenu(msg: any) {
    const { role, imAccount } = userStatus;
    // 用户禁言时隐藏所有菜单
    if (userIsForbit) {
      return null;
    }
    const { senderId: msgOwner } = msg;
    let menus = [
      {
        label: t('删除聊天'),
        value: 'delete',
      },
      {
        label: t('回复聊天'),
        value: 'reply',
      },
      {
        label: t('禁言用户'),
        value: 'forbit',
      },
      {
        label: t('解除禁言'),
        value: 'cancelForbit',
      },
      {
        label: t('踢出用户'),
        value: 'kick',
      },
    ];

    // 消息禁言状态过滤禁言 || 非禁言菜单
    menus = menus.filter((menu: any) =>
      msg.isForbit === 1
        ? menu.value !== 'forbit'
        : menu.value !== 'cancelForbit'
    );

    // 身份筛选消息菜单
    const isUserSelf = String(msgOwner) === String(imAccount);
    let menuMap: any = {
      // 主播
      1: isUserSelf ? menus.filter((item) => item.value === 'delete') : menus,
      // 嘉宾
      2: isUserSelf
        ? menus.filter((item) => item.value === 'delete')
        : menus.filter((item) => item.value === 'reply'),
    };

    const userRowMenus = menuMap[role];
    return userRowMenus?.length ? (
      <ul>
        {userRowMenus.map((menu: any) => (
          <li
            className="popover-menu-item"
            key={menu.value}
            onClick={() => handleMsgClick({ ...menu, ...msg })}
          >
            {menu.label}
          </li>
        ))}
      </ul>
    ) : null;
  }

  // handle click menu of msg
  function handleMsgClick({ value, nick, msgId, roomId, senderId }: any) {
    const reactObj: any = {
      // 删除聊天
      delete: () => {
        Modal.confirm({
          centered: true,
          content: t('确认删除聊天信息吗'),
          title: t('提示'),
          okText: t('删除'),
          cancelText: t('取消'),
          onOk: () => {
            dispatch({
              type: 'chat/deleteMsg',
              payload: {
                params: {
                  msgId,
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

      // 回复聊天
      reply: () => {
        const chatInput = document.getElementById('chatEditor');
        const valToEditor = formatInput(chatInput, `@${nick}`);
        const {
          event: {
            editor: { setValue },
          },
        } = eventEmitter;
        eventEmitter.emit(setValue, { value: valToEditor });
      },

      // 禁言用户
      forbit: () => {
        dispatch({
          type: 'chat/forbitChat',
          payload: {
            params: {
              memberId: senderId,
              roomId,
              type: 1,
            },
            onSuccess: {
              operate: true,
            },
          },
        });
      },

      // 取消禁言用户
      cancelForbit: () => {
        dispatch({
          type: 'chat/forbitChat',
          payload: {
            params: {
              memberId: senderId,
              roomId,
              type: 2,
            },
            onSuccess: {
              operate: true,
            },
          },
        });
      },
      // 踢用户出房间
      kick: () => {
        Modal.confirm({
          centered: true,
          content: `${t('是否把')}${nick}${t('踢出房间')}`,
          title: '提示',
          okText: t('确定'),
          cancelText: t('取消'),
          onOk: () => {
            dispatch({
              type: 'chat/kickOutUser',
              payload: {
                params: {
                  memberId: senderId,
                  msgId,
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
    reactObj[value]?.();
  }

  return (
    <div className="tab-container interactive">
      <div
        className={`panel-contain chat-panel${
          !chatList.length ? ' empty flex-center' : ''
        } `}
        ref={scrollRef}
        onScroll={() => tottle(animateToScroll)}
        id="chatPanel"
      >
        {chatList.length ? (
          <>
            {chatLoadEnded && (
              <div className="wrap-item no-more">{t('加载完毕')}~~</div>
            )}
            {chatList?.map((msg: any, index: number) =>
              String(msg.msgCode) !== '1020' ? (
                <div
                  className="wrap-item line"
                  key={index}
                  id={`msg-${msg.msgId}`}
                >
                  {handleFilterMenu(msg) ? (
                    <Popover
                      content={handleFilterMenu(msg)}
                      arrowPointAtCenter
                      placement="bottom"
                    >
                      <label
                        className={
                          msg.role === 1 || msg.role === 2 ? 'role' : ''
                        }
                      >
                        {msg.nick}
                        {msg.role === 1 || msg.role === 2
                          ? `  [${t(msg.identity)}]`
                          : null}
                      </label>
                    </Popover>
                  ) : (
                    <label
                      className={msg.role === 1 || msg.role === 2 ? 'role' : ''}
                    >
                      {msg.nick}
                      {msg.role === 1 || msg.role === 2
                        ? `  [${t(msg.identity)}]`
                        : null}
                    </label>
                  )}
                  <BreakWord
                    onClick={() => handleMsgContent(msg)}
                    options={{
                      text: formatMsg(msg),
                    }}
                  />
                </div>
              ) : (
                <div
                  className="wrap-item notice"
                  key={index}
                  id={`msg - ${msg.msgId} `}
                >
                  {msg.nick}
                  {t('进入直播间')}
                </div>
              )
            )}
          </>
        ) : (
          !chatLoading && <h3>{t('暂时无人发言，快来抢占沙发')}~</h3>
        )}
        {chatLoading && <div className="list-loading">{t('加载中')}...</div>}
      </div>

      <Editor
        {...props}
        menuList={[{ label: 'emoji' }, { label: 'img' }]}
        editorId="chatEditor"
      />

      <AModal
        width="50%"
        footer={null}
        visible={reviewShow}
        title={null}
        onCancel={() => setReviewShow(false)}
        className="ofweek-modal img-review"
      >
        {reviewList?.map((url: string) => (
          <img key={Math.random()} src={url} />
        ))}
      </AModal>
    </div>
  );
};

export default memo(ActiveInfo, (prevProps, nextProps) => {
  const prevMap = immutable.fromJS({
    room: prevProps.room,
    chat: prevProps.chat,
  });
  const nextMap = immutable.fromJS({
    room: nextProps.room,
    chat: nextProps.chat,
  });
  return immutable.is(prevMap, nextMap);
});
