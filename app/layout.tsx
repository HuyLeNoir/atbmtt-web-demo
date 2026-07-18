import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/authcontext";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
});
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <AuthProvider>
            <html lang="en" className={`${inter.variable} h-full antialiased`}>
                <body className="min-h-full flex flex-col bg-background">
                    {children}
                    <Toaster position="top-center" richColors />
                </body>
            </html>
        </AuthProvider>
    );
}
