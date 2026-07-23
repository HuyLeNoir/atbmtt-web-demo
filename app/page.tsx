"use client";
import Navigation from "@/components/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import ReactCompareImage from "react-compare-image";

import { Shield, Cpu, Clock } from "lucide-react"; // Hoặc dùng icon của bạn
import { useRouter } from "next/navigation";
import { login, register } from "@/lib/auth";
import { toast } from "sonner";
import { useAuth } from "./context/authcontext";

const cards = [
    {
        icon: <Shield className="w-6 h-6" />,
        title: "Mã hoá đầu cuối phong bì",
        desc: "ECDH P-256 tạo khoá đối xứng tạm thời bảo vệ khóa file K_file bằng AES-256-GCM, nén kép metadata đảm bảo chỉ người có Private Key hợp lệ mới xem được.",
    },
    {
        icon: <Cpu className="w-6 h-6" />,
        title: "Mật mã học 5 tầng tuần tự",
        desc: "Dữ liệu pixel sau khi xáo trộn và bitwise XNOR sẽ đi qua 3 lớp AES-CBC 256-bit và 2 lớp 3DES-CBC 192-bit tăng độ khuếch tán entropy lên mức tối đa.",
    },
    {
        icon: <Clock className="w-6 h-6" />,
        title: "Kiến trúc Zero-Knowledge",
        desc: "Không bao giờ lưu trữ ảnh, khoá hay tệp nén của bạn. Quy trình xử lý chuyển đổi dữ liệu diễn ra hoàn toàn trên bộ nhớ đệm luồng Express và tự hủy ngay lập tức.",
    },
];

export default function App() {
    const router = useRouter();
    const { loginUser } = useAuth();
    const [authTab, setAuthTab] = useState<"login" | "register">("login");
    async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData) as Record<string, string>;
        const { username, password } = data;
        const result = await login(username, password);
        if (!result.success || !result) {
            toast.error(`Đăng nhập thất bại. Lỗi: ${result.message}`);
            return;
        }
        loginUser(result.package?.id, username, result.package?.decrypted_private_key);
        toast.success("Đăng nhập thành công");
        router.push("/inbox");
    }

    async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        console.log("hello from handle register");
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData) as Record<string, string>;
        const { username, password, repassword } = data;
        if (password !== repassword) {
            toast.error("Mật khẩu không khớp!");
            return;
        }
        const result = await register(username, password);
        if (!result.success || !result) {
            toast.error(`Đăng ký thất bại. Lỗi: ${result.message}`);
            return;
        }
        const loginResult = await login(username, password);
        if (!loginResult.success || !result) {
            toast.error(`Đăng nhập thất bại. Lỗi: ${result.message}`);
            return;
        }
        loginUser(loginResult.package?.id, username, loginResult.package?.decrypted_private_key);
        toast.success("Đăng ký thành công");
        router.push("/inbox");
    }
    return (
        <div className="w-full flex flex-col">
            <Navigation className="w-full"></Navigation>
            {/* Main section */}
            <div className="Content col-span-12 mx-10 mt-10">
                {/* Hero section */}
                <div className="col-span-12 w-full py-16 min-h-100 grid-cols-12 grid gap-5">
                    <div className="col-span-12 md:col-span-7 flex flex-col gap-5">
                        <h1 className="text-7xl leading-20 text-foreground">
                            Bảo vệ tuyệt đối hình ảnh cá nhân của bạn với mã hoá đa lớp
                        </h1>
                        <p className="text-muted-foreground font-medium">
                            CyberShield mã hoá và giải mã hình ảnh nhạy cảm chỉ trong vài giây.
                            Quyền riêng tư của bạn là ưu tiên hàng đầu với kiến trúc Zero-Knowledge,
                            bảo mật tệp nén qua ECDH (ECC P-256) và AES-GCM phong bì.
                        </p>
                    </div>
                    <div className="col-span-12 md:col-span-5 flex items-center">
                        <div className="overflow-hidden rounded-lg border-10 border-border w-full">
                            <ReactCompareImage
                                leftImage="/mightyEagle.png"
                                rightImage="cho-ta-an-gi.jpg"
                                hover
                                aspectRatio="taller"
                            ></ReactCompareImage>
                        </div>
                    </div>
                </div>
                {/* Features */}
                <div className="col-span-12 gap-5 w-full bg-background my-16 flex rounded-lg flex-col items-center justify-center">
                    <h1 className="text-primary font-bold text-4xl mb-5">
                        Tại sao chọn CyberShield?
                    </h1>
                    <p className="max-w-2xl text-center font-medium text-muted-foreground mb-12 text-sm md:text-base leading-relaxed">
                        Chúng tôi áp dụng mô hình toán học chuẩn hóa kết hợp với hoán vị ngẫu nhiên
                        cấu trúc pixel và mật mã học phong bì để bảo vệ trọn vẹn dữ liệu.
                    </p>
                    <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6">
                        {cards.map((card, index) => (
                            <div
                                key={index}
                                className="group hover:border-primary transition-colors duration-300 border-2 rounded-2xl p-8 flex flex-col items-start h-full shadow-sm"
                            >
                                {/* Box chứa Icon */}
                                <div className="group-hover:scale-110 group-hover:text-primary-foreground group-hover:bg-primary text-muted-foreground transition-all duration-300 p-3 bg-accent rounded-xl mb-6 flex items-center justify-center">
                                    {card.icon}
                                </div>

                                {/* Tiêu đề Card */}
                                <h3 className="text-xl font-bold text-foreground mb-4 tracking-tight">
                                    {card.title}
                                </h3>

                                {/* Nội dung mô tả */}
                                <p className="text-muted-foreground text-sm font-medium leading-relaxed text-justify">
                                    {card.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Key gen used to be here*/}
                {/* login/logout */}
                <div className="Login/logout w-full flex justify-center contianer mt-5 min-h-100">
                    <div className="md:w-200 w-full">
                        <h1 className="text-primary font-bold text-4xl mb-10 text-center">
                            Đăng Nhập/Đăng Ký
                        </h1>
                        {/* Đăng nhập */}
                        {authTab === "login" && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Đăng nhập</CardTitle>
                                    <CardAction>
                                        <span>Chưa có tài khoản?</span>
                                        <Button
                                            onClick={() => {
                                                setAuthTab("register");
                                            }}
                                            className={"cursor-pointer"}
                                            variant="link"
                                        >
                                            Đăng ký ngay
                                        </Button>
                                    </CardAction>
                                </CardHeader>
                                <CardContent>
                                    <form id="login-form" onSubmit={handleLogin}>
                                        <div className="flex flex-col gap-6">
                                            <div className="grid gap-2">
                                                <Label htmlFor="account">Tài khoản</Label>
                                                <Input
                                                    id="account"
                                                    name="username"
                                                    type="text"
                                                    placeholder="Vui lòng nhập tên tài khoản"
                                                    required
                                                />
                                            </div>
                                            <div className="grid gap-2" id="login">
                                                <Label htmlFor="password">Password</Label>
                                                <Input
                                                    name="password"
                                                    id="password"
                                                    type="password"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </form>
                                </CardContent>
                                <CardFooter className="flex-col gap-2">
                                    <Button
                                        form="login-form"
                                        type="submit"
                                        className="cursor-pointer w-full"
                                    >
                                        Đăng nhập
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}
                        {/* Đăng ký */}
                        {authTab == "register" && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Đăng ký</CardTitle>
                                    <CardAction>
                                        <span>Đã có tài khoản?</span>
                                        <Button
                                            onClick={() => {
                                                setAuthTab("login");
                                            }}
                                            className={"cursor-pointer"}
                                            variant="link"
                                        >
                                            Đăng nhập ngay
                                        </Button>
                                    </CardAction>
                                </CardHeader>
                                <CardContent>
                                    <form id="register-form" onSubmit={handleRegister}>
                                        <div className="flex flex-col gap-6">
                                            <div className="grid gap-2">
                                                <Label htmlFor="account">Tài khoản</Label>
                                                <Input
                                                    name="username"
                                                    id="account"
                                                    type="text"
                                                    placeholder="Vui lòng nhập tên tài khoản"
                                                    required
                                                />
                                            </div>
                                            <div className="grid gap-2" id="login">
                                                <Label htmlFor="password">Password</Label>
                                                <Input
                                                    name="password"
                                                    id="password"
                                                    type="password"
                                                    required
                                                />
                                            </div>
                                            <div className="grid gap-2" id="login">
                                                <Label htmlFor="re-password">
                                                    Nhập lại password
                                                </Label>
                                                <Input
                                                    name="repassword"
                                                    id="repassword"
                                                    type="password"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </form>
                                </CardContent>
                                <CardFooter className="flex-col gap-2">
                                    <Button
                                        form="register-form"
                                        type="submit"
                                        className="cursor-pointer w-full"
                                    >
                                        Đăng ký
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
