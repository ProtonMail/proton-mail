import React from 'react';
import { Icon, useModals } from 'react-components';

import { ContactEmail } from '../../../models/contact';
import AddressesGroupModal from './AddressesGroupModal';
import { getRecipientGroupLabel } from '../../../helpers/addresses';
import { RecipientGroup } from '../../../models/address';
import { getContactsOfGroup } from '../../../helpers/contacts';

interface Props {
    recipientGroup?: RecipientGroup;
    contacts: ContactEmail[];
    onChange: (value: RecipientGroup) => void;
    onRemove: () => void;
}

const AddressesGroupItem = ({ recipientGroup, contacts, onChange, onRemove }: Props) => {
    const { createModal } = useModals();

    const contactsInGroup = getContactsOfGroup(contacts, recipientGroup?.group?.ID);
    const label = getRecipientGroupLabel(recipientGroup, contactsInGroup.length);

    const handleGroupModal = async () => {
        const newRecipientGroup = (await new Promise((resolve) => {
            createModal(
                <AddressesGroupModal recipientGroup={recipientGroup} contacts={contactsInGroup} onSubmit={resolve} />
            );
        })) as RecipientGroup;

        onChange(newRecipientGroup);
    };

    return (
        <div className="composer-addresses-item bordered-container flex flex-items-center flex-nowrap flex-row mw80 stop-propagation">
            <span className="inline-flex pl0-5 pr0-5 no-pointer-events-children h100">
                <Icon name="contacts-groups" size={12} className="mauto" />
            </span>
            <span
                className="composer-addresses-item-label mtauto mbauto pl0-5 ellipsis pr0-5"
                onClick={handleGroupModal}
            >
                {label}
            </span>
            <button
                className="composer-addresses-item-remove inline-flex pl0-5 pr0-5 no-pointer-events-children h100"
                onClick={onRemove}
            >
                <Icon name="off" size={12} className="mauto" />
            </button>
        </div>
    );
};

export default AddressesGroupItem;
