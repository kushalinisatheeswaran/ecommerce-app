import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import Navbar from "../components/Navbar";

export const metadata = {
  title: "E-Commerce Application",
  description: "Next.js E-Commerce app integrating with Spring Boot backend",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main style={{ minHeight: 'calc(100vh - 80px)' }}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
