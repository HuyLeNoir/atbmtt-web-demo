import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

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
        <html lang="en" className={`${inter.variable} h-full antialiased`}>
            <body className="min-h-full flex flex-col bg-background">
                {children}
                <Toaster position="top-right" richColors />
            </body>
        </html>
    );
}
