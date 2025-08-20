import "./globals.css";

export const metadata = {
  title: "Echo by PathAIde | AI Mock Interviews",
  description: "Master interviews with AI-powered practice sessions"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}