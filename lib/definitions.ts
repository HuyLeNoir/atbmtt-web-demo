export interface ServerMessage {
    success: boolean;
    message: string;
}
export interface PreviewImage {
    file: File;
    url: string;
    width: number;
    height: number;
    rgbBytes: Uint8Array;
}
