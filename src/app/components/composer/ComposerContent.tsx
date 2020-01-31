import React, { MutableRefObject } from 'react';
import { MessageExtended } from '../../models/message';
import { getAttachments } from '../../helpers/message/messages';
import AttachmentsList from './attachments/AttachmensList';
import { Attachment } from '../../models/attachment';

import 'react-quill/dist/quill.snow.css';
import Editor from './editor/Editor';

interface Props {
    message: MessageExtended;
    onChange: (message: MessageExtended) => void;
    onFocus: () => void;
    onAddAttachments: (files: File[]) => void;
    onRemoveAttachment: (attachment: Attachment) => () => void;
    contentFocusRef: MutableRefObject<() => void>;
}

const ComposerContent = ({
    message,
    onChange,
    onFocus,
    onAddAttachments,
    onRemoveAttachment,
    contentFocusRef
}: Props) => {
    const attachments = getAttachments(message.data);

    const handleChange = (content: string) => {
        onChange({ content });
    };

    return (
        <section className="composer-content flex-item-fluid w100 mb0-5 flex flex-column flex-nowrap">
            <Editor
                content={message.content}
                onChange={handleChange}
                onFocus={onFocus}
                onAddAttachments={onAddAttachments}
                contentFocusRef={contentFocusRef}
            />
            {attachments.length > 0 && <AttachmentsList message={message.data} onRemove={onRemoveAttachment} />}
        </section>
    );
};

export default ComposerContent;
