import React from 'react';
import PropTypes from 'prop-types';
import {
    MainLogo,
    SupportDropdown,
    Hamburger,
    TopNavbar,
    TopNavbarLink,
    UpgradeButton,
    Searchbox,
    useUser
} from 'react-components';
import { c } from 'ttag';

import AdvancedSearchDropdown from './AdvancedSearchDropdown';
import { extractSearchParameters } from '../../helpers/mailboxUrl';

const PrivateHeader = ({ location, history, expanded, onToggleExpand, onSearch }) => {
    const [{ hasPaidMail }] = useUser();
    const searchParameters = extractSearchParameters(location);
    const searchValue = Object.entries(searchParameters)
        .reduce((acc, [key, value]) => {
            if (value) {
                acc.push(`${key}:${value}`);
            }
            return acc;
        }, [])
        .join(' ');
    return (
        <header className="header flex flex-nowrap reset4print">
            <MainLogo url="/inbox" className="nomobile" />
            <Hamburger expanded={expanded} onToggle={onToggleExpand} />
            <Searchbox
                placeholder={c('Placeholder').t`Search messages`}
                onSearch={onSearch}
                value={searchValue}
                advanced={<AdvancedSearchDropdown location={location} history={history} />}
            />
            <TopNavbar>
                {hasPaidMail ? null : <UpgradeButton external={true} />}
                <TopNavbarLink to="/inbox" icon="mailbox" text={c('Title').t`Mailbox`} aria-current={true} />
                <TopNavbarLink external={true} to="/settings" icon="settings-master" text={c('Title').t`Settings`} />
                <SupportDropdown />
            </TopNavbar>
        </header>
    );
};

PrivateHeader.propTypes = {
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
    onSearch: PropTypes.func.isRequired,
    expanded: PropTypes.bool,
    onToggleExpand: PropTypes.func.isRequired
};

export default PrivateHeader;
