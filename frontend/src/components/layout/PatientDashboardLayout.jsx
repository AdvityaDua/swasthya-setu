import DashboardLayout from "./DashboardLayout";
import { LayoutDashboard, Stethoscope, FileText, UserIcon } from "lucide-react";

const PatientDashboardLayout = () => {
  const patientMenuItems = [
    { label: "Dashboard", path: "/patient", icon: LayoutDashboard, color: "text-blue-600", end: true,},
    { label: "My Tests", path: "/patient/tests", icon: Stethoscope, color: "text-emerald-600" },
    { label: "Referrals", path: "/patient/referrals", icon: FileText, color: "text-orange-600" },
    { label: "Profile", path: "/patient/profile", icon: UserIcon, color: "text-pink-600" },
  ];

  return (
    <DashboardLayout portalName="Patient Portal" menuItems={patientMenuItems} />
  );
};

export default PatientDashboardLayout;
