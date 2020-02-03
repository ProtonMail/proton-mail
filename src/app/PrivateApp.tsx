import React from 'react';
import { RouteChildrenProps } from 'react-router';
import { Route } from 'react-router-dom';
import { StandardPrivateApp } from 'react-components';

import {
    UserModel,
    MailSettingsModel,
    UserSettingsModel,
    SubscriptionModel,
    OrganizationModel,
    LabelsModel,
    AddressesModel,
    ConversationCountsModel,
    MessageCountsModel
} from 'proton-shared/lib/models';

import locales from './locales';
import PageContainer from './containers/PageContainer';
import ComposerContainer from './containers/ComposerContainer';
import MessageProvider from './containers/MessageProvider';
import ConversationProvider from './containers/ConversationProvider';

export type RouteProps = RouteChildrenProps<{ labelID: string; elementID?: string }>;

interface Props {
    onLogout: () => void;
}

const PrivateApp = ({ onLogout }: Props) => {
    return (
        <StandardPrivateApp
            onLogout={onLogout}
            locales={locales}
            preloadModels={[UserModel, UserSettingsModel]}
            eventModels={[
                UserModel,
                AddressesModel,
                ConversationCountsModel,
                MessageCountsModel,
                MailSettingsModel,
                UserSettingsModel,
                LabelsModel,
                SubscriptionModel,
                OrganizationModel
            ]}
        >
            <MessageProvider>
                <ConversationProvider>
                    <ComposerContainer>
                        {({ onCompose }) => (
                            <Route
                                path="/:labelID/:elementID?"
                                render={(routeProps: RouteProps) => (
                                    <PageContainer {...routeProps} onCompose={onCompose} />
                                )}
                            />
                        )}
                    </ComposerContainer>
                </ConversationProvider>
            </MessageProvider>
        </StandardPrivateApp>
    );
};

export default PrivateApp;
