import ProtectedRoutePlaceholder from "@/components/ProtectedRoutePlaceholder";

export default function CustomerDashboardPage() {
  return (
    <ProtectedRoutePlaceholder
      requiredRole="customer"
      title="Customer Dashboard"
      description="Customer orders, cart management, and notifications will be implemented in Stage 4."
    />
  );
}
