import React, { MutableRefObject, useRef, useEffect, RefObject } from 'react';
import ReactQuill from 'react-quill';
import Quill from 'quill';
import { noop } from 'proton-shared/lib/helpers/function';
import { MessageExtended } from '../../models/message';
import { getAttachments } from '../../helpers/message/messages';
import AttachmentsList from './attachments/AttachmensList';

const Block = Quill.import('blots/block');
Block.tagName = 'div';
Quill.register(Block);

interface Props {
    message: MessageExtended;
    onChange: (message: MessageExtended) => void;
    onFocus: () => void;
    contentFocusRef: MutableRefObject<() => void>;
}

const ComposerContent = ({ message, onChange, onFocus, contentFocusRef }: Props) => {
    const inputRef: RefObject<ReactQuill> = useRef(null);

    useEffect(() => {
        contentFocusRef.current = inputRef.current?.focus || noop;
    }, []);

    const handleChange = (content: string) => {
        onChange({ content });
    };

    const attachments = getAttachments(message.data);

    return (
        <section className="composer-content flex-item-fluid w100 mb1 flex flex-column">
            <ReactQuill
                className="composer-quill w100"
                value={message.content}
                onChange={handleChange}
                onFocus={onFocus}
                ref={inputRef}
            />
            {attachments.length > 0 && <AttachmentsList message={message.data} />}
        </section>
    );
};

export default ComposerContent;
