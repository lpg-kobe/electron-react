/**
 * @desc 主播 | 嘉宾演讲稿演示
 * @author pika
 */

import React from 'react'
// @ts-ignore
import Loading from '@/components/loading'

const Speech = (props: any) => {
    const {
        dispatch,
        speech: {
            speechPageIndex,
            speechFullScreen,
            speechPageLoading,
            speechInfo: { pages, id: speechId }
        },
        room: { roomOpenSpeechOther },
        match: {
            params: {
                id: roomId
            }
        }
    } = props

    /** handle change page of speech */
    function handleTurnSpeech(count: number) {
        const toPage = Math.max(1, Math.min(pages.length, speechPageIndex + count))
        if (toPage === speechPageIndex || speechPageLoading) {
            return
        }
        dispatch({
            type: 'speech/save',
            payload: {
                speechPageLoading: true
            }
        })
        dispatch({
            type: 'speech/turnPage',
            payload: {
                params: {
                    pageNum: toPage,
                    pageUrl: pages[toPage - 1].url,
                    roomId,
                    speechId
                },
                onSuccess: {
                    operate: () => {
                        dispatch({
                            type: 'speech/save',
                            payload: {
                                speechPageIndex: toPage
                            }
                        })
                    }
                }
            }
        })
    }

    /** close speech */
    function handleCloseSpeech() {
        dispatch({
            type: 'speech/closeSpeech',
            payload: {
                params: {
                    roomid: roomId,
                    speechid: speechId
                }
            }
        })
    }

    /** full screen speech */
    function handleFullSpeech() {
        dispatch({
            type: 'speech/save',
            payload: {
                speechFullScreen: true
            }
        })
    }

    return pages && pages.length ? <div className="speech-container">
        {
            !speechFullScreen && !roomOpenSpeechOther ? <i className="icon icon-close" title="关闭演讲稿" onClick={handleCloseSpeech}></i> : null
        }
        {
            !speechFullScreen && <i className="icon icon-full-screen" title="全屏演示" onClick={handleFullSpeech}></i>
        }
        <div className="speech-wrap" style={{ transform: `translateX(-${(speechPageIndex - 1) * 100}%)` }}>
            <ul style={{ width: `${pages.length * 100}%` }}>
                {
                    pages.map((ppt: any) => <li key={Math.random()} className="wrap-item">
                        <img src={ppt.url} alt={`page-${ppt.page}`} />
                    </li>)
                }
            </ul>
        </div>
        <div className="speech-controll">
            {
                !roomOpenSpeechOther && <i title="上一页" className={`icon icon-prev${speechPageIndex <= 1 || speechPageLoading ? ' disabled' : ''}`} onClick={() => handleTurnSpeech(-1)}></i>
            }
            <label>{speechPageIndex}/{pages.length}</label>
            {
                !roomOpenSpeechOther && <i title="下一页" className={`icon icon-next${speechPageIndex >= pages.length || speechPageLoading ? ' disabled' : ''}`} onClick={() => handleTurnSpeech(1)}></i>
            }
        </div>
    </div> : <Loading />
}

export default Speech