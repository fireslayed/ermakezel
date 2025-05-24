import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SidebarNav } from "@/components/sidebar-nav";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Map } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location, navigate] = useLocation();
  
  // Check if user is logged in
  const { isError } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
  });
  
  useEffect(() => {
    if (isError) {
      navigate('/login');
    }
  }, [isError, navigate]);
  
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[280px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-sidebar dark:bg-sidebar md:block">
        <SidebarNav />
      </div>
      <div className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
          <div className="flex flex-1 items-center justify-end space-x-4">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              asChild
            >
              <Link href="/location-report">
                <Map className="h-4 w-4 mr-1" />
                Yer Bildirimi Yap
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
