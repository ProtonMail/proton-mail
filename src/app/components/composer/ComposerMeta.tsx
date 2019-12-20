import React, { useState, ChangeEvent, useEffect } from 'react';
import { Label, Select, Input, generateUID } from 'react-components';
import { MessageExtended } from '../../models/message';
import { Address } from '../../models/address';
import { validateAddresses } from '../../helpers/addresses';

interface Props {
    message: MessageExtended;
    addresses: Address[];
    onChange: (message: MessageExtended) => void;
}

const ComposerMeta = ({ message, addresses, onChange }: Props) => {
    const [uid] = useState(generateUID('composer'));
    const [addressesModel, setAddressesModel] = useState('');

    // Temporary addresses logic to move on a (or many) dedicated components
    useEffect(() => {
        setAddressesModel(message.data?.ToList?.map((recipient) => recipient.Address).join(' ') || '');
    }, [message.data?.ToList]);
    useEffect(() => {
        const addresses = addressesModel.split(' ');
        if (validateAddresses(addresses)) {
            const recipients = addresses.map((value) => ({ Address: value, Name: '' }));
            onChange({ data: { ToList: recipients } });
        }
    }, [addressesModel]);

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

    const handleToChange = (event: ChangeEvent) => {
        const input = event.target as HTMLInputElement;
        setAddressesModel(input.value);
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
                ></Select>
            </div>
            <div className="flex flex-row flex-nowrap flex-items-center pl0-5 mb0-5">
                <Label htmlFor={`to-${uid}`} className="composer-meta-label">
                    To
                </Label>
                <Input id={`to-${uid}`} value={addressesModel} onChange={handleToChange} />
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
