"use server";
import mysql, { RowDataPacket } from "mysql2";
import { ServerMessage } from "./definitions";
import pool from "@/lib/db";
interface UserKeyRecord extends RowDataPacket {
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
//dinh nghia them package
interface PublicKeyResponse extends ServerMessage {
    package?: {
        username: string;
        public_key: string;
    };
}

export async function publicKeyFromUsername(username: string): Promise<PublicKeyResponse> {
    if (!username) {
        return { success: false, message: "Input erorr" };
    }
    try {
        const [rows] = await pool.execute<UserKeyRecord[]>(
            `SELECT u.username, uk.public_key 
                FROM users u 
                LEFT JOIN user_keys uk ON u.id = uk.user_id 
                WHERE u.username = ?
                Limit 1`,

            [username],
        );
        const foundUser = rows[0];
        if (!foundUser) {
            return {
                success: false,
                message: "User or associated public key not found",
            };
        }
        return {
            success: true,
            message: "Lấy thành công publicKey của user",
            package: { username: username, public_key: foundUser.public_key },
        };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

interface getInboxResponse extends ServerMessage {
    package?: InboxRecord[];
}
export async function getInbox(recipient_id: string): Promise<getInboxResponse> {
    try {
        if (!recipient_id) throw new Error("Lỗi: Không có recipient_id");
        const [rows] = await pool.execute<InboxRecord[]>(
            `SELECT pk.id as id, u.username as owner_username, pk.filename as filename, pk.storage_path, pk_re.encrypted_file_key, pk.message 
             FROM packages pk 
             JOIN packages_recipients pk_re ON pk.id = pk_re.image_id 
             JOIN users u ON pk.owner_id = u.id 
             WHERE pk_re.recipient_id = ?`,
            [recipient_id],
        );
        return {
            success: true,
            message: "Đã lấy được thông tin inbox",
            package: rows,
        };
    } catch (e: any) {
        return {
            success: false,
            message: e.message,
        };
    }
}
