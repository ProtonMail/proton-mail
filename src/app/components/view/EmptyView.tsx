import React from 'react';
import { c } from 'ttag';

import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import noResultSearchSvg from 'design-system/assets/img/placeholders/empty-search.svg';
import noResultInboxSvg from 'design-system/assets/img/placeholders/empty-mailbox.svg';

interface Props {
    labelID: string;
    isSearch: boolean;
}

const EmptyView = ({ labelID, isSearch }: Props) => {
    const isInbox = labelID === MAILBOX_LABEL_IDS.INBOX && !isSearch;
    const isFolder = !isInbox && !isSearch;

    return (
        <div className="mauto p1">
            <figure className="flex-item-fluid text-center p3">
                {isSearch && (
                    <img src={noResultSearchSvg} className="hauto" alt={c('Search - no results').t`No results found`} />
                )}
                {isFolder && (
                    <img
                        src={noResultSearchSvg}
                        className="hauto"
                        alt={c('Search - no results').t`No messages found`}
                    />
                )}
                {isInbox && (
                    <img src={noResultInboxSvg} className="hauto" alt={c('Search - no results').t`No messages found`} />
                )}

                <figcaption className="mt2">
                    <h3 className="text-bold">
                        {isSearch
                            ? c('Search - no results').t`No results found`
                            : isFolder
                            ? c('Search - no results').t`No messages found`
                            : c('Search - no results').t`No messages found`}
                    </h3>
                    <p data-if="folder">
                        {isSearch
                            ? // TODO: Add a link on clear it when search will work
                              c('Info').t`You can either update your search query or clear it`
                            : isFolder
                            ? c('Info').t`You do not have any messages here`
                            : c('Info').t`Seems like you are all caught up for now`}
                    </p>
                </figcaption>
            </figure>
        </div>
    );
};

export default EmptyView;
