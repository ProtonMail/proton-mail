import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';

const HeaderRecipientsSimple = ({ message }) => {
    const { ToList = [], CCList = [], BCCList = [] } = message;
    const recipients = [...ToList, ...BCCList, ...CCList];

    return (
        <div className="flex">
            <span className="opacity-50 flex-self-vcenter container-to">{c('Label').t`To:`}</span>
            <span className="flex-self-vcenter mr1">
                {recipients.map(({ Address = '', Name = '' }, index) => {
                    return (
                        <span key={index} className="mr0-5" title={Address}>
                            {Name || Address}
                            {index < recipients.length - 1 && ','}
                        </span>
                    );
                })}
            </span>
        </div>
    );
};

HeaderRecipientsSimple.propTypes = {
    message: PropTypes.object.isRequired,
    showDetails: PropTypes.bool
};

export default HeaderRecipientsSimple;
