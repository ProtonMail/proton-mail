import React, { Fragment } from 'react';
import { c } from 'ttag';
import { Label, Button } from 'react-components';

import { MessageExtended } from '../../../models/message';
import { RecipientType } from '../../../models/message';
import { getRecipientLabel } from '../../../helpers/conversation';

interface Props {
    message: MessageExtended;
    onFocus: () => void;
}

const AddressesSummary = ({ message: { data = {} }, onFocus }: Props) => {
    const types: RecipientType[] = ['ToList', 'CCList', 'BCCList'];

    return (
        <div className="flex flex-row flex-nowrap flex-items-center pl0-5 mb0-5" onClick={onFocus}>
            <Label htmlFor={null} className="composer-meta-label color-pm-blue">
                {c('Title').t`To`}
            </Label>
            <div className="flex flex-row w100">
                <span className="flex-item-fluid bordered-container flex composer-addresses-fakefield">
                    <span className="ellipsis mw100">
                        {types.map((type) => {
                            const list = data[type] || [];
                            if (list.length === 0) {
                                return null;
                            }
                            return (
                                <Fragment key={type}>
                                    {type === 'CCList' && (
                                        <span className="mr0-5 color-pm-blue">{c('Title').t`CC`}:</span>
                                    )}
                                    {type === 'BCCList' && (
                                        <span className="mr0-5 color-pm-blue">{c('Title').t`BCC`}:</span>
                                    )}
                                    {list.map((recipient, i) => (
                                        <span key={i} className="mr0-5">
                                            {getRecipientLabel(recipient)}
                                            {i !== list.length - 1 && ','}
                                        </span>
                                    ))}
                                </Fragment>
                            );
                        })}
                    </span>
                </span>
                <Button icon="caret" className="pm-button--link ml0-5 mr0-5 " />
            </div>
        </div>
    );
};

export default AddressesSummary;
