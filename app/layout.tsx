import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { constructMetadata } from "@/lib/constructMetadata";
import { Providers } from "@/components/providers";

export const metadata = constructMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <Providers>
          <div className="bg-background min-h-screen">
            <main>{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
