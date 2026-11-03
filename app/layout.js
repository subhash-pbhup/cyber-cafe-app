import "./globals.css";
import LayoutWrapper from "./LayoutWrapper"; // Naya wrapper import kiya

export const metadata = {
  title: "CyberCafe Admin",
  description: "Secure Cyber Cafe Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Wrapper check karega ki login page dikhana hai ya dashboard */}
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
