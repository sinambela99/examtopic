import './globals.css';

export const metadata = {
  title: 'ExamHub',
  description: 'Browse and study ExamTopics exam questions with discussions and voting stats.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
