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
    menuList: any,
    scrollRef: any,
    placeholder: string,
    onSubmit(value: any): void
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
        chat: { inputValue },
        room: {
            roomInfo: { id: roomId },
            userStatus: { imAccount, isForbit }
        },
        menuList,
        placeholder
    } = props
    const userIsForbit = isForbit === 1

    const [faceShow, setFaceShow] = useState(false)

    // 表情失焦隐藏
    function handleListen({ target }: any) {
        if (target.getAttribute('alt') === 'emoji' || target.getAttribute('data-alt') === 'emoji') {
            return
        }
        setFaceShow(false)
    }

    // handle send msg
    function handleSendMsg() {
        if (!inputValue || userIsForbit) {
            return
        }

        if (props.onSubmit) {
            props.onSubmit(inputValue)
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

    // handle menu click of edotor
    function handleMenuClick({ label }: any) {
        if (userIsForbit) {
            return
        }
        const menuAction: any = {
            'emoji': () => {
                setFaceShow(!faceShow)
            },
            'img': () => {
                // setFaceShow(!faceShow)
            }
        }
        menuAction[label] && menuAction[label]()
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
            <Input.TextArea placeholder={userIsForbit ? '您已被禁言' : placeholder || '一起聊天互动吧~~'} className="text-area" onChange={({ target: { value } }) => handleInputChange(value)} maxLength={1000} value={inputValue} disabled={userIsForbit} />
            <div className="operate-area flex-between">
                <div className="tool">
                    {
                        menuList && menuList.map((menu: any) => <i key={menu.label} className={`icon ${menu.label}${userIsForbit ? " disabled" : ""}`} data-alt={menu.label} onClick={() => handleMenuClick(menu)} title={userIsForbit ? "您已被禁言" : ""}></i>)
                    }
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
                <a onClick={handleSendMsg} className={`send-btn${!inputValue || userIsForbit ? ' disabled' : ''}`} title={userIsForbit ? "您已被禁言" : "一起互动聊天吧~~"}>发送</a>
            </div>
        </div>
    )
}

export default connect(({ chat, room }: any) => ({
    chat: chat.toJS(),
    room: room.toJS()
}))(Editor)