import React from 'react';
import { toMap } from 'proton-shared/lib/helpers/object';
import { orderBy } from 'proton-shared/lib/helpers/array';
import { noop } from 'proton-shared/lib/helpers/function';
import { Link } from 'react-router-dom';
import { Icon, classnames } from 'react-components';

import { Label } from '../../models/label';
import { Element } from '../../models/element';
import { getLabelIDs } from '../../helpers/elements';

import './ItemLabel.scss';

interface Props {
    element?: Element;
    labels?: Label[];
    max?: number;
    onUnlabel?: (labelID: string) => void;
    className?: string;
}

const ItemLabels = ({ element = {}, onUnlabel = noop, max = 99, labels = [], className = '' }: Props) => {
    const labelIDs = getLabelIDs(element) || [];
    const labelsMap = toMap(labels) as { [labelID: string]: Label };

    return (
        <div className={classnames(['pm_labels', className])}>
            {orderBy(labelIDs.map((ID) => labelsMap[ID]).filter(Boolean) as Label[], 'Order')
                .slice(0, max)
                .map(({ ID = '', Name = '', Color = '' }) => {
                    const style = {
                        backgroundColor: Color,
                        borderColor: Color
                    };
                    const to = `/${ID}`;
                    return (
                        <span className="pm_label" style={style} key={ID}>
                            <Link to={to}>{Name}</Link>
                            {onUnlabel !== noop ? (
                                <button type="button" onClick={() => onUnlabel(ID)}>
                                    <Icon name="off" size={12} color="white" />
                                </button>
                            ) : null}
                        </span>
                    );
                })}
        </div>
    );
};

export default ItemLabels;
