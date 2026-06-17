import TypeServicesPageLayout from "./TypeServicesPageLayout";

export default function DedicatedServersPage() {
  return (
    <TypeServicesPageLayout
      title="Dedicated Servers"
      serviceType={null}
      breadcrumb="Dashboard / Services / Dedicated Servers"
      emptyMessage="Dedicated servers are not yet available as a client service type. Contact support for provisioning."
    />
  );
}
