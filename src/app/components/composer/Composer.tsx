import React, { useState } from 'react';

import { MessageExtended, Message } from '../../models/message';
import ComposerTitleBar from './ComposerTitleBar';
import ComposerMeta from './ComposerMeta';
import ComposerContent from './ComposerContent';
import ComposerActions from './ComposerActions';

interface Props {
    message: MessageExtended;
    mailSettings: any;
    onClose: () => void;
}

const Composer = ({ message, onClose }: Props) => {
    const [currentMessage, setCurrentMessage] = useState<Message>(message.data || {});

    const handleChange = (message: Message) => {
        console.log('change', message);
        setCurrentMessage({ ...currentMessage, ...message });
    };

    return (
        <div className="composer flex flex-column p0-5">
            <ComposerTitleBar message={currentMessage} onClose={onClose} />
            <ComposerMeta message={currentMessage} onChange={handleChange} />
            <ComposerContent message={currentMessage} onChange={handleChange} />
            <ComposerActions message={currentMessage} />
        </div>
    );
};

export default Composer;
