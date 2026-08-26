export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ayush Clinical Consultation Desk</h2>
          <p className="text-sm text-muted-foreground">Comprehensive Ayush Case-Taking, Ashtavidha/Dashavidha Pariksha, and AI Clinical Assistant.</p>
        </div>
      </div>
      {children}
    </div>
  );
}
