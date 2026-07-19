"use client"; // Bắt buộc phải có trong Next.js App Router

import React, { createContext, useContext, useState, ReactNode } from "react";
import { AuthData, AuthContextType } from "@/lib/definitions";

// 3. Khởi tạo Context với giá trị mặc định là undefined
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 4. Định nghĩa Provider
export function AuthProvider({ children }: { children: ReactNode }) {
    const [auth, setAuth] = useState<AuthData>({
        id: null,
        username: null,
        decrypt_private_key: null,
    });

    // Hàm tiện ích để đăng nhập / lưu thông tin khóa
    const loginUser = (id: string, username: string, privateKey: string) => {
        setAuth({
            id,
            username,
            decrypt_private_key: privateKey,
        });
    };

    // Hàm tiện ích để đăng xuất / xóa thông tin khóa khỏi bộ nhớ
    const logoutUser = () => {
        setAuth({
            id: null,
            username: null,
            decrypt_private_key: null,
        });
    };

    return (
        <AuthContext.Provider value={{ auth, setAuth, loginUser, logoutUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth phải được sử dụng bên trong AuthProvider");
    }
    return context;
}
