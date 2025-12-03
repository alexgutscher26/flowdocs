import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { constructMetadata } from "@/lib/constructMetadata";
import { Providers } from "@/components/providers";
import { ConsentManager } from "./consent-manager";
import { UserJotWidget } from "@/components/userjot-widget";

export const metadata = constructMetadata();

/**
 * Renders the root layout of the application with children components.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <ConsentManager>
          <Providers>
            <div className="bg-background min-h-screen">
              <main>{children}</main>
            </div>
          </Providers>
        </ConsentManager>
        <UserJotWidget />
      </body>
    </html>
  );
}
