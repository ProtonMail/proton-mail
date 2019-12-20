export interface Contact {
    ID?: string;
    Name?: string;
    UID?: string;
    Size?: number;
    CreateTime?: number;
    ModifyTime?: number;
    ContactEmails?: ContactEmail[];
    LabelIDs?: string[];
    Cards?: Card[];
}

export interface ContactEmail {
    ID?: string;
    Email?: string;
    Type?: string;
    Defaults?: number;
    Order?: number;
    ContactID?: string;
    LabelIDs?: string[];
}

export interface Card {
    Type?: number;
    Data?: string;
    Signature?: string;
}

export type ContactCache = Map<string, Contact>;

export type ContactEmailCache = Map<string, ContactEmail>;
