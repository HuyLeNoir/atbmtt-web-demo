import { RowDataPacket } from "mysql2";
import React from "react";

export interface ServerMessage {
    success: boolean;
    message: string;
    package?: Record<string, any>;
}
export interface PreviewImage {
    file: File;
    filename: string;
    url: string;
    width: number;
    height: number;
    rgbBytes: Uint8Array;
}

export interface User {
    id: string;
    username: string;
    email: string;
    password_hash: string;
    created_at: string;
}

// Added interfaces from other files:

// From app/context/authcontext.tsx
export interface AuthData {
    id: string | null;
    username: string | null;
    decrypt_private_key: string | null;
}

export interface AuthContextType {
    auth: AuthData;
    setAuth: React.Dispatch<React.SetStateAction<AuthData>>;
    loginUser: (id: string, username: string, privateKey: string) => void;
    logoutUser: () => void;
}

// From components/navigation.tsx
export interface NavigationProps {
    className?: string;
}

// From lib/auth.ts
export interface UserLoginRecord extends RowDataPacket {
    id: number;
    email: string;
    password_hash: string;
    encrypted_private_key: string;
    public_key: string;
}

// From lib/cryptoEngine2.ts
export interface encrypted_k_file {
    recipient: string;
    encrypted_key: Buffer;
}

export interface EncryptResult {
    finalZip: Buffer;
    encryptedFileKeys: encrypted_k_file[];
    originalFilename: string;
    signature?: Buffer;
}

export interface EncryptInput {
    username_send: string;
    recipients: string[];
    filename: string;
    image_byte: Uint8Array;
    image_width: number;
    image_height: number;
}

export interface CreatePackageRecordInput {
    ownerUsername: string;
    recipients: { recipientUsername: string; encryptedFileKey: Buffer }[];
    filename: string;
    storagePath: string;
    signature?: Buffer;
}

// From lib/server_actions.ts
export interface UserKeyRecord extends RowDataPacket {
    username: string;
    public_key: string;
}

export interface InboxRecord extends RowDataPacket {
    id: number;
    owner_username: string;
    filename: string;
    storage_path: string;
    encrypted_file_key: string;
    message: string | undefined | null;
}

export interface PublicKeyResponse extends ServerMessage {
    package?: {
        username: string;
        public_key: string;
    };
}

export interface getInboxResponse extends ServerMessage {
    package?: InboxRecord[];
}
