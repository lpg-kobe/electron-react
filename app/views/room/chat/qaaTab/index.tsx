/**
 * @desc 直播间问答区
 */
import React, { memo, useState, useRef, useEffect } from 'react';
import immutable from 'immutable';
import { useTranslation } from 'react-i18next';
import { scrollElement, tottle, nextTick } from '../../../../utils/tool';
import { eventEmitter } from '../../../../utils/event';
import Editor from '../../../../components/editor';
import AModal from '../../../../components/modal';
import BreakWord from '../../../../components/breakWord';
import { Modal, Input, message, Button } from 'antd';
import moment from 'moment';

interface PropsType {
  room: any;
  chat: any;
  match: any;
  dispatch: (action: any) => void;
}

const QAndAInfo = (props: PropsType) => {
  const {
    chat: {
      qaaList,
      qaaLoading,
      qaaLoadEnded,
      qaaHasMore: dataHasMore,
      qaaScrollTop,
    },
    dispatch,
    match: {
      params: { id: roomId },
    },
    room: { userStatus },
  } = props;
  const { t } = useTranslation();

  const userIsForbit = userStatus.isForbit === 1;

  const [dragDisabled, setDragDisabled] = useState(true);
  const [answerShow, setAnswerShow] = useState(false);
  const [answerValue, setAnswerValue] = useState('');
  const [curMsg, setCurMsg] = useState({
    content: '',
    answer: '',
    questionId: 0,
    senderId: 0,
    msgId: 0,
    type: 1,
  });
  const scrollRef: any = useRef(null);

  useEffect(() => {
    // init data and scroll to bottom
    dispatch({
      type: 'chat/getQaaList',
      payload: {
        params: {
          questionId: qaaList[0]?.msgId,
          roomId,
          size: 50,
        },
        onSuccess: {
          search: () => {
            window.requestAnimationFrame(() => {
              dispatch({
                type: 'chat/save',
                payload: {
                  qaaScrollTop: 'scroll:bottom',
                },
              });
            });
          },
        },
      },
    });
  }, []);

  // 条件性触发聊天窗口滚动
  useEffect(() => {
    scrollElement(scrollRef.current, qaaScrollTop.split(':')[1]);
  }, [qaaScrollTop]);

  // 滚动跟随屏幕帧率刷新
  function animateToScroll() {
    const scrollTop = scrollRef.current.scrollTop;
    if (scrollTop <= 0) {
      handleScrollTop();
    }
  }

  // handle scroll top of chat area
  function handleScrollTop() {
    if (qaaLoading || !dataHasMore) {
      return;
    }
    dispatch({
      type: 'chat/save',
      payload: {
        qaaLoading: true,
      },
    });
    const prevScrollHeight = scrollRef.current.scrollHeight;
    dispatch({
      type: 'chat/getQaaList',
      payload: {
        params: {
          roomId,
          questionId: qaaList[0].msgId,
          size: 50,
        },
        onSuccess: {
          search: ({ data }: any) => {
            // dom元素位置更新后滚动至追加数据前第一条消息位置
            nextTick(scrollRef.current, ({ scrollHeight }: any) => {
              dispatch({
                type: 'chat/save',
                payload: {
                  qaaLoadEnded: data.length < 50,
                  qaaScrollTop: `scroll${new Date().getTime()}:${
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

  function handleShowAnswer(msg: any, reply?: any) {
    setAnswerShow(!answerShow);
    setAnswerValue('');
    setCurMsg(
      reply
        ? {
            ...reply,
            content: msg.content,
            answer: reply.content,
          }
        : {
            ...msg,
          }
    );
  }

  function handleDelAnswer({ msgId }: any) {
    Modal.confirm({
      centered: true,
      content: t('确定删除吗'),
      okText: t('删除'),
      cancelText: t('取消'),
      title: t('提示'),
      onOk: () => {
        dispatch({
          type: 'chat/delQaaMsg',
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
  }

  // 文字解答
  function handleEditAnswer() {
    const { type, msgId } = curMsg;
    const actionObj: any = {
      // 解答
      1: () => {
        dispatch({
          type: 'chat/sendQaaMsg',
          payload: {
            params: {
              answerType: 1,
              content: {
                content: encodeURI(answerValue),
                msgType: 1,
              },
              questionId: msgId,
              roomId,
              senderId: userStatus.imAccount,
              type: 2,
            },
            onSuccess: {
              operate: () => {
                message.success(t('操作成功'));
                setAnswerShow(false);
              },
            },
          },
        });
      },
      // 修改答案
      2: () => {
        dispatch({
          type: 'chat/updateQaaMsg',
          payload: {
            params: {
              answerId: msgId,
              content: encodeURI(answerValue),
              roomId,
              senderId: userStatus.imAccount,
            },
            onSuccess: {
              operate: () => {
                message.success(t('操作成功'));
                setAnswerShow(false);
              },
            },
          },
        });
      },
    };
    actionObj[type]?.();
  }

  // 语音答疑
  function handleAudioAnswer({ msgId, answerList }: any) {
    if (
      answerList?.some(({ answerType }: any) => answerType === 2) ||
      userIsForbit
    ) {
      return;
    }

    dispatch({
      type: 'chat/sendQaaMsg',
      payload: {
        params: {
          answerType: 2,
          questionId: msgId,
          content: {
            content: t('直播中回答'),
            msgType: 1,
          },
          roomId,
          senderId: userStatus.imAccount,
          type: 2,
        },
        onSuccess: {
          operate: () => {
            message.success(t('操作成功'));
          },
        },
      },
    });
  }

  // handle sending a new question
  function handleSendQues(value: any) {
    dispatch({
      type: 'chat/sendQaaMsg',
      payload: {
        params: {
          answerType: 1,
          content: {
            content: encodeURI(value),
            msgType: 1,
          },
          roomId,
          senderId: userStatus.imAccount,
          type: 1,
        },
        onSuccess: {
          operate: () => {
            // 清空输入框
            const {
              event: {
                editor: { setValue },
              },
            } = eventEmitter;
            eventEmitter.emit(setValue, { value: '' });
          },
        },
      },
    });
  }

  return (
    <div className="tab-container quest-and-answer">
      <ul
        className={`panel-contain qaa-panel${
          !qaaList.length ? ' empty flex-center' : ''
        }`}
        ref={scrollRef}
        onScroll={() => tottle(animateToScroll)}
      >
        {qaaList.length ? (
          <>
            {qaaLoadEnded && (
              <div className="wrap-item no-more">{t('加载完毕')}~~</div>
            )}
            {qaaList.map((item: any) => (
              <li
                key={Math.random()}
                className="wrap-item line"
                id={`msg-${item.msgId}`}
              >
                <div className="item-line ques">
                  <div className="title">
                    <h1>
                      <i title={t('问')}>{t('问')}</i>
                      <span>{item.nick}</span>
                    </h1>
                    <label>
                      {moment(item.createDate).format('YYYY-MM-DD HH:mm')}
                    </label>
                  </div>
                  <BreakWord
                    options={{
                      text: item.content,
                    }}
                    className="contain"
                  />
                  <div className="operate">
                    {userStatus.role === 1 ? (
                      <a
                        onClick={() => !userIsForbit && handleDelAnswer(item)}
                        className={userIsForbit ? 'disabled' : ''}
                        title={userIsForbit ? t('您已被禁言') : t('删除')}
                      >
                        {t('删除')}
                      </a>
                    ) : null}
                    <a
                      onClick={() => !userIsForbit && handleShowAnswer(item)}
                      className={`active${userIsForbit ? ' disabled' : ''}`}
                      title={userIsForbit ? t('您已被禁言') : t('文字答疑')}
                    >
                      {t('文字答疑')}
                    </a>
                    <a
                      onClick={() => handleAudioAnswer(item)}
                      className={`active${
                        userIsForbit ||
                        item.answerList?.some(
                          ({ answerType }: any) => answerType === 2
                        )
                          ? ' disabled'
                          : ''
                      }`}
                      title={userIsForbit ? t('您已被禁言') : ''}
                    >
                      {t('语音答疑')}
                    </a>
                  </div>
                </div>
                {item.answerList?.map((answer: any) => (
                  <div className="item-line answer" key={Math.random()}>
                    <div className="title">
                      <h1>
                        {answer.nick} [{t('答疑')}
                        {t(answer.identity)}]
                      </h1>
                      <label>
                        {moment(answer.createDate).format('YYYY-MM-DD HH:mm')}
                      </label>
                    </div>
                    <BreakWord
                      options={{
                        text:
                          answer.answerType === 2
                            ? t('直播中回答')
                            : answer.content,
                      }}
                      className="contain"
                    />
                    {String(userStatus.imAccount) === String(answer.senderId) ||
                    userStatus.role === 1 ? (
                      <div className="operate">
                        <a
                          onClick={() => handleDelAnswer(answer)}
                          className={userIsForbit ? 'disabled' : ''}
                          title={userIsForbit ? t('您已被禁言') : t('删除')}
                        >
                          {t('删除')}
                        </a>
                        {answer.answerType === 1 ? (
                          <a
                            className={`active${
                              userIsForbit ? ' disabled' : ''
                            }`}
                            title={
                              userIsForbit ? t('您已被禁言') : t('修改解答')
                            }
                            onClick={() =>
                              !userIsForbit && handleShowAnswer(item, answer)
                            }
                          >
                            {t('修改解答')}
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))}
              </li>
            ))}
          </>
        ) : (
          !qaaLoading && <h3>{t('暂时无人发言，快来抢占沙发')}~</h3>
        )}
        {qaaLoading && <div className="list-loading">{t('加载中')}...</div>}
      </ul>
      <Editor
        {...props}
        onSubmit={handleSendQues}
        placeholder={t('我要提问')}
        editorId="qaaEditor"
      />
      <AModal
        draggable={true}
        dragDisabled={dragDisabled}
        className="ofweek-modal draggable ofweek-answer-modal"
        width={520}
        title={
          <h1
            className={`ofweek-modal-title z2${dragDisabled ? '' : ' drag'}`}
            onMouseOver={() => setDragDisabled(false)}
            onMouseLeave={() => setDragDisabled(true)}
          >
            {t('文字答疑')}
          </h1>
        }
        footer={[
          <Button
            key={Math.random()}
            type="primary"
            onClick={handleEditAnswer}
            disabled={!answerValue}
          >
            {t('确定')}
          </Button>,
        ]}
        visible={answerShow}
        onCancel={() => setAnswerShow(false)}
        onOk={handleEditAnswer}
      >
        <div className="modal-line">
          <label>[{t('问题内容')}]</label>
          <BreakWord
            options={{
              text: curMsg.content,
              container: 'span',
            }}
          />
        </div>
        {curMsg.answer && (
          <div className="modal-line anchor">
            <label>[{t('我的解答')}]</label>
            <BreakWord
              options={{
                text: curMsg.answer,
                container: 'span',
              }}
            />
          </div>
        )}
        <Input.TextArea
          className="modal-line textarea"
          placeholder={t('请输入内容')}
          value={answerValue}
          onChange={({ target: { value } }: any) => setAnswerValue(value)}
        />
      </AModal>
    </div>
  );
};

export default memo(QAndAInfo, (prevProps, nextProps) => {
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
