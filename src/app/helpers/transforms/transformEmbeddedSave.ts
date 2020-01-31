import { Computation } from '../../hooks/useMessage';
import { mutateHTML } from '../embedded/embeddedParser';
import { find } from '../embedded/embeddedFinder';

export const transformEmbeddedSave: Computation = async (message) => {
    const saveDocument = message.document?.cloneNode(true) as Element;
    find(message);
    mutateHTML(message.data, saveDocument, 'cid');
    // console.log('transformEmbeddedSave', message.document?.innerHTML);
    return { saveDocument };
};
