import crypto from "crypto";
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
    keySalt: string,
): string {
    const key = crypto.scryptSync(password, keySalt, 32);
    const iv = crypto.randomBytes(16); // Initialization Vector cho cbc
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

    let encrypted = cipher.update(privateKeyPem, "utf8", "hex") + cipher.final("hex");
    // Gộp IV, Dữ liệu mã hóa lại thành 1 chuỗi để dễ lưu DB
    return `${iv.toString("hex")}:${encrypted}`;
}

export function decryptPrivateKey(
    encryptedData: string,
    password: string,
    keySalt: string,
): string {
    const [ivHex, encryptedHex] = encryptedData.split(":"); //encrypted data split de tach iv va encrypted_text
    const key = crypto.scryptSync(password, keySalt, 32);
    const iv = Buffer.from(ivHex, "hex"); //nap vao buffer
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    const decrypted = decipher.update(encryptedHex, "hex", "utf8") + decipher.final("utf-8");
    return decrypted;
}
