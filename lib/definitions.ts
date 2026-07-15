export interface ServerMessage {
    success: boolean;
    message: string;
    package?: Record<string, any>;
}
export interface PreviewImage {
    file: File;
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
