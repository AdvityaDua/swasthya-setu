import { Button } from "@/components/ui/button"
import { NavLink } from 'react-router-dom'
export default function Header() {
  return (
    <header className="w-full border-b border-border bg-background sticky top-0 z-50">
      {/* Government of India Top Bar */}
      <div className="bg-[#f8f9fa] py-1 border-b border-border">
        <div className="container mx-auto px-4 flex justify-between items-center text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span>Government of India</span>
          </div>
          <div className="flex gap-4">
            <span>Skip to main content</span>
            <span>Language: English</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="container mx-auto px-4 py-3 md:py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          {/* PLACEHOLDER: Government of India Logo */}
          <img
            src="/home/emblem.png"
            height="50px"
            width="100px"
            alt="Government of India Emblem"
            className="rounded-none border-none bg-transparent"
          />
          <NavLink to='/'>
          <div className="flex flex-col border-l border-border pl-4">
            <span className="text-xl md:text-2xl font-bold text-primary tracking-tight">Swasthya-Setu</span>
            <span className="text-[10px] md:text-xs text-muted-foreground font-medium uppercase tracking-widest">
              Healthcare Portal
            </span>
          </div>
          </NavLink>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#howItWorks">
            <button className="hover:text-primary transition-colors cursor-pointer">How it Works?</button>
          </a>
          <a href="#whyChoose">
            <button className="hover:text-primary transition-colors cursor-pointer">Why Choose?</button>
          </a>
          <button className="hover:text-primary transition-colors cursor-pointer">Resources</button>
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <NavLink to="/login">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                Login
            </Button>
          </NavLink>
          <NavLink to="/register">
            <Button size="sm">
                Register
            </Button>
          </NavLink>
        </div>
      </div>
    </header>
  )
}
