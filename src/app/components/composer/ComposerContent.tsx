import React, { MutableRefObject, useRef, useEffect, RefObject } from 'react';
import ReactQuill from 'react-quill';
import Quill from 'quill';
import { noop } from 'proton-shared/lib/helpers/function';
import { MessageExtended } from '../../models/message';

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

    return (
        <section className="composer-content flex-item-fluid w100 mb1">
            <ReactQuill
                className="composer-quill"
                value={message.content}
                onChange={handleChange}
                onFocus={onFocus}
                ref={inputRef}
            />
        </section>
    );
};

export default ComposerContent;
