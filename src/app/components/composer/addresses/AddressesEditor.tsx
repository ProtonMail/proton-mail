import React, { useState, MutableRefObject } from 'react';
import { c } from 'ttag';
import { Label, generateUID, Button, Tooltip } from 'react-components';

import { MessageExtended, RecipientType, Recipient } from '../../../models/message';
import AddressesInput from './AddressesInput';

interface Props {
    message: MessageExtended;
    onChange: (message: MessageExtended) => void;
    expanded: boolean;
    toggleExpanded: () => void;
    addressesFocusRef: MutableRefObject<() => void>;
}

const AddressesEditor = ({ message, onChange, expanded, toggleExpanded, addressesFocusRef }: Props) => {
    const [uid] = useState(generateUID('composer'));

    const handleChange = (type: RecipientType) => (value: Recipient[]) => {
        onChange({ data: { [type]: value } });
    };

    const handleContactModal = (type: RecipientType) => () => {
        console.log('Open contact modal for', type);
    };

    return (
        <div className="flex flex-row flex-nowrap flex-items-start pl0-5 mb0-5">
            <div className="flex flex-column flex-items-start flex-item-fluid">
                <div className="flex flex-row w100">
                    <Label htmlFor={`to-${uid}`} className="composer-meta-label">
                        <Tooltip title={c('Title').t`Add contacts`}>
                            <a onClick={handleContactModal('ToList')}>{c('Title').t`To`}</a>
                        </Tooltip>
                    </Label>
                    <AddressesInput
                        id={`to-${uid}`}
                        addresses={message.data?.ToList}
                        onChange={handleChange('ToList')}
                        addressesFocusRef={addressesFocusRef}
                    />
                </div>
                {expanded && (
                    <>
                        <div className="flex flex-row w100 mt0-5">
                            <Label htmlFor={`cc-${uid}`} className="composer-meta-label">
                                <a onClick={handleContactModal('CCList')}>{c('Title').t`CC`}</a>
                            </Label>
                            <AddressesInput
                                id={`cc-${uid}`}
                                addresses={message.data?.CCList}
                                onChange={handleChange('CCList')}
                            />
                        </div>
                        <div className="flex flex-row w100 mt0-5">
                            <Label htmlFor={`bcc-${uid}`} className="composer-meta-label">
                                <a onClick={handleContactModal('BCCList')}>{c('Title').t`BCC`}</a>
                            </Label>
                            <AddressesInput
                                id={`bcc-${uid}`}
                                addresses={message.data?.BCCList}
                                onChange={handleChange('BCCList')}
                            />
                        </div>
                    </>
                )}
            </div>
            <Button icon="caret" className="pm-button--link ml0-5 mr0-5" onClick={toggleExpanded} />
        </div>
    );
};

export default AddressesEditor;
