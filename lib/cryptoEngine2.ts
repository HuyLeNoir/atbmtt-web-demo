"use server";
import crypto from "crypto";
import JSZip from "jszip";
import fs from "fs/promises";
import { EncryptInput, ServerMessage } from "./definitions";
import { publicKeyFromUsername } from "@/lib/server_actions";
function createPRNG(seed: number) {
    let h = seed | 0;
    return function () {
        h = (h + 0x9e3779b9) | 0;
        let z = h;
        z = Math.imul(z ^ (z >>> 16), 0x21f0aa7b);
        z = Math.imul(z ^ (z >>> 15), 0x735a2d97);
        z = z ^ (z >>> 15);
        return (z >>> 0) / 4294967296;
    };
}

// Pixel Shuffling
function preprocessAndShuffle(pixels: Uint8Array, seed: number) {
    const len = pixels.length;
    const indices = new Uint32Array(len);

    for (let i = 0; i < len; i++) {
        indices[i] = i;
    }

    const rand = createPRNG(seed);
    // Fisher-Yates shuffle
    for (let i = len - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        const temp = indices[i];
        indices[i] = indices[j];
        indices[j] = temp;
    }

    const shuffled = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        shuffled[i] = pixels[indices[i]];
    }
    return { shuffled, indices };
}

function inverseShuffleAndReconstruct(shuffled: Uint8Array, seed: number): Uint8Array {
    const len = shuffled.length;
    const { indices } = preprocessAndShuffle(shuffled, seed); // Use a dummy seed to get the original indices
    const original = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        original[indices[i]] = shuffled[i];
    }
    return original;
}

// Bitwise XNOR Masking
function bitwiseXnorMasking(pixels: Uint8Array, mask_seed: number) {
    const len = pixels.length;
    const rand = createPRNG(mask_seed);
    const mask = new Uint8Array(len);
    const masked = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        mask[i] = Math.floor(rand() * 256);
        masked[i] = pixels[i] ^ mask[i] ^ 255;
    }
    return { masked, mask };
}

// Reverse Bitwise XNOR Masking
function inverseBitwiseXnorMasking(masked: Uint8Array, mask_seed: number): Uint8Array {
    const len = masked.length;
    const rand = createPRNG(mask_seed);
    const original = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        const maskVal = Math.floor(rand() * 256);
        original[i] = masked[i] ^ 255 ^ maskVal;
    }
    return original;
}

// 5-Stage Multi-Layer Encryption
function layeredEncrypt5Stages(
    B_masked: Buffer,
    keys: { [key: string]: Buffer },
    ivs: { [key: string]: Buffer },
): Buffer {
    // Stage 1: AES-256-CBC
    const cipher1 = crypto.createCipheriv("aes-256-cbc", keys["AES1"], ivs["IV1"]);
    const C1 = Buffer.concat([cipher1.update(B_masked), cipher1.final()]);

    // Stage 2: AES-256-CBC
    const cipher2 = crypto.createCipheriv("aes-256-cbc", keys["AES2"], ivs["IV2"]);
    const C2 = Buffer.concat([cipher2.update(C1), cipher2.final()]);

    // Stage 3: AES-256-CBC
    const cipher3 = crypto.createCipheriv("aes-256-cbc", keys["AES3"], ivs["IV3"]);
    const C3 = Buffer.concat([cipher3.update(C2), cipher3.final()]);

    // Stage 4: 3DES-CBC (des-ede3-cbc)
    const cipher4 = crypto.createCipheriv("des-ede3-cbc", keys["3DES1"], ivs["IV4"]);
    const C4 = Buffer.concat([cipher4.update(C3), cipher4.final()]);

    // Stage 5: 3DES-CBC (des-ede3-cbc)
    const cipher5 = crypto.createCipheriv("des-ede3-cbc", keys["3DES2"], ivs["IV5"]);
    const C5 = Buffer.concat([cipher5.update(C4), cipher5.final()]);

    return C5;
}
// 5-Stage Multi-Layer Decryption (Reverse order)
function layeredDecrypt5Stages(
    C5: Buffer,
    keys: { [key: string]: Buffer },
    ivs: { [key: string]: Buffer },
): Buffer {
    // Stage 5 Decrypt: 3DES-CBC
    const decipher5 = crypto.createDecipheriv("des-ede3-cbc", keys["3DES2"], ivs["IV5"]);
    const D4 = Buffer.concat([decipher5.update(C5), decipher5.final()]);

    // Stage 4 Decrypt: 3DES-CBC
    const decipher4 = crypto.createDecipheriv("des-ede3-cbc", keys["3DES1"], ivs["IV4"]);
    const D3 = Buffer.concat([decipher4.update(D4), decipher4.final()]);

    // Stage 3 Decrypt: AES-256-CBC
    const decipher3 = crypto.createDecipheriv("aes-256-cbc", keys["AES3"], ivs["IV3"]);
    const D2 = Buffer.concat([decipher3.update(D3), decipher3.final()]);

    // Stage 2 Decrypt: AES-256-CBC
    const decipher2 = crypto.createDecipheriv("aes-256-cbc", keys["AES2"], ivs["IV2"]);
    const D1 = Buffer.concat([decipher2.update(D2), decipher2.final()]);

    // Stage 1 Decrypt: AES-256-CBC
    const decipher1 = crypto.createDecipheriv("aes-256-cbc", keys["AES1"], ivs["IV1"]);
    const B_masked = Buffer.concat([decipher1.update(D1), decipher1.final()]);

    return B_masked;
}
function generateCryptoKeysAndIVs() {
    return {
        keys: {
            AES1: crypto.randomBytes(32),
            AES2: crypto.randomBytes(32),
            AES3: crypto.randomBytes(32),
            "3DES1": crypto.randomBytes(24),
            "3DES2": crypto.randomBytes(24),
        },
        ivs: {
            IV1: crypto.randomBytes(16),
            IV2: crypto.randomBytes(16),
            IV3: crypto.randomBytes(16),
            IV4: crypto.randomBytes(8),
            IV5: crypto.randomBytes(8),
        },
    };
}

// export async function EncryptAndSend(input: EncryptInput): Promise<ServerMessage> {
//     const { username_send, username_receive, image_byte, image_width, image_height } = input;

//     if (!image_byte || image_byte.length === 0) {
//         throw new Error("Dữ liệu hình ảnh RGB không hợp lệ hoặc trống.");
//     }

//     try {
//         const shuffleSeed = crypto.randomBytes(4).readUInt32LE(0);
//         const maskSeed = crypto.randomBytes(4).readUInt32LE(0);

//         const { shuffled, indices } = preprocessAndShuffle(image_byte, shuffleSeed);

//         const { masked } = bitwiseXnorMasking(shuffled, maskSeed);

//         const bMaskedBuffer = Buffer.from(masked.buffer, masked.byteOffset, masked.byteLength);

//         const { keys, ivs } = generateCryptoKeysAndIVs();

//         const C5 = layeredEncrypt5Stages(bMaskedBuffer, keys, ivs);

//         const metadata = {
//             image_width,
//             image_height,
//             shuffleSeed,
//             maskSeed,
//             keys: Object.fromEntries(
//                 Object.entries(keys).map(([k, v]) => [k, v.toString("base64")]),
//             ),
//             ivs: Object.fromEntries(Object.entries(ivs).map(([k, v]) => [k, v.toString("base64")])),
//         };
//         //package
//         const innerZip = new JSZip();
//         innerZip.file("metadata.json", JSON.stringify(metadata, null, 2));
//         innerZip.file("encrypted_image.bin", C5);
//         const innerZipBuffer = await innerZip.generateAsync({ type: "nodebuffer" });
//         const K_file = crypto.randomBytes(32);
//         const iv_cfb = crypto.randomBytes(16);
//         const cipher_cfb = crypto.createCipheriv("aes-256-cfb", K_file, iv_cfb);
//         //ma hoa metadata va img
//         const encrypted_metadata_zip = Buffer.concat([
//             cipher_cfb.update(innerZipBuffer),
//             cipher_cfb.final(),
//         ]);

//         const ephemeralKey = crypto.generateKeyPairSync("ec", {
//             namedCurve: "prime256v1",
//         });

//         // Import receiver's public key
//         const res = await publicKeyFromUsername(username_receive);
//         if (!res.success) {
//             return { success: false, message: "có lỗi khi truy xuất public key người nhận" };
//         }
//         const receiver_public_key = res.package?.public_key;
//         if (!receiver_public_key) {
//             return {
//                 success: false,
//                 message: "PublicKeyNotFound",
//             };
//         }
//         const receiverPubKeyObject = crypto.createPublicKey(receiver_public_key);

//         // Compute Shared Secret
//         const sharedSecret = crypto.diffieHellman({
//             privateKey: ephemeralKey.privateKey,
//             publicKey: receiverPubKeyObject,
//         });

//         // Derive K_ECC via HKDF
//         const K_ECC = Buffer.from(
//             crypto.hkdfSync(
//                 "sha256",
//                 sharedSecret,
//                 Buffer.alloc(0),
//                 Buffer.from("key-exchange"),
//                 32,
//             ),
//         );

//         // 8. Encrypt K_file using AES-256-GCM based on K_ECC
//         const nonce_gcm = crypto.randomBytes(12);
//         const cipher_gcm = crypto.createCipheriv("aes-256-gcm", K_ECC, nonce_gcm);
//         const encrypted_k_file = Buffer.concat([cipher_gcm.update(K_file), cipher_gcm.final()]);
//         const auth_tag = cipher_gcm.getAuthTag();

//         // 9. Package final outer zip
//         const outerZip = new JSZip();
//         outerZip.file("encrypted_my_files.zip", encrypted_metadata_zip);
//         outerZip.file("encrypted_aes_key.bin", encrypted_k_file);
//         outerZip.file("iv_cfb.bin", iv_cfb);
//         outerZip.file("nonce_gcm.bin", nonce_gcm);
//         outerZip.file("auth_tag.bin", auth_tag);
//         outerZip.file(
//             "ephemeral_public_key.pem",
//             ephemeralKey.publicKey.export({ type: "spki", format: "pem" }),
//         );

//         const finalZipBuffer = await outerZip.generateAsync({ type: "nodebuffer" });
//         return {
//             success: true,
//             message: "Gui file thanh cong",
//         };
//     } catch (error: any) {
//         console.error("Lỗi trong quá trình mã hóa ảnh:", error);
//         return {
//             success: false,
//             message: error.message,
//         };
//     }
// }

export interface EncryptResult {
    finalZip: Buffer;
    encryptedFileKey: Buffer;
    originalFilename: string;
    signature?: Buffer;
}

export async function encryptPackage(input: EncryptInput): Promise<EncryptResult> {
    const { username_send, username_receive, image_byte, image_width, image_height } = input;

    if (!image_byte || image_byte.length === 0) {
        throw new Error("Dữ liệu hình ảnh RGB không hợp lệ hoặc trống.");
    }

    const shuffleSeed = crypto.randomBytes(4).readUInt32LE(0);
    const maskSeed = crypto.randomBytes(4).readUInt32LE(0);

    const { shuffled, indices } = preprocessAndShuffle(image_byte, shuffleSeed);

    const { masked } = bitwiseXnorMasking(shuffled, maskSeed);

    const bMaskedBuffer = Buffer.from(masked.buffer, masked.byteOffset, masked.byteLength);

    const { keys, ivs } = generateCryptoKeysAndIVs();

    const C5 = layeredEncrypt5Stages(bMaskedBuffer, keys, ivs);

    const metadata = {
        image_width,
        image_height,
        shuffleSeed,
        maskSeed,
        keys: Object.fromEntries(Object.entries(keys).map(([k, v]) => [k, v.toString("base64")])),
        ivs: Object.fromEntries(Object.entries(ivs).map(([k, v]) => [k, v.toString("base64")])),
    };
    //package
    const innerZip = new JSZip();
    innerZip.file("metadata.json", JSON.stringify(metadata, null, 2));
    innerZip.file("encrypted_image.bin", C5);
    const innerZipBuffer = await innerZip.generateAsync({ type: "nodebuffer" });
    const K_file = crypto.randomBytes(32);
    const iv_cfb = crypto.randomBytes(16);
    const cipher_cfb = crypto.createCipheriv("aes-256-cfb", K_file, iv_cfb);
    //ma hoa metadata va img
    const encrypted_metadata_zip = Buffer.concat([
        cipher_cfb.update(innerZipBuffer),
        cipher_cfb.final(),
    ]);

    const ephemeralKey = crypto.generateKeyPairSync("ec", {
        namedCurve: "prime256v1",
    });

    // Import receiver's public key
    const res = await publicKeyFromUsername(username_receive); //ERROR
    const receiver_public_key = res.package?.public_key;
    console.log(receiver_public_key);
    if (!receiver_public_key) {
        throw new Error("Không tìm thấy public key của người nhận.");
    }
    const receiverPubKeyObject = crypto.createPublicKey(receiver_public_key);

    // Compute Shared Secret
    const sharedSecret = crypto.diffieHellman({
        privateKey: ephemeralKey.privateKey,
        publicKey: receiverPubKeyObject,
    });

    // Derive K_ECC via HKDF
    const K_ECC = Buffer.from(
        crypto.hkdfSync("sha256", sharedSecret, Buffer.alloc(0), Buffer.from("key-exchange"), 32),
    );

    // 8. Encrypt K_file using AES-256-GCM based on K_ECC
    const nonce_gcm = crypto.randomBytes(12);
    const cipher_gcm = crypto.createCipheriv("aes-256-gcm", K_ECC, nonce_gcm);
    const encrypted_k_file = Buffer.concat([cipher_gcm.update(K_file), cipher_gcm.final()]);
    const auth_tag = cipher_gcm.getAuthTag();

    // 9. Package final outer zip
    const outerZip = new JSZip();
    outerZip.file("encrypted_my_files.zip", encrypted_metadata_zip);
    outerZip.file("encrypted_aes_key.bin", encrypted_k_file);
    outerZip.file("iv_cfb.bin", iv_cfb);
    outerZip.file("nonce_gcm.bin", nonce_gcm);
    outerZip.file("auth_tag.bin", auth_tag);
    outerZip.file(
        "ephemeral_public_key.pem",
        ephemeralKey.publicKey.export({ type: "spki", format: "pem" }),
    );

    const finalZipBuffer = await outerZip.generateAsync({
        type: "nodebuffer",
    });

    return {
        finalZip: finalZipBuffer,
        encryptedFileKey: encrypted_k_file,
        originalFilename: input.filename + ".zip",
    };
}
export async function savePackage(file: Buffer, filename: string): Promise<string> {
    const id = crypto.randomUUID();
    const storagePath = `uploads/${id}_${filename}`;

    await fs.writeFile(storagePath, file);

    return storagePath;
}

import pool from "@/lib/db";

interface CreatePackageRecordInput {
    ownerUsername: string;
    recipientUsername: string;

    filename: string;
    storagePath: string;

    encryptedFileKey: Buffer;
    signature?: Buffer;
}

export async function createPackageRecord(input: CreatePackageRecordInput) {
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // Owner
        const [ownerRows]: any = await conn.execute(`SELECT id FROM users WHERE username = ?`, [
            input.ownerUsername,
        ]);

        if (ownerRows.length === 0) throw new Error("Owner không tồn tại.");

        // Recipient
        const [recipientRows]: any = await conn.execute(`SELECT id FROM users WHERE username = ?`, [
            input.recipientUsername,
        ]);

        if (recipientRows.length === 0) throw new Error("Recipient không tồn tại.");

        const ownerId = ownerRows[0].id;
        const recipientId = recipientRows[0].id;

        // Package
        const [packageResult]: any = await conn.execute(
            `INSERT INTO packages
            (owner_id, filename, storage_path, signature)
            VALUES (?, ?, ?, ?)`,
            [ownerId, input.filename, input.storagePath, input.signature ?? null],
        );

        const packageId = packageResult.insertId;

        // Recipient mapping
        await conn.execute(
            `INSERT INTO packages_recipients
            (image_id, recipient_id, encrypted_file_key)
            VALUES (?, ?, ?)`,
            [packageId, recipientId, input.encryptedFileKey],
        );

        await conn.commit();

        return packageId;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}
export async function EncryptAndSend(input: EncryptInput) {
    console.log("eNs called");
    // 1
    const encrypted = await encryptPackage(input);

    // 2
    const storagePath = await savePackage(encrypted.finalZip, encrypted.originalFilename);

    // 3
    await createPackageRecord({
        ownerUsername: input.username_send,

        recipientUsername: input.username_receive,

        filename: encrypted.originalFilename,

        storagePath,

        encryptedFileKey: encrypted.encryptedFileKey,

        signature: encrypted.signature,
    });

    return {
        success: true,
        message: "Gửi file thành công",
    };
}

export async function decryptImage(input: { zipFile: File; receiver_private_key: string }) {
    try {
        const archiveBuffer = Buffer.from(await input.zipFile.arrayBuffer());

        //------------------------------------------
        // 1. Outer ZIP
        //------------------------------------------
        const outerZip = await JSZip.loadAsync(archiveBuffer);

        const encryptedMetadataZip = await outerZip
            .file("encrypted_my_files.zip")!
            .async("nodebuffer");

        const encryptedKFile = await outerZip.file("encrypted_aes_key.bin")!.async("nodebuffer");

        const ivCFB = await outerZip.file("iv_cfb.bin")!.async("nodebuffer");

        const nonceGCM = await outerZip.file("nonce_gcm.bin")!.async("nodebuffer");

        const authTag = await outerZip.file("auth_tag.bin")!.async("nodebuffer");

        const ephemeralPublicKeyPem = await outerZip
            .file("ephemeral_public_key.pem")!
            .async("string");

        //------------------------------------------
        // 2. ECDH
        //------------------------------------------
        const receiverPrivateKey = crypto.createPrivateKey(input.receiver_private_key);

        const ephemeralPublicKey = crypto.createPublicKey(ephemeralPublicKeyPem);

        const sharedSecret = crypto.diffieHellman({
            privateKey: receiverPrivateKey,
            publicKey: ephemeralPublicKey,
        });

        //------------------------------------------
        // 3. HKDF
        //------------------------------------------
        const K_ECC = Buffer.from(
            crypto.hkdfSync(
                "sha256",
                sharedSecret,
                Buffer.alloc(0),
                Buffer.from("key-exchange"),
                32,
            ),
        );

        //------------------------------------------
        // 4. AES-GCM decrypt K_file
        //------------------------------------------
        const decipherGCM = crypto.createDecipheriv("aes-256-gcm", K_ECC, nonceGCM);

        decipherGCM.setAuthTag(authTag);

        const K_file = Buffer.concat([decipherGCM.update(encryptedKFile), decipherGCM.final()]);

        //------------------------------------------
        // 5. AES-CFB decrypt inner zip
        //------------------------------------------
        const decipherCFB = crypto.createDecipheriv("aes-256-cfb", K_file, ivCFB);

        const innerZipBuffer = Buffer.concat([
            decipherCFB.update(encryptedMetadataZip),
            decipherCFB.final(),
        ]);

        //------------------------------------------
        // 6. Inner ZIP
        //------------------------------------------
        const innerZip = await JSZip.loadAsync(innerZipBuffer);

        const metadata = JSON.parse(await innerZip.file("metadata.json")!.async("string"));
        const keys = {
            AES1: Buffer.from(metadata.keys.AES1, "base64"),
            AES2: Buffer.from(metadata.keys.AES2, "base64"),
            AES3: Buffer.from(metadata.keys.AES3, "base64"),
            "3DES1": Buffer.from(metadata.keys["3DES1"], "base64"),
            "3DES2": Buffer.from(metadata.keys["3DES2"], "base64"),
        };
        const ivs = {
            IV1: Buffer.from(metadata.ivs.IV1, "base64"),
            IV2: Buffer.from(metadata.ivs.IV2, "base64"),
            IV3: Buffer.from(metadata.ivs.IV3, "base64"),
            IV4: Buffer.from(metadata.ivs.IV4, "base64"),
            IV5: Buffer.from(metadata.ivs.IV5, "base64"),
        };

        const encryptedImage = await innerZip.file("encrypted_image.bin")!.async("nodebuffer");

        //------------------------------------------
        // 7. 5-layer decrypt
        //------------------------------------------
        const maskedBuffer = layeredDecrypt5Stages(encryptedImage, keys, ivs);

        const masked = new Uint8Array(maskedBuffer);

        //------------------------------------------
        // 8. Undo XNOR
        //------------------------------------------
        const shuffled = inverseBitwiseXnorMasking(masked, metadata.maskSeed);

        //------------------------------------------
        // 9. Undo Shuffle
        //------------------------------------------
        const rgbBytes = inverseShuffleAndReconstruct(shuffled, metadata.shuffleSeed);

        //------------------------------------------
        // 10. Return
        //------------------------------------------
        return {
            success: true,
            rgbBytes,
            width: metadata.width,
            height: metadata.height,
        };
    } catch (error) {
        throw new Error("Giai ma that bai");
    }
}
