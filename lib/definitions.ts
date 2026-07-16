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

export interface EncryptInput {
    //id_send
    //id_receive
    username_send: string;
    username_receive: string;
    filename: string;
    image_byte: Uint8Array;
    image_width: number;
    image_height: Number;
}
