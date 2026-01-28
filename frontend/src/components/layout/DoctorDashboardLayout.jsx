import DashboardLayout from "./DashboardLayout";
import { LayoutDashboard, Stethoscope, FileText, UserIcon, Video } from "lucide-react";

const PatientDashboardLayout = () => {
  const doctorMenuItems = [
    { label: "Dashboard", path: "/doctor", icon: LayoutDashboard, color: "text-blue-600", end: true,},
    { label: "Consultations", path: "/doctor/consultations", icon: Video, color: "text-red-600" },
  ];

  return (
    <DashboardLayout portalName="Doctor Portal" menuItems={doctorMenuItems} />
  );
};

export default PatientDashboardLayout;