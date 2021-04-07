import React, { useImperativeHandle, useEffect, useMemo, useRef, useState, memo, forwardRef, Ref } from 'react';

import { hasAttachments, isDraft, isSent, isOutbox } from 'proton-shared/lib/mail/messages';
import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { Label } from 'proton-shared/lib/interfaces/Label';
import { noop } from 'proton-shared/lib/helpers/function';

import { classnames } from 'react-components';

import { getSentStatusIconInfo, getReceivedStatusIcon, MessageViewIcons } from '../../helpers/message/icon';
import MessageBody from './MessageBody';
import HeaderCollapsed from './header/HeaderCollapsed';
import HeaderExpanded from './header/HeaderExpanded';
import MessageFooter from './MessageFooter';
import { Element } from '../../models/element';
import { useMessage } from '../../hooks/message/useMessage';
import { useMarkAs, MARK_AS_STATUS } from '../../hooks/useMarkAs';
import { isUnread } from '../../helpers/elements';
import { OnCompose } from '../../hooks/composer/useCompose';
import { Breakpoints } from '../../models/utils';
import { useLoadMessage } from '../../hooks/message/useLoadMessage';
import { useInitializeMessage } from '../../hooks/message/useInitializeMessage';
import { useLoadEmbeddedImages, useLoadRemoteImages } from '../../hooks/message/useLoadImages';
import { useResignContact } from '../../hooks/message/useResignContact';
import { useVerifyMessage } from '../../hooks/message/useVerifyMessage';
import { useMessageHotkeys } from '../../hooks/message/useMessageHotkeys';

import './MessageView.scss';

interface Props {
    labelID: string;
    conversationMode: boolean;
    loading: boolean;
    labels: Label[];
    message: Message;
    mailSettings: any;
    conversationIndex?: number;
    conversationID?: string;
    onBack: () => void;
    onCompose: OnCompose;
    breakpoints: Breakpoints;
    onFocus?: (index: number) => void;
}

export interface MessageViewRef {
    expand: (callback?: () => void) => void;
}

const MessageView = (
    {
        labelID,
        conversationMode,
        loading,
        labels = [],
        message: inputMessage,
        mailSettings,
        conversationIndex = 0,
        conversationID,
        onBack,
        onCompose,
        breakpoints,
        onFocus = noop,
    }: Props,
    ref: Ref<MessageViewRef>
) => {
    const getInitialExpand = () => !conversationMode && !isDraft(inputMessage) && !isOutbox(inputMessage);

    // Actual expanded state
    const [expanded, setExpanded] = useState(getInitialExpand);

    // Show or not the blockquote content
    const [originalMessageMode, setOriginalMessageMode] = useState(false);

    // HTML source should be shown instead of normal rendered content
    const [sourceMode, setSourceMode] = useState(false);

    const elementRef = useRef<HTMLElement>(null);

    const { message, addAction, messageLoaded, bodyLoaded } = useMessage(inputMessage.ID, conversationID);
    const load = useLoadMessage(inputMessage);
    const initialize = useInitializeMessage(message.localID, labelID);
    const verify = useVerifyMessage(message.localID);
    const loadRemoteImages = useLoadRemoteImages(message.localID);
    const loadEmbeddedImages = useLoadEmbeddedImages(message.localID);
    const resignContact = useResignContact(message.localID);
    const markAs = useMarkAs();

    const draft = !loading && isDraft(message.data);
    const outbox = !loading && isOutbox(message.data);
    const sent = isSent(message.data);
    const unread = isUnread(message.data, labelID);
    // It can be attachments but not yet loaded
    const showFooter = hasAttachments(message.data) && Array.isArray(message.data?.Attachments);

    const messageViewIcons = useMemo<MessageViewIcons>(() => {
        if (sent) {
            return getSentStatusIconInfo(message);
        }
        // else it's a received message
        return { globalIcon: getReceivedStatusIcon(message.data, message.verification), mapStatusIcon: {} };
    }, [message]);

    const handleLoadRemoteImages = async () => {
        await addAction(loadRemoteImages);
    };

    const handleResignContact = async () => {
        await addAction(resignContact);
    };

    const handleLoadEmbeddedImages = async () => {
        await addAction(loadEmbeddedImages);
    };

    const handleToggle = (value: boolean) => () => {
        if (message.sending) {
            return;
        }
        if (outbox) {
            return;
        }
        if (draft) {
            onCompose({ existingDraft: message });
            return;
        }

        setExpanded(value);
    };

    const toggleOriginalMessage = () => setOriginalMessageMode(!originalMessageMode);

    // Setup ref to allow opening the message from outside, typically the ConversationView
    useImperativeHandle(ref, () => ({
        expand: (callback) => {
            // Should be prevented before, but as an extra security...
            if (!isDraft(message.data)) {
                setExpanded(true);
                elementRef.current?.focus();
                callback?.();
            }
        },
    }));

    // Manage loading the message
    useEffect(() => {
        if (!loading && !messageLoaded) {
            void addAction(load);
        }
    }, [loading, messageLoaded]);

    // Manage preparing the content of the message
    useEffect(() => {
        if (!loading && expanded && message.initialized === undefined) {
            void addAction(initialize);
        }
    }, [loading, expanded, message.initialized]);

    // Manage recomputing signature verification (happens when invalidated after initial load)
    useEffect(() => {
        if (!loading && expanded && message.initialized && message.verification === undefined) {
            void addAction(() => verify(message.decryptedRawContent as string, message.signature));
        }
    }, [loading, expanded, message.initialized, message.verification]);

    useEffect(() => {
        if (expanded && bodyLoaded) {
            setTimeout(() => {
                if (elementRef.current) {
                    elementRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        }
    }, [expanded, bodyLoaded]);

    // Mark as read a message already loaded (when user marked as unread)
    useEffect(() => {
        if (expanded && unread && bodyLoaded && !message.actionInProgress) {
            markAs([message.data as Element], labelID, MARK_AS_STATUS.READ);
        }
    }, [expanded, unread, bodyLoaded, message.actionInProgress]);

    // Re-initialize context if message is changed without disposing the component
    useEffect(() => {
        if (message.data?.ID) {
            setExpanded(getInitialExpand);
            setSourceMode(false);
        }
    }, [draft, message.data?.ID]);

    // Automatically activate source mode when processing errors
    const hasProcessingErrors = !!message.errors?.processing?.length;
    useEffect(() => {
        if (hasProcessingErrors) {
            setSourceMode(true);
        }
    }, [hasProcessingErrors]);

    const {
        hasFocus,
        handleFocus,
        handleBlur,
        labelDropdownToggleRef,
        moveDropdownToggleRef,
        filterDropdownToggleRef,
    } = useMessageHotkeys(
        elementRef,
        {
            labelID,
            conversationIndex,
            message,
            bodyLoaded,
            expanded,
            messageLoaded,
            draft,
            conversationMode,
        },
        {
            onFocus,
            onCompose,
            setExpanded,
            toggleOriginalMessage,
            handleLoadRemoteImages,
            handleLoadEmbeddedImages,
        }
    );

    return (
        <article
            ref={elementRef}
            className={classnames([
                'message-container m0-5 mb1 no-outline',
                expanded && 'is-opened',
                hasAttachments(message.data) && 'message-container--hasAttachment',
                hasFocus && 'is-focused',
            ])}
            style={{ '--index': conversationIndex * 2 }}
            data-testid="message-view"
            tabIndex={-1}
            data-message-id={message.data?.ID}
            data-shortcut-target="message-container"
            onFocus={handleFocus}
            onBlur={handleBlur}
        >
            {expanded ? (
                <>
                    <HeaderExpanded
                        labelID={labelID}
                        conversationMode={conversationMode}
                        message={message}
                        messageViewIcons={messageViewIcons}
                        messageLoaded={messageLoaded}
                        bodyLoaded={bodyLoaded}
                        isSentMessage={sent}
                        sourceMode={sourceMode}
                        onLoadRemoteImages={handleLoadRemoteImages}
                        onLoadEmbeddedImages={handleLoadEmbeddedImages}
                        onResignContact={handleResignContact}
                        labels={labels}
                        mailSettings={mailSettings}
                        onToggle={handleToggle(false)}
                        onBack={onBack}
                        onCompose={onCompose}
                        onSourceMode={setSourceMode}
                        breakpoints={breakpoints}
                        labelDropdownToggleRef={labelDropdownToggleRef}
                        moveDropdownToggleRef={moveDropdownToggleRef}
                        filterDropdownToggleRef={filterDropdownToggleRef}
                    />
                    <MessageBody
                        messageLoaded={messageLoaded}
                        bodyLoaded={bodyLoaded}
                        sourceMode={sourceMode}
                        message={message}
                        originalMessageMode={originalMessageMode}
                        toggleOriginalMessage={toggleOriginalMessage}
                    />
                    {showFooter ? <MessageFooter message={message} /> : null}
                </>
            ) : (
                <HeaderCollapsed
                    labelID={labelID}
                    labels={labels}
                    message={message}
                    messageLoaded={messageLoaded}
                    isSentMessage={sent}
                    isUnreadMessage={unread}
                    onExpand={handleToggle(true)}
                    onCompose={onCompose}
                    breakpoints={breakpoints}
                />
            )}
        </article>
    );
};

export default memo(forwardRef(MessageView));
