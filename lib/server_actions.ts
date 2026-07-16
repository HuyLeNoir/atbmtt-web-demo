"use server";
import mysql, { RowDataPacket } from "mysql2";
import { ServerMessage } from "./definitions";
import pool from "@/lib/db";
interface UserKeyRecord extends RowDataPacket {
    username: string;
    public_key: string;
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
        const [rows] = await pool.query<UserKeyRecord[]>(
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
            message: "Got it",
            package: { username: username, public_key: foundUser.public_key },
        };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
