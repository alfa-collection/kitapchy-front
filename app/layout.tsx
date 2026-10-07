import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/language";

const nunito = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kitapchy — Read English books",
  description: "Read, listen and learn with English books.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><LanguageProvider>{children}</LanguageProvider></body>
    </html>
  );
}
