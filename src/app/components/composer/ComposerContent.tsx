import React from 'react';

import { MessageExtended } from '../../models/message';
import { RichTextEditor } from 'react-components';

interface Props {
    message: MessageExtended;
    onChange: (message: MessageExtended) => void;
}

const ComposerContent = ({ message, onChange }: Props) => {
    const handleChange = (content: string) => {
        onChange({ content });
    };

    return (
        <section className="composer-content flex-item-fluid w100 mb1">
            <RichTextEditor className="composer-quill" value={message.content} onChange={handleChange} />
        </section>
    );
};

export default ComposerContent;
