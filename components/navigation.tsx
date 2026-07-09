import { Image as ImageIcon, Shield, LogOut } from "lucide-react";

import { cn } from "@/lib/utils";

interface NavigationProps {
    className?: string;
}

export default function Navigation({ className = "" }: NavigationProps) {
    return (
        <header
            className={cn(
                "w-full px-5 sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-200/50 shadow-sm",
                className, // Class truyền từ ngoài vào sẽ được tự động tối ưu và hợp nhất tại đây
            )}
        >
            <div className="flex justify-between items-center py-6">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="font-sans text-2xl font-bold text-blue-600 tracking-tight">
                            CyberShield
                        </span>
                    </div>
                </div>

                {/* Links Navigation (Desktop) */}
                <div className="hidden md:flex space-x-8 items-center">
                    {/* Menu Item kích hoạt (Ví dụ: Nền tảng đang active) */}
                    <a className="cursor-pointer font-sans text-sm pb-1 transition-all text-blue-600 font-medium">
                        Nền tảng
                    </a>

                    <a className="cursor-pointer text-sm pb-1 transition-all text-slate-600 hover:text-blue-600 font-medium">
                        Bảo mật
                    </a>

                    <a className="cursor-pointer text-sm pb-1 transition-all text-slate-600 hover:text-blue-600 font-medium">
                        Trình tạo khoá
                    </a>

                    <a className="cursor-pointer text-sm pb-1 transition-all text-slate-600 hover:text-blue-600 font-medium">
                        Bảng điều khiển
                    </a>
                </div>

                {/* Buttons / User Profile */}
                <div className="flex items-center space-x-4 ">
                    {/* THỐNG NHẤT 1: Giao diện khi người dùng ĐÃ ĐĂNG NHẬP */}
                    <div className="hidden items-center space-x-3 bg-slate-50 border border-slate-200 pl-3 pr-4 py-1.5 rounded-full">
                        <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
                            A
                        </div>
                        <div className="text-left hidden sm:block">
                            <p className="text-xs font-bold text-slate-800 leading-none">@alice</p>
                            <p className="text-[9px] text-slate-400 font-mono">ECC Active</p>
                        </div>
                        <button
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Đăng xuất"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>

                    {/* THỐNG NHẤT 2: Nút Đăng nhập (nếu chưa đăng nhập) */}
                    <button className="bg-blue-600/5 text-blue-600 border border-blue-600/20 font-sans text-xs px-4 py-2 rounded-full hover:bg-blue-600/10 transition-all cursor-pointer">
                        Đăng nhập
                    </button>

                    {/* Hành động chính (Call To Action) */}
                    <button className="bg-blue-600 text-white font-sans text-sm px-6 py-2.5 rounded-full hover:bg-blue-700 hover:shadow-lg transition-all active:scale-95 duration-200 cursor-pointer">
                        Bắt đầu bảo vệ
                    </button>
                </div>
            </div>
        </header>
    );
}
