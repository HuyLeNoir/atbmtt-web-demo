import { ServerMessage } from "./definitions";
import crypto from "crypto";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { ResultSetHeader } from "mysql2";

interface UserLoginRecord extends RowDataPacket {
    id: number;
    email: string;
    password_hash: string;
    encrypted_private_key: string;
    public_key: string;
}
function deriveKeyFromPassword(password: string, salt: NonSharedBuffer): any {
    // Sử dụng PBKDF2 làm Hàm dẫn xuất khóa (KDF) để biến mật khẩu thành key AES an toàn
    return crypto.pbkdf2Sync(password, salt, 100000, 32, "sha512"); //return buffer
}
export function createECCKeys() {
    try {
        const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", {
            namedCurve: "prime256v1",
            publicKeyEncoding: {
                type: "spki",
                format: "pem",
            },
            privateKeyEncoding: {
                type: "pkcs8",
                format: "pem",
            },
        });
        return { publicKey, privateKey };
    } catch (error) {
        throw new Error("Không thể tạo ECC key");
    }
}
export function encryptPrivateKey(
    privateKeyPem: string,
    password: string,
    username: string,
): string {
    const salt = crypto.scryptSync(password, username, 32); // Dùng username làm salt cho KDF
    const key = deriveKeyFromPassword(password, salt);

    const iv = crypto.randomBytes(16); // Initialization Vector cho cbc
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

    let encrypted = cipher.update(privateKeyPem, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Gộp IV, Dữ liệu mã hóa lại thành 1 chuỗi để dễ lưu DB
    return `${iv.toString("hex")}:${encrypted}`;
}

export function decryptPrivateKey(
    encryptedData: string,
    password: string,
    username: string,
): string {
    const salt = crypto.scryptSync(password, username, 32); //remake salt
    const key = deriveKeyFromPassword(password, salt); //lay lai key da ma hoa cho key aes-cbc

    const [ivHex, encryptedHex] = encryptedData.split(":"); //encrypted data split de tach iv va encrypted_text

    const iv = Buffer.from(ivHex, "hex"); //nap vao buffer
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}

export async function login(username: string, password: string): Promise<ServerMessage> {
    try {
        if (!username || !password) {
            throw new Error("Input is incorrect");
        }
        //hash mk
        const passwordHash = crypto.createHash("sha512").update(password).digest("hex");
        const [rows] = await pool.query<UserLoginRecord[]>(
            `SELECT u.id, u.username, u.password_hash, uk.encrypted_private_key, uk.public_key 
                FROM users u 
                LEFT JOIN user_keys uk ON u.id = uk.user_id 
                WHERE u.username = ?`,
            [username],
        );
        const foundUser = rows[0];
        if (!foundUser) {
            //khong ton tai user
            throw new Error(`Not found user with username ${username}`);
        }
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
                    username,
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
        const hashed_password = crypto.createHash("sha512").update(password).digest("hex");
        const { publicKey, privateKey } = createECCKeys();
        const encrypted_private_key = encryptPrivateKey(privateKey, password, username);
        const [userResult] = await connection.query<ResultSetHeader>(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            [username, hashed_password],
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
