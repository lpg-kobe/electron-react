/**
 * @desc 直播间问答区
 */
import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { connect } from 'dva';
import { withRouter } from 'dva/router';
// @ts-ignore
import { scrollElement, tottle, rqaToGetElePos } from '@/utils/tool'
// @ts-ignore
import Editor from '@/components/editor'
import { Modal, Input, message } from 'antd'
// @ts-ignore
import AModal from '@/components/modal'
import moment from 'moment'

type PropsType = {
    room: any,
    chat: any,
    match: any,
    dispatch(action: any): void
}

function QAndAInfo(props: PropsType) {
    const { chat: { qaaList, qaaHasMore: dataHasMore, qaaScrollTop }, dispatch, match: { params: { id: roomId } }, room: { userStatus } } = props

    const [dataLoading, setDataLoading] = useState(true)
    const [answerShow, setAnswerShow] = useState(false)
    const [answerValue, setAnswerValue] = useState('')
    const [curMsg, setCurMsg] = useState({
        content: '',
        answer: '',
        questionId: 0,
        senderId: 0,
        msgId: 0,
        type: 1
    })
    const scrollRef: any = useRef(null)
    useLayoutEffect(() => {
        dispatch({
            type: 'chat/getQaaList',
            payload: {
                params: {
                    questionId: qaaList[0] && qaaList[0].msgId,
                    roomId,
                    size: 50
                },
                isInit: true,
                onSuccess: {
                    search: () => setDataLoading(false)
                }
            }
        })
    }, [])

    // 条件性触发聊天窗口滚动
    useEffect(() => {
        scrollElement(scrollRef.current, qaaScrollTop.split(':')[1])
    }, [qaaScrollTop])

    // 滚动跟随屏幕帧率刷新
    function animateToScroll() {
        const scrollTop = scrollRef.current.scrollTop
        if (scrollTop <= 0) {
            handleScrollTop()
        }
    }

    // handle scroll top of chat area
    function handleScrollTop() {
        if (dataLoading || !dataHasMore) {
            return
        }
        setDataLoading(true)
        const prevScrollHeight = scrollRef.current.scrollHeight
        dispatch({
            type: 'chat/getQaaList',
            payload: {
                params: {
                    roomId,
                    questionId: qaaList[0].msgId,
                    size: 50
                },
                onSuccess: {
                    search: () => {
                        setDataLoading(false)
                        // dom元素位置更新后滚动至追加数据前第一条消息位置
                        rqaToGetElePos(scrollRef.current, ({ scrollHeight }: any) => {
                            dispatch({
                                type: 'chat/save',
                                payload: {
                                    qaaScrollTop: `scroll${new Date().getTime()}:${scrollHeight - prevScrollHeight}`
                                }
                            })
                        })
                    }
                }
            }
        })
    }

    function handleShowAnswer(msg: any, reply?: any) {
        setAnswerShow(!answerShow)
        setAnswerValue('')
        setCurMsg(reply ? {
            ...reply,
            content: msg.content,
            answer: reply.content
        } : {
                ...msg
            })
    }

    function handleDelAnswer({ msgId }: any) {
        Modal.confirm({
            centered: true,
            content: '确定删除吗',
            title: '提示',
            onOk: () => {
                dispatch({
                    type: 'chat/delQaaMsg',
                    payload: {
                        params: {
                            msgId,
                            roomId
                        },
                        onSuccess: {
                            operate: true
                        }
                    }
                })
            }
        })
    }

    function handleEditAnswer() {
        if (!answerValue) {
            message.error('请输入您的解答')
            return
        }
        const { type, msgId } = curMsg
        const actionObj: any = {
            // 解答
            1: () => {
                dispatch({
                    type: 'chat/sendQaaMsg',
                    payload: {
                        params: {
                            content: {
                                content: encodeURI(answerValue),
                                msgType: 1
                            },
                            questionId: msgId,
                            roomId,
                            senderId: userStatus.imAccount,
                            type: 2
                        },
                        onSuccess: {
                            operate: () => {
                                message.success('操作成功')
                                setAnswerShow(false)
                            }
                        }
                    }
                })
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
                            senderId: userStatus.imAccount
                        },
                        onSuccess: {
                            operate: () => {
                                message.success('操作成功')
                                setAnswerShow(false)
                            }
                        }
                    }
                })
            }
        }
        actionObj[type] && actionObj[type]()
    }

    // handle sending a new question
    function handleSendQues(value: any) {
        dispatch({
            type: 'chat/sendQaaMsg',
            payload: {
                params: {
                    content: {
                        content: encodeURI(value),
                        msgType: 1
                    },
                    roomId,
                    senderId: userStatus.imAccount,
                    type: 1
                },
                onSuccess: {
                    operate: () => {
                        dispatch({
                            type: 'chat/save',
                            payload: {
                                inputValue: ''
                            }
                        })
                    }
                }
            }
        })
    }

    return <div className="tab-container quest-and-answer">
        <ul className={`panel-contain qaa-panel${!qaaList.length ? ' empty flex-center' : ''}`} ref={scrollRef} onScroll={() => tottle(animateToScroll)}>
            {
                qaaList.length ? <>
                    {
                        dataLoading || dataHasMore ? null : <div className="wrap-item no-more">加载完毕~~</div>
                    }
                    {
                        qaaList.map((item: any) => <li key={Math.random()} className="wrap-item" id={`msg-${item.msgId}`}>
                            <div className="item-line ques">
                                <div className="title">
                                    <h1>
                                        <i>问</i>
                                        <span>{item.nick}</span>
                                    </h1>
                                    <label>
                                        {
                                            moment(item.createDate).format('YYYY-MM-DD HH:mm')
                                        }
                                    </label>
                                </div>
                                <p className="contain">
                                    {item.content.replace(/\n/g, '<br>')}
                                </p>
                                <div className="operate">
                                    {
                                        userStatus.role === 1 ? <a onClick={() => handleDelAnswer(item)}>删除</a> : null
                                    }
                                    <a className="active" onClick={() => { handleShowAnswer(item) }}>文字答疑</a>
                                </div>
                            </div>
                            {
                                item.answerList && (item.answerList || []).map((answer: any) =>
                                    <div className="item-line answer" key={Math.random()}>
                                        <div className="title">
                                            <h1>{answer.nick} [答疑{answer.identity}]</h1>
                                            <label>
                                                {
                                                    moment(item.createDate).format('YYYY-MM-DD HH:mm')
                                                }
                                            </label>
                                        </div>
                                        <p className="contain">
                                            {
                                                answer.content.replace(/\n/g, '<br>')
                                            }
                                        </p>
                                        {
                                            String(userStatus.imAccount) === String(answer.senderId) || userStatus.role === 1 ? <div className="operate">
                                                <a onClick={() => handleDelAnswer(answer)}> 删除</a>
                                                <a className="active" onClick={() => { handleShowAnswer(item, answer) }}>修改解答</a>
                                            </div> : null
                                        }
                                    </div>)
                            }
                        </li>)
                    }
                </> : <h3>暂时无人发言，快来抢占沙发~</h3>
            }
            {
                dataLoading && <div className="list-loading">{'加载中...'}</div>
            }
        </ul>
        <Editor onSubmit={handleSendQues} placeholder='我要提问' />
        <AModal title="文字解答" className="ofweek-modal" visible={answerShow} onCancel={() => setAnswerShow(false)} onOk={handleEditAnswer}>
            <div className="modal-line">
                <label>[问题内容]</label>
                <span>{curMsg.content}</span>
            </div>
            {
                curMsg.answer && <div className="modal-line">
                    <label>[我的解答]</label>
                    <span>{curMsg.answer}</span>
                </div>
            }
            <Input.TextArea placeholder="请输入内容" value={answerValue} onChange={({ target: { value } }: any) => setAnswerValue(value)} />
        </AModal>
    </div>
}
export default withRouter(connect(({ chat, room }: any) => ({
    room: room.toJS(),
    chat: chat.toJS(),
}))(QAndAInfo));
