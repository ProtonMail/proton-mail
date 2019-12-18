import React from 'react';
import { c } from 'ttag';

import { MessageExtended } from '../../models/message';
import { Icon, Button } from 'react-components';

interface ButtonProps {
    onClick: () => void;
    iconName: string;
}

const TitleBarButton = ({ onClick, iconName }: ButtonProps) => {
    return (
        <Button className="composer-title-bar-button" onClick={onClick}>
            <Icon className="mauto" name={iconName} color="currentColor" />
        </Button>
    );
};

interface Props {
    message: MessageExtended;
    onClose: () => void;
}

const ComposerTitleBar = ({ message = {}, onClose }: Props) => {
    const title = message.data?.Subject || c('Title').t`New message`;

    const handleMinimize = () => console.log('minimize');
    const handleExpand = () => console.log('expand');

    return (
        <header className="composer-title-bar flex flex-row">
            <span className="flex-self-vcenter flex-item-fluid pl0-5 pr1 ellipsis">{title}</span>
            <TitleBarButton iconName="minimize" onClick={handleMinimize} />
            <TitleBarButton iconName="expand" onClick={handleExpand} />
            <TitleBarButton iconName="close" onClick={onClose} />
        </header>
    );
};

export default ComposerTitleBar;
