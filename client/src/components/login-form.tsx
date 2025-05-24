import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginCredentials } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export function LoginForm() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isShaking, setIsShaking] = useState(false);

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "ermak",
      password: "ermak",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      // Formdan gelen verileri JSON olarak ayarla
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Giriş başarısız");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Giriş başarılı",
        description: "ErmakPoint'e hoş geldiniz!",
        variant: "default",
      });
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Giriş başarısız",
        description: error.message || "Geçersiz kullanıcı adı veya parola",
        variant: "destructive",
      });
      
      // Shake effect animation for error
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    },
  });

  function onSubmit(data: LoginCredentials) {
    loginMutation.mutate(data);
  }

  return (
    <Card className={`w-full max-w-md ${isShaking ? "animate-shake" : ""}`}>
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-2">
          <Sparkles size={40} className="text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">ErmakPoint Pro</CardTitle>
        <CardDescription>Giriş yapmak için bilgilerinizi girin</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kullanıcı Adı</FormLabel>
                  <FormControl>
                    <Input placeholder="Kullanıcı adınızı girin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parola</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Parolanızı girin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Giriş yapılıyor..." : "Giriş Yap"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Demo Bilgileri: kullanıcı adı: ermak | parola: ermak
        </p>
      </CardFooter>
    </Card>
  );
}
