import React, { useState, ChangeEvent } from 'react';
import { Label, Select, Input, generateUID } from 'react-components';
import { MessageExtended } from '../../models/message';
import { Address } from '../../models/address';

interface Props {
    message: MessageExtended;
    addresses: Address[];
    onChange: (message: MessageExtended) => void;
}

const ComposerMeta = ({ message, addresses, onChange }: Props) => {
    const [uid] = useState(generateUID('composer'));

    const selectedAddress = addresses.find((address: Address) => address.ID === message.data?.AddressID);

    // TODO: Implement logic on available addresses
    // Reference: Angular/src/app/composer/factories/composerFromModel.js
    const addressesOptions = addresses.map((address: Address) => ({ text: address.Email, value: address.ID }));

    const handleFromChange = (event: ChangeEvent) => {
        const select = event.target as HTMLSelectElement;
        onChange({ data: { AddressID: select.value } });
    };

    const handleToChange = (event: ChangeEvent) => {
        const input = event.target as HTMLInputElement;
        const recipients = input.value.split(' ').map((value) => ({ Address: value }));
        onChange({ data: { ToList: recipients } });
    };

    const handleSubjectChange = (event: ChangeEvent) => {
        const input = event.target as HTMLInputElement;
        onChange({ data: { Subject: input.value } });
    };

    return (
        <div className="composer-meta w100">
            <div className="flex flex-row flex-nowrap flex-items-center pl0-5 mb0-5">
                <Label htmlFor={`from-${uid}`} className="composer-meta-label">
                    From
                </Label>
                <Select
                    id={`from-${uid}`}
                    options={addressesOptions}
                    value={selectedAddress}
                    onChange={handleFromChange}
                ></Select>
            </div>
            <div className="flex flex-row flex-nowrap flex-items-center pl0-5 mb0-5">
                <Label htmlFor={`to-${uid}`} className="composer-meta-label">
                    To
                </Label>
                <Input id={`to-${uid}`} onChange={handleToChange} />
            </div>
            <div className="flex flex-row flex-nowrap flex-items-center pl0-5 mb0-5">
                <Label htmlFor={`subject-${uid}`} className="composer-meta-label">
                    Subject
                </Label>
                <Input id={`subject-${uid}`} value={message.data?.Subject} onChange={handleSubjectChange} />
            </div>
        </div>
    );
};

export default ComposerMeta;
