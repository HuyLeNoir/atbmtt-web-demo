"use client";
import clsx from "clsx";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Key as KeyIcon } from "lucide-react";
import { createECCKeys } from "@/actions/serverActions";

interface KeyGenSection_TextAreaProps {
    title: string;
    value?: string;
}

interface KeyPair {
    hasKey: boolean;
    publicKey: string;
    privateKey: string;
}

function KeyGenSection_TextArea({
    title = "placeholder",
    value = "",
}: KeyGenSection_TextAreaProps) {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async () => {
        if (!value) {
            toast.error("Không có nội dung để sao chép!");
            return;
        }

        try {
            await navigator.clipboard.writeText(value);
            setIsCopied(true);
            toast.success(`Đã sao chép thành công ${title}!`);
            setTimeout(() => setIsCopied(false), 1000);
        } catch (err) {
            toast.error("Có lỗi xảy ra khi sao chép.");
        }
    };

    return (
        <div className="flex flex-col w-full">
            <div className="flex">
                <span className="mr-auto text-xl font-bold text-blue-900">{title}</span>
                <span
                    onClick={handleCopy}
                    className={clsx("flex items-center gap-1 cursor-pointer", {
                        "text-green-400": isCopied,
                        "text-slate-800": !isCopied,
                    })}
                >
                    {isCopied ? <Check size={16} /> : <Copy size={16} />}
                    Sao chép
                </span>
            </div>
            <textarea
                rows={6}
                readOnly
                value={value}
                className="w-full resize-none bg-slate-50 border text-slate-700 border-slate-200 rounded-lg px-4 py-3 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                name="pubkey"
                id="pubkey"
            />
        </div>
    );
}

export default function KeyGenSection() {
    const [keyPair, setKeyPair] = useState<KeyPair>({
        hasKey: false,
        publicKey: "",
        privateKey: "",
    });

    async function onCreateKey() {
        try {
            const { publicKey, privateKey } = await createECCKeys();
            setKeyPair({ hasKey: true, publicKey: publicKey, privateKey: privateKey });
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div className="border rounded-lg p-10 mt-10 flex flex-col gap-10">
            <h1 className="text-4xl font-medium text-slate-700">ECC NIST P-256 Key Generator</h1>
            <p className="text text-slate-500">
                Tạo khoá bảo mật công khai (Public Key) và bí mật (Private Key) dùng cho việc truyền
                nhận tệp mã hoá CyberShield.
            </p>
            <div
                className={clsx("flex-col md:flex-row w-full gap-5", {
                    hidden: !keyPair.hasKey,
                    flex: keyPair.hasKey,
                })}
            >
                <KeyGenSection_TextArea title="Public key" value={keyPair.publicKey} />
                <KeyGenSection_TextArea title="Private key" value={keyPair.privateKey} />
            </div>
            <button
                onClick={onCreateKey}
                className="bg-blue-800 flex items-center justify-center gap-5 mx-auto cursor-pointer rounded-lg px-5 py-3 text-white w-full hover:brightness-105 transition-all duration-300 disabled:opacity-60"
            >
                <KeyIcon size={24} />
                Tạo cặp khoá an toàn
            </button>
        </div>
    );
}
