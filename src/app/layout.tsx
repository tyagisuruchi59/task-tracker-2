import './globals.css';
import 'sweetalert2/dist/sweetalert2.min.css';

export const metadata = {
  title: 'Task Tracker',
  description: 'Mini Task Tracker (Next.js + Node API)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {children}
      </body>
    </html>
  );
}
