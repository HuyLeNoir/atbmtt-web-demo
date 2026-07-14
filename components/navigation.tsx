import { Image as ImageIcon, Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
interface NavigationProps {
    className?: string;
}

export default function Navigation({ className = "" }: NavigationProps) {
    return (
        <header
            className={cn(
                "w-full px-5 sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-border shadow-sm",
                className, // Class truyền từ ngoài vào sẽ được tự động tối ưu và hợp nhất tại đây
            )}
        >
            <div className="flex justify-between items-center py-6">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-background text-primary shadow-md">
                        <Shield className="w-6 h-6" />
                    </div>
                    <span className="font-sans text-3xl font-bold text-primary tracking-tight">
                        CyberShield
                    </span>
                </div>
                <Button
                    onClick={() => {
                        document.getElementById("login")?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                        });
                    }}
                    size={"lg"}
                    className={"cursor-pointer"}
                >
                    Đăng nhập
                </Button>
            </div>
        </header>
    );
}
