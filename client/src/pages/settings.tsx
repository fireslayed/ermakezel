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
              
              {/* 4. Mail Ayarları */}
              <TabsContent value="mail">
                <div>
                  <h1 className="text-2xl font-bold mb-6">Mail Ayarları</h1>
                  <p className="text-muted-foreground mb-8">Bildirim ve raporların e-posta ile gönderilmesi için yapılandırma.</p>
                  
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    <Card className="shadow-sm border-0">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-medium">E-posta Sunucu Ayarları</CardTitle>
                        <CardDescription>
                          SMTP sunucu yapılandırmasını güncelleyin
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Form {...mailForm}>
                          <form className="space-y-4">
                            <FormField
                              control={mailForm.control}
                              name="smtpServer"
                              render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FormLabel className="text-xs font-medium">SMTP Sunucu</FormLabel>
                                  <FormControl>
                                    <Input placeholder="smtp.example.com" className="h-9" {...field} />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={mailForm.control}
                              name="smtpPort"
                              render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FormLabel className="text-xs font-medium">Port</FormLabel>
                                  <FormControl>
                                    <Input placeholder="587" className="h-9" {...field} />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={mailForm.control}
                              name="username"
                              render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FormLabel className="text-xs font-medium">Kullanıcı Adı</FormLabel>
                                  <FormControl>
                                    <Input placeholder="mail@example.com" className="h-9" {...field} />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={mailForm.control}
                              name="password"
                              render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FormLabel className="text-xs font-medium">Şifre</FormLabel>
                                  <FormControl>
                                    <Input type="password" placeholder="••••••••" className="h-9" {...field} />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={mailForm.control}
                              name="fromEmail"
                              render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FormLabel className="text-xs font-medium">Gönderen E-posta</FormLabel>
                                  <FormControl>
                                    <Input placeholder="no-reply@example.com" className="h-9" {...field} />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={mailForm.control}
                              name="useSsl"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mt-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-sm">SSL Kullan</FormLabel>
                                    <FormDescription className="text-xs">
                                      Güvenli bağlantı kullan (TLS/SSL)
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
                            <div className="flex gap-2 pt-4">
                              <Button type="button" variant="outline" onClick={sendTestEmail} className="flex-1">
                                Test E-postası Gönder
                              </Button>
                              <Button type="submit" className="flex-1">
                                Kaydet
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                    
                    <div className="space-y-6">
                      <Card className="shadow-sm border-0">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg font-medium">E-posta Şablonları</CardTitle>
                          <CardDescription>
                            Otomatik e-posta şablonlarını yönetin
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="rounded-md border p-3 flex justify-between items-center">
                              <div>
                                <h4 className="text-sm font-medium">Rapor Gönderimi</h4>
                                <p className="text-xs text-muted-foreground">Rapor paylaşımı için e-posta şablonu</p>
                              </div>
                              <Button variant="outline" size="sm">Düzenle</Button>
                            </div>
                            <div className="rounded-md border p-3 flex justify-between items-center">
                              <div>
                                <h4 className="text-sm font-medium">Görev Bildirimi</h4>
                                <p className="text-xs text-muted-foreground">Görev atama bildirimi şablonu</p>
                              </div>
                              <Button variant="outline" size="sm">Düzenle</Button>
                            </div>
                            <div className="rounded-md border p-3 flex justify-between items-center">
                              <div>
                                <h4 className="text-sm font-medium">Hatırlatıcı</h4>
                                <p className="text-xs text-muted-foreground">Görev hatırlatma e-posta şablonu</p>
                              </div>
                              <Button variant="outline" size="sm">Düzenle</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="shadow-sm border-0">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg font-medium">E-posta Günlüğü</CardTitle>
                          <CardDescription>
                            Son gönderilen e-postaları görüntüleyin
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="rounded-md border p-3 space-y-4">
                            <div className="text-center text-muted-foreground text-sm">
                              Son 24 saat içinde gönderilmiş e-posta bulunmuyor
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* 5. Veri ve Yedekleme */}
              <TabsContent value="backup">
                <div>
                  <h1 className="text-2xl font-bold mb-6">Veri ve Yedekleme</h1>
                  <p className="text-muted-foreground mb-8">Veri yedekleme ve sıfırlama işlemlerini yönetin.</p>
                  
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    <Card className="shadow-sm border-0">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-medium">Otomatik Yedekleme</CardTitle>
                        <CardDescription>
                          Veritabanı ve dosya yedekleme ayarlarını yapılandırın
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Form {...backupForm}>
                          <form className="space-y-4">
                            <FormField
                              control={backupForm.control}
                              name="backupFrequency"
                              render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FormLabel className="text-xs font-medium">Yedekleme Sıklığı</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="h-9">
                                        <SelectValue placeholder="Sıklık seçin" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="daily">Günlük</SelectItem>
                                      <SelectItem value="weekly">Haftalık</SelectItem>
                                      <SelectItem value="monthly">Aylık</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={backupForm.control}
                              name="backupLocation"
                              render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FormLabel className="text-xs font-medium">Yedekleme Konumu</FormLabel>
                                  <FormControl>
                                    <Input placeholder="/backups" className="h-9" {...field} />
                                  </FormControl>
                                  <FormDescription className="text-xs">
                                    Yedeklerin kaydedileceği dizin yolu
                                  </FormDescription>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <div className="flex gap-2 pt-4">
                              <Button type="button" variant="outline" className="flex-1">
                                Manuel Yedekleme
                              </Button>
                              <Button type="submit" className="flex-1">
                                Ayarları Kaydet
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                    
                    <div className="space-y-6">
                      <Card className="shadow-sm border-0">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg font-medium">Yedek Geçmişi</CardTitle>
                          <CardDescription>
                            Önceki yedeklemeleri görüntüleyin ve geri yükleyin
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="rounded-md border p-4 space-y-4">
                            <div className="text-center text-muted-foreground text-sm">
                              Henüz yedekleme yapılmamış.
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="shadow-sm border-0">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg font-medium text-destructive">Veri Sıfırlama</CardTitle>
                          <CardDescription>
                            Sistem verilerini sıfırlama işlemleri
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" className="w-full border-red-200 text-destructive hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950">
                                  Demo Verileri Sıfırla
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Demo Verileri Sıfırla</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bu işlem tüm demo verilerini varsayılan değerlerine sıfırlayacaktır. Devam etmek istediğinizden emin misiniz?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>İptal</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleResetDemoData} className="bg-destructive">
                                    Sıfırla
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" className="w-full border-red-200 text-destructive hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950">
                                  Tüm Verileri Temizle
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Tüm Verileri Temizle</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bu işlem tüm sistem verilerini kalıcı olarak silecektir. Bu işlem geri alınamaz. Devam etmek istediğinizden emin misiniz?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>İptal</AlertDialogCancel>
                                  <AlertDialogAction className="bg-destructive">
                                    Verileri Temizle
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* 6. Bildirim Ayarları */}
              <TabsContent value="notifications">
                <div>
                  <h1 className="text-2xl font-bold mb-6">Bildirim Ayarları</h1>
                  <p className="text-muted-foreground mb-8">Bildirim tercihleri ve hatırlatıcıların yapılandırılması.</p>
                  
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    <Card className="shadow-sm border-0">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-medium">Bildirim Kanalları</CardTitle>
                        <CardDescription>
                          Bildirimlerin nasıl alınacağını yapılandırın
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <h4 className="text-sm font-medium">Uygulama Bildirimleri</h4>
                              <p className="text-xs text-muted-foreground">Sistem içi bildirimler</p>
                            </div>
                            <Switch defaultChecked />
                          </div>
                          
                          <div className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <h4 className="text-sm font-medium">E-posta Bildirimleri</h4>
                              <p className="text-xs text-muted-foreground">Bildirimleri e-posta ile al</p>
                            </div>
                            <Switch defaultChecked />
                          </div>
                          
                          <div className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <h4 className="text-sm font-medium">SMS Bildirimleri</h4>
                              <p className="text-xs text-muted-foreground">Bildirimleri SMS ile al</p>
                            </div>
                            <Switch />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="shadow-sm border-0">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-medium">Bildirim Tercihleri</CardTitle>
                        <CardDescription>
                          Hangi olaylar için bildirim alacağınızı yapılandırın
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <h4 className="text-sm font-medium">Görev Atamaları</h4>
                              <p className="text-xs text-muted-foreground">Yeni görev atandığında bildirim al</p>
                            </div>
                            <Switch defaultChecked />
                          </div>
                          
                          <div className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <h4 className="text-sm font-medium">Görev Hatırlatıcıları</h4>
                              <p className="text-xs text-muted-foreground">Yaklaşan görevler için hatırlatma al</p>
                            </div>
                            <Switch defaultChecked />
                          </div>
                          
                          <div className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <h4 className="text-sm font-medium">Rapor Gönderimi</h4>
                              <p className="text-xs text-muted-foreground">Yeni rapor paylaşıldığında bildirim al</p>
                            </div>
                            <Switch defaultChecked />
                          </div>
                          
                          <div className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <h4 className="text-sm font-medium">Sistem Güncellemeleri</h4>
                              <p className="text-xs text-muted-foreground">Sistem güncellemeleri hakkında bildirim al</p>
                            </div>
                            <Switch defaultChecked />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="shadow-sm border-0 md:col-span-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-medium">Hatırlatıcı Yapılandırması</CardTitle>
                        <CardDescription>
                          Görev hatırlatmalarının ne zaman gönderileceğini ayarlayın
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 border rounded-md">
                            <h4 className="text-sm font-medium mb-2">Görev Başlangıcı</h4>
                            <Select defaultValue="1day">
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1hour">1 saat önce</SelectItem>
                                <SelectItem value="3hours">3 saat önce</SelectItem>
                                <SelectItem value="1day">1 gün önce</SelectItem>
                                <SelectItem value="2days">2 gün önce</SelectItem>
                                <SelectItem value="1week">1 hafta önce</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="p-4 border rounded-md">
                            <h4 className="text-sm font-medium mb-2">Görev Teslim Süresi</h4>
                            <Select defaultValue="1day">
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1hour">1 saat önce</SelectItem>
                                <SelectItem value="3hours">3 saat önce</SelectItem>
                                <SelectItem value="1day">1 gün önce</SelectItem>
                                <SelectItem value="2days">2 gün önce</SelectItem>
                                <SelectItem value="1week">1 hafta önce</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="p-4 border rounded-md">
                            <h4 className="text-sm font-medium mb-2">Geciken Görevler</h4>
                            <Select defaultValue="daily">
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hourly">Her saat</SelectItem>
                                <SelectItem value="daily">Günlük</SelectItem>
                                <SelectItem value="weekly">Haftalık</SelectItem>
                                <SelectItem value="disabled">Devre dışı</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="mt-6 flex justify-end">
                          <Button>Ayarları Kaydet</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              {/* 7. Güvenlik */}
              <TabsContent value="security">
                <div>
                  <h1 className="text-2xl font-bold mb-6">Güvenlik Ayarları</h1>
                  <p className="text-muted-foreground mb-8">Sistem güvenliği ve erişim kontrolü yapılandırması.</p>
                  
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    <Card className="shadow-sm border-0">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-medium">Şifre Politikası</CardTitle>
                        <CardDescription>
                          Kullanıcı şifre gereksinimleri
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <h4 className="text-sm font-medium">Minimum Uzunluk</h4>
                              <p className="text-xs text-muted-foreground">Şifre için en az karakter sayısı</p>
                            </div>
                            <Select defaultValue="8">
                              <SelectTrigger className="w-20 h-8">
                                <SelectValue placeholder="Seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="6">6</SelectItem>
                                <SelectItem value="8">8</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="12">12</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <h4 className="text-sm font-medium">Büyük Harf Zorunlu</h4>
                              <p className="text-xs text-muted-foreground">En az bir büyük harf içermeli</p>
                            </div>
                            <Switch defaultChecked />
                          </div>
                          
                          <div className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <h4 className="text-sm font-medium">Özel Karakter Zorunlu</h4>
                              <p className="text-xs text-muted-foreground">En az bir özel karakter içermeli</p>
                            </div>
                            <Switch defaultChecked />
                          </div>
                          
                          <div className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <h4 className="text-sm font-medium">Şifre Süresi</h4>
                              <p className="text-xs text-muted-foreground">Şifre değişim zorunluluğu</p>
                            </div>
                            <Select defaultValue="90">
                              <SelectTrigger className="w-24 h-8">
                                <SelectValue placeholder="Seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="30">30 gün</SelectItem>
                                <SelectItem value="60">60 gün</SelectItem>
                                <SelectItem value="90">90 gün</SelectItem>
                                <SelectItem value="0">Sınırsız</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <Button className="w-full mt-4">Kaydet</Button>
                      </CardContent>
                    </Card>
                    
                    <Card className="shadow-sm border-0">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-medium">Oturum Güvenliği</CardTitle>
                        <CardDescription>
                          Kullanıcı oturum ve giriş ayarları
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <h4 className="text-sm font-medium">Oturum Süresi</h4>
                              <p className="text-xs text-muted-foreground">Kullanıcı oturumunun aktif kalma süresi</p>
                            </div>
                            <Select defaultValue="60">
                              <SelectTrigger className="w-24 h-8">
                                <SelectValue placeholder="Seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="15">15 dakika</SelectItem>
                                <SelectItem value="30">30 dakika</SelectItem>
                                <SelectItem value="60">1 saat</SelectItem>
                                <SelectItem value="240">4 saat</SelectItem>
                                <SelectItem value="480">8 saat</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <h4 className="text-sm font-medium">Başarısız Giriş Limiti</h4>
                              <p className="text-xs text-muted-foreground">Hesap kilitleme için deneme sayısı</p>
                            </div>
                            <Select defaultValue="5">
                              <SelectTrigger className="w-16 h-8">
                                <SelectValue placeholder="Seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="3">3</SelectItem>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="0">Sınırsız</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <h4 className="text-sm font-medium">Hesap Kilitleme Süresi</h4>
                              <p className="text-xs text-muted-foreground">Başarısız girişlerden sonra kilitleme süresi</p>
                            </div>
                            <Select defaultValue="15">
                              <SelectTrigger className="w-24 h-8">
                                <SelectValue placeholder="Seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">5 dakika</SelectItem>
                                <SelectItem value="15">15 dakika</SelectItem>
                                <SelectItem value="30">30 dakika</SelectItem>
                                <SelectItem value="60">1 saat</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <h4 className="text-sm font-medium">IP Adres Kısıtlaması</h4>
                              <p className="text-xs text-muted-foreground">Belirli IP adreslerinden erişime izin ver</p>
                            </div>
                            <Switch />
                          </div>
                        </div>
                        
                        <Button className="w-full mt-4">Kaydet</Button>
                      </CardContent>
                    </Card>
                    
                    <Card className="shadow-sm border-0 md:col-span-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-medium">Erişim Logları</CardTitle>
                        <CardDescription>
                          Son kullanıcı erişim ve işlem kayıtları
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border overflow-hidden">
                          <Table>
                            <TableHeader className="bg-muted/50">
                              <TableRow>
                                <TableHead>Kullanıcı</TableHead>
                                <TableHead>Tarih & Saat</TableHead>
                                <TableHead>IP Adresi</TableHead>
                                <TableHead>İşlem</TableHead>
                                <TableHead>Durum</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-medium">ermak</TableCell>
                                <TableCell>{new Date().toLocaleString()}</TableCell>
                                <TableCell>192.168.1.100</TableCell>
                                <TableCell>Giriş</TableCell>
                                <TableCell>
                                  <Badge variant="success" className="bg-opacity-10">Başarılı</Badge>
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">ermak</TableCell>
                                <TableCell>{new Date(Date.now() - 3600000).toLocaleString()}</TableCell>
                                <TableCell>192.168.1.100</TableCell>
                                <TableCell>Rapor Erişimi</TableCell>
                                <TableCell>
                                  <Badge variant="success" className="bg-opacity-10">Başarılı</Badge>
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">admin</TableCell>
                                <TableCell>{new Date(Date.now() - 86400000).toLocaleString()}</TableCell>
                                <TableCell>192.168.1.101</TableCell>
                                <TableCell>Ayar Değişikliği</TableCell>
                                <TableCell>
                                  <Badge variant="success" className="bg-opacity-10">Başarılı</Badge>
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              {/* 8. API Ayarları */}
              <TabsContent value="api">
                <div>
                  <h1 className="text-2xl font-bold mb-6">API Ayarları</h1>
                  <p className="text-muted-foreground mb-8">API erişim ve entegrasyon yapılandırması.</p>
                  
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    <Card className="shadow-sm border-0 md:col-span-2">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-lg font-medium">API Anahtarları</CardTitle>
                            <CardDescription>
                              Sisteme erişim için API anahtarlarını yönetin
                            </CardDescription>
                          </div>
                          <Button size="sm" className="gap-1">
                            <Plus className="h-4 w-4" /> Anahtar Oluştur
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border overflow-hidden">
                          <Table>
                            <TableHeader className="bg-muted/50">
                              <TableRow>
                                <TableHead>İsim</TableHead>
                                <TableHead>Anahtar</TableHead>
                                <TableHead>İzinler</TableHead>
                                <TableHead>Oluşturulma Tarihi</TableHead>
                                <TableHead>Son Kullanım</TableHead>
                                <TableHead>İşlemler</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-medium">Ana Sistem</TableCell>
                                <TableCell>
                                  <div className="flex items-center">
                                    <code className="bg-muted px-1 py-0.5 rounded text-xs">••••••••••••••••</code>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                                      <RefreshCw className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="capitalize">
                                    Tam Erişim
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">12 Mart 2023</TableCell>
                                <TableCell className="text-muted-foreground text-sm">5 dakika önce</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Düzenle">
                                      <FileEditIcon className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Sil">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Mobil Uygulama</TableCell>
                                <TableCell>
                                  <div className="flex items-center">
                                    <code className="bg-muted px-1 py-0.5 rounded text-xs">••••••••••••••••</code>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                                      <RefreshCw className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="capitalize">
                                    Salt Okunur
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">5 Mayıs 2023</TableCell>
                                <TableCell className="text-muted-foreground text-sm">1 gün önce</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Düzenle">
                                      <FileEditIcon className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Sil">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="shadow-sm border-0">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-medium">Webhook Yapılandırması</CardTitle>
                        <CardDescription>
                          Olay tetikleyici webhook URL'leri
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="p-3 border rounded-md">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-sm font-medium">Yeni Görev Oluşturuldu</h4>
                              <Switch defaultChecked />
                            </div>
                            <Input 
                              className="h-8 text-xs" 
                              placeholder="https://example.com/webhooks/tasks" 
                              defaultValue="https://example.com/webhooks/tasks" 
                            />
                          </div>
                          
                          <div className="p-3 border rounded-md">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-sm font-medium">Rapor Tamamlandı</h4>
                              <Switch />
                            </div>
                            <Input 
                              className="h-8 text-xs" 
                              placeholder="https://example.com/webhooks/reports" 
                            />
                          </div>
                          
                          <div className="p-3 border rounded-md">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-sm font-medium">Parça Talebi</h4>
                              <Switch />
                            </div>
                            <Input 
                              className="h-8 text-xs" 
                              placeholder="https://example.com/webhooks/parts" 
                            />
                          </div>
                        </div>
                        
                        <Button className="w-full mt-4">Kaydet</Button>
                      </CardContent>
                    </Card>
                    
                    <Card className="shadow-sm border-0">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-medium">Harici Servisler</CardTitle>
                        <CardDescription>
                          Entegre harici servislerin yapılandırması
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 border rounded-md">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 bg-blue-500 rounded flex items-center justify-center text-white">
                                A
                              </div>
                              <div>
                                <h4 className="text-sm font-medium">Anthropic Claude AI</h4>
                                <p className="text-xs text-muted-foreground">Yapay zeka hizmetleri</p>
                              </div>
                            </div>
                            <Switch />
                          </div>
                          
                          <div className="flex items-center justify-between p-3 border rounded-md">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 bg-green-500 rounded flex items-center justify-center text-white">
                                S
                              </div>
                              <div>
                                <h4 className="text-sm font-medium">SendGrid</h4>
                                <p className="text-xs text-muted-foreground">E-posta gönderim servisi</p>
                              </div>
                            </div>
                            <Switch defaultChecked />
                          </div>
                          
                          <div className="flex items-center justify-between p-3 border rounded-md">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 bg-purple-500 rounded flex items-center justify-center text-white">
                                G
                              </div>
                              <div>
                                <h4 className="text-sm font-medium">Google Maps</h4>
                                <p className="text-xs text-muted-foreground">Harita ve konum servisi</p>
                              </div>
                            </div>
                            <Switch defaultChecked />
                          </div>
                        </div>
                        
                        <Button className="w-full mt-4">API Anahtarlarını Yönet</Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              {/* 9. Hakkında */}
              <TabsContent value="about">
                <div>
                  <h1 className="text-2xl font-bold mb-6">Hakkında</h1>
                  <p className="text-muted-foreground mb-8">Sistem bilgileri ve lisans detayları.</p>
                  
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    <Card className="shadow-sm border-0">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-medium">Sistem Bilgileri</CardTitle>
                        <CardDescription>
                          Uygulama ve sistem detayları
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex flex-col items-center justify-center mb-6">
                            <h2 className="text-xl font-bold text-primary">ErmkaPoint Beta</h2>
                            <p className="text-sm text-muted-foreground">Versiyon 2.1.5 (Build 2405)</p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between py-2 border-b">
                              <span className="text-sm font-medium">Yazılım Sürümü</span>
                              <span className="text-sm">2.1.5</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                              <span className="text-sm font-medium">Veritabanı Sürümü</span>
                              <span className="text-sm">1.3.0</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                              <span className="text-sm font-medium">Son Güncelleme</span>
                              <span className="text-sm">24 Mayıs 2025</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                              <span className="text-sm font-medium">Lisans Durumu</span>
                              <span className="text-sm text-green-500">Aktif</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                              <span className="text-sm font-medium">Lisans Sahibi</span>
                              <span className="text-sm">ERMKA Mühendislik</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                              <span className="text-sm font-medium">Lisans Bitiş Tarihi</span>
                              <span className="text-sm">31 Aralık 2025</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-6 flex justify-center">
                          <Button variant="outline">Güncellemeleri Kontrol Et</Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <div className="space-y-6">
                      <Card className="shadow-sm border-0">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg font-medium">Destek ve İletişim</CardTitle>
                          <CardDescription>
                            Yardım ve teknik destek bilgileri
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="p-4 border rounded-md">
                              <h4 className="text-sm font-medium mb-2">Teknik Destek</h4>
                              <p className="text-sm mb-2">Teknik sorunlar ve kullanım desteği için:</p>
                              <div className="space-y-1">
                                <div className="flex items-center text-sm">
                                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span>destek@ermka.com</span>
                                </div>
                                <div className="flex items-center text-sm">
                                  <Bell className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span>+90 212 555 12 34</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="p-4 border rounded-md">
                              <h4 className="text-sm font-medium mb-2">Dokümantasyon</h4>
                              <p className="text-sm mb-2">Kullanım kılavuzu ve yardım dökümanları:</p>
                              <Button variant="link" className="h-auto p-0 text-sm">
                                Kullanım Kılavuzunu Görüntüle
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="shadow-sm border-0">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg font-medium">Sistem Durumu</CardTitle>
                          <CardDescription>
                            Servis ve sunucu durumu
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-2 border-b">
                              <div className="flex items-center">
                                <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                                <span className="text-sm">API Servisi</span>
                              </div>
                              <span className="text-xs text-green-500">Çalışıyor</span>
                            </div>
                            <div className="flex justify-between items-center p-2 border-b">
                              <div className="flex items-center">
                                <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                                <span className="text-sm">Veritabanı</span>
                              </div>
                              <span className="text-xs text-green-500">Çalışıyor</span>
                            </div>
                            <div className="flex justify-between items-center p-2 border-b">
                              <div className="flex items-center">
                                <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                                <span className="text-sm">E-posta Servisi</span>
                              </div>
                              <span className="text-xs text-green-500">Çalışıyor</span>
                            </div>
                            <div className="flex justify-between items-center p-2">
                              <div className="flex items-center">
                                <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                                <span className="text-sm">Dosya Depolama</span>
                              </div>
                              <span className="text-xs text-green-500">Çalışıyor</span>
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t">
                            <h4 className="text-sm font-medium mb-2">Sistem Yükü</h4>
                            <div className="space-y-2">
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span>CPU: 23%</span>
                                  <span>2/8 Çekirdek</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                  <div className="bg-blue-500 h-full rounded-full" style={{ width: "23%" }}></div>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span>Bellek: 41%</span>
                                  <span>1.3/4 GB</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                  <div className="bg-blue-500 h-full rounded-full" style={{ width: "41%" }}></div>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span>Disk: 62%</span>
                                  <span>124/200 GB</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                  <div className="bg-blue-500 h-full rounded-full" style={{ width: "62%" }}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
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