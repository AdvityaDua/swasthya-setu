import React from "react";
import { Outlet } from "react-router-dom";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Menu, User, LayoutDashboard, Stethoscope, History, FileText, UserIcon, Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logout as logoutAction } from "../../app/slices/userSlice";
import { useNavigate } from "react-router-dom"; 
import { useLogoutMutation } from "../../app/api/userApiSlice";
const PatientDashboardLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logout, {isLoading}] = useLogoutMutation()
  const user = useSelector((state) => state.user);
  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "My Tests", icon: Stethoscope },
    { name: "Test History", icon: History },
    { name: "Referrals", icon: FileText },
    { name: "Profile", icon: UserIcon },
  ];

   const handleLogout = async () => {
     try {
       await logout().unwrap();
       dispatch(logoutAction());
       navigate("/login");
     } catch (err) {
       console.error("Logout failed:", err);
       // Optionally display an error message to the user
     }
   }
 
   return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
        <div className="flex h-16 items-center border-b items-center justify-center">
          <h1 className="text-xl font-semibold">Swasthya Setu</h1>
        </div>
        <nav className="flex flex-col gap-2 p-4">
          {menuItems.map((item) => (
            <Button
              key={item.name}
              variant="ghost"
              className="w-full justify-start gap-2"
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Button>
          ))}
        </nav>
      </aside>

      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <nav className="grid gap-6 text-lg font-medium">
                <h1 className="text-xl font-semibold">Swasthya Setu</h1>
                {menuItems.map((item) => (
                  <Button
                    key={item.name}
                    variant="ghost"
                    className="w-full justify-start gap-2"
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Button>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <h1 className="text-xl font-semibold">Welcome, {user.fullName}</h1>
          <div className="relative ml-auto flex-1 md:grow-0"></div>
           <Button variant="secondary" className="gap-1" onClick={handleLogout} disabled={isLoading}>
             {isLoading ? (
               <>
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 Logging out...
               </>
             ) : (
               <>
                 <User className="h-4 w-4" />
                 Logout
               </>
             )}
           </Button>
        </header>

        {/* Main Content (Outlet) */}
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t p-4 text-center text-sm text-muted-foreground sm:px-6">
          © Swasthya-Setu | Powered by Government of India
        </footer>
      </div>
    </div>
  );
};

export default PatientDashboardLayout;
