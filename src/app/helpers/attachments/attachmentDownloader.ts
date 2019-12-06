import JSZip from 'jszip';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';

import { MessageExtended, Message } from '../../models/message';
import { Attachment } from '../../models/attachment';
import { getAndVerify } from './attachmentLoader';
import { AttachmentsCache } from '../../hooks/useAttachments';
import { Api, Binary } from '../../models/utils';

interface Download {
    attachment: Attachment;
    data: Binary;
    isError?: boolean;
}

/**
 * Format attachment for the download
 */
const formatDownload = async (
    attachment: Attachment,
    message: MessageExtended,
    cache: AttachmentsCache,
    api: Api
): Promise<Download> => {
    try {
        const { data } = await getAndVerify(attachment, message, false, cache, api);
        return {
            attachment,
            data
        };
    } catch (e) {
        // If the decryption fails we download the encrypted version
        if (e.data) {
            return {
                attachment: {
                    Name: `${attachment.Name}.pgp`,
                    MIMEType: 'application/pgp',
                    ID: attachment.ID
                },
                data: e.data,
                isError: true
            };
        }
        throw e;
    }
};

/**
 * Generate a download for an attachment
 */
const generateDownload = async (download: Download /*, message: MessageExtended*/) => {
    // TODO: uncomment
    // try {
    //     await checkAllSignatures(message, [attachment]);
    // } catch (e) {
    //     // swallow as the user is informed already by a confirmation and actually caused this error
    //     return;
    // }

    downloadFile(new Blob([download.data], { type: download.attachment.MIMEType }), download.attachment.Name);
};

/**
 * Download an attachment
 */
export const download = async (
    attachment: Attachment,
    message: MessageExtended,
    cache: AttachmentsCache,
    api: Api
): Promise<void> => {
    const download = await formatDownload(attachment, message, cache, api);

    // TODO: uncomment
    // if (download.isError) {
    //     if (!(await allowDownloadBrokenAtt())) {
    //         return; // We don't want to download it
    //     }
    // }

    return generateDownload(download);
};

/**
 * The attachment's Name is not uniq we need a uniq name in order
 * to make the zip. The lib doesn't allow duplicates
 */
const formatDownloadAll = async (message: MessageExtended, cache: AttachmentsCache, api: Api): Promise<Download[]> => {
    const { Attachments = [] } = message.data || {};
    const { list }: { list: Attachment[] } = Attachments.reduce(
        (acc: any, att) => {
            const name = att.Name || '';
            if (!acc.map[name]) {
                acc.map[name] = { index: 0 };
            } else {
                acc.map[name].index++;
                // We can have an extension
                const currentName = name.split('.');
                const ext = currentName.pop();
                const newName = `${currentName.join('.')} (${acc.map[name].index}).${ext}`;
                att.Name = newName;
            }
            acc.list.push(att);
            return acc;
        },
        { list: [], map: {} }
    );

    return Promise.all(list.map((att) => formatDownload(att, message, cache, api)));
};

const getZipAttachmentName = (message: Message = {}) => `Attachments-${message.Subject}.zip`;

/**
 * Download all attachments as a zipfile
 */
export const downloadAll = async (message: MessageExtended = {}, cache: AttachmentsCache, api: Api): Promise<void> => {
    const list = await formatDownloadAll(message, cache, api);

    // TODO: uncomment
    // try {
    //     await checkAllSignatures(message, list);
    // } catch (e) {
    //     // swallow as the user is informed already by a confirmation and actually caused this error
    //     return;
    // }

    // TODO: uncomment
    // // Detect if we have at least one error
    // if (list.some(({ isError }) => isError)) {
    //     if (!(await allowDownloadBrokenAtt())) {
    //         return; // We don't want to download it
    //     }
    // }

    const zip = new JSZip();
    list.forEach(({ attachment: { Name = '' }, data }) => zip.file(Name, data));
    const content = await zip.generateAsync({ type: 'blob' });
    downloadFile(content, getZipAttachmentName(message.data));
};
