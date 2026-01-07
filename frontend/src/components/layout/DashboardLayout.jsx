import { Outlet, NavLink } from "react-router-dom"
import { Button } from "../ui/button"
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet"
import { Menu, LayoutDashboard, Stethoscope, FileText, UserIcon, Loader2, LogOut } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { logout as logoutAction } from "../../app/slices/userSlice"
import { useNavigate } from "react-router-dom"
import { useLogoutMutation } from "../../app/api/userApiSlice"
import { cn } from "@/lib/utils"

const DashboardLayout = ({ portalName, menuItems }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [logout, { isLoading }] = useLogoutMutation()
  const user = useSelector((state) => state.user)

  const handleLogout = async () => {
    try {
      await logout().unwrap()
      dispatch(logoutAction())
      navigate("/login")
    } catch (err) {
      console.error("Logout failed:", err)
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-900 selection:bg-primary/10">
      {/* Sidebar - Transitioned to a clean light theme */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-200 bg-white/80 backdrop-blur-xl sm:flex">
        <div className="flex h-20 items-center px-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/10">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">Swasthya Setu</h1>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {menuItems.map((item) => (
            <NavLink to={item.path} key={item.label} end={item.end}>
            {({ isActive }) => (
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 px-3 py-6 text-slate-500 hover:text-primary hover:bg-slate-50 transition-all group relative overflow-hidden",
                  isActive && "font-bold text-primary bg-slate-50"
                )}
              >
                <div
                  className={cn(
                    "p-1.5 rounded-md bg-slate-100 group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-200",
                    item.color
                  )}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                </div>
          
                <span className="font-medium">{item.label}</span>
          
                <div
                  className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-primary rounded-r-full transition-all duration-300",
                    isActive ? "h-6" : "h-0"
                  )}
                />
              </Button>
            )}
          </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3 px-2 py-3 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
              <UserIcon className="h-5 w-5 text-slate-500" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate text-slate-900">{user.fullName || "User"}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{portalName}</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col sm:pl-64">
        {/* Header - Clean & Integrated */}
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-slate-200 bg-white/60 backdrop-blur-md px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" className="sm:hidden text-slate-600">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-white border-r border-slate-200 p-0">
              <div className="p-6 border-b border-slate-100">
                <h1 className="text-xl font-bold text-slate-900">Swasthya Setu</h1>
              </div>
              <nav className="p-4 space-y-2">
                {menuItems.map((item) => (
                  <Button key={item.label} variant="ghost" className="w-full justify-start gap-3 py-6 text-slate-600">
                    {item.icon && <item.icon className={cn("h-5 w-5", item.color)} />}
                    {item.label}
                  </Button>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <div className="flex flex-col">
            <h2 className="text-xs font-medium text-slate-400">Welcome back,</h2>
            <h1 className="text-xl font-bold text-slate-900 leading-none mt-1">{user.fullName}</h1>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Button
              variant="outline"
              className="border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all gap-2 bg-white"
              onClick={handleLogout}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Outlet />
          </div>
        </main>

        {/* Footer - Subtle and institutional */}
        <footer className="mt-auto border-t border-slate-200 bg-white/40 py-8 px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto opacity-60 hover:opacity-100 transition-opacity">
            <p className="text-xs font-medium tracking-wide text-slate-500">
              © 2026 SWASTHYA-SETU • DIGITAL HEALTH MISSION
            </p>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Powered by Government of India
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default DashboardLayout
