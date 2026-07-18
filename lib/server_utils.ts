import crypto from "crypto";
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
