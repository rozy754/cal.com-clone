import "./globals.css"; // CRITICAL: This line wakes up Tailwind CSS layout variables!

export const metadata = {
  title: "Cal.com Clone",
  description: "Built from scratch",
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