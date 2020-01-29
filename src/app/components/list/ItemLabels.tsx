import React from 'react';
import { toMap } from 'proton-shared/lib/helpers/object';
import { orderBy } from 'proton-shared/lib/helpers/array';
import { noop } from 'proton-shared/lib/helpers/function';
import { Link } from 'react-router-dom';
import { Icon, classnames } from 'react-components';

import { Label } from '../../models/label';
import { Element } from '../../models/element';
import { getLabelIDs } from '../../helpers/elements';
import { getLabelsWithoutFolders } from '../../helpers/labels';

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
    const labelsMap = toMap(getLabelsWithoutFolders(labels)) as { [labelID: string]: Label };
    const labelsObjects: Label[] = labelIDs.map((ID) => labelsMap[ID]).filter(Boolean);
    const labelsSorted: Label[] = orderBy(labelsObjects, 'Order');
    const labelsToShow = labelsSorted.slice(0, max);

    return (
        <div className={classnames(['pm_labels stop-propagation', className])}>
            {labelsToShow.map(({ ID = '', Name = '', Color = '' }) => (
                <span
                    className="pm_label"
                    style={{
                        backgroundColor: Color,
                        borderColor: Color
                    }}
                    key={ID}
                >
                    <Link to={`/${ID}`}>{Name}</Link>
                    {onUnlabel !== noop ? (
                        <button type="button" onClick={() => onUnlabel(ID)}>
                            <Icon name="off" size={12} color="white" />
                        </button>
                    ) : null}
                </span>
            ))}
        </div>
    );
};

export default ItemLabels;
