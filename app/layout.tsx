import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Uplift - AI Agents Platform",
  description: "Install. Plug. Run. Run your AI Agents in a secured Environment and connect them with your Agentic Vault.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-white">
        {children}
      </body>
    </html>
  );
}
