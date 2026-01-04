
export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-muted py-16 md:py-24 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <img
                src="/home/emblem.png"
                height="40px"
                width="80px"
                query="Government of India Emblem"
                className="rounded-none border-none bg-transparent"
              />
              <span className="text-2xl font-bold text-primary tracking-tight">Swasthya-Setu</span>
            </div>
            <p className="text-muted-foreground max-w-sm leading-relaxed">
              Powered by Government of India (placeholder). A national initiative to digitize healthcare while
              maintaining the highest standards of clinical safety.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="font-bold uppercase text-xs tracking-widest text-foreground">Government Links</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <span className="hover:text-primary cursor-pointer transition-colors">Ministry of Health</span>
              <span className="hover:text-primary cursor-pointer transition-colors">Digital India</span>
              <span className="hover:text-primary cursor-pointer transition-colors">Ayushman Bharat (PM-JAY)</span>
              <span className="hover:text-primary cursor-pointer transition-colors">National Health Authority</span>
            </nav>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="font-bold uppercase text-xs tracking-widest text-foreground">Support</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <span className="hover:text-primary cursor-pointer transition-colors">Help Desk</span>
              <span className="hover:text-primary cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-primary cursor-pointer transition-colors">Terms of Service</span>
              <span className="hover:text-primary cursor-pointer transition-colors">Contact Us</span>
            </nav>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">
          <p>© {currentYear} Swasthya-Setu. All rights reserved.</p>
          <div className="flex gap-8">
            <span>Official Government Portal</span>
            <span>Made with Digital India</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
