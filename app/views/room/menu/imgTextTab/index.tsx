/**
 * @desc 图文直播描述
 */
'use strict'
import React, { useState } from 'react';
import { connect } from 'dva';
import { Input, Button, Upload, Modal } from 'antd'
// @ts-ignore
import AModal from '@/components/modal';
import moment from 'moment'

// @ts-ignore
import { filterBreakWord } from '@/utils/tool'
// @ts-ignore
import { API_HOST } from '@/constants'

type PropsType = {
    room: any,
    detail: any,
    dispatch(action: any): void,
}

const ImgTextTab = (props: PropsType) => {
    const { detail: { imgTextList, imgTextHasMore } } = props
    const [inputValue, setInputValue] = useState('')
    const [dataLoading, setDataLoading] = useState(false)
    const [reviewShow, setReviewShow] = useState(false)
    const [editShow, setEditShow] = useState(false)
    const [uploadShow, setUploadShow] = useState(false)
    const [fileList, setFileList] = useState([])

    // open review img
    function handleOpenReview() {
        setUploadShow(!uploadShow)
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

    // hanndle submit img-text
    function handleSubmit() {

    }

    // handle open delete confirm of modal
    function handleOpenDel() {
        Modal.confirm({
            centered: true,
            content: "是否删除该图文信息",
            title: '提示',
            onOk: () => {

            }
        })
    }

    return (<div className="tab-container img-text">
        <div className="wrap-operate">
            <Input.TextArea className="input-line" maxLength={1000} placeholder="" value={inputValue} onChange={({ target: { value } }: any) => setInputValue(value)}>
            </Input.TextArea>
            <div className="operate-line">
                <div className="line-l">
                    <label>
                        图文发布时间至直播结束时间后30分钟截止，在此之后将不可发布
                    </label>
                </div>
                <div className="line-r">
                    <Button onClick={handleOpenUpload}>上传图片</Button>
                    <Button type="primary" disabled={!inputValue && !fileList.length}>预览</Button>
                    <Button type="primary" danger disabled={!inputValue && !fileList.length}>发布</Button>
                </div>
            </div>
        </div>
        <div className={`wrap-list ${!imgTextList || !imgTextList.length ? ' empty flex-center' : ''}`}>
            {
                imgTextList && imgTextList.length ? <ul>
                    {
                        dataLoading || imgTextHasMore ? null : <li className="wrap-item no-more">全部加载完毕，敬请期待更多内容...</li>
                    }
                    {
                        imgTextList.map((item: any) => <li key={Math.random()} className="wrap-item">
                            <div className="item-t">
                                <label>{moment(item.createDate).format('HH:mm:ss YYYY-MM-DD')}</label>
                                <div className="flex">
                                    <i className="icon edit" onClick={() => setEditShow(!editShow)}></i>
                                    <i className="icon del" onClick={handleOpenDel}></i>
                                </div>
                            </div>
                            <div className="item-b">
                                {
                                    item.text.length && <p dangerouslySetInnerHTML={{ __html: filterBreakWord(item.text) }}></p>
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
                dataLoading && <div className="list-loading">{'加载中...'}</div>
            }
        </div>

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
                    fileList.length < 9 && <i className="icon-add"></i>
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
                <Button key={Math.random()} type="primary" onClick={handleSubmit}>确认发布</Button>
            ]}
            visible={reviewShow}
            onCancel={() => setReviewShow(false)}
        >
            <p dangerouslySetInnerHTML={{ __html: filterBreakWord(inputValue) }}>
            </p>
            {
                fileList.length && fileList.map((file: any) => <img key={Math.random()} src={file.response && file.response.data} />)
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
                <Button key={Math.random()} type="primary" onClick={handleSubmit}>确认修改</Button>
            ]}
            visible={editShow}
            onCancel={() => setEditShow(false)}
        >
            <Input.TextArea className="input-line" maxLength={1000} placeholder="" value={inputValue} onChange={({ target: { value } }: any) => setInputValue(value)}>
            </Input.TextArea>
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
                    fileList.length < 9 && <i className="icon-add"></i>
                }
            </Upload>
        </AModal>
    </div>)
}
export default connect(({ room, detail }: any) => ({
    room: room.toJS(),
    detail: detail.toJS()
}))(ImgTextTab);