import { AdminEmptyState } from "@/components/admin/empty-state";

export default async function AdminPage() {
  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-8">
      <AdminEmptyState />
    </div>
  );
}
