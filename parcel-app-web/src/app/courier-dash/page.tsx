import ProtectedRoutePlaceholder from "@/components/ProtectedRoutePlaceholder";

export default function CourierDashboardPage() {
  return (
    <ProtectedRoutePlaceholder
      requiredRole="courier"
      title="Courier Dashboard"
      description="Courier dispatch, deals, and transaction modules will be migrated in the next stage."
    />
  );
}
