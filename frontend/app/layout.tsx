import type { Metadata } from "next";
import { ThemeProvider } from "./providers";
import "./globals.css";
import "sweetalert2/dist/sweetalert2.min.css";

export const metadata: Metadata = {
  title: "GizmoHub | Gadget & Aksesori Pilihan",
  description: "Temukan gadget dan aksesori pilihan di GizmoHub.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
