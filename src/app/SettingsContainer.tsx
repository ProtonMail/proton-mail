import React, { useState, useEffect, useRef } from 'react';
import { Redirect, Route, useLocation, Switch } from 'react-router-dom';
import { APPS } from 'proton-shared/lib/constants';
import { KeyboardKey } from 'proton-shared/lib/interfaces';
import { c } from 'ttag';
import {
    useActiveBreakpoint,
    PrivateAppContainer,
    useUser,
    useToggle,
    MainLogo,
    PrivateHeader,
    Sidebar,
    SidebarBackButton,
    SidebarNav,
    SidebarList,
    SidebarListItemsWithSubsections,
    useModals,
    useHotkeys,
    SupportDropdown,
} from 'react-components';
import { isTargetEditable } from 'proton-shared/lib/shortcuts/helpers';

import OverviewContainer from './containers/settings/OverviewContainer';
import ImportContainer from './containers/settings/ImportContainer';
import AddressesContainer from './containers/settings/AddressesContainer';
import IdentityContainer from './containers/settings/IdentityContainer';
import AppearanceContainer from './containers/settings/AppearanceContainer';
import AppsContainer from './containers/settings/AppsContainer';
import GeneralContainer from './containers/settings/GeneralContainer';
import FiltersContainer from './containers/settings/FiltersContainer';
import FoldersLabelsContainer from './containers/settings/FoldersLabelsContainer';
import AutoReplyContainer from './containers/settings/AutoReplyContainer';
import BridgeContainer from './containers/settings/BridgeContainer';
import SecurityContainer from './containers/settings/SecurityContainer';
import SidebarVersion from './components/sidebar/SidebarVersion';
import MailShortCutsModal from './components/shortcuts/MailShortcutsModal';
import { getPages } from './pages';

const SettingsContainer = () => {
    const [user] = useUser();
    const location = useLocation();
    const { isNarrow } = useActiveBreakpoint();
    const { state: expanded, toggle: onToggleExpand, set: setExpand } = useToggle();
    const [activeSection, setActiveSection] = useState('');
    const { createModal } = useModals();
    const documentRef = useRef(window.document);
    const [isBlurred, setBlurred] = useState(false);

    useEffect(() => {
        setExpand(false);
    }, [location.pathname, location.hash]);

    const base = '/inbox';
    const logo = <MainLogo to={base} toApp={APPS.PROTONMAIL} target="_self" />;

    const handleOpenShortcutsModal = () => {
        createModal(<MailShortCutsModal />, 'shortcuts-modal');
    };

    const header = (
        <PrivateHeader
            logo={logo}
            title={c('Title').t`Settings`}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            isNarrow={isNarrow}
            supportDropdown={<SupportDropdown onOpenShortcutsModal={handleOpenShortcutsModal} />}
        />
    );

    const sidebar = (
        <Sidebar
            logo={logo}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            primary={
                <SidebarBackButton to={base} toApp={APPS.PROTONMAIL} target="_self">{c('Action')
                    .t`Back to Mailbox`}</SidebarBackButton>
            }
            version={<SidebarVersion />}
        >
            <SidebarNav>
                <SidebarList>
                    <SidebarListItemsWithSubsections
                        list={getPages(user)}
                        pathname={location.pathname}
                        activeSection={activeSection}
                    />
                </SidebarList>
            </SidebarNav>
        </Sidebar>
    );

    useHotkeys(documentRef, [
        [
            KeyboardKey.QuestionMark,
            (e) => {
                if (!isTargetEditable(e)) {
                    handleOpenShortcutsModal();
                }
            },
        ],
    ]);

    return (
        <PrivateAppContainer isBlurred={isBlurred} header={header} sidebar={sidebar}>
            <Switch>
                <Route path="/settings/overview" exact>
                    <OverviewContainer user={user} />
                </Route>
                <Route path="/settings/import">
                    <ImportContainer
                        location={location}
                        setActiveSection={setActiveSection}
                        onChangeBlurred={setBlurred}
                    />
                </Route>
                <Route path="/settings/addresses/:memberID?">
                    <AddressesContainer location={location} setActiveSection={setActiveSection} user={user} />
                </Route>
                <Route path="/settings/identity">
                    <IdentityContainer location={location} setActiveSection={setActiveSection} />
                </Route>
                <Route path="/settings/appearance">
                    <AppearanceContainer location={location} setActiveSection={setActiveSection} />
                </Route>
                <Route path="/settings/security">
                    <SecurityContainer location={location} setActiveSection={setActiveSection} />
                </Route>
                <Route path="/settings/apps">
                    <AppsContainer location={location} setActiveSection={setActiveSection} />
                </Route>
                <Route path="/settings/general">
                    <GeneralContainer
                        location={location}
                        setActiveSection={setActiveSection}
                        onOpenShortcutsModal={handleOpenShortcutsModal}
                    />
                </Route>
                <Route path="/settings/filters">
                    <FiltersContainer location={location} setActiveSection={setActiveSection} />
                </Route>
                <Route path="/settings/labels">
                    <FoldersLabelsContainer location={location} setActiveSection={setActiveSection} />
                </Route>
                <Route path="/settings/auto-reply">
                    <AutoReplyContainer location={location} setActiveSection={setActiveSection} />
                </Route>
                <Route path="/settings/bridge">
                    <BridgeContainer location={location} setActiveSection={setActiveSection} />
                </Route>
                <Redirect to="/settings/overview" />
            </Switch>
        </PrivateAppContainer>
    );
};

export default SettingsContainer;
