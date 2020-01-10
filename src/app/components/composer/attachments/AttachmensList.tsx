import React from 'react';
import { c, msgid } from 'ttag';
import { Icon, useToggle } from 'react-components';
import humanSize from 'proton-shared/lib/helpers/humanSize';

import { Message } from '../../../models/message';
import { attachmentsSize, getAttachments } from '../../../helpers/message/messages';

interface Props {
    message?: Message;
}

const AttachmentsList = ({ message }: Props) => {
    const { state: expanded, toggle: toggleExpanded } = useToggle(false);

    const attachments = getAttachments(message);
    const size = humanSize(attachmentsSize(message));

    return (
        <div className="flex flex-column p0-5 relative w100 flex-item-fluid">
            <button className="flex flex-row flex-spacebetween p0-5 w100" onClick={toggleExpanded}>
                <div>
                    <strong className="mr0-5">{size}</strong>
                    <Icon name="attach" className="mr0-5" />
                    {c('Info').ngettext(
                        msgid`${attachments.length} file attached`,
                        `${attachments.length} files attached`,
                        attachments.length
                    )}
                </div>
                <div className="color-pm-blue">{expanded ? c('Action').t`Hide` : c('Action').t`Show`}</div>
            </button>
            {expanded && (
                <div>
                    <div className="composer-attachments-expand flex flex-row flex-wrap">
                        {attachments.map((attachment) => (
                            <div key={attachment.ID}>
                                <Icon name="attachment" />
                                {attachment.Name}
                                <Icon name="off" size={12} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttachmentsList;
