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

type PropsType = {
    room: any,
    chat: any,
    match: any,
    dispatch(action: any): void
}

function QAndAInfo(props: PropsType) {
    const { chat: { qaaList, qaaHasMore: dataHasMore, qaaScrollTop }, dispatch, match: { params: { id: roomId } } } = props

    const [dataLoading, setDataLoading] = useState(true)
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
        const topMsgId = qaaList[0].msgId
        dispatch({
            type: 'chat/getQaaList',
            payload: {
                params: {
                    roomId,
                    questionId: topMsgId,
                    size: 50
                },
                onSuccess: {
                    search: () => {
                        setDataLoading(false)
                        // dom元素位置更新后滚动至追加数据前第一条消息位置
                        rqaToGetElePos(`#msg-${topMsgId}`, ({ offsetTop }: any) => {
                            dispatch({
                                type: 'chat/save',
                                payload: {
                                    chatScrollTop: `scroll${new Date().getTime()}:${offsetTop}`
                                }
                            })
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
                        qaaList.map((item: any, index: number) => <li key={index} className="wrap-item">
                            <div className="item-line ques">
                                <div className="title">
                                    <h1>
                                        <i>问</i>
                                        <span>Jinlai</span>
                                    </h1>
                                    <label>
                                        2020-09-19  10:15
                            </label>
                                </div>
                                <p className="contain">如果获得这套工具软件和基本预算价？</p>
                                <div className="operate">
                                    <a>删除</a>
                                    <a className="active">文字答疑</a>
                                </div>
                            </div>
                            {
                                item.answerList && item.answerList.length ? <div className="item-line answer">
                                    <div className="title">
                                        <h1>
                                            xx[答疑嘉宾]
                                </h1>
                                    </div>
                                    <p className="contain">
                                        如果获得这套工具软件和基本预算价？
                            </p>
                                    <div className="operate">
                                        <a>删除</a>
                                        <a className="active">修改解答</a>
                                    </div>
                                </div> : null
                            }
                        </li>)
                    }
                </> : <h3>暂时无人发言，快来抢占沙发~</h3>
            }
        </ul>
        {
            dataLoading && <div className="list-loading">{'加载中...'}</div>
        }
        <Editor />
    </div>
}
export default withRouter(connect(({ chat, room }: any) => ({
    room: room.toJS(),
    chat: chat.toJS(),
}))(QAndAInfo));
