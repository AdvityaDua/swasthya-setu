import DashboardLayout from "./DashboardLayout";
import { LayoutDashboard, Stethoscope, FileText, UserIcon, Video, FileCheck } from "lucide-react";

const PatientDashboardLayout = () => {
  const doctorMenuItems = [
    { label: "Dashboard", path: "/doctor", icon: LayoutDashboard, color: "text-blue-600", end: true, },
    { label: "Pending Referrals", path: "/doctor/referrals", icon: FileText, color: "text-orange-600" },
    { label: "Reviewed Cases", path: "/doctor/reviewed", icon: FileCheck, color: "text-green-600" },
    { label: "Consultations", path: "/doctor/consultations", icon: Video, color: "text-red-600" },
    { label: "Profile", path: "/doctor/profile", icon: UserIcon, color: "text-purple-600" },
  ];

  return (
    <DashboardLayout portalName="Doctor Portal" menuItems={doctorMenuItems} />
  );
};

export default PatientDashboardLayout;