import React, { useState, ChangeEvent, MutableRefObject } from 'react';
import { Label, Select, Input, generateUID } from 'react-components';

import { MessageExtended } from '../../models/message';
import { Address } from '../../models/address';
import ComposerAddresses from './addresses/Addresses';

interface Props {
    message: MessageExtended;
    addresses: Address[];
    onChange: (message: MessageExtended) => void;
    addressesBlurRef: MutableRefObject<() => void>;
    addressesFocusRef: MutableRefObject<() => void>;
}

const ComposerMeta = ({ message, addresses, onChange, addressesBlurRef, addressesFocusRef }: Props) => {
    const [uid] = useState(generateUID('composer'));

    // TODO: Implement logic on available addresses
    // Reference: Angular/src/app/composer/factories/composerFromModel.js
    const addressesOptions = addresses.map((address: Address) => ({ text: address.Email, value: address.ID }));

    const handleFromChange = (event: ChangeEvent) => {
        const select = event.target as HTMLSelectElement;
        const AddressID = select.value;
        const address = addresses.find((address: Address) => address.ID === AddressID);
        const Sender = { Name: address?.DisplayName, Address: address?.Email };
        onChange({ data: { AddressID, Sender } });
    };

    const handleSubjectChange = (event: ChangeEvent) => {
        const input = event.target as HTMLInputElement;
        onChange({ data: { Subject: input.value } });
    };

    // console.log('Meta', message);

    return (
        <div className="composer-meta w100">
            <div className="flex flex-row flex-nowrap flex-items-center pl0-5 mb0-5">
                <Label htmlFor={`from-${uid}`} className="composer-meta-label">
                    From
                </Label>
                <Select
                    id={`from-${uid}`}
                    options={addressesOptions}
                    value={message.data?.AddressID}
                    onChange={handleFromChange}
                    onFocus={addressesBlurRef.current}
                ></Select>
            </div>
            <ComposerAddresses
                message={message}
                onChange={onChange}
                addressesBlurRef={addressesBlurRef}
                addressesFocusRef={addressesFocusRef}
            />
            <div className="flex flex-row flex-nowrap flex-items-center pl0-5 mb0-5">
                <Label htmlFor={`subject-${uid}`} className="composer-meta-label">
                    Subject
                </Label>
                <Input
                    id={`subject-${uid}`}
                    value={message.data?.Subject}
                    onChange={handleSubjectChange}
                    onFocus={addressesBlurRef.current}
                />
            </div>
        </div>
    );
};

export default ComposerMeta;
