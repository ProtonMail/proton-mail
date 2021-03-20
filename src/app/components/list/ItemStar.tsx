import React, { MouseEvent } from 'react';
import { c } from 'ttag';
import { Icon, useLoading, classnames, Tooltip, useMailSettings } from 'react-components';

import { Element } from '../../models/element';
import { isStarred as testIsStarred, isMessage } from '../../helpers/elements';
import { useStar } from '../../hooks/useApplyLabels';

interface Props {
    element?: Element;
}

const ItemStar = ({ element = {} }: Props) => {
    const [loading, withLoading] = useLoading();
    const star = useStar();
    const [{ Shortcuts } = { Shortcuts: 0 }] = useMailSettings();

    const isStarred = testIsStarred(element);

    const title = isMessage(element)
        ? isStarred
            ? c('Alt').t`Unstar message`
            : c('Alt').t`Star message`
        : isStarred
        ? c('Alt').t`Unstar conversation`
        : c('Alt').t`Star conversation`;

    const handleClick = async (event: MouseEvent) => {
        event.stopPropagation();
        // Programmatically block the action instead of disabling the action
        // Perhaps a bit less accessible but prevent to collapse a message on a second click
        if (!loading) {
            void withLoading(star([element], !isStarred));
        }
    };

    return (
        <Tooltip
            title={
                Shortcuts ? (
                    <>
                        {title}
                        <br />
                        <kbd className="no-border">*</kbd>
                    </>
                ) : (
                    title
                )
            }
        >
            <button
                data-test-id="message-list:star-button"
                type="button"
                className={classnames([
                    'starbutton relative item-star flex stop-propagation',
                    isStarred && 'starbutton--is-starred',
                ])}
                onClick={handleClick}
            >
                <Icon name="star" className="starbutton-icon-star" />
                <Icon name="starfull" className="starbutton-icon-starred" />
                <span className="sr-only">{title}</span>
            </button>
        </Tooltip>
    );
};

export default ItemStar;
