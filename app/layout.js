import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";
import { AuthProvider } from "../contexts/AuthContext";

const inter = Inter({
  subsets: ['latin'],
  variable: "--font-inter-sans",
});

export const metadata = {
  title: "AI-Notes - Your Smart Note Taking Assistant",
  description: "Store your memories, important points, and more in a user-friendly way with AI-Notes",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased transition-colors duration-200`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
