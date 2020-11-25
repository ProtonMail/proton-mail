import React, { useState, useEffect, ReactNode, useCallback } from 'react';
import { PrivateAppContainer } from 'react-components';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { changeSearchParams } from 'proton-shared/lib/helpers/url';
import { Location, History } from 'history';

import MailSidebar from '../sidebar/MailSidebar';
import MailHeader from '../header/MailHeader';
import { getHumanLabelID } from '../../helpers/labels';
import { Breakpoints } from '../../models/utils';
import { OnCompose } from '../../hooks/useCompose';
import {
    getRecipients,
    formatRecipients,
    DEFAULT_MODEL,
    UNDEFINED,
    WITH_ATTACHMENTS,
} from '../header/AdvancedSearchDropdown';

interface Props {
    children: ReactNode;
    location: Location;
    history: History;
    breakpoints: Breakpoints;
    labelID: string;
    elementID: string | undefined;
    onCompose: OnCompose;
    isBlurred?: boolean;
}

const PrivateLayout = ({
    children,
    location,
    history,
    breakpoints,
    labelID,
    elementID,
    onCompose,
    isBlurred,
}: Props) => {
    const [expanded, setExpand] = useState(false);

    const handleSearch = useCallback((search = '', labelID = MAILBOX_LABEL_IDS.ALL_MAIL as string) => {
        const model = {
            ...DEFAULT_MODEL,
            keyword: search || '',
            labelID,
        };

        const keywords = [];
        search.split(' ').forEach((part) => {
            const parsed = part.match(/^([^:]*):(.*)$/);
            if (parsed && parsed[1]) {
                switch (parsed[1]) {
                    case 'from':
                    case 'to':
                        model[parsed[1]] = getRecipients(parsed[2]);
                        return;
                    case 'has':
                        if (parsed[2]) {
                            switch (parsed[2]) {
                                case 'attachment':
                                    model.attachments = WITH_ATTACHMENTS;
                                    return;
                                default:
                            }
                        }
                        break;
                    default:
                }
            }
            keywords.push(part);
        });
        model.keyword = keywords.join(' ');

        const { keyword, from, to, attachments } = model;

        history.push(
            changeSearchParams(`/${getHumanLabelID(model.labelID)}`, location.search, {
                keyword: keyword || UNDEFINED,
                from: from.length ? formatRecipients(from) : UNDEFINED,
                to: to.length ? formatRecipients(to) : UNDEFINED,
                attachments: typeof attachments === 'number' ? String(attachments) : UNDEFINED,
            })
        );
    }, []);

    const handleToggleExpand = useCallback(() => setExpand((expanded) => !expanded), []);

    useEffect(() => {
        setExpand(false);
    }, [location.pathname, location.hash]);

    const header = (
        <MailHeader
            labelID={labelID}
            elementID={elementID}
            location={location}
            history={history}
            breakpoints={breakpoints}
            expanded={expanded}
            onToggleExpand={handleToggleExpand}
            onSearch={handleSearch}
            onCompose={onCompose}
        />
    );

    const sidebar = (
        <MailSidebar
            labelID={labelID}
            expanded={expanded}
            location={location}
            onToggleExpand={handleToggleExpand}
            onCompose={onCompose}
        />
    );

    return (
        <PrivateAppContainer header={header} sidebar={sidebar} isBlurred={isBlurred}>
            {children}
        </PrivateAppContainer>
    );
};

export default PrivateLayout;
