export const metadata = {
  title: "Daily Care Service",
  description: "일일 복약·식사·운동 관리 서비스",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
