import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./lib/auth-context";

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Synthesis",
  description: "Write and think clearly.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${monoFont.variable} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
