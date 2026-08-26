export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ministry / Institutional Admin Console</h2>
          <p className="text-sm text-muted-foreground">Monitor morbidity patterns, NAMASTE registry codes, and ABDM ecosystem metrics.</p>
        </div>
      </div>
      {children}
    </div>
  );
}
