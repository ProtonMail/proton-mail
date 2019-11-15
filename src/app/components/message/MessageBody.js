import React from 'react';
import PropTypes from 'prop-types';
import { isPlainText } from '../../helpers/message';
import { classnames } from 'react-components';

import './MessageBody.scss';

const MessageBody = ({ message: { content, data: message } }) => {
    const plain = isPlainText(message);
    return (
        <div
            className={classnames(['message-content bodyDecrypted', plain && 'plain'])}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
};

MessageBody.propTypes = {
    message: PropTypes.object.isRequired
};

export default MessageBody;
