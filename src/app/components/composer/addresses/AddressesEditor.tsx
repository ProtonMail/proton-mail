import React, { useState, MutableRefObject } from 'react';
import { c } from 'ttag';
import { Label, generateUID, Button, Tooltip, classnames, useModals, useContactEmails } from 'react-components';

import { MessageExtended, RecipientType, Recipient } from '../../../models/message';
import AddressesInput from './AddressesInput';
import AddressesContactsModals from './AddressesContactsModal';
import { ContactEmail } from '../../../models/contact';

interface Props {
    message: MessageExtended;
    onChange: (message: MessageExtended) => void;
    expanded: boolean;
    toggleExpanded: () => void;
    addressesFocusRef: MutableRefObject<() => void>;
}

const AddressesEditor = ({ message, onChange, expanded, toggleExpanded, addressesFocusRef }: Props) => {
    const [uid] = useState(generateUID('composer'));
    const [contacts, loading]: [ContactEmail[], boolean] = useContactEmails();
    const { createModal } = useModals();

    const handleChange = (type: RecipientType) => (value: Recipient[]) => {
        onChange({ data: { [type]: value } });
    };

    const handleContactModal = (type: RecipientType) => async () => {
        const recipients = await new Promise((resolve) => {
            createModal(<AddressesContactsModals inputValue={message.data?.[type]} onSubmit={resolve} />);
        });

        onChange({ data: { [type]: recipients } });
    };

    if (loading) {
        return null;
    }

    return (
        <div className="flex flex-row flex-nowrap flex-items-start pl0-5 mb0-5">
            <div className="flex flex-column composer-meta-label">
                <Label htmlFor={`to-${uid}`}>
                    <Tooltip title={c('Title').t`Add contacts`}>
                        <a onClick={handleContactModal('ToList')}>{c('Title').t`To`}</a>
                    </Tooltip>
                </Label>
                {expanded && (
                    <>
                        <Label htmlFor={`cc-${uid}`}>
                            <Tooltip title={c('Title').t`Add contacts`}>
                                <a onClick={handleContactModal('CCList')}>{c('Title').t`CC`}</a>
                            </Tooltip>
                        </Label>
                        <Label htmlFor={`bcc-${uid}`}>
                            <Tooltip title={c('Title').t`Add contacts`}>
                                <a onClick={handleContactModal('BCCList')}>{c('Title').t`BCC`}</a>
                            </Tooltip>
                        </Label>
                    </>
                )}
            </div>

            <div className="flex flex-column w100">
                <div className="flex flex-row w100 composer-addresses-container-line">
                    <AddressesInput
                        id={`to-${uid}`}
                        addresses={message.data?.ToList}
                        onChange={handleChange('ToList')}
                        addressesFocusRef={addressesFocusRef}
                        contacts={contacts}
                    />
                    <Tooltip originalPlacement="left" title={c('Title').t`CC BCC`}>
                        <Button
                            icon="caret"
                            className={classnames(['pm-button--link ml0-5 mr0-5', expanded && 'rotateX-180'])}
                            onClick={toggleExpanded}
                        />
                    </Tooltip>
                </div>
                {expanded && (
                    <>
                        <div className="flex flex-row w100 mt0-5 composer-addresses-container-line">
                            <AddressesInput
                                id={`cc-${uid}`}
                                addresses={message.data?.CCList}
                                onChange={handleChange('CCList')}
                                contacts={contacts}
                            />
                        </div>
                        <div className="flex flex-row w100 mt0-5 composer-addresses-container-line">
                            <AddressesInput
                                id={`bcc-${uid}`}
                                addresses={message.data?.BCCList}
                                onChange={handleChange('BCCList')}
                                contacts={contacts}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AddressesEditor;
