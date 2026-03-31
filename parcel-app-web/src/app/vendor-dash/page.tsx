import ProtectedRoutePlaceholder from "@/components/ProtectedRoutePlaceholder";

export default function VendorDashboardPage() {
  return (
    <ProtectedRoutePlaceholder
      requiredRole="vendor"
      title="Vendor Dashboard"
      description="Vendor dashboard tabs and business tools will be ported in Stage 4."
    />
  );
}
