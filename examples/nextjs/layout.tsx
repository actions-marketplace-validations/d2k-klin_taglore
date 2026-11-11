import type { ReactNode } from "react";
import AppWhatsNew from "./whats-new";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <AppWhatsNew />
      </body>
    </html>
  );
}
