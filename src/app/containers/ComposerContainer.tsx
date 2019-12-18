import React, { ReactNode, useState } from 'react';

import { Message } from '../models/message';
import Composer from '../components/composer/Composer';

import '../components/composer/composer.scss';
import { useMailSettings, useAddresses } from 'react-components';

interface Props {
    children: (props: { onCompose: (message?: Message) => void }) => ReactNode;
}

const ComposerContainer = ({ children }: Props) => {
    const [mailSettings, loadingSettings] = useMailSettings();
    const [addresses, loadingAddresses] = useAddresses();
    const [messages, setMessages] = useState<Message[]>([]);

    if (loadingSettings || loadingAddresses) {
        return null;
    }

    const handleCompose = (message: Message = {}) => {
        !messages.some((m) => m.ID === message.ID) && setMessages([...messages, message]);
    };
    const handleChange = (oldMessage: Message) => (newMessage: Message) => {
        const newMessages = [...messages];
        newMessages[newMessages.indexOf(oldMessage)] = newMessage;
        setMessages(newMessages);
    };
    const handleClose = (message: Message) => () => {
        setMessages(messages.filter((m) => m !== message));
    };

    return (
        <>
            {children({ onCompose: handleCompose })}
            <div className="composer-container">
                {messages.map((message, i) => (
                    <Composer
                        key={message.ID || i}
                        message={message}
                        mailSettings={mailSettings}
                        addresses={addresses}
                        onChange={handleChange(message)}
                        onClose={handleClose(message)}
                    />
                ))}
            </div>
        </>
    );
};

export default ComposerContainer;
