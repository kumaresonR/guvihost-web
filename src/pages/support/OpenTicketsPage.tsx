import { StaffTicketsTablePage } from "@/pages/support/StaffTicketsTablePage";

export default function OpenTicketsPage() {
  return (
    <StaffTicketsTablePage
      title="Open Tickets"
      description="Tickets awaiting assignment or initial response."
      fixedStatus="OPEN"
    />
  );
}
