"use client";
import { saveAs } from "file-saver";
import { cn } from "@/lib/utils";
import { LockIcon, UnlockIcon, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { decryptImage, encryptImage } from "@/lib/cryptoEngine";
interface ControlTab {
    className?: string;
}
interface PreviewImage {
    file: File;
    url: string;
    width: number;
    height: number;
    rgbBytes: Uint8Array;
}

export default function ControlTab({ className }: ControlTab) {
    const [encImage, setEncImage] = useState<PreviewImage | null>(null);
    const [zipFile, setZipFile] = useState<File | null>(null);
    const [receiverPubKey, setReceiverPubKey] = useState<string>("");
    const [receiverPrivateKey, setReceiverPrivateKey] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<string>("encrypt");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const fileZipInputRef = useRef<HTMLInputElement>(null);

    function reconstructImage(rgbBytes: Uint8Array, width: number, height: number) {
        const rgba = new Uint8ClampedArray(width * height * 4);

        let rgbIndex = 0;
        let rgbaIndex = 0;

        while (rgbIndex < rgbBytes.length) {
            rgba[rgbaIndex++] = rgbBytes[rgbIndex++]; // R
            rgba[rgbaIndex++] = rgbBytes[rgbIndex++]; // G
            rgba[rgbaIndex++] = rgbBytes[rgbIndex++]; // B
            rgba[rgbaIndex++] = 255; // Alpha
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d")!;
        ctx.putImageData(new ImageData(rgba, width, height), 0, 0);

        canvas.toBlob((blob) => {
            if (!blob) return;

            saveAs(blob, "decrypted.png");
        }, "image/png");
    }

    function handleUpload() {
        fileInputRef.current?.click();
    }
    function handleZipUpload() {
        fileZipInputRef.current?.click();
    }
    async function handleEncrypt() {
        if (!encImage) {
            toast.error("Vui lòng chọn ảnh trước khi mã hóa.");
            return;
        }

        const { file, width, height, rgbBytes } = encImage;
        setIsProcessing(true);

        try {
            const result = await encryptImage({
                rgbBytes,
                receiver_public_key: receiverPubKey,
                width,
                height,
            });

            if (!result.success || !result.file) {
                throw new Error(result.error || "Mã hóa thất bại.");
            }

            const fileBytes = new Uint8Array(result.file);
            const blob = new Blob([fileBytes], {
                type: "application/zip",
            });

            saveAs(blob, `${file.name.split(".")[0]}_encrypted.zip`);
            toast.success("Mã hóa thành công.");
        } catch (err) {
            console.error(err);
            toast.error("Có lỗi xảy ra khi mã hóa ảnh.");
        } finally {
            setIsProcessing(false);
        }
    }
    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        try {
            toast.success(`Đã tải file thành công`);
        } catch (err) {
            toast.error("Có lỗi xảy ra khi sao chép.");
        }
        if (!file) return;

        const url = URL.createObjectURL(file);

        const img = new Image();

        img.onload = () => {
            const width = img.width;
            const height = img.height;
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data; // Đây là mảng phẳng RGBA [R,G,B,A, R,G,B,A...]
            // 4. Lọc bỏ kênh Alpha (A) để chỉ giữ lại RGB phẳng
            const rgbFlatBytes = new Uint8Array(width * height * 3);
            let rgbIdx = 0;

            for (let i = 0; i < data.length; i += 4) {
                rgbFlatBytes[rgbIdx] = data[i]; // R
                rgbFlatBytes[rgbIdx + 1] = data[i + 1]; // G
                rgbFlatBytes[rgbIdx + 2] = data[i + 2]; // B
                rgbIdx += 3;
            }
            setEncImage({
                file: file,
                width: width,
                height: height,
                url: url,
                rgbBytes: rgbFlatBytes,
            });
        };
        img.src = url;
    }
    async function handleDecrypt() {
        if (!zipFile) {
            toast.error("Vui lòng chọn file zip.");
            return;
        }
        if (!receiverPrivateKey) {
            toast.error("Vui lòng chọn private key");
            return;
        }

        try {
            const result = await decryptImage({
                zipFile,
                receiver_private_key: receiverPrivateKey,
            });
            const width = result.width;
            const height = result.height;

            console.log(result);

            if (result.success) {
                toast.success("Giải mã thành công.");
                reconstructImage(result.rgbBytes, result.width, result.height);
            }
        } catch (err) {
            console.error(err);
            toast.error("Có lỗi xảy ra khi giải mã.");
        }
    }
    async function handleZipFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];

        if (!file) {
            setZipFile(null);
            return;
        }

        if (!file.name.endsWith(".zip")) {
            alert("Vui lòng chọn file .zip");
            e.target.value = "";
            setZipFile(null);
            return;
        }

        setZipFile(file);
    }
    return (
        <div
            defaultValue="encrypt"
            className={cn(
                "w-full min-h-100 mt-10 py-5 rounded-lg border flex flex-col md:flex-rows",
                className,
            )}
        >
            <div className="tabList flex py-1 gap-5 justify-center border-b-2">
                <div
                    onClick={() => {
                        setActiveTab("encrypt");
                    }}
                    className="tabTrigger px-5 min-w-25 border-b-4 border-b-blue-900 py-2 font-medium text-lg cursor-pointer flex text-slate-700 hover:text-blue-900 transition-all duration-300 gap-2.5"
                >
                    <LockIcon />
                    Encrypt
                </div>
                <div
                    onClick={() => {
                        setActiveTab("decrypt");
                    }}
                    className="tabTrigger px-5 border-b-4 border-transparent hover:border-b-blue-900 py-2 font-medium text-lg cursor-pointer flex text-slate-700 hover:text-blue-900 transition-all duration-300 gap-2.5"
                >
                    <UnlockIcon />
                    Decrypt
                </div>
            </div>
            {/* encrypt */}
            {activeTab == "encrypt" && (
                <div className="w-full flex items-center py-5 flex-col">
                    <div className="p-5 w-full" onClick={handleUpload}>
                        <div className="group transition-all duration-300 cursor-pointer hover:border-blue-800 border-dashed border-3 border-slate-800 hover:bg-blue-800/5 w-full h-full flex items-center flex-col gap-5 py-10 border-outline-variant rounded-xl">
                            <p>
                                Kéo thả ảnh gốc vào đây hoặc{" "}
                                <span className="text-blue-900 underline">chọn file</span>
                            </p>
                            <input
                                onChange={handleFileChange}
                                ref={fileInputRef}
                                className="hidden"
                                type="file"
                                accept="image/*"
                            />
                            <Upload
                                size={64}
                                className="text-slate-800 group-hover:text-blue-900"
                            />
                            <p className="text-slate-500 font-medium">Hỗ trợ JPG, PNG, WEBP</p>
                        </div>
                    </div>
                    {encImage && (
                        <div className="w-full items-center flex gap-10 bg-gray-100 rounded-lg mt-5 p-5">
                            <img
                                src={encImage.url}
                                alt="preview"
                                className="h-full max-h-32 aspect-square rounded-xl object-cover"
                            />
                            <div>
                                <p className="text-slate-800 font-medium text-xl">
                                    {encImage.width} x {encImage.height} Pixels
                                </p>
                            </div>
                        </div>
                    )}
                    {encImage && (
                        <div className="mt-5 flex gap-2.5 flex-col w-full">
                            <span className="mr-auto text-xl font-bold text-blue-900">
                                Public Key người nhận
                            </span>
                            <textarea
                                rows={6}
                                value={receiverPubKey}
                                onChange={(e) => {
                                    setReceiverPubKey(e.target.value);
                                }}
                                className="w-full resize-none bg-slate-50 border text-slate-700 border-slate-200 rounded-lg px-4 py-3 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                            />
                        </div>
                    )}
                    {encImage && (
                        <button
                            type="button"
                            onClick={handleEncrypt}
                            disabled={isProcessing}
                            className="mt-5 bg-blue-800 flex items-center justify-center gap-5 mx-auto cursor-pointer rounded-lg px-5 py-3 text-white w-full hover:brightness-105 transition-all duration-300 disabled:opacity-60"
                        >
                            {isProcessing ? "Đang xử lý..." : "Bắt đầu mã hoá"}
                        </button>
                    )}
                </div>
            )}
            {/* decrypt */}
            {activeTab == "decrypt" && (
                <div className="w-full flex items-center py-5 flex-col">
                    <div className="p-5 w-full" onClick={handleZipUpload}>
                        <div className="group transition-all duration-300 cursor-pointer hover:border-blue-800 border-dashed border-3 border-slate-800 hover:bg-blue-800/5 w-full h-full flex items-center flex-col gap-5 py-10 border-outline-variant rounded-xl">
                            <p>
                                Kéo thả file mã hoá vào đây hoặc{" "}
                                <span className="text-blue-900 underline">chọn file</span>
                            </p>
                            <input
                                onChange={handleZipFileChange}
                                ref={fileZipInputRef}
                                className="hidden"
                                type="file"
                                accept=".zip"
                            />
                            <Upload
                                size={64}
                                className="text-slate-800 group-hover:text-blue-900"
                            />
                            <p className="text-slate-500 font-medium">Hỗ trợ Zip</p>
                        </div>
                    </div>
                    {zipFile && (
                        <div className="w-full items-center flex flex-col gap-10 bg-gray-100 rounded-lg mt-5 p-5">
                            <div>
                                <p className="text-slate-800 font-medium text-xl">{zipFile.name}</p>
                                <p className="text-slate-800 font-medium text-xl">{zipFile.size}</p>
                            </div>
                        </div>
                    )}
                    {zipFile && (
                        <div className="mt-5 flex gap-2.5 flex-col w-full">
                            <span className="mr-auto text-xl font-bold text-blue-900">
                                Private Key của bạn
                            </span>
                            <textarea
                                rows={6}
                                value={receiverPrivateKey}
                                onChange={(e) => {
                                    setReceiverPrivateKey(e.target.value);
                                }}
                                className="w-full resize-none bg-slate-50 border text-slate-700 border-slate-200 rounded-lg px-4 py-3 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                            />
                        </div>
                    )}
                    {zipFile && (
                        <button
                            type="button"
                            onClick={handleDecrypt}
                            disabled={isProcessing}
                            className="mt-5 bg-blue-800 flex items-center justify-center gap-5 mx-auto cursor-pointer rounded-lg px-5 py-3 text-white w-full hover:brightness-105 transition-all duration-300 disabled:opacity-60"
                        >
                            {isProcessing ? "Đang xử lý..." : "Bắt đầu mã hoá"}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
