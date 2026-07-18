"use client";

import { useAuth } from "@/app/context/authcontext";
import { LucideDownload, Search, Loader2, RefreshCcw, Inbox as InboxIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getInbox, InboxRecord } from "@/lib/server_actions";
import { decryptStoredPackage } from "@/lib/cryptoEngine2";
import { toast } from "sonner";
import { useEffect, useState, useMemo } from "react";

export default function Inbox() {
    const { auth } = useAuth();
    const [inboxItems, setInboxItems] = useState<InboxRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [decryptingId, setDecryptingId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");
    async function fetchInbox() {
        setLoading(true);
        try {
            const res = await getInbox(auth.id!);
            if (res.success && res.package) {
                setInboxItems(res.package as InboxRecord[]);
            } else {
                toast.error(res.message || "Không thể tải danh sách thư.");
            }
        } catch (err: any) {
            toast.error("Lỗi khi tải thư: " + err.message);
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        if (!auth.id) {
            setLoading(false);
            return;
        }
        fetchInbox();
    }, [auth.id]);

    async function handleDecryptAndDownload(item: InboxRecord) {
        if (!auth.decrypt_private_key) {
            toast.error("Không tìm thấy khóa riêng tư (Private Key) để giải mã.");
            return;
        }

        setDecryptingId(item.id);
        toast.info("Đang tải xuống và giải mã hình ảnh từ server...");

        try {
            const res = await decryptStoredPackage({
                storagePath: item.storage_path,
                recipientUsername: auth.username!,
                receiver_private_key: auth.decrypt_private_key,
            });

            if (!res.success || !res.base64Data) {
                throw new Error(res.message || "Không thể giải mã dữ liệu.");
            }

            // Giải mã base64 thành Uint8Array
            const binaryString = window.atob(res.base64Data);
            const len = binaryString.length;
            const rgbBytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                rgbBytes[i] = binaryString.charCodeAt(i);
            }

            // Tạo canvas để vẽ lại ảnh từ dữ liệu pixel RGB
            const canvas = document.createElement("canvas");
            canvas.width = res.width;
            canvas.height = res.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                throw new Error("Không thể khởi tạo Canvas 2D.");
            }

            const imgData = ctx.createImageData(res.width, res.height);
            let rgbIdx = 0;
            for (let i = 0; i < imgData.data.length; i += 4) {
                imgData.data[i] = rgbBytes[rgbIdx]; // R
                imgData.data[i + 1] = rgbBytes[rgbIdx + 1]; // G
                imgData.data[i + 2] = rgbBytes[rgbIdx + 2]; // B
                imgData.data[i + 3] = 255; // A (Alpha opaque)
                rgbIdx += 3;
            }
            ctx.putImageData(imgData, 0, 0);

            // Chuyển canvas thành Blob và tự động tải xuống
            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    // Đặt tên file đã tải xuống, giữ nguyên phần mở rộng
                    const downloadName = item.filename
                        ? item.filename.replace(/\.zip$/i, "")
                        : "decrypted_image.png";
                    a.download =
                        downloadName.endsWith(".png") ||
                        downloadName.endsWith(".jpg") ||
                        downloadName.endsWith(".jpeg")
                            ? downloadName
                            : `${downloadName}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    toast.success("Giải mã và tải xuống hình ảnh thành công!");
                } else {
                    toast.error("Không thể xuất ảnh từ canvas.");
                }
            }, "image/png");
        } catch (error: any) {
            console.error(error);
            toast.error(`Giải mã thất bại: ${error.message}`);
        } finally {
            setDecryptingId(null);
        }
    }
    const filteredInboxItems = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return inboxItems;

        return inboxItems.filter(
            (item) =>
                item.owner_username.toLowerCase().includes(query) ||
                (item.filename && item.filename.toLowerCase().includes(query)),
        );
    }, [inboxItems, searchQuery]);
    return (
        <div className="py-10 px-4 max-w-5xl mx-auto h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Hộp thư đến
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Xin chào <span className="font-semibold text-primary">{auth.username}</span>{" "}
                        👋. Dưới đây là các tệp tin được gửi riêng cho bạn.
                    </p>
                </div>
            </div>

            <main className="mt-6 h-full">
                <div id="controler" className="py-2 w-full mb-2 flex justify-between items-center">
                    <div
                        id="search"
                        className="px-2 focus-within:border-primary border-2 flex items-center rounded-lg"
                    >
                        <Search className="text-muted-foreground"></Search>
                        <Input
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                            }}
                            className="focus-visible:ring-0 border-0"
                            placeholder="Nhập tên người gửi để tìm kiếm"
                        ></Input>
                    </div>
                    <Button onClick={fetchInbox} variant={"outline"} size={"icon-lg"}>
                        <RefreshCcw />
                    </Button>
                </div>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border shadow-sm">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        <p className="text-muted-foreground mt-4 font-medium">
                            Đang tải hộp thư...
                        </p>
                    </div>
                ) : filteredInboxItems.length === 0 ? (
                    <div className="flex flex-col h-full items-center justify-center py-20 bg-card rounded-xl border border-border border-dashed text-center">
                        <div className="p-4 bg-muted rounded-full text-muted-foreground mb-4">
                            <InboxIcon className="w-12 h-12" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground">Hộp thư trống</h3>
                        <p className="text-muted-foreground max-w-sm mt-2">
                            Bạn hiện chưa nhận được gói tin mã hóa nào từ người dùng khác.
                        </p>
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden divide-y divide-border">
                        {filteredInboxItems.map((item) => (
                            <div
                                key={item.id}
                                className="p-5 hover:bg-muted/50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                                            Từ: {item.owner_username}
                                        </span>
                                    </div>
                                    <h2 className="font-semibold text-lg text-foreground tracking-tight">
                                        {item.filename}
                                    </h2>
                                    {item.message && (
                                        <p className="text-sm text-muted-foreground italic font-mono bg-muted px-2 py-1 rounded border border-border inline-block max-w-md truncate">
                                            Lời nhắn: "{item.message}"
                                        </p>
                                    )}
                                </div>
                                <div className="w-full sm:w-auto">
                                    <Button
                                        size="default"
                                        className="w-full sm:w-auto cursor-pointer flex items-center justify-center gap-2"
                                        onClick={() => handleDecryptAndDownload(item)}
                                        disabled={decryptingId !== null}
                                    >
                                        {decryptingId === item.id ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Đang giải mã...
                                            </>
                                        ) : (
                                            <>
                                                <LucideDownload className="w-4 h-4" />
                                                Giải mã & Tải xuống
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
