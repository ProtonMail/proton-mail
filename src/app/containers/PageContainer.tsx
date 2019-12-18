import React from 'react';
import { ErrorBoundary, useMailSettings, Loader } from 'react-components';

import PrivateLayout from '../components/layout/PrivateLayout';
import MailboxContainer from './MailboxContainer';
import { HUMAN_TO_LABEL_IDS } from '../constants';
import { Message } from '../models/message';
import { RouteProps } from '../PrivateApp';

interface Props extends RouteProps {
    onCompose: (message?: Message) => void;
}

const PageContainer = ({ match, location, history, onCompose }: Props) => {
    const [mailSettings, loadingMailSettings] = useMailSettings();

    const { elementID, labelID: currentLabelID = '' } = (match || {}).params || {};
    const labelID = HUMAN_TO_LABEL_IDS[currentLabelID] || currentLabelID;

    return (
        <PrivateLayout labelID={labelID} location={location} history={history} onCompose={onCompose}>
            <ErrorBoundary>
                {loadingMailSettings ? (
                    <Loader />
                ) : (
                    <MailboxContainer
                        labelID={labelID}
                        mailSettings={mailSettings}
                        elementID={elementID}
                        location={location}
                        history={history}
                        onCompose={onCompose}
                    />
                )}
            </ErrorBoundary>
        </PrivateLayout>
    );
};

export default PageContainer;
