"use server";
import crypto from "crypto";
import { promisify } from "util";

const generateKeyPairAsync = promisify(crypto.generateKeyPair);

export async function createECCKeys() {
    try {
        const { publicKey, privateKey } = await generateKeyPairAsync("ec", {
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
