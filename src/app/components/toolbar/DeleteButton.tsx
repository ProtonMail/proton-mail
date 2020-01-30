import React from 'react';
import { Location } from 'history';
import {
    Icon,
    useLoading,
    useNotifications,
    useEventManager,
    useApi,
    ConfirmModal,
    ErrorButton,
    useModals,
    Alert
} from 'react-components';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { deleteMessages, emptyLabel } from 'proton-shared/lib/api/messages';
import { deleteConversations } from 'proton-shared/lib/api/conversations';
import { c, msgid } from 'ttag';

import ToolbarButton from './ToolbarButton';
import { getCurrentType } from '../../helpers/elements';
import { ELEMENT_TYPES } from '../../constants';

const { TRASH, SPAM, DRAFTS, ALL_DRAFTS, ALL_MAIL, INBOX, SENT, ALL_SENT, ARCHIVE } = MAILBOX_LABEL_IDS;

interface Props {
    labelID: string;
    mailSettings: any;
    selectedIDs: string[];
    location: Location;
}

const DeleteButton = ({ labelID = '', mailSettings = {}, selectedIDs = [], location }: Props) => {
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const { call } = useEventManager();
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const displayDelete = [TRASH, SPAM, DRAFTS, ALL_DRAFTS, SENT, ALL_SENT].includes(labelID as MAILBOX_LABEL_IDS);
    const displayEmpty = ![INBOX, SENT, ALL_SENT, ARCHIVE, ALL_MAIL].includes(labelID as MAILBOX_LABEL_IDS);
    const type = getCurrentType({ mailSettings, labelID, location });

    const handleDelete = async () => {
        await new Promise((resolve, reject) => {
            createModal(
                <ConfirmModal
                    title={c('Title').ngettext(msgid`Delete email`, `Delete emails`, selectedIDs.length)}
                    confirm={(<ErrorButton type="submit" icon={null}>{c('Action').t`Delete`}</ErrorButton>) as any}
                    onConfirm={resolve}
                    onClose={reject}
                >
                    <Alert type="warning">
                        {c('Info').ngettext(
                            msgid`This action will permanently delete the selected email. Are you sure you want to delete this email?`,
                            `This action will permanently delete the selected emails. Are you sure you want to delete these emails?`,
                            selectedIDs.length
                        )}
                    </Alert>
                </ConfirmModal>
            );
        });
        const action = type === ELEMENT_TYPES.CONVERSATION ? deleteConversations : deleteMessages;
        await api(action(selectedIDs));
        await call();
        createNotification({ text: c('Success').t`Elements deleted` });
    };

    const handleEmpty = async () => {
        await new Promise((resolve, reject) => {
            createModal(
                <ConfirmModal
                    title={c('Title').t`Empty folder`}
                    confirm={(<ErrorButton type="submit" icon={null}>{c('Action').t`Empty`}</ErrorButton>) as any}
                    onConfirm={resolve}
                    onClose={reject}
                >
                    <Alert type="warning">{c('Info')
                        .t`This action will permanently delete your emails. Are you sure you want to empty this folder?`}</Alert>
                </ConfirmModal>
            );
        });
        c;
        await api(emptyLabel({ LabelID: labelID, AddressID: undefined }));
        await call();
        createNotification({ text: c('Success').t`Folder cleared` });
    };

    return (
        <>
            {displayDelete ? (
                <ToolbarButton
                    loading={loading}
                    title={c('Action').t`Delete`}
                    onClick={() => withLoading(handleDelete())}
                >
                    <Icon className="toolbar-icon mauto" name="delete" />
                </ToolbarButton>
            ) : null}
            {displayEmpty ? (
                <ToolbarButton
                    loading={loading}
                    title={c('Action').t`Empty folder`}
                    onClick={() => withLoading(handleEmpty())}
                >
                    <Icon className="toolbar-icon mauto" name="empty-folder" />
                </ToolbarButton>
            ) : null}
        </>
    );
};

export default DeleteButton;
