import DashboardLayout from "./DashboardLayout";
import ChatbotWidget from "../ChatbotWidget";
import { LayoutDashboard, Stethoscope, FileText, UserIcon, ClipboardList, Calendar, Users, MapPin, Video } from "lucide-react";

const PatientDashboardLayout = () => {
  const patientMenuItems = [
    { label: "Dashboard", path: "/patient", icon: LayoutDashboard, color: "text-blue-600", end: true },
    { label: "My Tests", path: "/patient/tests", icon: Stethoscope, color: "text-emerald-600" },
    { label: "Appointments", path: "/patient/appointments", icon: Calendar, color: "text-cyan-600" },
    { label: "Centers", path: "/patient/practitioners", icon: MapPin, color: "text-rose-600" },
    { label: "Doctors", path: "/patient/doctors", icon: Users, color: "text-indigo-600" },
    { label: "Consultations", path: "/patient/consultations", icon: Video, color: "text-red-600" },
    { label: "Referrals", path: "/patient/referrals", icon: FileText, color: "text-orange-600" },
    { label: "Medical History", path: "/patient/medical-history", icon: ClipboardList, color: "text-purple-600" },
    { label: "Profile", path: "/patient/profile", icon: UserIcon, color: "text-pink-600" },
  ];

  return (
    <>
      <DashboardLayout portalName="Patient Portal" menuItems={patientMenuItems} />
      <ChatbotWidget />
    </>
  );
};

export default PatientDashboardLayout;