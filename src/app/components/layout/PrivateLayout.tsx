import React, { useState, useEffect, ReactNode } from 'react';
import { PrivateAppContainer } from 'react-components';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';

import PrivateHeader from '../header/PrivateHeader';
import PrivateSidebar from '../sidebar/PrivateSidebar';
import { Location, History } from 'history';
import { getHumanLabelID } from '../../helpers/labels';
import { setKeywordInUrl } from '../../helpers/mailboxUrl';
import { Breakpoints } from '../../models/utils';
import { OnCompose } from '../../hooks/useCompose';

interface Props {
    children: ReactNode;
    location: Location;
    history: History;
    breakpoints: Breakpoints;
    labelID: string;
    elementID: string | undefined;
    onCompose: OnCompose;
}

const PrivateLayout = ({ children, location, history, breakpoints, labelID, elementID, onCompose }: Props) => {
    const [expanded, setExpand] = useState(false);

    const handleSearch = (keyword = '', labelID = MAILBOX_LABEL_IDS.ALL_MAIL as string) => {
        history.push(setKeywordInUrl({ ...location, pathname: `/${getHumanLabelID(labelID)}` }, keyword));
    };

    const handleToggleExpand = () => setExpand(!expanded);

    useEffect(() => {
        setExpand(false);
    }, [location.pathname]);

    const header = (
        <PrivateHeader
            labelID={labelID}
            elementID={elementID}
            location={location}
            history={history}
            breakpoints={breakpoints}
            expanded={expanded}
            onToggleExpand={handleToggleExpand}
            onSearch={handleSearch}
        />
    );

    const sidebar = (
        <PrivateSidebar
            labelID={labelID}
            expanded={expanded}
            location={location}
            onToggleExpand={handleToggleExpand}
            breakpoints={breakpoints}
            onCompose={onCompose}
        />
    );

    return (
        <PrivateAppContainer header={header} sidebar={sidebar}>
            {children}
        </PrivateAppContainer>
    );
};

export default PrivateLayout;
