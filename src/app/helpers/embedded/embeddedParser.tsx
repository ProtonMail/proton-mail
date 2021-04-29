import React from 'react';
import { render } from 'react-dom';
import { wait } from 'proton-shared/lib/helpers/promise';
import { Api } from 'proton-shared/lib/interfaces';
import { Attachment } from 'proton-shared/lib/interfaces/mail/Message';
import { isDraft } from 'proton-shared/lib/mail/messages';
import { Loader } from 'react-components';
import { MessageExtended, EmbeddedMap, MessageKeys, MessageVerification } from '../../models/message';
import { escapeSrc, unescapeSrc, wrap } from '../dom';
import { ENCRYPTED_STATUS } from '../../constants';
import { getAttachment, findEmbedded } from './embeddedFinder';
import { get } from '../attachment/attachmentLoader';
import { createBlob, readCID } from './embeddeds';
import { isInlineEmbedded, isEmbedded } from '../image';
import { AttachmentsCache } from '../../containers/AttachmentProvider';

export const EMBEDDED_CLASSNAME = 'proton-embedded';
export const EMBEDDED_CLASSNAME_LOADING = 'proton-embedded-loading';

const wrapImage = (img: Element) => {
    const element = wrap(img, `<div class="${EMBEDDED_CLASSNAME_LOADING} relative inline-block"></div>`);
    const loaderContainer = document.createElement('div');
    loaderContainer.classList.add('covered-absolute', 'flex');
    element.appendChild(loaderContainer);
    // Using a mini react to have the official loader
    render(<Loader className="center flex" />, loaderContainer);
};

/**
 * Prepare embedded images in the document
 */
export const prepareImages = (message: Partial<MessageExtended>, show: boolean) => {
    if (!message.document) {
        return;
    }

    const draft = isDraft(message.data);

    let showEmbedded = message.showEmbeddedImages;

    const images = [...message.document.querySelectorAll('img[proton-src]')];

    images.forEach((image) => {
        const src = image.getAttribute('proton-src') || undefined;
        image.setAttribute('referrerPolicy', 'no-referrer');
        const info = getAttachment(message.embeddeds, src);

        if (!image.classList.contains(EMBEDDED_CLASSNAME)) {
            image.classList.add(EMBEDDED_CLASSNAME);
        }

        if (!image.parentElement) {
            return;
        }

        // check if the attachment exist before processing
        if (!(info && Object.keys(info).length > 0)) {
            /**
             * If the attachment does not exist and the proton-src attribute
             * starts with cid:, it's an embedded image that does not exist in the list of attachments,
             * or is not a valid image.
             * So remove the element from the DOM because it will not display anything useful anyway.
             */
            if (isEmbedded(src)) {
                image.parentElement.removeChild(image);
            }
            // If it's not an inline embedded image, it's either an embedded image or a remote image. So stop here.
            // Otherwise, continue so that the inline image is detected as an embedded image.
            if (!isInlineEmbedded(src)) {
                return;
            }
        }

        if (show) {
            image.setAttribute('data-embedded-img', src || '');
            /**
             * Since the image is supposed to be displayed, remove the proton-src attribute.
             * Then it will be parsed by the embeddedParser in the blob or cid direction.
             */
            image.removeAttribute('proton-src');
            image.removeAttribute('src');

            if (!draft && !image.parentElement.classList.contains(EMBEDDED_CLASSNAME_LOADING)) {
                wrapImage(image);
            }

            return;
        }

        showEmbedded = false;

        // Inline embedded images does not have an attachment.
        if (info) {
            image.setAttribute('alt', info.attachment.Name || '');
        }
    });

    return showEmbedded;
};

/**
 * Remove an embedded attachment from the document
 */
export const removeEmbeddedHTML = (document: Element, attachment: Attachment) => {
    const cid = readCID(attachment);
    const nodes = document.querySelectorAll(
        `img[src="cid:${cid}"], img[data-embedded-img="cid:${cid}"], img[data-embedded-img="${cid}"]`
    );
    [...nodes].map((node) => node.remove());
};

/**
 * launch and forget: we don't need to do anything with the result
 * wait a bit before disabling the invalidsignature modal
 * this allows the user to see the change icon popup.
 *
 * More elaborate explanation:
 * We're addressing a fairly rare UX thing here.
 * We want to avoid showing a popup saying the confirmmodal when the signature is invalid to often.
 * For instance, when embedding images you can see that the icon says the signature is invalid,
 * so we don't show this icon (as the user can know it before clicking).
 *
 * However, if you would click on the embedded attachment before it has downloaded the attachment, it will not show this icon.
 * So consider you clicking on this attachment when it didn't verify the attachment yet.
 * Then just after that the attachment loader downloaded the attachment and
 * verified it signature and sets invalidSignature.askAgain to false.
 * Then you don't know that this happened, but in this case you should get a popup.
 *
 * Note when thinking  this is just a race condition: also consider the case where you are clicking
 * on the icon and it shows the icon just before you click: it's not humanly possible to see that it
 * changed and is not valid. So even in that case we want to show the icon.
 */
const triggerSigVerification = (
    verification: MessageVerification | undefined,
    messageKeys: MessageKeys,
    attachments: Attachment[],
    api: Api,
    cache: AttachmentsCache
) => {
    /*
     * launch and forget: we don't need to do anything with the result
     * wait a bit before disabling the invalidsignature modal
     * this allows the user to see the change icon popup.
     */
    void Promise.all(
        attachments.map(async (attachment) => {
            await get(attachment, verification, messageKeys, cache, api);
            await wait(1000);
            // invalidSignature.askAgain(message, attachment, false);
        })
    );
};

/**
 * It works on data-src attribute for this reason:
 * Don't set the src attribute since it's evaluated and cid:cid create an error (#3330)
 * NET::ERR_UNKNOWN_URL_SCHEME because src="cid:xxxx" is not valid HTML
 * This function expects the content to be properly unescaped later.
 */
const mutateHTML = (
    embeddeds: EmbeddedMap | undefined,
    document: Element | undefined,
    callback: (elements: Element[], cid: string) => void
) => {
    if (!embeddeds || !document) {
        return;
    }

    document.innerHTML = escapeSrc(document.innerHTML);
    embeddeds.forEach((_, cid) => callback(findEmbedded(cid, document), cid));
    document.innerHTML = unescapeSrc(document.innerHTML);
};

/**
 * Parse the content to inject the generated blob src
 */
export const mutateHTMLBlob = (embeddeds: EmbeddedMap | undefined, document: Element | undefined) => {
    mutateHTML(embeddeds, document, (elements, cid) => {
        const { url = '' } = embeddeds?.get(cid) || {};
        elements.forEach((element) => {
            // Always remove the `data-` src attribute set by the cid function, otherwise it can get displayed if the user does not auto load embedded images.
            element.removeAttribute('data-src');
            if (element.getAttribute('proton-src')) {
                return;
            }
            element.setAttribute('data-src', url);
            element.setAttribute('data-embedded-img', cid);
            element.classList.add(EMBEDDED_CLASSNAME);

            console.log('mutateHTML', element.parentElement?.parentElement);

            if (element.parentElement?.classList.contains(EMBEDDED_CLASSNAME_LOADING)) {
                console.log('replaceChild', element.parentElement.parentElement);
                element.parentElement.parentElement?.replaceChild(element, element.parentElement);
            }
        });
    });
};

/**
 * Parse the content to inject the cid
 */
export const mutateHTMLCid = (embeddeds: EmbeddedMap | undefined, document: Element | undefined) => {
    mutateHTML(embeddeds, document, (elements, cid) => {
        elements.forEach((element) => {
            element.removeAttribute('data-embedded-img');
            element.removeAttribute('src');
            element.setAttribute('data-src', `cid:${cid}`);
        });
    });
};

export const decrypt = async (
    message: MessageExtended,
    messageKeys: MessageKeys,
    api: Api,
    cache: AttachmentsCache
) => {
    // const show = message.showEmbeddedImages === true || mailSettings.ShowImages & SHOW_IMAGES.EMBEDDED;
    // const sigList = show ? list : list.filter(({ attachment }) => cache.has(attachment.ID));

    // For a draft if we close it before the end of the attachment upload, there are no keyPackets
    // pgp attachments do not have keypackets.

    const infos = [...(message.embeddeds?.values() || [])];

    const promises = infos
        .filter((info) => info.attachment.KeyPackets || info.attachment.Encrypted === ENCRYPTED_STATUS.PGP_MIME)
        .filter((info) => !info.url)
        .map(async (info) => {
            const buffer = await get(info.attachment, message.verification, messageKeys, cache, api);
            info.url = createBlob(info.attachment, buffer.data as Uint8Array);
        });

    const attachments = infos.map((info) => info.attachment);

    if (!promises.length) {
        // all cid was already stored, we can resolve
        triggerSigVerification(message.verification, messageKeys, attachments, api, cache);
        return;
    }

    await Promise.all(promises);

    // We need to trigger on the original list not after filtering: after filter they are just stored
    // somewhere else
    triggerSigVerification(message.verification, messageKeys, attachments, api, cache);
};
