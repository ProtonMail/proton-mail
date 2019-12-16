import React, { ReactNode, useState } from 'react';

import { MessageExtended } from '../models/message';
import Composer from '../components/composer/Composer';

import '../components/composer/composer.scss';
import { useMailSettings } from 'react-components';

interface Props {
    children: (props: { onCompose: (message: MessageExtended) => void }) => ReactNode;
}

const ComposerContainer = ({ children }: Props) => {
    const [mailSettings, loading] = useMailSettings();
    const [messages, setMessages] = useState<MessageExtended[]>([]);

    if (loading) {
        return null;
    }

    const handleCompose = (message: MessageExtended) => {
        setMessages([...messages, message]);
    };
    const handleClose = (message: MessageExtended) => () => {
        setMessages(messages.filter((m) => m !== message));
    };

    return (
        <>
            {children({ onCompose: handleCompose })}
            <div className="composer-container">
                {messages.map((message) => (
                    <Composer
                        key={(message.data || {}).ID}
                        message={message}
                        mailSettings={mailSettings}
                        onClose={handleClose(message)}
                    />
                ))}
            </div>
        </>
    );
};

export default ComposerContainer;
