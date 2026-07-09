export interface FeedbackState {
    message: string;
    type: "success" | "error" | null;
}

export interface EncryptedImageState {
    url: string | null;
    width: number;
    height: number;
    rgbBytes: Uint8Array | null;
}

export interface EncryptionStages {
    shuffled: string;
    masked: string;
    c1: string;
    c2: string;
    c3: string;
    c4: string;
    c5: string;
}

export interface DecryptionStages {
    d4: string;
    d3: string;
    d2: string;
    d1: string;
    masked: string;
    shuffled: string;
}

export interface UserProfile {
    username: string;
    publicKey: string;
    createdAt: string;
}

export interface SecureMessage {
    id: string;
    sender: string;
    receiver: string;
    encryptedZip: string; // Base64 Zip
    fileName: string;
    createdAt: any; // Firestore Timestamp
    isRead: boolean;
}

export interface CurrentUser {
    username: string;
    publicKey: string;
    privateKey: string;
}
