import React, { useState, useEffect } from 'react';

import { Message, MessageExtended } from '../../models/message';
import ComposerTitleBar from './ComposerTitleBar';
import ComposerMeta from './ComposerMeta';
import ComposerContent from './ComposerContent';
import ComposerActions from './ComposerActions';
import { useMessage } from '../../hooks/useMessage';
import { createNewDraft } from '../../helpers/message/messageDraft';
import { Address } from '../../models/address';
import { useLoading, Loader } from 'react-components';

/**
 * Create a new MessageExtended with props from both m1 and m2
 * Almost a standard deep merge but simplified with specific needs
 * m2 props will override those from m1
 */
const mergeMessages = (m1: MessageExtended, m2: MessageExtended) => ({
    ...m1,
    ...m2,
    data: { ...m1.data, ...m2.data }
});

interface Props {
    message?: Message;
    mailSettings: any;
    addresses: Address[];
    onChange: (message: Message) => void;
    onClose: () => void;
}

const Composer = ({ message: inputMessage = {}, mailSettings, addresses, onChange, onClose }: Props) => {
    const [modelMessage, setModelMessage] = useState<MessageExtended>({ data: inputMessage });
    const [loading, withLoading] = useLoading(false);
    const [syncedMessage, { initialize, createDraft, saveDraft, send }] = useMessage(inputMessage, mailSettings);

    useEffect(() => {
        if (!loading && !syncedMessage.data?.ID) {
            withLoading(createDraft(createNewDraft(addresses)));
        }

        if (!loading && syncedMessage.data?.ID && typeof syncedMessage.initialized === 'undefined') {
            withLoading(initialize());
        }

        setModelMessage(mergeMessages(modelMessage, syncedMessage));
        onChange(syncedMessage.data || {});
    }, [loading, syncedMessage]);

    const handleChange = (message: MessageExtended) => {
        console.log('change', message);
        setModelMessage(mergeMessages(modelMessage, message));
    };
    const handleSave = async () => {
        await saveDraft(modelMessage);
    };
    const handleSend = async () => {
        await send(modelMessage);
        onClose();
    };

    const showLoader = loading || !modelMessage.data?.ID || !modelMessage.content;

    return (
        <div className="composer flex flex-column p0-5">
            {showLoader ? (
                <Loader />
            ) : (
                <>
                    <ComposerTitleBar message={modelMessage} onClose={onClose} />
                    <ComposerMeta message={modelMessage} addresses={addresses} onChange={handleChange} />
                    <ComposerContent message={modelMessage} onChange={handleChange} />
                    <ComposerActions message={modelMessage} onSave={handleSave} onSend={handleSend} />
                </>
            )}
        </div>
    );
};

export default Composer;
