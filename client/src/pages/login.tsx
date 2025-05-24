import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { LoginForm } from "@/components/login-form";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Login() {
  const [, navigate] = useLocation();
  
  // Check if user is already logged in
  const { data, isSuccess } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
    staleTime: 0,
  });
  
  useEffect(() => {
    if (isSuccess && data) {
      navigate('/dashboard');
    }
  }, [isSuccess, data, navigate]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <LoginForm />
    </div>
  );
}
