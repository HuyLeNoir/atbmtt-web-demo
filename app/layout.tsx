import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

import { Toaster } from "sonner";
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${inter.className} h-full antialiased`}>
            <body className="min-h-full flex flex-col bg-white">
                {children}
                <Toaster
                    position="top-right"
                    richColors
                    toastOptions={{
                        className: inter.className,
                    }}
                />
            </body>
        </html>
    );
}
