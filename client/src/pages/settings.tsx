import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
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
  Save
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
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Rol Yetkileri</CardTitle>
                <CardDescription>
                  Her rol için detaylı yetkilendirme ayarları
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <Label>Rol Seçin</Label>
                  <Select 
                    onValueChange={handleRoleChange} 
                    defaultValue={selectedRole}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Rol seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="root">Root</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="technician">Teknisyen</SelectItem>
                      <SelectItem value="operator">Operatör</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-4">
                  {permissionsList.map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Switch 
                        id={permission.id}
                        checked={rolePermissions.some(p => p.id === permission.id)}
                        onCheckedChange={() => togglePermission(permission.id)}
                        disabled={selectedRole === "root" && permission.defaultRoles.includes("root")}
                      />
                      <Label htmlFor={permission.id}>{permission.label}</Label>
                    </div>
                  ))}
                </div>
                
                <Button onClick={saveRolePermissions} className="mt-6">
                  <Save className="mr-2 h-4 w-4" /> Yetkileri Kaydet
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Bilgi</CardTitle>
                <CardDescription>
                  Rol ve yetki sistemi hakkında bilgi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Roller</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Root:</strong> Tüm yetkilere sahiptir, kısıtlanamaz</li>
                    <li><strong>Admin:</strong> Sistem yönetimi yapabilir</li>
                    <li><strong>Teknisyen:</strong> Teknik işlemler yapabilir</li>
                    <li><strong>Operatör:</strong> Temel işlemleri yapabilir</li>
                  </ul>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold mb-2">Yetkiler</h3>
                  <p className="text-sm text-muted-foreground">
                    Her rol için erişim yetkilerini özelleştirebilirsiniz. Root rolünün yetkileri kısıtlanamaz.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* 3. Dil ve Tema Ayarları */}
        <TabsContent value="language">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Dil Ayarları</CardTitle>
                <CardDescription>
                  Sistem dilini değiştirin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Dil Seçimi</Label>
                  <Select defaultValue="tr">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Dil seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tr">Türkçe</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ru">Русский</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Yazı Tipi Boyutu</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Boyut seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Küçük</SelectItem>
                      <SelectItem value="medium">Orta</SelectItem>
                      <SelectItem value="large">Büyük</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Tema Ayarları</CardTitle>
                <CardDescription>
                  Sistem temasını özelleştirin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tema</Label>
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <span className="text-sm text-muted-foreground">
                      Açık ve koyu mod arasında geçiş yapın
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* 4. Mail Ayarları */}
        <TabsContent value="mail">
          <Card>
            <CardHeader>
              <CardTitle>Mail Server Ayarları</CardTitle>
              <CardDescription>
                E-posta gönderimi için SMTP ayarlarını yapılandırın
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...mailForm}>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={mailForm.control}
                      name="smtpServer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Sunucusu</FormLabel>
                          <FormControl>
                            <Input placeholder="smtp.example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={mailForm.control}
                      name="smtpPort"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Port</FormLabel>
                          <FormControl>
                            <Input placeholder="587" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={mailForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kullanıcı Adı</FormLabel>
                          <FormControl>
                            <Input placeholder="username@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={mailForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Şifre</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={mailForm.control}
                    name="fromEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gönderen E-posta Adresi</FormLabel>
                        <FormControl>
                          <Input placeholder="noreply@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={mailForm.control}
                    name="useSsl"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>SSL/TLS Kullan</FormLabel>
                          <FormDescription>
                            Güvenli bağlantı için SSL/TLS kullanın
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
                  
                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={sendTestEmail}>
                      Test E-postası Gönder
                    </Button>
                    <Button type="submit">Ayarları Kaydet</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 5. Veri ve Yedekleme */}
        <TabsContent value="backup">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Yedekleme Ayarları</CardTitle>
                <CardDescription>
                  Sistem verilerinin yedekleme ayarlarını yapılandırın
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...backupForm}>
                  <form className="space-y-4">
                    <FormField
                      control={backupForm.control}
                      name="backupFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Otomatik Yedekleme Sıklığı</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sıklık seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="hourly">Saatlik</SelectItem>
                              <SelectItem value="daily">Günlük</SelectItem>
                              <SelectItem value="weekly">Haftalık</SelectItem>
                              <SelectItem value="monthly">Aylık</SelectItem>
                              <SelectItem value="disabled">Devre Dışı</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={backupForm.control}
                      name="backupLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Yedekleme Konumu</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Yedeklerin saklanacağı klasör yolu
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-between pt-4">
                      <Button variant="outline">
                        Manuel Yedek Al
                      </Button>
                      <Button type="submit">Ayarları Kaydet</Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Yedek Geçmişi</CardTitle>
                <CardDescription>
                  Önceki yedeklemelerin listesi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tarih</TableHead>
                          <TableHead>Boyut</TableHead>
                          <TableHead className="text-right">İşlem</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>24.05.2025 08:00</TableCell>
                          <TableCell>4.2 MB</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">Geri Yükle</Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>23.05.2025 08:00</TableCell>
                          <TableCell>4.1 MB</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">Geri Yükle</Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>22.05.2025 08:00</TableCell>
                          <TableCell>4.0 MB</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">Geri Yükle</Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="pt-2">
                    <Button variant="outline" className="w-full">
                      Yedek Dosyası Yükle
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* 6. Bildirim Ayarları */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Bildirim Ayarları</CardTitle>
              <CardDescription>
                Sistem bildirimlerini özelleştirin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Genel Bildirimler</h3>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="sound-notifications" />
                    <Label htmlFor="sound-notifications">Sesli Uyarılar</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="exit-warning" defaultChecked />
                    <Label htmlFor="exit-warning">Kaydetmeden Çıkış Uyarısı</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="part-request-notification" defaultChecked />
                    <Label htmlFor="part-request-notification">Parça İsteği Bildirimi</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="email-notifications" defaultChecked />
                    <Label htmlFor="email-notifications">E-posta ile Bilgilendirme</Label>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Bildirim Sesi</h3>
                  
                  <div className="space-y-2">
                    <Label>Bildirim Sesi Seçin</Label>
                    <Select defaultValue="beep">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Ses seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beep">Kısa Bip</SelectItem>
                        <SelectItem value="chime">Zil Sesi</SelectItem>
                        <SelectItem value="alert">Uyarı Tonu</SelectItem>
                        <SelectItem value="notification">Bildirim Sesi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Ses Seviyesi</Label>
                    <div className="pt-2">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        defaultValue="80" 
                        className="w-full" 
                      />
                    </div>
                  </div>
                  
                  <Button variant="outline" className="mt-2">
                    Sesi Test Et
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="pt-2">
                <h3 className="text-lg font-semibold mb-4">Bildirim Tercihleri</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="task-notifications" defaultChecked />
                    <Label htmlFor="task-notifications">Görev Bildirimleri</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="system-notifications" defaultChecked />
                    <Label htmlFor="system-notifications">Sistem Bildirimleri</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="user-notifications" defaultChecked />
                    <Label htmlFor="user-notifications">Kullanıcı Bildirimleri</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="update-notifications" defaultChecked />
                    <Label htmlFor="update-notifications">Güncelleme Bildirimleri</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 7. Güvenlik Ayarları */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Güvenlik ve Oturum Ayarları</CardTitle>
              <CardDescription>
                Sistem güvenliği ve oturum ayarlarını yapılandırın
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Oturum Ayarları</h3>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="single-session" />
                    <Label htmlFor="single-session">Bir kullanıcı sadece tek cihazdan oturum açabilsin</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="close-old-session" defaultChecked />
                    <Label htmlFor="close-old-session">Oturum çakışmasında eski oturum kapatılsın</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Otomatik Çıkış Süresi</Label>
                    <Select defaultValue="15">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Süre seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 dakika</SelectItem>
                        <SelectItem value="15">15 dakika</SelectItem>
                        <SelectItem value="30">30 dakika</SelectItem>
                        <SelectItem value="60">1 saat</SelectItem>
                        <SelectItem value="never">Hiçbir zaman</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Güvenlik Ayarları</h3>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="suspicious-login-warning" defaultChecked />
                    <Label htmlFor="suspicious-login-warning">Şüpheli girişlerde uyarı</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Giriş Deneme Sınırı</Label>
                    <Select defaultValue="5">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Deneme sayısı" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 deneme</SelectItem>
                        <SelectItem value="5">5 deneme</SelectItem>
                        <SelectItem value="10">10 deneme</SelectItem>
                        <SelectItem value="unlimited">Sınırsız</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="require-strong-password" defaultChecked />
                    <Label htmlFor="require-strong-password">Güçlü şifre zorunluluğu</Label>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="pt-2 space-y-4">
                <h3 className="text-lg font-semibold">Oturum Logları</h3>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kullanıcı</TableHead>
                        <TableHead>Giriş Zamanı</TableHead>
                        <TableHead>IP Adresi</TableHead>
                        <TableHead>Tarayıcı</TableHead>
                        <TableHead>Durum</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>ermak</TableCell>
                        <TableCell>24.05.2025 18:32</TableCell>
                        <TableCell>192.168.1.1</TableCell>
                        <TableCell>Chrome 125</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Başarılı
                          </span>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>admin</TableCell>
                        <TableCell>24.05.2025 17:20</TableCell>
                        <TableCell>192.168.1.2</TableCell>
                        <TableCell>Firefox 122</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Başarılı
                          </span>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>teknik</TableCell>
                        <TableCell>24.05.2025 16:15</TableCell>
                        <TableCell>192.168.1.3</TableCell>
                        <TableCell>Edge 125</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                            Başarısız
                          </span>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                
                <div className="flex justify-end">
                  <Button variant="outline">
                    Tüm Logları Görüntüle
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 8. API Ayarları */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API ve Bağlantı Ayarları</CardTitle>
              <CardDescription>
                Harici sistemlerle iletişim için API ayarlarını yapılandırın
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Web API Adresi</Label>
                  <div className="flex gap-2">
                    <Input value="https://api.example.com/v1" />
                    <Button variant="outline">
                      Test Et
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>API Token / Bağlantı Anahtarı</Label>
                  <div className="flex gap-2">
                    <Input type="password" value="••••••••••••••••••••••••••••••" />
                    <Button variant="outline">
                      Yenile
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Bu anahtarı güvenli bir şekilde saklayın. Hiçbir zaman paylaşmayın.
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Bağlantı Durumu</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-md border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Ana Sunucu</h4>
                        <p className="text-sm text-muted-foreground">api.example.com</p>
                      </div>
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        Bağlı
                      </span>
                    </div>
                  </div>
                  
                  <div className="rounded-md border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Yedek Sunucu</h4>
                        <p className="text-sm text-muted-foreground">backup-api.example.com</p>
                      </div>
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                        Hazır
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Veri Eşleşme Durumu</Label>
                  <div className="rounded-md border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm">Son eşleşme: <strong>24.05.2025 18:30</strong></p>
                        <p className="text-sm text-muted-foreground">
                          Tüm veriler sunucu ile eşleştirildi
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Şimdi Eşleştir
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Webhook Ayarları</h3>
                
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <Input placeholder="https://example.com/webhook" />
                </div>
                
                <div className="space-y-2">
                  <Label>Webhook Olayları</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="task-created" />
                      <Label htmlFor="task-created">Görev Oluşturuldu</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="task-completed" />
                      <Label htmlFor="task-completed">Görev Tamamlandı</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="user-login" />
                      <Label htmlFor="user-login">Kullanıcı Girişi</Label>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2 flex justify-end">
                  <Button>
                    Webhook Ayarlarını Kaydet
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 9. Hakkında */}
        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>Uygulama Hakkında</CardTitle>
              <CardDescription>
                Sistem ve geliştirici bilgileri
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center py-6">
                <h2 className="text-2xl font-bold mb-2">ErmkaPoint Beta</h2>
                <p className="text-muted-foreground mb-4">Versiyon 2.0.0 (24.05.2025)</p>
                <Button variant="outline" className="mt-2">
                  Güncellemeleri Kontrol Et
                </Button>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Sistem Bilgileri</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Veritabanı:</span>
                      <span>PostgreSQL 16.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Sunucu:</span>
                      <span>Node.js 20.12.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Tarayıcı:</span>
                      <span>Chrome 125.0.0.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">İşletim Sistemi:</span>
                      <span>Windows 11</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Ekran Çözünürlüğü:</span>
                      <span>1920x1080</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Geliştirici Bilgileri</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Geliştirici:</span>
                      <span>Ermka Software Solutions</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">E-posta:</span>
                      <span>info@ermka.com</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Web Site:</span>
                      <span>www.ermka.com</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Telefon:</span>
                      <span>+90 123 456 7890</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Lisans:</span>
                      <span>Kurumsal Lisans</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Hata Raporu Gönder</h3>
                
                <div className="space-y-3">
                  <Label htmlFor="error-description">Hata Açıklaması</Label>
                  <textarea
                    id="error-description"
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Karşılaştığınız hatayı detaylı bir şekilde açıklayın..."
                  />
                </div>
                
                <div className="pt-2 flex justify-end">
                  <Button variant="outline">
                    Hata Raporu Gönder
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
