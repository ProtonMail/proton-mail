import React from 'react';
import { Icon, useModals } from 'react-components';

import EditorImageModal from './EditorImageModal';

interface Props {
    id: string;
    onAddImageUrl: (url: string) => void;
    onAddAttachments: (files: File[]) => void;
}

const EditorToolbar = ({ id, onAddImageUrl, onAddAttachments }: Props) => {
    const { createModal } = useModals();

    const handleImage = () => {
        createModal(<EditorImageModal onAddUrl={onAddImageUrl} onAddAttachments={onAddAttachments} />);
    };

    return (
        <div id={id}>
            <select className="ql-header" defaultValue={''} onChange={(e) => e.persist()}>
                <option value="1"></option>
                <option value="2"></option>
                <option></option>
            </select>
            <button className="ql-bold"></button>
            <button className="ql-italic"></button>
            <select className="ql-color">
                <option value="red"></option>
                <option value="green"></option>
                <option value="blue"></option>
                <option value="orange"></option>
                <option value="violet"></option>
                <option value="#d0d1d2"></option>
                <option></option>
            </select>
            <button type="button" onClick={handleImage}>
                <Icon name="file-image" />
            </button>
        </div>
    );
};

export default EditorToolbar;
