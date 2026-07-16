"use client";
import { Shield, LogOut, Pencil, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { clsx } from "clsx";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { PreviewImage } from "@/lib/definitions";
import { EncryptAndSend } from "@/lib/cryptoEngine2";
import { publicKeyFromUsername } from "@/lib/server_actions";
export default function personalLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pathName = usePathname();
    const [UploadedImage, setUploadedImage] = useState<PreviewImage>();
    const [IsSubmiting, setIsSubmiting] = useState<boolean>(false);
    const [receivers, setReceivers] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState<string>("");
    function handleUpload() {
        fileInputRef.current?.click();
    }
    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }
        try {
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
                setUploadedImage({
                    file: file,
                    filename: file.name,
                    width: width,
                    height: height,
                    url: url,
                    rgbBytes: rgbFlatBytes,
                });
                toast.success(`Đã tải file ${file.name}. Kích thước: ${width}px x ${height}px`);
            };

            img.src = url;
        } catch (err) {
            toast.error("Tải file thất bại");
        }
    }
    function handleInputChange(inputValue: string) {
        setInputValue(inputValue);
    }
    function addReceiver() {
        const value = inputValue?.trim();
        if (!value) return;
        if (receivers.includes(value)) {
            toast.warning(`${value} đã tồn tại`);
            return;
        }
        setInputValue("");
        toast.success(`Thêm thành công ${value}`);
        setReceivers((prev) => [...prev, value]);
    }
    function removeReceiver(target: string) {
        setReceivers((prev) => prev.filter((item) => item !== target));
    }
    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === " " || e.code === "Space") {
            // Prevent default to avoid adding a space character in the input
            e.preventDefault();
        }
        if (e.key === "Enter") {
            e.preventDefault();
            addReceiver();
        }
    }
    //currentlyWorking
    async function handleSubmit() {
        console.log("handleSubmit called");
        if (!inputValue) {
            toast.error("LOL");
        }
        if (!UploadedImage) {
            toast.error("Vui lòng tải lên một ảnh trước khi gửi.");
            return;
        }

        setIsSubmiting(true);
        try {
            const result = await EncryptAndSend({
                username_send: "huyle",
                username_receive: inputValue, //temp
                image_byte: UploadedImage.rgbBytes,
                image_width: UploadedImage.width,
                image_height: UploadedImage.height,
                filename: UploadedImage.filename,
            });

            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gửi file thất bại";
            toast.error(message);
        } finally {
            setIsSubmiting(false);
        }
    }
    return (
        <div className="h-screen grid grid-cols-12 gap-5 overflow-hidden">
            <div className="col-span-3 flex flex-col md:col-span-2 h-screen border border-border shadow-md px-2 py-5">
                {/* Logo */}
                <div className="flex gap-2.5 lg:justify-start justify-center items-center border-b border-border pb-2">
                    <div className="p-2 rounded-xl flex items-center justify-center bg-background text-primary shadow-sm">
                        <Shield className="w-5 h-5" />
                    </div>
                    <span className="hidden font-sans text-xl font-bold text-primary tracking-tight lg:block">
                        CyberShield
                    </span>
                </div>
                {/* Action */}
                <Dialog>
                    <form onSubmit={handleSubmit}>
                        <DialogTrigger
                            render={
                                <Button
                                    type="button"
                                    className={
                                        "text-lg px-3 py-5 w-full mt-10 hover:shadow-sm cursor-pointer transition-all duration-300 ease-in-out "
                                    }
                                    variant={"outline"}
                                    size={"lg"}
                                >
                                    <Pencil />
                                    Send
                                </Button>
                            }
                        >
                            Open
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Send</DialogTitle>
                                <DialogDescription>
                                    Vui lòng chọn file ảnh bạn muốn gửi
                                </DialogDescription>
                            </DialogHeader>
                            <p>Upload</p>
                            <div className="w-full" onClick={handleUpload}>
                                <div className="group p-5 transition-all duration-100 ease-in-out cursor-pointer hover:border-foreground border-dashed border-2 w-full h-full flex items-center flex-col gap-5 py-5 rounded-xl">
                                    <p className="text-muted-foreground">
                                        Kéo thả ảnh gốc vào đây hoặc{" "}
                                        <span className="text-primary underline">
                                            click để chọn file
                                        </span>
                                    </p>
                                    <input
                                        onChange={handleFileChange}
                                        ref={fileInputRef}
                                        className="hidden"
                                        type="file"
                                        accept="image/*"
                                    />
                                    <Upload
                                        size={48}
                                        className="text-muted-foreground transition-all duration-100 ease-in-out group-hover:text-foreground"
                                    />
                                    <p className="text-muted-foreground font-medium">
                                        Hỗ trợ JPG, PNG, WEBP
                                    </p>
                                </div>
                            </div>
                            {/* Preview */}
                            {UploadedImage && (
                                <div>
                                    <p>Preview</p>
                                    <div className="wrapper">
                                        {UploadedImage && (
                                            <div className="w-full flex items-center justify-center rounded-lg p-5">
                                                <img
                                                    src={UploadedImage.url}
                                                    alt="preview"
                                                    className="h-full max-h-32 w-full aspect-square rounded-xl object-cover"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {UploadedImage && (
                                <Field>
                                    <FieldLabel htmlFor="input-field-receiver">
                                        Người nhận
                                    </FieldLabel>
                                    <div className="flex gap-2 items-center w-full flex-wrap">
                                        {receivers?.map((receiver, index) => (
                                            <span
                                                onClick={(e) => {
                                                    removeReceiver(receiver);
                                                }}
                                                key={index}
                                                className="group hover:bg-destructive relative cursor-pointer px-3 py-1 bg-primary text-primary-foreground rounded-lg"
                                            >
                                                <span className="group-hover:invisible">
                                                    {receiver}
                                                </span>
                                                <span className="absolute w-full h-full inset-0 flex justify-center items-center opacity-0 group-hover:opacity-100 text-white">
                                                    <Trash2 size={18}></Trash2>
                                                </span>
                                            </span>
                                        ))}
                                    </div>
                                    <Input
                                        value={inputValue || ""}
                                        onKeyDown={handleKeyDown}
                                        onChange={(e) => {
                                            handleInputChange(e.target.value);
                                        }}
                                        id="input-field-receiver"
                                        type="text"
                                        placeholder="Enter your receiver id"
                                    />
                                </Field>
                            )}
                            <DialogFooter>
                                <DialogClose
                                    render={
                                        <Button type="button" variant="outline">
                                            Thoát
                                        </Button>
                                    }
                                />
                                <Button
                                    className={"cursor-pointer"}
                                    onClick={handleSubmit}
                                    disabled={IsSubmiting}
                                >
                                    Gửi
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </form>
                </Dialog>
                {/* Menu */}
                <div className="px-2 flex flex-col mt-2.5">
                    <button
                        onClick={() => {
                            router.replace("/inbox");
                        }}
                        className={clsx(
                            "py-1 px-3 w-full text-left rounded-lg hover:text-secondary-foreground transition-all duration-150 cursor-pointer ease-in-out",
                            pathName == "/inbox"
                                ? "text-bold bg-secondary text-secondary-foreground"
                                : " hover:bg-secondary",
                        )}
                    >
                        Inbox
                    </button>
                    <button
                        onClick={() => {
                            router.replace("/sent");
                        }}
                        className={clsx(
                            "py-1 px-3 w-full text-left rounded-lg hover:text-secondary-foreground transition-all duration-150 cursor-pointer ease-in-out",
                            pathName == "/sent"
                                ? "text-bold bg-secondary text-secondary-foreground"
                                : " hover:bg-secondary",
                        )}
                    >
                        Sent
                    </button>
                </div>
                {/* logout */}
                <div className="mt-auto mb-10">
                    <button className="p-1 flex items-center gap-2.5 w-full hover:bg-secondary rounded-lg hover:text-secondary-foreground transition-all duration-150 cursor-pointer ease-in-out hover:scale-105">
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </div>
            <div className="col-span-9 md:col-span-10 h-full overflow-y-auto">{children}</div>
        </div>
    );
}
