import React, { MutableRefObject, useEffect } from 'react';
import { useToggle } from 'react-components';
import { MessageExtended } from '../../../models/message';
import AddressesEditor from './AddressesEditor';
import AddressesSummary from './AddressesSummary';
import { getRecipients } from '../../../helpers/message/messages';

interface Props {
    message: MessageExtended;
    onChange: (message: MessageExtended) => void;
    addressesBlurRef: MutableRefObject<() => void>;
    addressesFocusRef: MutableRefObject<() => void>;
}

const Addresses = ({ message, onChange, addressesBlurRef, addressesFocusRef }: Props) => {
    // Summary of selected addresses or addresses editor
    const { state: editor, set: setEditor } = useToggle(true);

    // CC and BCC visible in expanded mode
    const { state: expanded, set: setExpanded, toggle: toggleExpanded } = useToggle(
        getRecipients(message.data).length > 0
    );

    useEffect(() => {
        addressesBlurRef.current = () => setEditor(false);
    }, []);

    const handleFocus = () => {
        setEditor(true);
        setExpanded(true);
        setTimeout(() => {
            addressesFocusRef.current();
        });
    };

    return editor ? (
        <AddressesEditor
            message={message}
            onChange={onChange}
            expanded={expanded}
            toggleExpanded={toggleExpanded}
            addressesFocusRef={addressesFocusRef}
        />
    ) : (
        <AddressesSummary message={message} onFocus={handleFocus} />
    );
};

export default Addresses;
