/**
 * @desc 聊天公用输入框
 */
import React, { useState, useEffect, useRef } from 'react';
import { Input, Upload, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { emoji } from '../../assets/js/emoji';
import { FACE_URL, UPLOAD_HOST } from '../../constants';
import { formatInput } from '../../utils/tool';
import { eventEmitter } from '../../utils/event';

interface PropsType {
  dispatch: (action: any) => void;
  room?: any;
  chat?: any;
  editorId: string;
  menuList?: any;
  placeholder?: string;
  onSubmit?: (value: any) => void;
}

const Editor = (props: PropsType) => {
  useEffect(() => {
    bindEvent();
    return () => {
      unbindEvent();
    };
  }, []);

  const {
    dispatch,
    room: {
      roomInfo: { id: roomId },
      userStatus: { imAccount, isForbit },
    },
    editorId,
    menuList,
    placeholder,
  } = props;
  const { t } = useTranslation();
  const userIsForbit = isForbit === 1;

  const inputRef: any = useRef(null);
  const [faceShow, setFaceShow] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // handle event listener of editor
  function bindEvent() {
    const {
      event: {
        editor: { setValue },
      },
    } = eventEmitter;
    eventEmitter.on(setValue, onInputValue);
    document.body.addEventListener('click', handleListen);
  }

  // handle remove event listener of editor
  function unbindEvent() {
    const {
      event: {
        editor: { setValue },
      },
    } = eventEmitter;
    eventEmitter.off(setValue, onInputValue);
    document.body.removeEventListener('click', handleListen);
  }

  // handle event of set inputvalue
  function onInputValue({ data: { value } }: any) {
    setInputValue(value);
  }

  // handle change of input
  function handleInputChange({ target: { value } }: any) {
    setInputValue(value);
  }

  // 表情失焦隐藏
  function handleListen({ target }: any) {
    if (
      target.getAttribute('alt') === 'emoji' ||
      target.getAttribute('data-alt') === 'emoji'
    ) {
      return;
    }
    setFaceShow(false);
  }

  // handle send msg
  function handleSendMsg(event: any) {
    if (event.keyCode === 13) {
      if (event.shiftKey) {
        return;
      } else {
        event.preventDefault();
      }
    }

    if (!inputValue.trim() || userIsForbit) {
      return;
    }

    if (props.onSubmit) {
      props.onSubmit(inputValue);
      return;
    }

    dispatch({
      type: 'chat/sendMsg',
      payload: {
        params: {
          content: {
            content: encodeURI(inputValue),
            msgType: 1,
          },
          roomId,
          senderId: imAccount,
        },
        onSuccess: {
          operate: () => setInputValue(''),
        },
        onError: {
          operate: () => message.error(`${t('操作频繁')}~~`),
        },
      },
    });
  }

  // handle menu click of edotor
  function handleMenuClick({ label }: any) {
    if (userIsForbit) {
      return;
    }
    const menuAction: any = {
      emoji: () => {
        setFaceShow(!faceShow);
      },
      img: () => {
        // setFaceShow(!faceShow)
      },
    };
    menuAction[label]?.();
  }

  // handle face selected
  function handleSelectFace({ face_name }: any) {
    const inputRef = document.getElementById(editorId);
    const inputVal = formatInput(inputRef, face_name);
    setInputValue(inputVal);
    setFaceShow(!faceShow);
  }

  // check before upload img
  function onBeforeUpload({ size }: File) {
    const maxSize = 2 * 1024 * 1024;
    if (size > maxSize) {
      message.error(t('请上传小于2M的图片'));
      return false;
    } else {
      return true;
    }
  }

  // handle file change & send img msg
  function handleFileChange({ file: { status, response } }: any) {
    if (status === 'done') {
      const { data } = response;
      dispatch({
        type: 'chat/sendMsg',
        payload: {
          params: {
            content: {
              content: data,
              msgType: 2,
            },
            roomId,
            senderId: imAccount,
          },
        },
      });
    } else if (status === 'error') {
      message.error(t('网络出现了点问题，请稍后上传试试'));
    }
  }

  return (
    <div className="editor-container">
      <Input.TextArea
        onPressEnter={handleSendMsg}
        placeholder={
          userIsForbit
            ? t('您已被禁言')
            : placeholder || `${t('一起互动聊天吧')}~~`
        }
        className="text-area"
        onChange={handleInputChange}
        value={inputValue}
        maxLength={1000}
        disabled={userIsForbit}
        ref={inputRef}
        id={editorId}
      />
      <div className="operate-area flex-between">
        <div className="tool">
          {menuList?.map((menu: any) =>
            menu.label === 'img' ? (
              <Upload
                disabled={userIsForbit}
                key={menu.label}
                accept=".jpg,.jpeg,.png,.JPG,.JPEG"
                data={{
                  filetype: '0',
                  module: 'msgpictext',
                }}
                beforeUpload={onBeforeUpload}
                onChange={handleFileChange}
                showUploadList={false}
                action={`${UPLOAD_HOST}/fileremote/file/uploadfile2`}
              >
                <i
                  key={menu.label}
                  className={`icon ${menu.label}${
                    userIsForbit ? ' disabled' : ''
                  }`}
                  data-alt={menu.label}
                  onClick={() => handleMenuClick(menu)}
                  title={userIsForbit ? t('您已被禁言') : ''}
                />
              </Upload>
            ) : (
              <i
                key={menu.label}
                className={`icon ${menu.label}${
                  userIsForbit ? ' disabled' : ''
                }`}
                data-alt={menu.label}
                onClick={() => handleMenuClick(menu)}
                title={userIsForbit ? t('您已被禁言') : ''}
              />
            )
          )}
          {faceShow ? (
            <div className="face-box">
              <ul>
                {emoji.map((face: any) => (
                  <li key={face.face_id}>
                    <img
                      src={`${FACE_URL}${face.face_name}@2x.png`}
                      alt="emoji"
                      onClick={() => handleSelectFace(face)}
                      onMouseDown={(event: any) => event.preventDefault()}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <a
          onClick={handleSendMsg}
          className={`send-btn${
            !inputValue.trim() || userIsForbit ? ' disabled' : ''
          }`}
          title={userIsForbit ? t('您已被禁言') : `${t('一起互动聊天吧')}~~`}
        >
          {t('发送')}
        </a>
      </div>
    </div>
  );
};

export default Editor;
