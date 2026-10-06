/*
|--------------------------------------------------
| npm imports
|--------------------------------------------------
*/
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

/*
|--------------------------------------------------
| custom imports
|--------------------------------------------------
*/
import "./globals.css";

/*
|--------------------------------------------------
| constants
|--------------------------------------------------
*/
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/*
|--------------------------------------------------
| metadata
|--------------------------------------------------
*/
export const metadata: Metadata = {
  title: "Bootcamp LMS",
  description: "Modern, minimal Bootcamp Learning Management System",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: "/apple-icon.png",
  },
};

/*
|--------------------------------------------------
| types
|--------------------------------------------------
*/
interface RootLayoutProps {
  children: React.ReactNode;
}

/*
|----------------------------------------------------------------------------------------------------
| RootLayout
|----------------------------------------------------------------------------------------------------
| Root layout wrapping the entire application.
| Configures typography, base CSS styling, and global HTML metadata.
*/
export default function RootLayout({
  children,
}: RootLayoutProps) {
  /*
  |--------------------------------------------------
  | return
  |--------------------------------------------------
  */
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#F7F4ED] text-[#171717]">
        {children}
      </body>
    </html>
  );
}
