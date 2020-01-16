import React, { useState, useEffect, MutableRefObject, useRef, ReactNode } from 'react';
import Awesomplete from 'awesomplete';

import { contactToInput, inputToRecipient } from '../../../helpers/addresses';
import { ContactEmail } from '../../../models/contact';
import useEventListener from '../../../hooks/useEventListener';
import { Recipient } from '../../../models/message';

interface Props {
    inputRef: MutableRefObject<HTMLInputElement | undefined>;
    contacts: ContactEmail[];
    children: ReactNode;
    onSelect: (contact: ContactEmail) => void;
    currentValue: Recipient[];
}

const AddressesAutocomplete = ({ inputRef, contacts, onSelect, currentValue, children }: Props) => {
    const [awesomplete, setAwesomplete] = useState();
    const containerRef = useRef<HTMLDivElement>(null);

    const handleSelect = (event: any) => {
        const contact = contacts.find((contact) => contact.Email === inputToRecipient(event.text.value).Address);
        if (contact) {
            onSelect(contact);
        }
    };

    useEffect(() => {
        const awesompleteInstance = new Awesomplete(
            inputRef.current as HTMLElement,
            {
                container: () => containerRef.current as HTMLElement,
                minChars: 0,
                autoFirst: true
            } as Awesomplete.Options
        );
        setAwesomplete(awesompleteInstance);
        return () => awesompleteInstance.destroy();
    }, []);

    useEventListener(inputRef, 'awesomplete-selectcomplete', handleSelect);

    useEffect(() => {
        if (awesomplete) {
            awesomplete.list = contacts
                .filter((contact) => !currentValue.find((recipient) => recipient.Address === contact.Email))
                .map(contactToInput);
        }
    }, [awesomplete, contacts, currentValue]);

    return (
        <div className="composer-addresses-autocomplete flex-item-fluid relative" ref={containerRef}>
            {children}
        </div>
    );
};

export default AddressesAutocomplete;
