import DashboardLayout from "./DashboardLayout";
import { LayoutDashboard, Search, FilePlus, Microscope, UserIcon } from "lucide-react";

const PractitionerDashboardLayout = () => {
  const practitionerMenuItems = [
    { label: "Dashboard", path: "/practitioner", icon: LayoutDashboard, color: "text-blue-600", end: true },
    { label: "Patient Lookup", path: "/practitioner/patient-lookup", icon: Search, color: "text-purple-600" },
    { label: "Create Test", path: "/practitioner/create-test", icon: FilePlus, color: "text-emerald-600" },
    { label: "Active Tests", path: "/practitioner/active-tests", icon: Microscope, color: "text-orange-600" },
    { label: "Profile", path: "/practitioner/profile", icon: UserIcon, color: "text-pink-600" },
  ];

  return (
    <DashboardLayout portalName="Practitioner Portal" menuItems={practitionerMenuItems} />
  );
};

export default PractitionerDashboardLayout;

