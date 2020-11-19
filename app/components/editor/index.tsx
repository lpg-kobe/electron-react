/**
 * @desc 聊天公用输入框
 */
import React, { useState, useEffect } from 'react'
import { connect } from 'dva'
import { Input } from 'antd'
// @ts-ignore
import { emoji } from '@/assets/js/emoji'
// @ts-ignore
import { FACE_URL } from '@/constants'

type PropsType = {
    dispatch(action: any): void,
    auth: any,
    room: any,
    chat: any,
    scrollRef: any
}

const Editor = (props: PropsType) => {
    useEffect(() => {
        document.body.addEventListener('click', handleListen)
        return () => {
            document.body.removeEventListener('click', handleListen)
        }
    }, [])

    const {
        dispatch,
        chat: { list, inputValue, inputDisabled },
        room: {
            roomInfo: { id: roomId },
            userStatus: { imAccount, role, identity }
        }
    } = props

    const [faceShow, setFaceShow] = useState(false)

    // 表情失焦隐藏
    function handleListen({ target }: any) {
        if (target.getAttribute('alt') === 'emoji' || target.getAttribute('data-alt') === 'emoji') {
            return
        }
        setFaceShow(false)
    }

    // handle format msg
    function handleFormatMsg(msg: any) {
        return {
            ...msg,
            role,
            identity,
        }
    }

    // handle send msg
    function handleSendMsg() {
        if (!inputValue) {
            return
        }
        dispatch({
            type: 'chat/sendMsg',
            payload: {
                params: {
                    content: {
                        content: encodeURI(inputValue),
                        msgType: 1
                    },
                    roomId,
                    senderId: imAccount
                },
                onSuccess: {
                    operate: ({ data }: any) => {
                        dispatch({
                            type: 'chat/save',
                            payload: {
                                list: [...list, handleFormatMsg(data)],
                                chatScrollTop: `scroll${new Date().getTime()}:bottom`,
                                inputValue: ''
                            }
                        })
                    }
                }
            }
        })
    }

    // handle face selected
    function handleSelectFace({ face_name }: any) {
        dispatch({
            type: 'chat/save',
            payload: {
                inputValue: `${inputValue}${face_name}`
            }
        })
        setFaceShow(!faceShow)
    }

    // handle input change 
    function handleInputChange(value: any) {
        dispatch({
            type: 'chat/save',
            payload: {
                inputValue: value
            }
        })
    }

    return (
        <div className="editor-container">
            <Input.TextArea placeholder={inputDisabled ? '您已被禁言' : '一起聊天互动吧~~'} className="text-area" onChange={({ target: { value } }) => handleInputChange(value)} maxLength={1000} value={inputValue} disabled={inputDisabled} />
            <div className="operate-area flex-between">
                <div className="tool">
                    <i className="icon face" data-alt="emoji" onClick={() => setFaceShow(!faceShow)}></i>
                    {/* <i className="icon img"></i> */}

                    {
                        faceShow ? <div className="face-box">
                            <ul>
                                {

                                    emoji.map((face: any) => <li key={face.face_id}>
                                        <img src={`${FACE_URL}${face.face_name}@2x.png`} alt="emoji" onClick={() => handleSelectFace(face)} onMouseDown={(event: any) => event.preventDefault()} />
                                    </li>)
                                }
                            </ul>
                        </div> : null
                    }
                </div>
                <a onClick={handleSendMsg} className="send-btn">发送</a>
            </div>
        </div>
    )
}

export default connect(({ chat, room }: any) => ({
    chat: chat.toJS(),
    room: room.toJS()
}))(Editor)