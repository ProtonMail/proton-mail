import React, { useState, useEffect, ChangeEvent, MutableRefObject, useRef, MouseEvent } from 'react';
import { Input } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

import { Recipient } from '../../../models/message';
import AddressesItem from './AddressesItem';
import { inputToRecipient } from '../../../helpers/addresses';

interface Props {
    id: string;
    addresses?: Recipient[];
    onChange: (value: Recipient[]) => void;
    addressesFocusRef?: MutableRefObject<() => void>;
}

const AddressesInput = ({ id, addresses = [], onChange, addressesFocusRef }: Props) => {
    const [inputModel, setInputModel] = useState('');
    const inputRef = useRef<HTMLInputElement>();

    const confirmInput = () => {
        onChange([...addresses, inputToRecipient(inputModel)]);
        setInputModel('');
    };

    useEffect(() => {
        if (addressesFocusRef) {
            addressesFocusRef.current = inputRef.current?.focus.bind(inputRef.current) || noop;
        }
    }, []);

    const handleInputChange = (event: ChangeEvent) => {
        const input = event.target as HTMLInputElement;
        setInputModel(input.value);
    };

    const handleInputKey = (event: KeyboardEvent) => {
        // Enter or Tab
        if ((event.keyCode === 13 || event.keyCode === 9) && inputModel.length !== 0) {
            confirmInput();
            event.preventDefault(); // Prevent tab to switch field
        }
        if (event.keyCode === 8 && inputModel.length === 0) {
            onChange(addresses.slice(0, -1));
        }
    };

    const handleBlur = () => {
        if (inputModel.trim().length > 0) {
            confirmInput();
        }
    };

    const handleClick = (event: MouseEvent) => {
        if ((event.target as HTMLElement).closest('.stop-propagation')) {
            event.stopPropagation();
            return;
        }

        inputRef.current?.focus();
    };

    const handleExistingChange = (toChange: Recipient) => (value: Recipient) => {
        console.log('handleExistingChange', toChange, value);
        onChange(addresses.map((recipient) => (recipient === toChange ? value : recipient)));
    };

    const handleExistingRemove = (toRemove: Recipient) => () => {
        onChange(addresses.filter((recipient) => recipient !== toRemove));
    };

    return (
        <div
            className="composer-addresses-container flex-item-fluid bordered-container pl1-25 pr1-25"
            onClick={handleClick}
        >
            {addresses.map((recipient, i) => (
                <AddressesItem
                    key={i}
                    recipient={recipient}
                    onChange={handleExistingChange(recipient)}
                    onRemove={handleExistingRemove(recipient)}
                />
            ))}
            <div className="flex-item-fluid">
                <Input
                    id={id}
                    value={inputModel}
                    onChange={handleInputChange}
                    onKeyDown={handleInputKey}
                    onBlur={handleBlur}
                    ref={inputRef}
                />
            </div>
        </div>
    );
};

export default AddressesInput;
