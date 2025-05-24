import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  CheckSquare,
  Folder,
  Settings,
  LogOut,
  Sparkles,
  User,
  Map,
} from "lucide-react";

interface SidebarNavProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarNav({ className, ...props }: SidebarNavProps) {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
  });
  
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      navigate("/login");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to log out",
        variant: "destructive",
      });
    }
  });
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const navItems = [
    {
      title: "Gösterge Paneli",
      href: "/dashboard",
      icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
    },
    {
      title: "Görevler",
      href: "/tasks",
      icon: <CheckSquare className="mr-2 h-4 w-4" />,
    },
    {
      title: "Projeler",
      href: "/projects",
      icon: <Folder className="mr-2 h-4 w-4" />,
    },
    {
      title: "Plan",
      href: "/plan",
      icon: <Map className="mr-2 h-4 w-4" />,
    },
    {
      title: "Ayarlar",
      href: "/settings",
      icon: <Settings className="mr-2 h-4 w-4" />,
    },
  ];

  return (
    <div className={cn("pb-12", className)} {...props}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <div className="flex items-center mb-8">
            <Sparkles className="h-6 w-6 text-primary mr-2" />
            <h2 className="text-lg font-semibold tracking-tight">ErmakPlan Beta v2</h2>
          </div>
          
          <div className="mb-8 flex items-center gap-2">
            <div className="rounded-full bg-primary/10 p-1">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">
                {isLoading ? "Loading..." : user?.username || "Guest"}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.fullName || "User"}
              </p>
            </div>
          </div>
          
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-1">
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  variant={location === item.href ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={item.href}>
                    {item.icon}
                    {item.title}
                  </Link>
                </Button>
              ))}
            </div>
          </ScrollArea>
          
          <div className="mt-6">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-muted-foreground"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {logoutMutation.isPending ? "Çıkış yapılıyor..." : "Çıkış Yap"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
