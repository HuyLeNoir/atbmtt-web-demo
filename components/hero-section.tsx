"use client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import ReactCompareImage from "react-compare-image";
interface HerosectionProps {
    className?: string;
}
export default function HeroSection({ className }: HerosectionProps) {
    return (
        <div className={cn("w-full py-16 min-h-100 grid-cols-12 grid gap-5", className)}>
            <div className="col-span-12 md:col-span-7 flex flex-col gap-5">
                <h1 className="text-7xl leading-20 text-slate-800">
                    Bảo vệ tuyệt đối hình ảnh cá nhân của bạn với mã hoá đa lớp
                </h1>
                <p className="text-slate-600 font-medium">
                    CyberShield mã hoá và giải mã hình ảnh nhạy cảm chỉ trong vài giây. Quyền riêng
                    tư của bạn là ưu tiên hàng đầu với kiến trúc Zero-Knowledge, bảo mật tệp nén qua
                    ECDH (ECC P-256) và AES-GCM phong bì.
                </p>
                <div className="flex max-w-lg gap-5">
                    <button className="bg-blue-800 cursor-pointer rounded-lg px-5 py-3 text-white w-50 hover:brightness-105 transition-all duration-300">
                        Start now
                    </button>
                    <button className="bg-slate-200 cursor-pointer rounded-lg px-5 py-3 text-black w-50 hover:brightness-105 transition-all duration-300">
                        Watch demo!
                    </button>
                </div>
            </div>
            <div className="col-span-12 md:col-span-5 flex items-center">
                <div className="overflow-hidden rounded-lg border-10 w-full">
                    <ReactCompareImage
                        leftImage="/mightyEagle.png"
                        rightImage="cho-ta-an-gi.jpg"
                        hover
                        aspectRatio="taller"
                    ></ReactCompareImage>
                </div>
            </div>
        </div>
    );
}
