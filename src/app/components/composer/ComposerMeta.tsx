import React, { useState, ChangeEvent } from 'react';
import { useAddresses, Label, Select, Input, generateUID } from 'react-components';
import { Message } from '../../models/message';
import { Address } from '../../models/address';

interface Props {
    message: Message;
    onChange: (message: Message) => void;
}

const ComposerMeta = ({ message, onChange }: Props) => {
    const [addresses, loading]: [Address[], boolean, any] = useAddresses();
    const [uid] = useState(generateUID('composer'));

    if (loading) {
        return null;
    }

    const selectedAddress = addresses.find((address: Address) => address.ID === message.AddressID);

    // TODO: Implement logic on available addresses
    // Reference: Angular/src/app/composer/factories/composerFromModel.js
    const addressesOptions = addresses.map((address: Address) => ({ text: address.Email, value: address.ID }));

    const handleFromChange = (event: ChangeEvent) => {
        const select = event.target as HTMLSelectElement;
        onChange({ AddressID: select.value });
    };

    const handleToChange = (event: ChangeEvent) => {
        const input = event.target as HTMLInputElement;
        const recipients = input.value.split(' ').map((value) => ({ Address: value }));
        onChange({ ToList: recipients });
    };

    const handleSubjectChange = (event: ChangeEvent) => {
        const input = event.target as HTMLInputElement;
        onChange({ Subject: input.value });
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
                <Input id={`subject-${uid}`} onChange={handleSubjectChange} />
            </div>
        </div>
    );
};

export default ComposerMeta;
