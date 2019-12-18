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
    const [syncedMessage, { initialize, createDraft, saveDraft }] = useMessage(inputMessage, mailSettings);

    useEffect(() => {
        if (!loading && !syncedMessage.data?.ID) {
            withLoading(createDraft(createNewDraft(addresses)));
        }

        if (!loading && syncedMessage.data?.ID && !syncedMessage.initialized) {
            console.log('initialize from Composer');
            withLoading(initialize());
        }

        setModelMessage(syncedMessage);
        onChange(syncedMessage.data || {});
    }, [loading, syncedMessage]);

    const handleChange = (message: MessageExtended) => {
        setModelMessage({ ...modelMessage, ...message, data: { ...modelMessage.data, ...message.data } });
    };
    const handleSave = async () => {
        await saveDraft(modelMessage);
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
                    <ComposerActions message={modelMessage} onSave={handleSave} />
                </>
            )}
        </div>
    );
};

export default Composer;
