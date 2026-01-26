import DashboardLayout from "./DashboardLayout";
import { LayoutDashboard, Stethoscope, FileText, UserIcon } from "lucide-react";

const PatientDashboardLayout = () => {
  const doctorMenuItems = [
    { label: "Dashboard", path: "/doctor", icon: LayoutDashboard, color: "text-blue-600", end: true,},
    
  ];

  return (
    <DashboardLayout portalName="Doctor Portal" menuItems={doctorMenuItems} />
  );
};

export default PatientDashboardLayout;
