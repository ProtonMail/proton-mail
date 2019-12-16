import React from 'react';

import { Button } from 'react-components';

const ComposerActions = () => {
    return (
        <footer className="composer-actions flex flex-row flex-spacebetween w100">
            <div>
                <Button icon="attach" /> <Button icon="expiration" /> <Button icon="lock" />
            </div>
            <div className="flex-self-vcenter">
                <span>Saved at ...</span>
                <Button className="ml1" icon="trash" /> <Button icon="save" />{' '}
                <Button className="pm-button-blue">Send</Button>
            </div>
        </footer>
    );
};

export default ComposerActions;
