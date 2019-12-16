import React from 'react';

import { Message } from '../../models/message';
import { RichTextEditor } from 'react-components';

interface Props {
    message: Message;
    onChange: (message: Message) => void;
}

const ComposerContent = ({ onChange }: Props) => {
    const handleChange = (content: string) => {
        onChange({ Body: content });
    };

    return (
        <section className="composer-content flex-item-fluid w100 mb1">
            <RichTextEditor className="composer-quill" onChange={handleChange} />
        </section>
    );
};

export default ComposerContent;
