import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Users, 
  ShieldCheck, 
  Languages, 
  Mail, 
  Database, 
  Bell, 
  Lock, 
  Link, 
  Info,
  Plus,
  Trash2,
  RefreshCw,
  Save,
  FileEdit as FileEditIcon
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("users");
  
  // Demo kullanıcıları
  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: ['/api/users'],
  });
  
  const handleResetDemoData = () => {
    toast({
      title: "Demo verileri sıfırlandı",
      description: "Tüm demo verileri varsayılan değerlere sıfırlandı",
    });
  };
  
  const backupFormSchema = z.object({
    backupFrequency: z.string(),
    backupLocation: z.string().min(1, "Yedekleme konumu gereklidir"),
  });
  
  const backupForm = useForm({
    resolver: zodResolver(backupFormSchema),
    defaultValues: {
      backupFrequency: "daily",
      backupLocation: "/backups",
    },
  });
  
  const mailFormSchema = z.object({
    smtpServer: z.string().min(1, "SMTP sunucusu gereklidir"),
    smtpPort: z.string().min(1, "Port gereklidir"),
    username: z.string().min(1, "Kullanıcı adı gereklidir"),
    password: z.string().min(1, "Şifre gereklidir"),
    fromEmail: z.string().email("Geçerli bir e-posta adresi giriniz"),
    useSsl: z.boolean().default(true),
  });
  
  const mailForm = useForm({
    resolver: zodResolver(mailFormSchema),
    defaultValues: {
      smtpServer: "",
      smtpPort: "587",
      username: "",
      password: "",
      fromEmail: "",
      useSsl: true,
    },
  });
  
  const sendTestEmail = () => {
    toast({
      title: "Test e-postası gönderildi",
      description: "Lütfen gelen kutunuzu kontrol edin",
    });
  };
  
  // Kullanıcı yönetimi için form
  const userFormSchema = z.object({
    username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalıdır"),
    fullName: z.string().min(2, "Ad soyad en az 2 karakter olmalıdır"),
    email: z.string().email("Geçerli bir e-posta adresi giriniz"),
    role: z.string(),
    isActive: z.boolean().default(true),
  });
  
  const userForm = useForm({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      role: "operator",
      isActive: true,
    },
  });
  
  const createUser = (data) => {
    toast({
      title: "Kullanıcı oluşturuldu",
      description: `${data.fullName} kullanıcısı başarıyla oluşturuldu`,
    });
    userForm.reset();
  };
  
  // Rol yetkileri için ayarlar
  const [selectedRole, setSelectedRole] = useState("admin");
  
  const permissionsList = [
    { id: "uploadImage", label: "Resim yükleme", defaultRoles: ["root", "admin", "technician"] },
    { id: "addPoint", label: "Artı işareti ekleme", defaultRoles: ["root", "admin", "technician", "operator"] },
    { id: "editNotes", label: "Not yazma/düzenleme/silme", defaultRoles: ["root", "admin", "technician"] },
    { id: "viewReports", label: "Rapor görme", defaultRoles: ["root", "admin", "technician"] },
    { id: "changeSettings", label: "Ayarları değiştirme", defaultRoles: ["root", "admin"] },
    { id: "requestParts", label: "Parça isteği gönderme", defaultRoles: ["root", "admin", "technician"] },
    { id: "manageUsers", label: "Kullanıcı yönetme", defaultRoles: ["root", "admin"] },
    { id: "backup", label: "Yedekleme yapma", defaultRoles: ["root", "admin"] },
  ];
  
  const getRolePermissions = (role) => {
    return permissionsList.filter(perm => perm.defaultRoles.includes(role));
  };
  
  const [rolePermissions, setRolePermissions] = useState(getRolePermissions(selectedRole));
  
  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setRolePermissions(getRolePermissions(role));
  };
  
  const togglePermission = (permId) => {
    setRolePermissions(prev => {
      if (prev.some(p => p.id === permId)) {
        return prev.filter(p => p.id !== permId);
      } else {
        const perm = permissionsList.find(p => p.id === permId);
        return [...prev, perm];
      }
    });
  };
  
  const saveRolePermissions = () => {
    toast({
      title: "Yetkiler kaydedildi",
      description: `${selectedRole} rolü için yetkiler başarıyla güncellendi`,
    });
  };
  
  return (
    <div className="flex-1 p-0">
      <div className="flex flex-col md:flex-row h-full">
        {/* Yan Menü */}
        <div className="w-full md:w-64 shrink-0 border-r bg-background">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Ayarlar</h2>
            <p className="text-sm text-muted-foreground mt-1">Sistem yapılandırmasını yönetin</p>
          </div>
          <nav className="p-2">
            <div className="space-y-1">
              <Button 
                variant={activeTab === "users" ? "secondary" : "ghost"} 
                className={`w-full justify-start text-sm ${activeTab === "users" ? "font-medium" : ""}`}
                onClick={() => setActiveTab("users")}
              >
                <Users className="h-4 w-4 mr-2" />
                Kullanıcı Yönetimi
              </Button>
              <Button 
                variant={activeTab === "permissions" ? "secondary" : "ghost"} 
                className={`w-full justify-start text-sm ${activeTab === "permissions" ? "font-medium" : ""}`}
                onClick={() => setActiveTab("permissions")}
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                Yetki Ayarları
              </Button>
              <Button 
                variant={activeTab === "language" ? "secondary" : "ghost"} 
                className={`w-full justify-start text-sm ${activeTab === "language" ? "font-medium" : ""}`}
                onClick={() => setActiveTab("language")}
              >
                <Languages className="h-4 w-4 mr-2" />
                Dil ve Tema
              </Button>
              <Button 
                variant={activeTab === "mail" ? "secondary" : "ghost"} 
                className={`w-full justify-start text-sm ${activeTab === "mail" ? "font-medium" : ""}`}
                onClick={() => setActiveTab("mail")}
              >
                <Mail className="h-4 w-4 mr-2" />
                Mail Ayarları
              </Button>
              <Button 
                variant={activeTab === "backup" ? "secondary" : "ghost"} 
                className={`w-full justify-start text-sm ${activeTab === "backup" ? "font-medium" : ""}`}
                onClick={() => setActiveTab("backup")}
              >
                <Database className="h-4 w-4 mr-2" />
                Veri ve Yedekleme
              </Button>
              <Button 
                variant={activeTab === "notifications" ? "secondary" : "ghost"} 
                className={`w-full justify-start text-sm ${activeTab === "notifications" ? "font-medium" : ""}`}
                onClick={() => setActiveTab("notifications")}
              >
                <Bell className="h-4 w-4 mr-2" />
                Bildirim Ayarları
              </Button>
              <Button 
                variant={activeTab === "security" ? "secondary" : "ghost"} 
                className={`w-full justify-start text-sm ${activeTab === "security" ? "font-medium" : ""}`}
                onClick={() => setActiveTab("security")}
              >
                <Lock className="h-4 w-4 mr-2" />
                Güvenlik
              </Button>
              <Button 
                variant={activeTab === "api" ? "secondary" : "ghost"} 
                className={`w-full justify-start text-sm ${activeTab === "api" ? "font-medium" : ""}`}
                onClick={() => setActiveTab("api")}
              >
                <Link className="h-4 w-4 mr-2" />
                API Ayarları
              </Button>
              <Button 
                variant={activeTab === "about" ? "secondary" : "ghost"} 
                className={`w-full justify-start text-sm ${activeTab === "about" ? "font-medium" : ""}`}
                onClick={() => setActiveTab("about")}
              >
                <Info className="h-4 w-4 mr-2" />
                Hakkında
              </Button>
            </div>
          </nav>
        </div>
        
        {/* İçerik Alanı */}
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
              {/* 1. Kullanıcı Yönetimi */}
              <TabsContent value="users">
                <div>
                  <h1 className="text-2xl font-bold mb-6">Kullanıcı Yönetimi</h1>
                  <p className="text-muted-foreground mb-8">Kullanıcıların bilgilerini düzenleyin ve yeni kullanıcılar ekleyin.</p>
                  
                  <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                    <Card className="lg:col-span-2 shadow-sm border-0 bg-card">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-lg font-medium">Kullanıcı Listesi</CardTitle>
                            <CardDescription className="mt-1">
                              Sisteme kayıtlı kullanıcıları yönetin
                            </CardDescription>
                          </div>
                          <Button variant="outline" size="sm" className="h-8 gap-1">
                            <RefreshCw className="h-3.5 w-3.5" /> Yenile
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border overflow-hidden">
                          <Table>
                            <TableHeader className="bg-muted/50">
                              <TableRow>
                                <TableHead className="py-2">Kullanıcı Adı</TableHead>
                                <TableHead>Ad Soyad</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead>Son Giriş</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead>İşlemler</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {!isUsersLoading && users && users.map((user) => (
                                <TableRow key={user.id} className="hover:bg-muted/30">
                                  <TableCell className="font-medium">{user.username}</TableCell>
                                  <TableCell>{user.fullName}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="capitalize">
                                      {user.role || "Operatör"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground text-sm">{new Date().toLocaleDateString()}</TableCell>
                                  <TableCell>
                                    <Badge variant={user.isActive ? "success" : "destructive"} className="bg-opacity-10">
                                      {user.isActive ? "Aktif" : "Pasif"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Düzenle">
                                        <FileEditIcon className="h-3.5 w-3.5" />
                                      </Button>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" title="Sil">
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Kullanıcıyı Sil</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>İptal</AlertDialogCancel>
                                            <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
                                              Sil
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="shadow-sm border-0 bg-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-medium">Kullanıcı Ekle</CardTitle>
                        <CardDescription className="mt-1">
                          Sisteme yeni bir kullanıcı ekleyin
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Form {...userForm}>
                          <form onSubmit={userForm.handleSubmit(createUser)} className="space-y-4">
                            <FormField
                              control={userForm.control}
                              name="username"
                              render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FormLabel className="text-xs font-medium">Kullanıcı Adı</FormLabel>
                                  <FormControl>
                                    <Input placeholder="kullanici123" className="h-9" {...field} />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={userForm.control}
                              name="fullName"
                              render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FormLabel className="text-xs font-medium">Ad Soyad</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Ahmet Yılmaz" className="h-9" {...field} />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={userForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FormLabel className="text-xs font-medium">E-posta</FormLabel>
                                  <FormControl>
                                    <Input placeholder="ahmet@sirket.com" className="h-9" {...field} />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={userForm.control}
                              name="role"
                              render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FormLabel className="text-xs font-medium">Rol</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="h-9">
                                        <SelectValue placeholder="Rol seçin" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="root">Root</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                      <SelectItem value="technician">Teknisyen</SelectItem>
                                      <SelectItem value="operator">Operatör</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={userForm.control}
                              name="isActive"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mt-6">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-sm">Aktif</FormLabel>
                                    <FormDescription className="text-xs">
                                      Kullanıcı sisteme giriş yapabilir
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <Button type="submit" className="w-full mt-6">
                              <Plus className="mr-2 h-4 w-4" /> Kullanıcı Ekle
                            </Button>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              {/* 2. Yetki Ayarları */}
              <TabsContent value="permissions">
                <div>
                  <h1 className="text-2xl font-bold mb-6">Yetki Ayarları</h1>
                  <p className="text-muted-foreground mb-8">Kullanıcı rollerine göre yetkileri yapılandırın.</p>
                  
                  <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                    <Card className="shadow-sm border-0">
                      <CardHeader>
                        <CardTitle className="text-lg font-medium">Rol Seçimi</CardTitle>
                        <CardDescription>
                          Yetkilendirmek istediğiniz rolü seçin
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          {["root", "admin", "technician", "operator"].map(role => (
                            <Button
                              key={role}
                              variant={selectedRole === role ? "default" : "outline"}
                              className="w-full justify-start text-sm capitalize"
                              onClick={() => handleRoleChange(role)}
                            >
                              {role === "root" && <ShieldCheck className="h-4 w-4 mr-2" />}
                              {role === "admin" && <Users className="h-4 w-4 mr-2" />}
                              {role === "technician" && <Database className="h-4 w-4 mr-2" />}
                              {role === "operator" && <Info className="h-4 w-4 mr-2" />}
                              {role} Rolü
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="lg:col-span-2 shadow-sm border-0">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-lg font-medium capitalize">{selectedRole} Rol Yetkileri</CardTitle>
                            <CardDescription>
                              Bu role atanmış yetkileri yönetin
                            </CardDescription>
                          </div>
                          <Button 
                            onClick={saveRolePermissions} 
                            variant="default" 
                            size="sm"
                            className="gap-1"
                          >
                            <Save className="h-4 w-4" /> Kaydet
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="rounded-md border divide-y">
                            {permissionsList.map(perm => (
                              <div key={perm.id} className="flex items-center justify-between p-3">
                                <div>
                                  <p className="font-medium text-sm">{perm.label}</p>
                                  <p className="text-muted-foreground text-xs">{perm.id}</p>
                                </div>
                                <Switch
                                  checked={rolePermissions.some(p => p.id === perm.id)}
                                  onCheckedChange={() => togglePermission(perm.id)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              {/* 3. Dil ve Tema */}
              <TabsContent value="language">
                <div>
                  <h1 className="text-2xl font-bold mb-6">Dil ve Tema Ayarları</h1>
                  <p className="text-muted-foreground mb-8">Uygulama dilini ve görünümünü özelleştirin.</p>
                  
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    <Card className="shadow-sm border-0">
                      <CardHeader>
                        <CardTitle className="text-lg font-medium">Dil Seçimi</CardTitle>
                        <CardDescription>
                          Arayüz dilini değiştirin
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Sistem Dili</Label>
                          <Select defaultValue="tr">
                            <SelectTrigger>
                              <SelectValue placeholder="Dil seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tr">Türkçe</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2 pt-4">
                          <Label>Tarih Formatı</Label>
                          <Select defaultValue="dd.MM.yyyy">
                            <SelectTrigger>
                              <SelectValue placeholder="Format seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="dd.MM.yyyy">31.12.2023</SelectItem>
                              <SelectItem value="MM/dd/yyyy">12/31/2023</SelectItem>
                              <SelectItem value="yyyy-MM-dd">2023-12-31</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="shadow-sm border-0">
                      <CardHeader>
                        <CardTitle className="text-lg font-medium">Tema Ayarları</CardTitle>
                        <CardDescription>
                          Arayüz temasını ve görünümünü özelleştirin
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-medium">Tema Modu</h3>
                            <p className="text-xs text-muted-foreground">Açık veya koyu tema seçimi yapın</p>
                          </div>
                          <ThemeToggle />
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium">Renk Şeması</h3>
                          <div className="grid grid-cols-3 gap-2">
                            <Button 
                              variant="outline" 
                              className="p-0 h-8 border-2 border-primary overflow-hidden"
                            >
                              <div className="w-full h-full bg-gradient-to-r from-blue-500 to-blue-700"></div>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="p-0 h-8 overflow-hidden"
                            >
                              <div className="w-full h-full bg-gradient-to-r from-green-500 to-green-700"></div>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="p-0 h-8 overflow-hidden"
                            >
                              <div className="w-full h-full bg-gradient-to-r from-purple-500 to-purple-700"></div>
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between border-t pt-4">
                          <div>
                            <h3 className="text-sm font-medium">Yazı Tipi Boyutu</h3>
                            <p className="text-xs text-muted-foreground">Arayüz yazı boyutu</p>
                          </div>
                          <Select defaultValue="normal">
                            <SelectTrigger className="w-24">
                              <SelectValue placeholder="Boyut" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="small">Küçük</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="large">Büyük</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}