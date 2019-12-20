import { Conversation } from '../models/conversation';
import { Recipient } from '../models/message';

export const getRecipientLabel = ({ Address, Name }: Recipient) => Name || Address || '';

export const getSendersLabels = ({ Senders = [] }: Conversation = {}) => Senders.map(getRecipientLabel);

export const getRecipientsLabels = ({ Recipients = [] }: Conversation) => Recipients.map(getRecipientLabel);
