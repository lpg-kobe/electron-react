/**
 * @desc 演讲稿弹窗
 * @author pika
 */

import React, { useEffect } from 'react'
import { Button, message } from 'antd'
// @ts-ignore
import AModal from '@/components/modal';
// @ts-ignore
import ATable from '@/components/table';

const SpeechList = (props: any) => {
    const {
        dispatch,
        speech: { list },
        match: {
            params: {
                id: roomId
            }
        }
    } = props

    useEffect(() => {
        dispatch({
            type: 'speech/getList',
            payload: {
                params: {
                    roomid: roomId
                }
            }
        })
        return () => { };
    }, []);

    const tableOpts = {
        showIndex: false,
        size: 'small',
        scroll: {
            y: 520
        },
        rowKey: 'id',
        columns: [{
            title: '名称',
            key: 'name',
            ellipsis: true,
            textWrap: 'no-wrap',
            dataIndex: 'name'
        }, {
            title: '大小',
            key: 'fileSize',
            dataIndex: 'fileSize'
        }, {
            title: '操作',
            key: 'operate',
            render: (row: Object) => <Button size="small" type="primary" ghost onClick={() => handleOpenSpeech(row)}>演示</Button>
        }],
        dataSource: list || []
    }

    /** handle open speech */
    function handleOpenSpeech(speech: any) {
        const { id } = speech
        dispatch({
            type: 'speech/save',
            payload: {
                speechInfo: speech,
                speechModalShow: false,
                speechPageIndex: 1
            }
        })
        dispatch({
            type: 'speech/getInfo',
            payload: {
                params: { speechid: id },
                onSuccess: {
                    operate: ({ data: { pages } }: any) => {
                        // api翻页接口通知后台开启ppt直播
                        dispatch({
                            type: 'speech/turnPage',
                            payload: {
                                params: {
                                    pageNum: 1,
                                    pageUrl: pages[0].url,
                                    roomId,
                                    speechId: id
                                }
                            }
                        })
                        dispatch({
                            type: 'room/save',
                            payload: {
                                roomOpenSpeech: true
                            }
                        })
                    }
                },
                onError: {
                    operate: () => {
                        message.error('该演讲稿暂时不能演示，请稍后重试')
                    }
                }
            }
        })
    }

    return <>
        <AModal
            width={600}
            footer={null}
            visible={true}
            title={<h1 className="ofweek-modal-title z2" >演讲稿</h1 >}
            onCancel={() => dispatch({
                type: 'speech/save',
                payload: {
                    speechModalShow: false
                }
            })}
            className="ofweek-modal share-room small"
        >
            <ATable {...tableOpts} />
        </ AModal>
    </>
}

export default SpeechList