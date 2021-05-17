/**
 * @desc 图文直播描述
 * @feature 1、单独封装一个input图文编辑器确保onchange事件回调最小面积reRender
 * @feature 2、拖拽modal限制只能头部拖拽
 * @feature 3、封装一个通用的scroll component
 */

import React, { memo, useState, useEffect } from 'react';
import { Input, Button, Upload, Modal, message } from 'antd';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import immutable from 'immutable';
import AModal from '@/components/modal';
import BreakWord from '@/components/breakWord';
import { tottle } from '@/utils/tool';
import { UPLOAD_HOST } from '@/constants';

const ImgTextTab = (props: any) => {
  const {
    detail: { imgTextList, imgTextHasMore, imgTextLoading },
    room: { userStatus },
    dispatch,
    match: {
      params: { id: roomId },
    },
  } = props;
  const { t } = useTranslation();
  const userIsForbit = userStatus.isForbit === 1;

  const [inputValue, setInputValue] = useState('');
  const [reviewShow, setReviewShow] = useState(false);
  const [editShow, setEditShow] = useState(false);
  const [uploadShow, setUploadShow] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [curImgText, setCurImgText] = useState({
    imageVoList: [],
    msgId: 0,
    text: '',
  });

  useEffect(() => {
    // 图文数据更新时重新绑定监听事件确保事件触发时拿到最新的数据
    const scrollDom: any = document.querySelector(
      '.ofweek-modal.img-text .ant-modal-body'
    );
    if (!scrollDom || !imgTextList.length) {
      return;
    }
    // clear prev listener before bind new listener
    scrollDom.removeEventListener('scroll', handleListener);
    scrollDom.addEventListener('scroll', handleListener);
    return () => {
      scrollDom?.removeEventListener('scroll', handleListener);
    };
  }, [imgTextList.length]);

  // callback of listener
  function handleListener() {
    tottle(animateToScroll);
  }

  // open review img
  function handleOpenReview() {
    setUploadShow(false);
    setReviewShow(!reviewShow);
  }

  // open open upload
  function handleOpenUpload() {
    setUploadShow(!uploadShow);
  }

  // handle file change
  function handleFileChange({ fileList: newFileList }: any) {
    setFileList(newFileList.splice(0, 9));
  }

  // handle edit imgtext uploadchange
  function handleEditFileChange({ fileList: imageVoList }: any) {
    setCurImgText({
      ...curImgText,
      imageVoList: imageVoList
        .map((img: any) => ({
          ...img,
          imageUrl: img.imageUrl || img.response?.data,
          thumbUrl: img.thumbUrl || img.response?.data,
        }))
        .splice(0, 9),
    });
  }

  /**
   * @desc send a new msg of imgText
   * @param {Number} type 0 new 1 update
   */
  function handleSubmit(type: Number) {
    let params;
    if (type) {
      const failFiles = curImgText.imageVoList.filter(
        (file: any) => !file.imageUrl
      );
      if (failFiles.length) {
        message.error(t('存在未上传成功的图片，请重新上传后再发布'));
        return;
      }
      params = {
        fileUrl: curImgText.imageVoList
          .map((file: any) => file.imageUrl)
          .join(','),
        msgId: curImgText.msgId,
        text: encodeURI(curImgText.text),
        type:
          curImgText.text && curImgText.imageVoList.length
            ? 3
            : !curImgText.text
            ? 2
            : 1,
      };

      if (curImgText.text && curImgText.imageVoList.length) {
        params.type = 3;
      } else if (!curImgText.text) {
        params.type = 2;
      }
    } else {
      const failFiles = fileList.filter((file: any) => file.status !== 'done');
      if (failFiles.length) {
        message.error(t('存在未上传成功的图片，请重新上传后再发布'));
        return;
      }

      params = {
        fileUrl: fileList.map((file: any) => file.response.data).join(','),
        roomId,
        senderId: userStatus.imAccount,
        text: encodeURI(inputValue),
        type: 1,
      };

      if (inputValue && fileList.length) {
        params.type = 3;
      } else if (!inputValue) {
        params.type = 2;
      }
    }

    dispatch({
      type: type ? 'detail/updateImgTextMsg' : 'detail/sendImgTextMsg',
      payload: {
        params,
        onSuccess: {
          operate: () => {
            if (type) {
              message.success(t('修改成功'));
              setEditShow(false);
            } else {
              message.success(t('发布成功'));
              setInputValue('');
              setFileList([]);
              setReviewShow(false);
            }
          },
        },
      },
    });
  }

  /**
   * @desc handle open edit modal of imgText
   * @param {Object} item current item of imgText
   */
  function handleOpenEdit(item: any) {
    setCurImgText({
      ...item,
      imageVoList: item.imageVoList.map((img: any) => ({
        ...img,
        uid: Math.random(),
        thumbUrl: img.imageUrl,
      })),
    });
    setEditShow(!editShow);
  }

  // handle open delete confirm of modal
  function handleOpenDel({ msgId }: any) {
    Modal.confirm({
      centered: true,
      content: t('是否删除该图文信息'),
      title: t('提示'),
      okText: t('删除'),
      cancelText: t('取消'),
      onOk: () => {
        dispatch({
          type: 'detail/delImgTextMsg',
          payload: {
            params: {
              msgId,
              roomId,
            },
            onSuccess: {
              delete: true,
            },
          },
        });
      },
    });
  }

  // 滚动跟随屏幕帧率刷新
  function animateToScroll() {
    const scrollRef: any = document.querySelector(
      '.ofweek-modal.img-text .ant-modal-body'
    );
    const scrollTop = scrollRef.scrollTop;
    if (scrollTop >= scrollRef.scrollHeight - scrollRef.offsetHeight) {
      handleScrollBottom();
    }
  }

  // scroll bottom to get more data of img list
  function handleScrollBottom() {
    if (!imgTextHasMore || imgTextLoading) {
      return;
    }
    dispatch({
      type: 'detail/save',
      payload: {
        imgTextLoading: true,
      },
    });
    dispatch({
      type: 'detail/getImgTextList',
      payload: {
        params: {
          roomId,
          msgId: imgTextList[imgTextList.length - 1].msgId,
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
  }

  return (
    <div className="tab-container img-text">
      <div className="wrap-operate">
        <Input.TextArea
          className="input-line"
          maxLength={1000}
          placeholder={userIsForbit ? t('您已被禁言') : ''}
          value={inputValue}
          onChange={({ target: { value } }: any) => setInputValue(value)}
          disabled={userIsForbit}
        />
        <div className="operate-line">
          <div className="line-l">
            <label>
              {t('图文发布时间至直播结束时间后30分钟截止，在此之后将不可发布')}
            </label>
          </div>
          <div className="line-r">
            <Button onClick={handleOpenUpload} disabled={userIsForbit}>
              {t('上传图片')}
            </Button>
            <Button
              type="primary"
              disabled={!inputValue && !fileList.length}
              onClick={handleOpenReview}
            >
              {t('预览')}
            </Button>
            <Button
              type="primary"
              danger
              disabled={(!inputValue && !fileList.length) || userIsForbit}
              onClick={() => handleSubmit(0)}
            >
              {t('发布')}
            </Button>
          </div>
        </div>
      </div>
      <div
        className={`wrap-list ${
          !imgTextList || !imgTextList.length ? ' empty flex-center' : ''
        }`}
      >
        {imgTextList?.length ? (
          <ul>
            {imgTextList.map((item: any) => (
              <li key={Math.random()} className="wrap-item">
                <div className="item-t">
                  <label>
                    {moment(item.createDate).format('HH:mm:ss YYYY-MM-DD')}
                  </label>
                  {(String(userStatus.imAccount) === String(item.senderId) ||
                    userStatus.role === 1) && (
                    <div className="flex">
                      <i
                        className="icon edit"
                        onClick={() => handleOpenEdit(item)}
                      />
                      <i
                        className="icon del"
                        onClick={() => handleOpenDel(item)}
                      />
                    </div>
                  )}
                </div>
                <div className="item-b">
                  {item.imageVoList?.length
                    ? item.imageVoList.map((ele: any) => (
                        <img src={ele.imageUrl} key={Math.random()} />
                      ))
                    : null}
                  {item.text.length ? (
                    <BreakWord
                      options={{
                        text: item.text,
                      }}
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <h3>{t('暂无图文消息，精彩内容敬请期待')}！</h3>
        )}
        {imgTextLoading && <div className="list-loading">{t('加载中')}...</div>}
      </div>
      {imgTextLoading || imgTextHasMore || !imgTextList.length ? null : (
        <p className="wrap-list-no-more">
          {t('全部加载完毕，敬请期待更多内容')}...
        </p>
      )}

      {/* 图片上传 */}
      <AModal
        className="ofweek-modal draggable ofweek-upload-modal"
        width={690}
        title={<h1 className="ofweek-modal-title z2">{t('图片上传')}</h1>}
        footer={[
          <Button
            key={Math.random()}
            type="primary"
            onClick={handleOpenReview}
            disabled={!inputValue && !fileList.length}
          >
            {t('完成')}
          </Button>,
        ]}
        visible={uploadShow}
        onCancel={() => setUploadShow(false)}
      >
        <p className="upload-desc">
          {t('已选择')}
          {fileList.length}，{t('还能选择')}
          {9 - fileList.length}
        </p>
        <Upload
          accept=".jpg,.jpeg,.png,.JPG,.JPEG"
          multiple
          listType="picture-card"
          data={{
            filetype: '0',
            module: 'msgpictext',
          }}
          fileList={fileList}
          showUploadList={{
            showPreviewIcon: false,
          }}
          onChange={handleFileChange}
          action={`${UPLOAD_HOST}/fileremote/file/uploadfile2`}
        >
          {fileList.length < 9 && <i className="icon-upload-add" />}
        </Upload>
      </AModal>

      {/* 图文信息预览 */}
      <AModal
        className="ofweek-modal draggable ofweek-review-modal"
        width={670}
        title={<h1 className="ofweek-modal-title z2">{t('图文信息预览')}</h1>}
        footer={[
          <Button key={Math.random()} onClick={() => setReviewShow(false)}>
            {t('继续编辑')}
          </Button>,
          <Button
            key={Math.random()}
            type="primary"
            disabled={(!inputValue && !fileList.length) || userIsForbit}
            onClick={() => handleSubmit(0)}
          >
            {t('确认发布')}
          </Button>,
        ]}
        visible={reviewShow}
        onCancel={() => setReviewShow(false)}
      >
        {fileList?.length
          ? fileList.map((file: any) => (
              <img key={Math.random()} src={file.response?.data} />
            ))
          : null}

        {inputValue && (
          <BreakWord
            options={{
              text: inputValue,
            }}
          />
        )}
      </AModal>

      {/* 图文信息修改 */}
      <AModal
        className="ofweek-modal draggable ofweek-edit-modal"
        width={670}
        title={<h1 className="ofweek-modal-title z2">{t('修改图文')}</h1>}
        footer={[
          <Button
            key={Math.random()}
            type="primary"
            onClick={() => handleSubmit(1)}
            disabled={
              (!curImgText.text &&
                curImgText.imageVoList &&
                !curImgText.imageVoList.length) ||
              userIsForbit
            }
          >
            {t('确认修改')}
          </Button>,
        ]}
        visible={editShow}
        onCancel={() => setEditShow(false)}
      >
        <Input.TextArea
          disabled={userIsForbit}
          className="input-line"
          maxLength={1000}
          placeholder={userIsForbit ? t('您已被禁言') : ''}
          value={curImgText.text}
          onChange={({ target: { value } }: any) =>
            setCurImgText({
              ...curImgText,
              text: value,
            })
          }
        />

        <Upload
          accept=".jpg,.jpeg,.png,.JPG,.JPEG"
          multiple
          listType="picture-card"
          data={{
            filetype: '0',
            module: 'msgpictext',
          }}
          // defaultFileList={curImgText.imageVoList}
          fileList={curImgText.imageVoList}
          showUploadList={{
            showPreviewIcon: false,
          }}
          onChange={handleEditFileChange}
          action={`${UPLOAD_HOST}/fileremote/file/uploadfile2`}
        >
          {curImgText.imageVoList.length < 9 && (
            <i className="icon-upload-add" />
          )}
        </Upload>
      </AModal>
    </div>
  );
};

export default memo(ImgTextTab, (prevProps, nextProps) => {
  const prevMap = immutable.fromJS({
    room: prevProps.room,
    detail: prevProps.detail,
  });
  const nextMap = immutable.fromJS({
    room: nextProps.room,
    detail: nextProps.detail,
  });
  return immutable.is(prevMap, nextMap);
});
