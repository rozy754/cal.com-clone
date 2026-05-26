import "./globals.css"; // CRITICAL: This line wakes up Tailwind CSS layout variables!
import { Metadata } from "next";

// ✅ FIXED METADATA: Stripped out the literal "public/" string mapping paths
export const metadata: Metadata = {
  title: "Cal.com | Open Source Scheduling",
  description: "The open-source Calendly alternative. Style it your way from scratch.",
  icons: {
    icon: [
      { url: "/favicon.ico" }, // Default standard fallback
      { url: "/icon.png", type: "image/png", sizes: "32x32" } // ✅ FIXED: Changed "public/icon.png" to "/icon.png"
    ],
    apple: [
      { url: "/icon.png", sizes: "180x180", type: "image/png" } // ✅ FIXED: Changed "public/icon.png" to "/icon.png"
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full dark">
      <body className="min-h-full bg-[#101010] antialiased text-white">
        {children}
      </body>
    </html>
  );
}