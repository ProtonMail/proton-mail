import React, { useMemo } from 'react';
import { Location } from 'history';
import { Icon } from 'react-components';
import { identity } from 'proton-shared/lib/helpers/function';

import ToolbarSeparator from './ToolbarSeparator';
import ReadUnreadButtons from './ReadUnreadButtons';
import ToolbarDropdown from './ToolbarDropdown';
import LayoutDropdown from './LayoutDropdown';
import MoveButtons from './MoveButtons';
import DeleteButton from './DeleteButton';
import SortDropdown from './SortDropdown';
import FilterDropdown from './FilterDropdown';
import SelectAll from './SelectAll';
import MoveDropdown from '../dropdown/MoveDropdown';
import LabelDropdown from '../dropdown/LabelDropdown';
import BackButton from './BackButton';
import PagingControls from './PagingControls';
import { isColumnMode } from '../../helpers/mailSettings';
import { Page, Sort, Filter } from '../../models/tools';
import { Element } from '../../models/element';

import './Toolbar.scss';

interface Props {
    location: Location;
    loading?: boolean;
    checkAll: boolean;
    onCheckAll: () => void;
    labelID: string;
    elementID?: string;
    elements: Element[];
    selectedIDs: string[];
    mailSettings: any;
    page: Page;
    onPage: (page: number) => void;
    sort: Sort;
    onSort: (sort: Sort) => void;
    filter: Filter;
    onFilter: (filter: Filter) => void;
    onBack: () => void;
}

const Toolbar = ({
    location,
    labelID = '',
    elementID,
    elements,
    checkAll,
    onCheckAll,
    mailSettings = {},
    selectedIDs = [],
    loading = false,
    onSort,
    sort,
    onFilter,
    filter,
    onBack,
    page,
    onPage
}: Props) => {
    const columnMode = isColumnMode(mailSettings);

    const selectedElements = useMemo(
        () =>
            selectedIDs
                .map((elementID) => elements.find((element) => element.ID === elementID) as Element)
                .filter(identity),
        [elements, selectedIDs]
    );

    return (
        <nav className="toolbar flex noprint flex-spacebetween">
            <div className="flex">
                {columnMode || !elementID ? (
                    <SelectAll checked={checkAll} onCheck={onCheckAll} loading={loading} />
                ) : (
                    <BackButton onClick={onBack} />
                )}
                <ToolbarSeparator />
                <ReadUnreadButtons
                    labelID={labelID}
                    mailSettings={mailSettings}
                    selectedIDs={selectedIDs}
                    location={location}
                />
                <ToolbarSeparator />
                <MoveButtons
                    labelID={labelID}
                    mailSettings={mailSettings}
                    selectedIDs={selectedIDs}
                    location={location}
                />
                <DeleteButton
                    labelID={labelID}
                    mailSettings={mailSettings}
                    selectedIDs={selectedIDs}
                    location={location}
                />
                <ToolbarSeparator />
                <ToolbarDropdown
                    autoClose={false}
                    disabled={!selectedIDs.length}
                    content={<Icon className="toolbar-icon" name="folder" />}
                >
                    {({ onClose, onLock }) => (
                        <MoveDropdown elements={selectedElements} onClose={onClose} onLock={onLock} />
                    )}
                </ToolbarDropdown>
                <ToolbarDropdown
                    autoClose={false}
                    disabled={!selectedIDs.length}
                    content={<Icon className="toolbar-icon" name="label" />}
                >
                    {({ onClose, onLock }) => (
                        <LabelDropdown elements={selectedElements} onClose={onClose} onLock={onLock} />
                    )}
                </ToolbarDropdown>
            </div>
            <div className="flex">
                <FilterDropdown loading={loading} filter={filter} onFilter={onFilter} />
                <SortDropdown loading={loading} sort={sort} onSort={onSort} />
                <LayoutDropdown mailSettings={mailSettings} />
                <ToolbarSeparator />
                <PagingControls loading={loading} page={page} onPage={onPage} />
            </div>
        </nav>
    );
};

export default Toolbar;
