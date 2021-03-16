import React, { ReactNode, useState, useEffect, memo } from 'react';
import { useWindowSize, useHandler, useBeforeUnload } from 'react-components';
import { c } from 'ttag';
import { useMessageCache } from './MessageProvider';
import { Breakpoints, WindowSize } from '../models/utils';
import { MAX_ACTIVE_COMPOSER_MOBILE, MAX_ACTIVE_COMPOSER_DESKTOP } from '../helpers/composerPositioning';
import { useCompose, OnCompose } from '../hooks/composer/useCompose';
import ComposerFrame from '../components/composer/ComposerFrame';
import '../components/composer/composer.scss';

interface Props {
    breakpoints: Breakpoints;
    children: (props: { onCompose: OnCompose }) => ReactNode;
}

const ComposerContainer = ({ breakpoints, children }: Props) => {
    const [messageIDs, setMessageIDs] = useState<string[]>([]);
    const [focusedMessageID, setFocusedMessageID] = useState<string>();
    const [width, height] = useWindowSize();
    const windowSize: WindowSize = { width, height };
    const messageCache = useMessageCache();

    useBeforeUnload(
        messageIDs.length
            ? c('Info').t`The data you have entered in the draft may not be saved if you leave the page.`
            : ''
    );

    const maxActiveComposer = breakpoints.isNarrow ? MAX_ACTIVE_COMPOSER_MOBILE : MAX_ACTIVE_COMPOSER_DESKTOP;

    const handleClose = (messageID: string) => () =>
        setMessageIDs((messageIDs) => {
            const newMessageIDs = messageIDs.filter((id) => id !== messageID);
            if (newMessageIDs.length) {
                setFocusedMessageID(newMessageIDs[0]);
            }
            return newMessageIDs;
        });

    // Automatically close draft which has been deleted (could happen through the message list)
    const messageDeletionListener = useHandler((changedMessageID: string) => {
        if (messageIDs.includes(changedMessageID) && !messageCache.has(changedMessageID)) {
            handleClose(changedMessageID)();
        }
    });

    useEffect(() => messageCache.subscribe(messageDeletionListener), [messageCache]);

    const handleCompose = useCompose(
        messageIDs,
        (messageID) => setMessageIDs((messageIDs) => [...messageIDs, messageID]),
        setFocusedMessageID,
        maxActiveComposer
    );

    const handleFocus = (messageID: string) => () => {
        setFocusedMessageID(messageID);
    };

    return (
        <>
            {children({ onCompose: handleCompose })}
            <div className="composer-container">
                {messageIDs.map((messageID, i) => (
                    <ComposerFrame
                        key={messageID}
                        messageID={messageID}
                        index={i}
                        count={messageIDs.length}
                        focus={messageID === focusedMessageID}
                        windowSize={windowSize}
                        breakpoints={breakpoints}
                        onFocus={handleFocus(messageID)}
                        onClose={handleClose(messageID)}
                        onCompose={handleCompose}
                    />
                ))}
            </div>
        </>
    );
};

export default memo(ComposerContainer);
