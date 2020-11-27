/**
 * @desc 图文直播描述
 */
'use strict'
import React, { useState, useEffect } from 'react';
import { connect } from 'dva';
import { withRouter } from 'dva/router';
import { Input, Button, Upload, Modal, message } from 'antd'
// @ts-ignore
import AModal from '@/components/modal';
import moment from 'moment'

// @ts-ignore
import { filterBreakWord, tottle } from '@/utils/tool'
// @ts-ignore
import { API_HOST } from '@/constants'

type PropsType = {
    room: any,
    detail: any,
    match: any,
    dispatch(action: any): void,
}

const ImgTextTab = (props: PropsType) => {
    const { detail: { imgTextList, imgTextHasMore, imgTextLoading }, room: { userStatus }, dispatch, match: { params: { id: roomId } } } = props
    const userIsForbit = userStatus.isForbit === 1

    const [inputValue, setInputValue] = useState('')
    const [reviewShow, setReviewShow] = useState(false)
    const [editShow, setEditShow] = useState(false)
    const [uploadShow, setUploadShow] = useState(false)
    const [fileList, setFileList] = useState([])
    const [curImgText, setCurImgText] = useState({
        imageVoList: [],
        msgId: 0,
        text: ''
    })

    useEffect(() => {
        const scrollDom: any = document.querySelector('.ofweek-modal.img-text .ant-modal-body')
        scrollDom && scrollDom.addEventListener('scroll', () => { tottle(animateToScroll) })
        return () => {
            scrollDom && scrollDom.removeEventListener('scroll', () => {
                tottle(animateToScroll)
            })
        }
    }, [])

    // open review img
    function handleOpenReview() {
        setUploadShow(false)
        setReviewShow(!reviewShow)
    }

    // open open upload
    function handleOpenUpload() {
        setUploadShow(!uploadShow)
    }

    // handle file change
    function handleFileChange({ fileList: newFileList }: any) {
        setFileList(newFileList.splice(0, 9));
    };

    // handle edit imgtext uploadchange
    function handleEditFileChange({ fileList: imageVoList }: any) {
        setCurImgText({
            ...curImgText,
            imageVoList: imageVoList.map((img: any) => ({
                ...img,
                imageUrl: img.imageUrl || (img.response && img.response.data),
                thumbUrl: img.thumbUrl || (img.response && img.response.data)
            })).splice(0, 9)
        })
    }

    /**
     * @desc send a new msg of imgText
     * @param {Number} type 0new 1update
     */
    function handleSubmit(type: Number) {
        let params;
        if (type) {
            const failFiles = curImgText.imageVoList.filter((file: any) => !file.imageUrl)
            if (failFiles.length) {
                message.error('存在未上传成功的图片，请重新上传后再发布')
                return
            }
            params = {
                fileUrl: curImgText.imageVoList.map((file: any) => file.imageUrl).join(','),
                msgId: curImgText.msgId,
                text: curImgText.text,
                type: curImgText.text && curImgText.imageVoList.length ? 3 : (
                    !curImgText.text ? 2 : 1
                )
            }

            if (curImgText.text && curImgText.imageVoList.length) {
                params.type = 3
            } else if (!curImgText.text) {
                params.type = 2
            }

        } else {
            const failFiles = fileList.filter((file: any) => file.status !== 'done')
            if (failFiles.length) {
                message.error('存在未上传成功的图片，请重新上传后再发布')
                return
            }

            params = {
                fileUrl: fileList.map((file: any) => file.response.data).join(','),
                roomId,
                senderId: userStatus.imAccount,
                text: encodeURI(inputValue),
                type: 1,
            }

            if (inputValue && fileList.length) {
                params.type = 3
            } else if (!inputValue) {
                params.type = 2
            }
        }

        dispatch({
            type: type ? 'detail/updateImgTextMsg' : 'detail/sendImgTextMsg',
            payload: {
                params,
                onSuccess: {
                    operate: () => {
                        if (type) {
                            message.success('修改成功')
                            setEditShow(false)
                        } else {
                            message.success('发布成功')
                            setInputValue('')
                            setFileList([])
                            setReviewShow(false)
                        }
                    }
                }
            }
        })
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
                thumbUrl: img.imageUrl
            }))
        })
        setEditShow(!editShow)
    }

    // handle open delete confirm of modal
    function handleOpenDel({ msgId }: any) {
        Modal.confirm({
            centered: true,
            content: "是否删除该图文信息",
            title: '提示',
            onOk: () => {
                dispatch({
                    type: 'detail/delImgTextMsg',
                    payload: {
                        params: {
                            msgId,
                            roomId
                        },
                        onSuccess: {
                            delete: true
                        }
                    }
                })
            }
        })
    }

    // 滚动跟随屏幕帧率刷新
    function animateToScroll() {
        const scrollRef: any = document.querySelector('.ofweek-modal.img-text .ant-modal-body')
        const scrollTop = scrollRef.scrollTop
        if (scrollTop >= scrollRef.scrollHeight - scrollRef.offsetHeight) {
            handleScrollBottom()
        }
    }

    // scroll bottom to get more data of img list
    function handleScrollBottom() {
        if (!imgTextHasMore || imgTextLoading) {
            return
        }
        dispatch({
            type: 'detail/save',
            payload: {
                imgTextLoading: true
            }
        })
        dispatch({
            type: 'detail/getImgTextList',
            payload: {
                params: {
                    roomId,
                    msgId: imgTextList[0] && imgTextList[0].msgId,
                    size: 20
                },
                onSuccess: {
                    search: () => {
                        dispatch({
                            type: 'detail/save',
                            payload: {
                                imgTextLoading: false
                            }
                        })
                    }
                }
            }
        })
    }

    return (<div className="tab-container img-text">
        <div className="wrap-operate">
            <Input.TextArea className="input-line" maxLength={1000} placeholder={userIsForbit ? "您已被禁言" : ""} value={inputValue} onChange={({ target: { value } }: any) => setInputValue(value)} disabled={userIsForbit}>
            </Input.TextArea>
            <div className="operate-line">
                <div className="line-l">
                    <label>
                        图文发布时间至直播结束时间后30分钟截止，在此之后将不可发布
                    </label>
                </div>
                <div className="line-r">
                    <Button onClick={handleOpenUpload} disabled={userIsForbit}>上传图片</Button>
                    <Button type="primary" disabled={!inputValue && !fileList.length} onClick={handleOpenReview}>预览</Button>
                    <Button type="primary" danger disabled={!inputValue && !fileList.length || userIsForbit} onClick={() => handleSubmit(0)}>发布</Button>
                </div>
            </div>
        </div>
        <div className={`wrap-list ${!imgTextList || !imgTextList.length ? ' empty flex-center' : ''}`}>
            {
                imgTextList && imgTextList.length ? <ul>
                    {
                        imgTextList.map((item: any) => <li key={Math.random()} className="wrap-item">
                            <div className="item-t">
                                <label>{moment(item.createDate).format('HH:mm:ss YYYY-MM-DD')}</label>
                                {
                                    (String(userStatus.imAccount) === String(item.senderId) || userStatus.role === 1) && <div className="flex">
                                        <i className="icon edit" onClick={() => handleOpenEdit(item)}></i>
                                        <i className="icon del" onClick={() => handleOpenDel(item)}></i>
                                    </div>
                                }
                            </div>
                            <div className="item-b">
                                {
                                    item.text.length ? <p dangerouslySetInnerHTML={{ __html: filterBreakWord(item.text) }}></p> : null
                                }
                                {
                                    item.imageVoList && item.imageVoList.length ?
                                        item.imageVoList.map((ele: any) =>
                                            <img src={ele.imageUrl} key={Math.random()} />)
                                        : null
                                }</div>

                        </li>)
                    }
                </ul> : <h3>暂无图文消息，精彩内容敬请期待！</h3>
            }
            {
                imgTextLoading && <div className="list-loading">{'加载中...'}</div>
            }
        </div>
        {
            imgTextLoading || imgTextHasMore ? null : <p className="wrap-list-no-more">全部加载完毕，敬请期待更多内容...</p>
        }

        {/* 图片上传 */}
        <AModal
            draggable={true}
            className="ofweek-modal draggable ofweek-upload-modal"
            width={690}
            title={
                <h1 className="ofweek-modal-title z2">
                    图片上传
            </h1>
            }
            footer={[
                <Button key={Math.random()} type="primary" onClick={handleOpenReview} disabled={!inputValue && !fileList.length}>完成</Button>
            ]}
            visible={uploadShow}
            onCancel={() => setUploadShow(false)}
        >
            <p className="upload-desc">
                已选择{fileList.length}张，还能选择{9 - fileList.length}张
            </p>
            <Upload
                accept=".jpg,.jpeg,.png,.JPG,.JPEG"
                multiple
                listType="picture-card"
                data={{
                    filetype: '0',
                    module: 'msgpictext'
                }}
                fileList={fileList}
                showUploadList={{
                    showPreviewIcon: false
                }}
                onChange={handleFileChange}
                action={`${API_HOST}/fileremote/file/uploadfile2`}>
                {
                    fileList.length < 9 && <i className="icon-upload-add"></i>
                }
            </Upload>
        </AModal>

        {/* 图文信息预览 */}
        <AModal
            draggable={true}
            className="ofweek-modal draggable ofweek-review-modal"
            width={670}
            title={
                <h1 className="ofweek-modal-title z2">
                    图文信息预览
            </h1>
            }
            footer={[
                <Button key={Math.random()} onClick={() => setReviewShow(false)}>继续编辑</Button>,
                <Button key={Math.random()} type="primary" disabled={!inputValue && !fileList.length || userIsForbit} onClick={() => handleSubmit(0)}>确认发布</Button>
            ]}
            visible={reviewShow}
            onCancel={() => setReviewShow(false)}
        >
            {
                inputValue && <p dangerouslySetInnerHTML={{ __html: filterBreakWord(inputValue) }}>
                </p>
            }

            {
                fileList && fileList.length ? fileList.map((file: any) => <img key={Math.random()} src={file.response && file.response.data} />) : null
            }
        </AModal>

        {/* 图文信息修改 */}
        <AModal
            draggable={true}
            className="ofweek-modal draggable ofweek-edit-modal"
            width={670}
            title={
                <h1 className="ofweek-modal-title z2">
                    修改图文
                </h1>
            }
            footer={[
                <Button key={Math.random()} type="primary" onClick={() => handleSubmit(1)} disabled={!curImgText.text && curImgText.imageVoList && !curImgText.imageVoList.length || userIsForbit}>确认修改</Button>
            ]}
            visible={editShow}
            onCancel={() => setEditShow(false)}
        >
            <Input.TextArea disabled={userIsForbit} className="input-line" maxLength={1000} placeholder={userIsForbit ? "您已被禁言" : ""} value={curImgText.text} onChange={({ target: { value } }: any) => setCurImgText({
                ...curImgText,
                text: value
            })}>
            </Input.TextArea>

            <Upload
                accept=".jpg,.jpeg,.png,.JPG,.JPEG"
                multiple
                listType="picture-card"
                data={{
                    filetype: '0',
                    module: 'msgpictext'
                }}
                // defaultFileList={curImgText.imageVoList}
                fileList={curImgText.imageVoList}
                showUploadList={{
                    showPreviewIcon: false
                }}
                onChange={handleEditFileChange}
                action={`${API_HOST}/fileremote/file/uploadfile2`}>
                {
                    curImgText.imageVoList.length < 9 && <i className="icon-upload-add"></i>
                }
            </Upload>

        </AModal>
    </div >)
}
export default withRouter(connect(({ room, detail }: any) => ({
    room: room.toJS(),
    detail: detail.toJS()
}))(ImgTextTab));