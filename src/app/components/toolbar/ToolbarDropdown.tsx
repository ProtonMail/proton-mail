import React, { ReactNode, useState } from 'react';
import { classnames, usePopperAnchor, DropdownButton, Dropdown, generateUID } from 'react-components';

interface LockableDropdownProps {
    onClose: () => void;
    onLock: (lock: boolean) => void;
}

interface Props {
    autoClose?: boolean;
    title?: string;
    className?: string;
    content?: ReactNode;
    children: (props: LockableDropdownProps) => ReactNode;
    disabled?: boolean;
    size?: string;
    [rest: string]: any;
}

const ToolbarDropdown = ({
    title,
    content,
    className,
    children,
    autoClose = true,
    disabled = false,
    size = 'normal',
    ...rest
}: Props) => {
    const [uid] = useState(generateUID('dropdown'));
    const [lock, setLock] = useState(false);

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor();

    return (
        <>
            <DropdownButton
                title={title}
                buttonRef={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
                hasCaret={true}
                disabled={disabled}
                caretClassName="toolbar-icon"
                className={classnames(['flex-item-noshrink toolbar-button toolbar-button--dropdown', className])}
                {...rest}
            >
                {content}
            </DropdownButton>
            <Dropdown
                id={uid}
                size={size}
                autoClose={autoClose}
                autoCloseOutside={!lock}
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                className="toolbar-dropdown"
            >
                {children({ onClose: close, onLock: setLock })}
            </Dropdown>
        </>
    );
};

export default ToolbarDropdown;
