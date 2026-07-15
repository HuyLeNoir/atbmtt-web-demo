import { encryptPrivateKey, decryptPrivateKey, createECCKeys, register, login } from "@/lib/auth";
function testEncryptionFlow() {
    console.log("=== BẮT ĐẦU KIỂM TRA HÀM MÃ HÓA / GIẢI MÃ ===");

    // 1. Chuẩn bị dữ liệu giả lập (Mock Data)
    const mockPrivateKeyPem =
        "-----BEGIN PRIVATE KEY-----\n" +
        "MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3z9xZ...\n" +
        "Đây là đoạn Private Key bảo mật mẫu của hệ thống\n" +
        "-----END PRIVATE KEY-----";

    const mockPassword = "SuperSecurePassword123!";
    const mockUsername = "annguyen_crypto";

    try {
        console.log("\n[1] Tiến hành mã hóa...");
        // Gọi hàm mã hóa của bạn
        const encryptedResult = encryptPrivateKey(mockPrivateKeyPem, mockPassword, mockUsername);

        console.log("-> Chuỗi lưu vào DB thành công:");
        console.log(encryptedResult);

        console.log("\n[2] Tiến hành giải mã...");
        // Gọi hàm giải mã của bạn với đúng thông tin đăng nhập
        const decryptedResult = decryptPrivateKey(encryptedResult, mockPassword, mockUsername);
        console.log(decryptedResult);
        console.log("\n[3] So sánh kết quả...");
        // Kiểm tra xem chuỗi sau giải mã có bằng chuỗi ban đầu không
        if (decryptedResult === mockPrivateKeyPem) {
            console.log("✅ THÀNH CÔNG: Dữ liệu giải mã khớp hoàn toàn với dữ liệu gốc!");
        } else {
            console.log("❌ THẤT BẠI: Dữ liệu giải mã KHÔNG khớp với dữ liệu gốc.");
        }

        // --- KIỂM TRA TRƯỜNG HỢP SAI MẬT KHẨU HOẶC SAI USERNAME ---
        console.log("\n[4] Thử nghiệm giải mã với SAI mật khẩu để check lỗi...");
        try {
            decryptPrivateKey(encryptedResult, "WrongPassword!!!", mockUsername);
            console.log(
                "⚠️ CẢNH BÁO: Giải mã bừa vẫn chạy được (Có thể ra chuỗi rác vì đang dùng CBC).",
            );
        } catch (e) {
            console.log("🔒 TỐT: Hệ thống đã chặn được và ném ra lỗi khi sai mật khẩu.");
        }
    } catch (error) {
        console.error("❌ LỖI HỆ THỐNG TRONG QUÁ TRÌNH TEST:", error);
    }
}

// Chạy hàm kiểm tra
// testEncryptionFlow();

// console.log(createECCKeys());

async function run() {
    const result = await login("huyle", "nigabaka");
    console.log(result);
}
run();
