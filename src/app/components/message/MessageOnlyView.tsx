import React from 'react';
import { useLabels } from 'react-components';

import MessageView from '../message/MessageView';
import ItemStar from '../list/ItemStar';
import { ELEMENT_TYPES } from '../../constants';
import ItemLabels from '../list/ItemLabels';
import { useMessage } from '../../hooks/useMessage';
import { Message } from '../../models/message';

interface Props {
    messageID: string;
    mailSettings: any;
    onCompose: (message?: Message) => void;
}

const MessageOnlyView = ({ messageID, mailSettings, onCompose }: Props) => {
    const [labels] = useLabels();

    // There is only reading on the message here, no actions
    // MessageView will be in charge to trigger all messages actions
    const [{ data: message }] = useMessage({ ID: messageID }, mailSettings);

    if (!message) {
        return null;
    }

    return (
        <>
            <header className="flex flex-nowrap flex-spacebetween flex-items-center mb1">
                <h2 className="mb0">{message.Subject}</h2>
                <div>
                    <ItemLabels labels={labels} max={4} element={message} />
                    <ItemStar element={message} type={ELEMENT_TYPES.MESSAGE} />
                </div>
            </header>
            <MessageView
                message={message}
                initialExpand={true}
                labels={labels}
                mailSettings={mailSettings}
                onCompose={onCompose}
            />
        </>
    );
};

export default MessageOnlyView;
