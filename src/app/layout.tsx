import type { Metadata } from "next";
import "./globals.css";
import { PlacesProvider } from "./contexts/PlacesContext";

export const metadata: Metadata = {
  title: "MPP Travel App",
  description: "Travel app for MPP project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="w-full max-w-full">
        <PlacesProvider>
          <main className="w-full max-w-full">
            {children}
          </main>
        </PlacesProvider>
      </body>
    </html>
  );
}
