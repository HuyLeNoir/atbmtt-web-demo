"use server";
import { ServerMessage, UserLoginRecord } from "./definitions";
import crypto from "crypto";
import pool from "@/lib/db";
import { ResultSetHeader } from "mysql2";
import { decryptPrivateKey, createECCKeys, encryptPrivateKey } from "@/lib/server_utils";
import { Satellite } from "lucide-react";

export async function login(username: string, password: string): Promise<ServerMessage> {
    try {
        if (!username || !password) {
            throw new Error("Input is incorrect");
        }
        //hash mk
        const [rows] = await pool.query<UserLoginRecord[]>(
            `SELECT u.id, u.username, u.password_hash ,u.passSalt, u.keySalt, uk.public_key, uk.encrypted_private_key
                FROM users u 
                LEFT JOIN user_keys uk ON u.id = uk.user_id 
                WHERE u.username = ?`,
            [username],
        );
        const foundUser = rows[0];
        // console.log(passwordHash);
        if (!foundUser) {
            //khong ton tai user
            throw new Error(`Not found user with username ${username}`);
        }
        const passwordHash = crypto.scryptSync(password, foundUser.passSalt, 32).toString("hex");

        if (passwordHash !== foundUser.password_hash) {
            throw new Error("Wrong password");
        }
        //login success
        return {
            success: true,
            message: "login success",
            package: {
                ...foundUser,
                decrypted_private_key: decryptPrivateKey(
                    foundUser.encrypted_private_key,
                    password,
                    foundUser.keySalt,
                ),
            },
        };
    } catch (e: any) {
        return {
            success: false,
            message: e.message || "login failed",
        };
    }
}

export async function register(username: string, password: string): Promise<ServerMessage> {
    const connection = await pool.getConnection();
    try {
        //logic inside
        await connection.beginTransaction();
        if (!username || !password) {
            throw new Error("Input is incorrect");
        }

        const passSalt = crypto.randomBytes(16).toString("hex");
        const keySalt = crypto.randomBytes(16).toString("hex");
        const hashed_password = crypto.scryptSync(password, passSalt, 32).toString("hex");

        const { publicKey, privateKey } = createECCKeys();
        const encrypted_private_key = encryptPrivateKey(privateKey, password, keySalt);
        const [userResult] = await connection.query<ResultSetHeader>(
            "INSERT INTO users (username, password_hash, passSalt, keySalt) VALUES (?, ?,?,?)",
            [username, hashed_password, passSalt, keySalt],
        );
        const userId = userResult.insertId;
        await connection.query(
            "INSERT INTO user_keys (user_id, public_key, encrypted_private_key) VALUES (?, ?, ?)",
            [userId, publicKey, encrypted_private_key],
        );
        // Hoàn tất Transaction thành công
        await connection.commit();
        return {
            success: true,
            message: "register success",
        };
    } catch (e: any) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Không thể rollback transaction:", rollbackError);
            }
        }
        return {
            success: false,
            message: e.message || "register failed",
        };
    } finally {
        if (connection) {
            connection.release();
        }
    }
}
