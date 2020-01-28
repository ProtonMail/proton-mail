import React, { useState, useEffect, MutableRefObject, useRef, ReactNode } from 'react';
import Awesomplete from 'awesomplete';

import { contactToInput } from '../../../helpers/addresses';
import { ContactEmail, ContactGroup, ContactOrGroup } from '../../../models/contact';
import useEventListener from '../../../hooks/useEventListener';
import { Recipient } from '../../../models/address';

interface Props {
    inputRef: MutableRefObject<HTMLInputElement | undefined>;
    contacts: ContactEmail[];
    contactGroups: ContactGroup[];
    children: ReactNode;
    onSelect: (value: ContactOrGroup) => void;
    currentValue: Recipient[];
}

const AddressesAutocomplete = ({ inputRef, contacts, contactGroups, onSelect, currentValue, children }: Props) => {
    const [awesomplete, setAwesomplete] = useState<Awesomplete>();
    const containerRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        if (awesomplete) {
            const contactList = contacts
                .filter((contact) => !currentValue.find((recipient) => recipient.Address === contact.Email))
                .map((contact) => ({
                    label: contactToInput(contact),
                    value: `Contact:${contact.ID}`
                }));

            const groupList = contactGroups
                .filter((group) => !currentValue.find((recipient) => recipient.Group === group.Path))
                .map((group) => ({
                    label: group.Name,
                    value: `Group:${group.ID}`
                }));

            awesomplete.list = [...contactList, ...groupList];

            (awesomplete as any).item = (text: string, input: string, itemId: string) =>
                (Awesomplete.ITEM as any)(text.replace('<', '&lt;'), input, itemId);

            // Prevent Awesomplete to open immediately
            awesomplete.close();
        }
    }, [awesomplete, contacts, contactGroups, currentValue]);

    const handleSelect = (event: any) => {
        const value = event.text.value;
        const contactID = /Contact:(.*)/.exec(value)?.[1];
        const contact = contacts.find((contact) => contact.ID === contactID);
        const groupID = /Group:(.*)/.exec(value)?.[1];
        const group = contactGroups.find((group) => group.ID === groupID);
        if (contact || group) {
            onSelect({ contact, group });
        }
        awesomplete?.close();
    };

    useEventListener(inputRef, 'awesomplete-selectcomplete', handleSelect);

    useEventListener(inputRef, 'click', () => {
        if (awesomplete) {
            awesomplete.open();
        }
    });

    return (
        <div className="composer-addresses-autocomplete flex-item-fluid relative" ref={containerRef}>
            {children}
        </div>
    );
};

export default AddressesAutocomplete;
