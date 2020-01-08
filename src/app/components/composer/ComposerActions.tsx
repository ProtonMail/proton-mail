import React from 'react';
import { c } from 'ttag';
import { Button, useLoading, useModals, ConfirmModal, Alert } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

import { formatSimpleDate } from '../../helpers/date';
import { MessageExtended } from '../../models/message';
import { getDate } from '../../helpers/elements';
import AttachmentsButton from './attachments/AttachmentsButton';

interface Props {
    message: MessageExtended;
    onAddAttachments: (files: File[]) => void;
    onSave: () => Promise<void>;
    onSend: () => Promise<void>;
    onDelete: () => Promise<void>;
}

const ComposerActions = ({ message, onSave, onSend, onDelete, onAddAttachments }: Props) => {
    const [loading, withLoading] = useLoading(false);
    const { createModal } = useModals();

    const handleDelete = () => {
        return createModal(
            <ConfirmModal onConfirm={onDelete} onClose={noop} title={c('Title').t`Delete`}>
                <Alert>{c('Info').t`Permanently delete this draft?`}</Alert>
            </ConfirmModal>
        );
    };

    return (
        <footer className="composer-actions flex flex-row flex-spacebetween w100">
            <div>
                <AttachmentsButton onAddAttachments={onAddAttachments} /> <Button icon="expiration" />{' '}
                <Button icon="lock" />
            </div>
            <div className="flex-self-vcenter">
                <span>Saved at {formatSimpleDate(getDate(message.data))}</span>
                <Button className="ml1" icon="trash" onClick={handleDelete} /> <Button icon="save" onClick={onSave} />{' '}
                <Button className="pm-button-blue" loading={loading} onClick={() => withLoading(onSend())}>
                    Send
                </Button>
            </div>
        </footer>
    );
};

export default ComposerActions;
