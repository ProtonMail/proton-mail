import React, { useState, useEffect, CSSProperties, useRef } from 'react';
import { classnames, useToggle, useWindowSize, useLoading, Loader, useNotifications } from 'react-components';
import { c } from 'ttag';

import { Message, MessageExtended } from '../../models/message';
import ComposerTitleBar from './ComposerTitleBar';
import ComposerMeta from './ComposerMeta';
import ComposerContent from './ComposerContent';
import ComposerActions from './ComposerActions';
import { useMessage } from '../../hooks/useMessage';
import { createNewDraft } from '../../helpers/message/messageDraft';
import { Address } from '../../models/address';
import {
    COMPOSER_GUTTER,
    COMPOSER_VERTICAL_GUTTER,
    APP_BAR_WIDTH,
    HEADER_HEIGHT,
    COMPOSER_HEIGHT,
    COMPOSER_SWITCH_MODE
} from '../../containers/ComposerContainer';
import { noop } from 'proton-shared/lib/helpers/function';
import { getRecipients } from '../../helpers/message/messages';

/**
 * Create a new MessageExtended with props from both m1 and m2
 * Almost a standard deep merge but simplified with specific needs
 * m2 props will override those from m1
 */
const mergeMessages = (m1: MessageExtended, m2: MessageExtended) => ({
    ...m1,
    ...m2,
    data: { ...m1.data, ...m2.data }
});

const computeStyle = (
    inputStyle: CSSProperties,
    minimized: boolean,
    maximized: boolean,
    width: number,
    height: number
): CSSProperties => {
    if (minimized) {
        return {
            ...inputStyle,
            height: 'auto'
        };
    }
    if (maximized) {
        return {
            ...inputStyle,
            right: COMPOSER_GUTTER,
            width: width - COMPOSER_GUTTER - APP_BAR_WIDTH,
            height: height - COMPOSER_VERTICAL_GUTTER * 2
        };
    }
    return inputStyle;
};

interface Props {
    style?: CSSProperties;
    focus: boolean;
    message?: Message;
    mailSettings: any;
    addresses: Address[];
    onFocus: () => void;
    onChange: (message: Message) => void;
    onClose: () => void;
}

const Composer = ({
    style: inputStyle = {},
    focus,
    message: inputMessage = {},
    mailSettings,
    addresses,
    onFocus,
    onChange,
    onClose
}: Props) => {
    const { state: minimized, toggle: toggleMinimized } = useToggle(false);
    const { state: maximized, toggle: toggleMaximized } = useToggle(false);
    const [modelMessage, setModelMessage] = useState<MessageExtended>({ data: inputMessage });
    const [loading, withLoading] = useLoading(false);
    const [syncedMessage, { initialize, createDraft, saveDraft, send, deleteDraft }] = useMessage(
        inputMessage,
        mailSettings
    );
    const [width, height] = useWindowSize();
    const { createNotification } = useNotifications();

    // Manage focus from the container yet keeping logic in each component
    const addressesBlurRef = useRef<() => void>(noop);
    const addressesFocusRef = useRef<() => void>(noop);
    const contentFocusRef = useRef<() => void>(noop);

    const showLoader = loading || !modelMessage.data?.ID || !modelMessage.content;

    useEffect(() => {
        if (!loading && !syncedMessage.data?.ID) {
            withLoading(createDraft(createNewDraft(addresses)));
        }

        if (!loading && syncedMessage.data?.ID && typeof syncedMessage.initialized === 'undefined') {
            withLoading(initialize());
        }

        setModelMessage(mergeMessages(modelMessage, syncedMessage));
        onChange(syncedMessage.data || {});
    }, [loading, syncedMessage]);

    useEffect(() => {
        if (!maximized && height - COMPOSER_VERTICAL_GUTTER - HEADER_HEIGHT < COMPOSER_HEIGHT - COMPOSER_SWITCH_MODE) {
            toggleMaximized();
        }
        if (maximized && height - COMPOSER_VERTICAL_GUTTER - HEADER_HEIGHT > COMPOSER_HEIGHT + COMPOSER_SWITCH_MODE) {
            toggleMaximized();
        }
    }, [height]);

    // Manage focus at opening
    useEffect(() => {
        if (showLoader) {
            return;
        }

        setTimeout(() => {
            if (getRecipients(syncedMessage.data).length === 0) {
                addressesFocusRef.current();
            } else {
                contentFocusRef.current();
            }
        });
    }, [showLoader]);

    const handleChange = (message: MessageExtended) => {
        console.log('change', message);
        setModelMessage(mergeMessages(modelMessage, message));
    };
    const save = async () => {
        await saveDraft(modelMessage);
        createNotification({ text: c('Info').t`Message saved` });
    };
    const handleSave = async () => {
        await save();
    };
    const handleSend = async () => {
        await send(modelMessage);
        createNotification({ text: c('Success').t`Message sent` });
        onClose();
    };
    const handleDelete = async () => {
        await deleteDraft();
        createNotification({ text: c('Info').t`Message discarded` });
        onClose();
    };
    const handleClick = async () => {
        if (minimized) {
            toggleMinimized();
        }
        onFocus();
    };
    const handleClose = async () => {
        await save();
        onClose();
    };

    const style = computeStyle(inputStyle, minimized, maximized, width, height);

    return (
        <div
            className={classnames([
                'composer flex flex-column p0-5',
                !focus && 'composer-blur',
                minimized && 'composer-minimized pb0'
            ])}
            style={style}
            onFocus={onFocus}
            onClick={handleClick}
        >
            {showLoader ? (
                <Loader />
            ) : (
                <>
                    <ComposerTitleBar
                        message={modelMessage}
                        minimized={minimized}
                        maximized={maximized}
                        toggleMinimized={toggleMinimized}
                        toggleMaximized={toggleMaximized}
                        onClose={handleClose}
                    />
                    {!minimized && (
                        <>
                            <ComposerMeta
                                message={modelMessage}
                                addresses={addresses}
                                onChange={handleChange}
                                addressesBlurRef={addressesBlurRef}
                                addressesFocusRef={addressesFocusRef}
                            />
                            <ComposerContent
                                message={modelMessage}
                                onChange={handleChange}
                                onFocus={addressesBlurRef.current}
                                contentFocusRef={contentFocusRef}
                            />
                            <ComposerActions
                                message={modelMessage}
                                onSave={handleSave}
                                onSend={handleSend}
                                onDelete={handleDelete}
                            />
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default Composer;
