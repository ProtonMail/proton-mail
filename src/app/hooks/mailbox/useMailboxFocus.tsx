import { useEffect, useState, MutableRefObject, useRef } from 'react';
import { useHandler } from 'react-components';

export interface MailboxFocusContext {
    elementIDs: string[];
    showList: boolean;
    showContentView: boolean;
    listRef: MutableRefObject<HTMLElement | null>;
    labelID: string;
    loading: boolean;
}

export const useMailboxFocus = ({
    elementIDs,
    showList,
    showContentView,
    listRef,
    labelID,
    loading,
}: MailboxFocusContext) => {
    const [focusIndex, setFocusIndex] = useState<number>();
    const labelIDRef = useRef(labelID);

    const getFocusedId = () => (focusIndex !== undefined ? elementIDs[focusIndex] : undefined);

    const handleFocus = useHandler((index) => setFocusIndex(index));

    const focusOnElement = (index: number) => {
        const element = listRef.current?.querySelector(
            `[data-shortcut-target="item-container"][data-element-id="${elementIDs[index]}"]`
        ) as HTMLElement;
        element?.focus();
    };

    const focusOnFirstListItem = () => {
        if (elementIDs.length) {
            setFocusIndex(0);
        }
    };

    const focusOnLastListItem = () => {
        const lastIndex = elementIDs.length - 1;
        setFocusIndex(lastIndex);
    };

    const focusOnLastMessage = () => {
        const messages = document.querySelectorAll('[data-shortcut-target="message-container"]');
        if (messages.length) {
            const lastMessage = messages[messages.length - 1] as HTMLElement;
            lastMessage.focus();
            setFocusIndex(undefined);
            return;
        }
        const trashWarning = document.querySelector('[data-shortcut-target="trash-warning"]') as HTMLElement;
        trashWarning?.focus();
    };

    useEffect(() => {
        if (loading) {
            setFocusIndex(undefined);
            return;
        }

        if (labelIDRef.current === labelID) {
            if (typeof focusIndex !== 'undefined') {
                if (elementIDs[focusIndex]) {
                    focusOnElement(focusIndex);
                } else {
                    focusOnLastListItem();
                }
            }
        } else {
            focusOnFirstListItem();
            labelIDRef.current = labelID;
        }
    }, [labelID, elementIDs, loading]);

    useEffect(() => {
        if (showList) {
            focusOnFirstListItem();
        }
    }, [showList]);

    useEffect(() => {
        if (showContentView) {
            focusOnLastMessage();
        }
    }, [showContentView]);

    useEffect(() => {
        if (typeof focusIndex !== 'undefined') {
            focusOnElement(focusIndex);
        }
    }, [focusIndex]);

    return {
        focusIndex,
        getFocusedId,
        setFocusIndex,
        handleFocus,
        focusOnLastMessage,
    };
};
