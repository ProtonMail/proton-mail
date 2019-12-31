import { REGEX_EMAIL } from 'proton-shared/lib/constants';
import { Address } from '../models/address';
import { Key } from '../models/key';
import { removeEmailAlias } from './string';
import { Recipient } from '../models/message';

export const REGEX_RECIPIENT = /(.*)\s*<([^>]*)>/;

export const validateAddress = (address = '') => REGEX_EMAIL.test(address);

export const validateAddresses = (addresses: string[]) => addresses.every(validateAddress);

/**
 * Get address from email
 * Remove + alias and transform to lower case
 */
export const getByEmail = (addresses: Address[], email = '') => {
    const cleanEmail = removeEmailAlias(email);
    return addresses.find(({ Email }) => removeEmailAlias(Email) === cleanEmail);
};

/**
 * Check if the address is fallback (Can't receive but has keys)
 */
export const isFallbackAddress = (address?: Address, keys: Key[] = []) =>
    !!address && !address.Receive && !!keys.length;

export const isOwnAddress = (address?: Address, keys: Key[] = []) => !isFallbackAddress(address, keys);

export const inputToRecipient = (input: string): Recipient => {
    const match = REGEX_RECIPIENT.exec(input);

    if (match !== null) {
        return {
            Name: match[1],
            Address: match[2]
        };
    }
    return {
        Name: input,
        Address: input
    };
};

export const recipientToInput = (recipient: Recipient): string => {
    if (recipient.Address && recipient.Name && recipient.Address !== recipient.Name) {
        return `${recipient.Name} <${recipient.Address}>`;
    }

    if (recipient.Address === recipient.Name) {
        return recipient.Address || '';
    }

    return `${recipient.Name} ${recipient.Address}`;
};
