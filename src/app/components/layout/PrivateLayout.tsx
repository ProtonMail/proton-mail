import React, { useRef, useState, useEffect, ReactNode } from 'react';
import { c } from 'ttag';
import { AppsSidebar, StorageSpaceStatus, MainAreaContext, Href } from 'react-components';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';

import PrivateHeader from '../header/PrivateHeader';
import PrivateSidebar from '../sidebar/PrivateSidebar';
import { Location, History } from 'history';
import { OnCompose } from '../../containers/ComposerContainer';
import { setSearchParametersInUrl } from '../../helpers/mailboxUrl';
import { getHumanLabelID } from '../../helpers/labels';

interface Props {
    children: ReactNode;
    location: Location;
    history: History;
    labelID: string;
    onCompose: OnCompose;
}

const PrivateLayout = ({ children, location, history, labelID, onCompose }: Props) => {
    const mainAreaRef = useRef<HTMLDivElement>(null);
    const [expanded, setExpand] = useState(false);

    const handleSearch = (keyword = '', labelID = MAILBOX_LABEL_IDS.ALL_MAIL) => {
        // keyword:test from:gibolin@protonmail.com to:gibolin@protonmail.com begin:20200122 end:20200128
        const trimmed = keyword.trim();
        const newLocation = {
            ...location,
            pathname: `/${getHumanLabelID(labelID)}`
        };
        history.push(setSearchParametersInUrl(newLocation, trimmed));
    };

    useEffect(() => {
        setExpand(false);
    }, [location.pathname]);

    return (
        <div className="flex flex-nowrap no-scroll">
            <AppsSidebar
                items={[
                    <StorageSpaceStatus
                        key="storage"
                        upgradeButton={
                            <Href
                                url="/settings/subscription"
                                target="_self"
                                className="pm-button pm-button--primary pm-button--small"
                            >
                                {c('Action').t`Upgrade`}
                            </Href>
                        }
                    ></StorageSpaceStatus>
                ]}
            />
            <div className="content flex-item-fluid reset4print">
                <PrivateHeader
                    labelID={labelID}
                    location={location}
                    history={history}
                    expanded={expanded}
                    onToggleExpand={() => setExpand(!expanded)}
                    onSearch={handleSearch}
                />
                <div className="flex flex-nowrap">
                    <PrivateSidebar labelID={labelID} expanded={expanded} location={location} onCompose={onCompose} />
                    <div className="main flex-item-fluid scroll-smooth-touch" ref={mainAreaRef}>
                        <div className="flex-item-fluid">
                            <MainAreaContext.Provider value={mainAreaRef}>{children}</MainAreaContext.Provider>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivateLayout;
