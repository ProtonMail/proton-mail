import React, { MutableRefObject, useRef, useEffect, RefObject, useState } from 'react';
import ReactQuill from 'react-quill';
import Quill, { DeltaStatic } from 'quill';
import Delta from 'quill-delta';

import { generateUID } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

import { Attachment } from '../../../models/attachment';
import { getCid } from '../../../helpers/attachment/attachments';
import { getBlob } from '../../../helpers/embedded/embeddedStoreBlobs';
import EditorToolbar from './EditorToolbar';

import '../../../helpers/quill/quillSetup';

import 'react-quill/dist/quill.snow.css';

// Strangely types from quill and quill-delta are incompatible
const convertDelta = (delta: Delta): DeltaStatic => (delta as any) as DeltaStatic;

interface Props {
    content?: string;
    onChange: (content: string) => void;
    onFocus: () => void;
    onAddAttachments: (files: File[]) => Promise<Attachment[]>;
    contentFocusRef: MutableRefObject<() => void>;
}

const Editor = ({ content, onChange, onFocus, onAddAttachments, contentFocusRef }: Props) => {
    const [uid] = useState(generateUID('quill'));
    const reactQuillRef: RefObject<ReactQuill> = useRef(null);

    const toolbarId = `quill-${uid}-toolbar`;
    const getQuill = () => reactQuillRef.current?.getEditor() as Quill;

    useEffect(() => {
        contentFocusRef.current = reactQuillRef.current?.focus || noop;
    }, []);

    const handleChange = (content: string, delta: any, source: string) => {
        if (source === 'user') {
            onChange(content);
        }
    };

    const handleAddImageUrl = (url: string) => {
        const quill = getQuill();
        const range = quill.getSelection(true);

        const delta = new Delta()
            .retain(range.index)
            .delete(range.length)
            .insert({ image: url });

        quill.updateContents(convertDelta(delta), 'user');
        quill.setSelection(range.index + 1, 0, 'silent');
    };

    const handleAddAttachments = async (files: File[]) => {
        const attachments = await onAddAttachments(files);

        const quill = getQuill();
        const range = quill.getSelection(true);

        const delta = new Delta().retain(range.index).delete(range.length);

        attachments.forEach((attachment) => {
            const cid = getCid(attachment);
            const { url } = getBlob(cid);
            delta.insert({ image: url }, { cid, alt: attachment.Name });
        });

        quill.updateContents(convertDelta(delta), 'user');
        quill.setSelection(range.index + 1, 0, 'silent');
    };

    return (
        <>
            <EditorToolbar id={toolbarId} onAddImageUrl={handleAddImageUrl} onAddAttachments={handleAddAttachments} />
            <ReactQuill
                className="composer-quill w100 flex-item-fluid"
                modules={{ toolbar: `#${toolbarId}` }}
                value={content || ''}
                readOnly={!content}
                onChange={handleChange}
                onFocus={onFocus}
                ref={reactQuillRef}
            />
        </>
    );
};

export default Editor;
