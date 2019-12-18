import React from 'react';

import { Button } from 'react-components';
import { formatSimpleDate } from '../../helpers/date';
import { MessageExtended } from '../../models/message';
import { getDate } from '../../helpers/elements';

interface Props {
    message: MessageExtended;
    onSave: () => Promise<void>;
}

const ComposerActions = ({ message, onSave }: Props) => {
    return (
        <footer className="composer-actions flex flex-row flex-spacebetween w100">
            <div>
                <Button icon="attach" /> <Button icon="expiration" /> <Button icon="lock" />
            </div>
            <div className="flex-self-vcenter">
                <span>Saved at {formatSimpleDate(getDate(message.data))}</span>
                <Button className="ml1" icon="trash" /> <Button icon="save" onClick={onSave} />{' '}
                <Button className="pm-button-blue">Send</Button>
            </div>
        </footer>
    );
};

export default ComposerActions;
