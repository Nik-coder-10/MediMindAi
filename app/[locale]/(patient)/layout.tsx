export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Patient PHR Portal</h2>
          <p className="text-sm text-muted-foreground">Manage personal health records, consent requests, and Ayush e-prescriptions.</p>
        </div>
      </div>
      {children}
    </div>
  );
}
