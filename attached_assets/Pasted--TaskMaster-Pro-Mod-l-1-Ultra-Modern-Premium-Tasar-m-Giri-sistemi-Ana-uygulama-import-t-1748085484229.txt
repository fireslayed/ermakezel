# TaskMaster Pro - Modül 1: Ultra Modern Premium Tasarım
# Giriş sistemi + Ana uygulama

import tkinter as tk
from tkinter import ttk
import tkinter.font as tkFont

class LoginWindow:
    def __init__(self, on_success_callback):
        self.on_success = on_success_callback
        self.login_window = tk.Tk()
        self.login_window.title("TaskMaster Pro - Giriş")
        self.login_window.geometry("400x600")  # Yüksekliği artırdım
        self.login_window.resizable(False, False)
        
        # Pencereyi ortala
        self.center_window()
        
        # Modern renkler
        self.colors = {
            'bg_primary': '#fafbfc',
            'accent_primary': '#6366f1',
            'accent_hover': '#4f46e5',
            'text_primary': '#1f2937',
            'text_secondary': '#6b7280',
            'card_bg': '#ffffff',
            'border': '#e5e7eb',
            'success': '#10b981',
            'danger': '#ef4444'
        }
        
        self.login_window.configure(bg=self.colors['bg_primary'])
        
        # Fontlar
        self.fonts = {
            'title': tkFont.Font(family="Segoe UI", size=24, weight="bold"),
            'subtitle': tkFont.Font(family="Segoe UI", size=12, weight="normal"),
            'normal': tkFont.Font(family="Segoe UI", size=11, weight="normal"),
            'small': tkFont.Font(family="Segoe UI", size=9, weight="normal")
        }
        
        self.create_login_ui()
    
    def center_window(self):
        """Pencereyi ekranın ortasına yerleştir"""
        self.login_window.update_idletasks()
        x = (self.login_window.winfo_screenwidth() // 2) - (400 // 2)
        y = (self.login_window.winfo_screenheight() // 2) - (600 // 2)  # 600 yaptım
        self.login_window.geometry(f"400x600+{x}+{y}")
    
    def create_login_ui(self):
        """Giriş arayüzü oluştur"""
        # Ana container
        main_frame = tk.Frame(self.login_window, bg=self.colors['bg_primary'])
        main_frame.pack(fill=tk.BOTH, expand=True, padx=40, pady=40)
        
        # Logo ve başlık alanı
        header_frame = tk.Frame(main_frame, bg=self.colors['bg_primary'])
        header_frame.pack(fill=tk.X, pady=(0, 40))
        
        # Logo
        logo_label = tk.Label(header_frame, text="✨", font=self.fonts['title'],
                             fg=self.colors['accent_primary'], bg=self.colors['bg_primary'])
        logo_label.pack()
        
        title_label = tk.Label(header_frame, text="TaskMaster Pro", font=self.fonts['title'],
                              fg=self.colors['text_primary'], bg=self.colors['bg_primary'])
        title_label.pack(pady=(10, 5))
        
        subtitle_label = tk.Label(header_frame, text="Güvenli giriş yapın", font=self.fonts['subtitle'],
                                 fg=self.colors['text_secondary'], bg=self.colors['bg_primary'])
        subtitle_label.pack()
        
        # Giriş formu
        form_frame = tk.Frame(main_frame, bg=self.colors['card_bg'], relief=tk.FLAT)
        form_frame.pack(fill=tk.X, pady=(0, 20))
        
        # İç padding için frame
        inner_frame = tk.Frame(form_frame, bg=self.colors['card_bg'])
        inner_frame.pack(fill=tk.X, padx=30, pady=30)
        
        # Kullanıcı adı
        username_label = tk.Label(inner_frame, text="Kullanıcı Adı", font=self.fonts['normal'],
                                 fg=self.colors['text_primary'], bg=self.colors['card_bg'])
        username_label.pack(anchor=tk.W, pady=(0, 5))
        
        self.username_entry = tk.Entry(inner_frame, font=self.fonts['normal'],
                                      bg='white', fg=self.colors['text_primary'],
                                      relief=tk.SOLID, bd=1, insertbackground=self.colors['accent_primary'])
        self.username_entry.pack(fill=tk.X, pady=(0, 20), ipady=8)
        self.username_entry.insert(0, "ermak")  # Varsayılan değer
        
        # Şifre
        password_label = tk.Label(inner_frame, text="Şifre", font=self.fonts['normal'],
                                 fg=self.colors['text_primary'], bg=self.colors['card_bg'])
        password_label.pack(anchor=tk.W, pady=(0, 5))
        
        self.password_entry = tk.Entry(inner_frame, font=self.fonts['normal'], show="*",
                                      bg='white', fg=self.colors['text_primary'],
                                      relief=tk.SOLID, bd=1, insertbackground=self.colors['accent_primary'])
        self.password_entry.pack(fill=tk.X, pady=(0, 30), ipady=8)  # Daha fazla boşluk
        self.password_entry.insert(0, "ermak")  # Varsayılan değer
        
        # Modern Giriş Butonu
        print("Modern buton oluşturuluyor...")  # Debug için
        
        # Buton container
        button_container = tk.Frame(inner_frame, bg=self.colors['card_bg'])
        button_container.pack(fill=tk.X, pady=(10, 0))
        
        self.login_btn = tk.Button(button_container, 
                                  text="🔐  Giriş Yap", 
                                  font=tkFont.Font(family="Segoe UI", size=12, weight="bold"),
                                  fg='white', 
                                  bg=self.colors['accent_primary'],
                                  activeforeground='white',
                                  activebackground=self.colors['accent_hover'],
                                  relief=tk.FLAT,
                                  bd=0,
                                  cursor="hand2",
                                  command=self.login_attempt)
        self.login_btn.pack(fill=tk.X, ipady=15)
        
        # Modern hover efektleri
        def on_enter(e):
            self.login_btn.configure(bg=self.colors['accent_hover'])
            
        def on_leave(e):
            self.login_btn.configure(bg=self.colors['accent_primary'])
            
        def on_click(e):
            self.login_btn.configure(bg=self.colors['accent_hover'])
            self.login_window.after(100, lambda: self.login_btn.configure(bg=self.colors['accent_primary']))
        
        self.login_btn.bind("<Enter>", on_enter)
        self.login_btn.bind("<Leave>", on_leave)
        self.login_btn.bind("<Button-1>", on_click)
        
        print("Modern buton oluşturuldu!")  # Debug için
        
        # Hata mesajı alanı
        self.error_label = tk.Label(inner_frame, text="", font=self.fonts['small'],
                                   fg=self.colors['danger'], bg=self.colors['card_bg'])
        self.error_label.pack()
        
        # Alt bilgi
        info_frame = tk.Frame(main_frame, bg=self.colors['bg_primary'])
        info_frame.pack(fill=tk.X)
        
        info_label = tk.Label(info_frame, text="Demo Giriş Bilgileri:", font=self.fonts['small'],
                             fg=self.colors['text_secondary'], bg=self.colors['bg_primary'])
        info_label.pack()
        
        demo_label = tk.Label(info_frame, text="Kullanıcı: ermak | Şifre: ermak", font=self.fonts['small'],
                             fg=self.colors['accent_primary'], bg=self.colors['bg_primary'])
        demo_label.pack(pady=5)
        
        # Enter tuşu ile giriş
        self.login_window.bind('<Return>', lambda e: self.login_attempt())
        
        # Focus ayarla
        self.username_entry.focus()
    
    def login_attempt(self):
        """Giriş denemesi"""
        username = self.username_entry.get().strip()
        password = self.password_entry.get().strip()
        
        # Basit doğrulama
        if username == "ermak" and password == "ermak":
            self.error_label.config(text="✅ Giriş başarılı!", fg=self.colors['success'])
            self.login_window.after(1000, self.successful_login)
        else:
            self.error_label.config(text="❌ Kullanıcı adı veya şifre hatalı!", fg=self.colors['danger'])
            # Animasyon efekti - formu hafifçe salla
            self.shake_window()
    
    def shake_window(self):
        """Hata durumunda pencereyi hafifçe salla"""
        original_x = self.login_window.winfo_x()
        for i in range(10):
            if i % 2 == 0:
                self.login_window.geometry(f"+{original_x + 5}+{self.login_window.winfo_y()}")
            else:
                self.login_window.geometry(f"+{original_x - 5}+{self.login_window.winfo_y()}")
            self.login_window.update()
            self.login_window.after(50)
        self.login_window.geometry(f"+{original_x}+{self.login_window.winfo_y()}")
    
    def successful_login(self):
        """Başarılı giriş sonrası"""
        self.login_window.destroy()
        # Ana uygulamayı başlat
        app = TaskMasterApp()
        app.run()
    
    def run(self):
        """Giriş penceresini başlat"""
        self.login_window.mainloop()


class TaskMasterApp:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("TaskMaster Pro")
        self.root.geometry("1200x800")
        self.root.minsize(1000, 700)
        self.root.state('zoomed')  # Windows'ta tam ekran
        
        # Ultra Modern Premium Renkler (Tatlı & Soft)
        self.colors = {
            'bg_primary': '#fafbfc',        # Çok açık gri-beyaz
            'bg_secondary': '#f8f9fa',      # Soft gri
            'header_bg': '#ffffff',         # Temiz beyaz header
            'card_bg': '#ffffff',           # Kart arka planı
            'accent_primary': '#6366f1',    # Modern mor-mavi
            'accent_hover': '#4f46e5',      # Koyu mor-mavi
            'accent_light': '#e0e7ff',      # Açık mor-mavi
            'text_primary': '#1f2937',      # Soft siyah
            'text_secondary': '#6b7280',    # Soft gri
            'text_light': '#9ca3af',        # Açık gri
            'border_light': '#e5e7eb',      # Çok açık border
            'border_medium': '#d1d5db',     # Orta border
            'success': '#10b981',           # Soft yeşil
            'success_light': '#d1fae5',     # Açık yeşil
            'warning': '#f59e0b',           # Soft turuncu
            'warning_light': '#fef3c7',     # Açık turuncu
            'danger': '#ef4444',            # Soft kırmızı
            'danger_light': '#fee2e2',      # Açık kırmızı
            'info': '#06b6d4',              # Soft cyan
            'info_light': '#cffafe',        # Açık cyan
            'purple': '#8b5cf6',            # Soft mor
            'purple_light': '#ede9fe',      # Açık mor
            'shadow': 'rgba(0, 0, 0, 0.05)' # Soft gölge
        }
        
        self.root.configure(bg=self.colors['bg_primary'])
        
        # Premium Font Sistemi
        self.fonts = {
            'logo': tkFont.Font(family="Segoe UI", size=20, weight="bold"),
            'title': tkFont.Font(family="Segoe UI", size=18, weight="bold"),
            'subtitle': tkFont.Font(family="Segoe UI", size=15, weight="bold"),
            'normal': tkFont.Font(family="Segoe UI", size=11, weight="normal"),
            'small': tkFont.Font(family="Segoe UI", size=9, weight="normal"),
            'menu': tkFont.Font(family="Segoe UI", size=11, weight="normal"),
            'card_value': tkFont.Font(family="Segoe UI", size=24, weight="bold"),
            'card_title': tkFont.Font(family="Segoe UI", size=10, weight="normal")
        }
        
        self.current_page = "dashboard"
        
        self.create_header()
        self.create_main_layout()
        self.create_status_bar()
        
        # Varsayılan sayfa
        self.show_dashboard()
    
    def create_header(self):
        """Ultra modern header"""
        # Ana header frame - beyaz ve temiz
        self.header_frame = tk.Frame(self.root, bg=self.colors['header_bg'], height=70)
        self.header_frame.pack(fill=tk.X)
        self.header_frame.pack_propagate(False)
        
        # Alt çizgi efekti
        header_border = tk.Frame(self.root, bg=self.colors['border_light'], height=1)
        header_border.pack(fill=tk.X)
        
        # Logo ve başlık (sol taraf)
        logo_frame = tk.Frame(self.header_frame, bg=self.colors['header_bg'])
        logo_frame.pack(side=tk.LEFT, padx=30, pady=15)
        
        # Gradient efektli logo
        logo_label = tk.Label(logo_frame, text="✨ TaskMaster", font=self.fonts['logo'],
                             fg=self.colors['accent_primary'], bg=self.colors['header_bg'])
        logo_label.pack(side=tk.LEFT)
        
        version_label = tk.Label(logo_frame, text="Pro", font=self.fonts['small'],
                                fg=self.colors['text_light'], bg=self.colors['header_bg'])
        version_label.pack(side=tk.LEFT, padx=(5, 0), pady=(5, 0))
        
        # Orta menü - modern butonlar
        menu_frame = tk.Frame(self.header_frame, bg=self.colors['header_bg'])
        menu_frame.pack(pady=15)
        
        self.menu_buttons = {}
        
        menu_items = [
            ("Dashboard", "🏠", self.show_dashboard),
            ("Görevler", "📝", self.show_tasks),
            ("Takvim", "📅", self.show_calendar),
            ("Projeler", "📊", self.show_projects),
            ("Raporlar", "📈", self.show_reports)
        ]
        
        for text, icon, command in menu_items:
            btn = self.create_modern_menu_button(menu_frame, text, icon, command)
            self.menu_buttons[text.lower()] = btn
        
        # Sağ taraf - modern aksiyonlar
        actions_frame = tk.Frame(self.header_frame, bg=self.colors['header_bg'])
        actions_frame.pack(side=tk.RIGHT, padx=30, pady=15)
        
        # Bildirim butonu
        notif_btn = self.create_icon_button(actions_frame, "🔔", "Bildirimler")
        notif_btn.pack(side=tk.LEFT, padx=5)
        
        # Arama butonu
        search_btn = self.create_icon_button(actions_frame, "🔍", "Ara")
        search_btn.pack(side=tk.LEFT, padx=5)
        
        # Ayarlar butonu
        settings_btn = self.create_icon_button(actions_frame, "⚙️", "Ayarlar", 
                                              command=lambda: self.switch_page(self.show_settings, "ayarlar"))
        settings_btn.pack(side=tk.LEFT, padx=5)
        self.menu_buttons['ayarlar'] = settings_btn
    
    def create_modern_menu_button(self, parent, text, icon, command):
        """Modern menü butonu oluştur"""
        btn_frame = tk.Frame(parent, bg=self.colors['header_bg'])
        btn_frame.pack(side=tk.LEFT, padx=8)
        
        btn = tk.Button(btn_frame, text=f"{icon} {text}", font=self.fonts['menu'],
                       fg=self.colors['text_secondary'], bg=self.colors['header_bg'],
                       activeforeground=self.colors['accent_primary'],
                       activebackground=self.colors['accent_light'],
                       relief=tk.FLAT, cursor="hand2", padx=20, pady=10,
                       command=lambda: self.switch_page(command, text.lower()))
        btn.pack()
        
        # Premium hover efekti
        def on_enter(e):
            if btn['bg'] != self.colors['accent_light']:
                btn.configure(bg=self.colors['accent_light'], fg=self.colors['accent_primary'])
        
        def on_leave(e):
            if btn['bg'] != self.colors['accent_light'] or self.current_page != text.lower():
                btn.configure(bg=self.colors['header_bg'], fg=self.colors['text_secondary'])
        
        btn.bind("<Enter>", on_enter)
        btn.bind("<Leave>", on_leave)
        
        return btn
    
    def create_icon_button(self, parent, icon, tooltip, command=None):
        """Modern ikon butonu"""
        btn = tk.Button(parent, text=icon, font=self.fonts['normal'],
                       fg=self.colors['text_light'], bg=self.colors['header_bg'],
                       relief=tk.FLAT, cursor="hand2", padx=12, pady=8,
                       command=command if command else lambda: None)
        
        # Hover efekti
        def on_enter(e):
            btn.configure(bg=self.colors['bg_secondary'], fg=self.colors['text_primary'])
        
        def on_leave(e):
            btn.configure(bg=self.colors['header_bg'], fg=self.colors['text_light'])
        
        btn.bind("<Enter>", on_enter)
        btn.bind("<Leave>", on_leave)
        
        return btn
    
    def create_main_layout(self):
        """Premium ana layout"""
        # Ana container
        self.main_container = tk.Frame(self.root, bg=self.colors['bg_primary'])
        self.main_container.pack(fill=tk.BOTH, expand=True)
        
        # İçerik alanı - daha geniş padding
        self.content_frame = tk.Frame(self.main_container, bg=self.colors['bg_primary'])
        self.content_frame.pack(fill=tk.BOTH, expand=True, padx=40, pady=30)
        
        # Sayfa başlık alanı
        self.page_header = tk.Frame(self.content_frame, bg=self.colors['bg_primary'], height=60)
        self.page_header.pack(fill=tk.X, pady=(0, 30))
        self.page_header.pack_propagate(False)
        
        self.page_title = tk.Label(self.page_header, text="Dashboard", font=self.fonts['title'],
                                  fg=self.colors['text_primary'], bg=self.colors['bg_primary'])
        self.page_title.pack(side=tk.LEFT, pady=15)
        
        # Breadcrumb
        self.breadcrumb = tk.Label(self.page_header, text="Ana Sayfa > Dashboard", 
                                  font=self.fonts['small'], fg=self.colors['text_light'], 
                                  bg=self.colors['bg_primary'])
        self.breadcrumb.pack(side=tk.LEFT, padx=(15, 0), pady=15)
        
        # İçerik alanı
        self.content_area = tk.Frame(self.content_frame, bg=self.colors['bg_primary'])
        self.content_area.pack(fill=tk.BOTH, expand=True)
    
    def create_status_bar(self):
        """Modern durum çubuğu"""
        status_frame = tk.Frame(self.root, bg=self.colors['header_bg'], height=35)
        status_frame.pack(side=tk.BOTTOM, fill=tk.X)
        status_frame.pack_propagate(False)
        
        # Üst border
        border = tk.Frame(self.root, bg=self.colors['border_light'], height=1)
        border.pack(side=tk.BOTTOM, fill=tk.X)
        
        # Sol taraf - durum
        self.status_label = tk.Label(status_frame, text="✨ Hazır", font=self.fonts['small'],
                                    fg=self.colors['success'], bg=self.colors['header_bg'])
        self.status_label.pack(side=tk.LEFT, padx=20, pady=8)
        
        # Orta - istatistik
        stats_frame = tk.Frame(status_frame, bg=self.colors['header_bg'])
        stats_frame.pack(pady=8)
        
        task_info = tk.Label(stats_frame, text="📝 5 Aktif", font=self.fonts['small'],
                            fg=self.colors['text_light'], bg=self.colors['header_bg'])
        task_info.pack(side=tk.LEFT, padx=20)
        
        project_info = tk.Label(stats_frame, text="📊 3 Proje", font=self.fonts['small'],
                               fg=self.colors['text_light'], bg=self.colors['header_bg'])
        project_info.pack(side=tk.LEFT, padx=20)
        
        # Sağ taraf - tarih/saat
        import datetime
        now = datetime.datetime.now()
        time_label = tk.Label(status_frame, text=f"🕐 {now.strftime('%d.%m.%Y • %H:%M')}", 
                             font=self.fonts['small'], fg=self.colors['text_light'], 
                             bg=self.colors['header_bg'])
        time_label.pack(side=tk.RIGHT, padx=20, pady=8)
    
    def switch_page(self, command, page_name):
        """Sayfa değiştir - premium geçiş efekti"""
        # Tüm butonları normal hale getir
        for btn_name, btn in self.menu_buttons.items():
            if 'ayarlar' in btn_name:
                btn.configure(bg=self.colors['header_bg'], fg=self.colors['text_light'])
            else:
                btn.configure(bg=self.colors['header_bg'], fg=self.colors['text_secondary'])
        
        # Aktif butonu vurgula
        if page_name in self.menu_buttons:
            if 'ayarlar' in page_name:
                self.menu_buttons[page_name].configure(bg=self.colors['accent_light'], 
                                                      fg=self.colors['accent_primary'])
            else:
                self.menu_buttons[page_name].configure(bg=self.colors['accent_light'], 
                                                      fg=self.colors['accent_primary'])
        
        self.current_page = page_name
        command()
    
    def clear_content(self):
        """İçerik alanını temizle"""
        for widget in self.content_area.winfo_children():
            widget.destroy()
    
    def create_premium_card(self, parent, title, value, color, icon, description=""):
        """Premium 3D kart oluştur"""
        card_frame = tk.Frame(parent, bg=self.colors['card_bg'], relief=tk.FLAT)
        card_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=12, pady=10)
        
        # 3D gölge efekti için iç frame
        inner_frame = tk.Frame(card_frame, bg=self.colors['card_bg'], padx=25, pady=20)
        inner_frame.pack(fill=tk.BOTH, expand=True, padx=2, pady=2)
        
        # Üst kısım - ikon ve değer
        top_frame = tk.Frame(inner_frame, bg=self.colors['card_bg'])
        top_frame.pack(fill=tk.X)
        
        icon_frame = tk.Frame(top_frame, bg=color, width=50, height=50)
        icon_frame.pack(side=tk.LEFT)
        icon_frame.pack_propagate(False)
        
        icon_label = tk.Label(icon_frame, text=icon, font=self.fonts['subtitle'], 
                             fg='white', bg=color)
        icon_label.pack(expand=True)
        
        value_label = tk.Label(top_frame, text=value, font=self.fonts['card_value'], 
                              fg=color, bg=self.colors['card_bg'])
        value_label.pack(side=tk.RIGHT)
        
        # Alt kısım - başlık ve açıklama
        bottom_frame = tk.Frame(inner_frame, bg=self.colors['card_bg'])
        bottom_frame.pack(fill=tk.X, pady=(15, 0))
        
        title_label = tk.Label(bottom_frame, text=title, font=self.fonts['card_title'], 
                              fg=self.colors['text_primary'], bg=self.colors['card_bg'])
        title_label.pack(anchor=tk.W)
        
        if description:
            desc_label = tk.Label(bottom_frame, text=description, font=self.fonts['small'], 
                                 fg=self.colors['text_light'], bg=self.colors['card_bg'])
            desc_label.pack(anchor=tk.W, pady=(2, 0))
        
        # Hover efekti
        def on_enter(e):
            card_frame.configure(relief=tk.RAISED, bd=1)
        
        def on_leave(e):
            card_frame.configure(relief=tk.FLAT, bd=0)
        
        card_frame.bind("<Enter>", on_enter)
        card_frame.bind("<Leave>", on_leave)
        inner_frame.bind("<Enter>", on_enter)
        inner_frame.bind("<Leave>", on_leave)
    
    def show_dashboard(self):
        """Premium dashboard"""
        self.clear_content()
        self.page_title.config(text="Dashboard")
        self.breadcrumb.config(text="Ana Sayfa > Dashboard")
        self.status_label.config(text="✨ Dashboard yüklendi")
        
        # Welcome Banner - Gradient efektli
        welcome_frame = tk.Frame(self.content_area, bg=self.colors['accent_primary'], height=140)
        welcome_frame.pack(fill=tk.X, pady=(0, 40))
        welcome_frame.pack_propagate(False)
        
        welcome_content = tk.Frame(welcome_frame, bg=self.colors['accent_primary'])
        welcome_content.pack(expand=True, padx=40, pady=30)
        
        welcome_label = tk.Label(welcome_content, text="Hoş Geldiniz! ✨", 
                                font=self.fonts['title'], fg='white', 
                                bg=self.colors['accent_primary'])
        welcome_label.pack(anchor=tk.W)
        
        date_label = tk.Label(welcome_content, text="Bugün harika bir gün! Planladığınız 5 görev sizi bekliyor.", 
                             font=self.fonts['normal'], fg='#f0f0f0', 
                             bg=self.colors['accent_primary'])
        date_label.pack(anchor=tk.W, pady=(8, 0))
        
        # Quick Actions
        action_frame = tk.Frame(welcome_content, bg=self.colors['accent_primary'])
        action_frame.pack(anchor=tk.W, pady=(15, 0))
        
        new_task_btn = tk.Button(action_frame, text="+ Yeni Görev", font=self.fonts['menu'],
                                fg=self.colors['accent_primary'], bg='white',
                                relief=tk.FLAT, cursor="hand2", padx=20, pady=8)
        new_task_btn.pack(side=tk.LEFT, padx=(0, 15))
        
        # İstatistik Kartları - Premium tasarım
        stats_frame = tk.Frame(self.content_area, bg=self.colors['bg_primary'])
        stats_frame.pack(fill=tk.X, pady=(0, 40))
        
        stats_title = tk.Label(stats_frame, text="📊 Genel Durum", font=self.fonts['subtitle'], 
                              fg=self.colors['text_primary'], bg=self.colors['bg_primary'])
        stats_title.pack(anchor=tk.W, pady=(0, 20))
        
        cards_frame = tk.Frame(stats_frame, bg=self.colors['bg_primary'])
        cards_frame.pack(fill=tk.X)
        
        # Premium kart verileri
        cards_data = [
            ("Toplam Görev", "24", self.colors['accent_primary'], "📝", "Bu hafta +3"),
            ("Tamamlanan", "18", self.colors['success'], "✅", "%75 başarı"),
            ("Devam Eden", "4", self.colors['warning'], "⏳", "2 yakında"),
            ("Geciken", "2", self.colors['danger'], "⚠️", "Dikkat gerekli")
        ]
        
        for title, value, color, icon, desc in cards_data:
            self.create_premium_card(cards_frame, title, value, color, icon, desc)
        
        # Son Aktiviteler - Modern liste
        activity_main = tk.Frame(self.content_area, bg=self.colors['bg_primary'])
        activity_main.pack(fill=tk.BOTH, expand=True)
        
        # Sol kolon - aktiviteler
        left_column = tk.Frame(activity_main, bg=self.colors['bg_primary'])
        left_column.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 20))
        
        activity_frame = tk.Frame(left_column, bg=self.colors['card_bg'])
        activity_frame.pack(fill=tk.BOTH, expand=True)
        
        activity_header = tk.Frame(activity_frame, bg=self.colors['bg_secondary'], height=60)
        activity_header.pack(fill=tk.X)
        activity_header.pack_propagate(False)
        
        activity_title = tk.Label(activity_header, text="📈 Son Aktiviteler", 
                                 font=self.fonts['subtitle'], fg=self.colors['text_primary'], 
                                 bg=self.colors['bg_secondary'])
        activity_title.pack(side=tk.LEFT, padx=25, pady=20)
        
        # Aktivite listesi
        activity_list = tk.Frame(activity_frame, bg=self.colors['card_bg'])
        activity_list.pack(fill=tk.BOTH, expand=True, padx=25, pady=20)
        
        activities = [
            ("✅", "Web sitesi tasarımı tamamlandı", "10:30", self.colors['success']),
            ("📝", "Müşteri toplantısı eklendi", "09:15", self.colors['info']),
            ("⏰", "Rapor hazırlama - süre yaklaşıyor", "08:45", self.colors['warning']),
            ("📊", "Haftalık rapor oluşturuldu", "Dün 16:20", self.colors['purple'])
        ]
        
        for i, (icon, text, time, color) in enumerate(activities):
            item_frame = tk.Frame(activity_list, bg=self.colors['card_bg'])
            item_frame.pack(fill=tk.X, pady=8)
            
            icon_label = tk.Label(item_frame, text=icon, font=self.fonts['normal'], 
                                 fg=color, bg=self.colors['card_bg'], width=3)
            icon_label.pack(side=tk.LEFT)
            
            text_frame = tk.Frame(item_frame, bg=self.colors['card_bg'])
            text_frame.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(10, 0))
            
            text_label = tk.Label(text_frame, text=text, font=self.fonts['normal'], 
                                 fg=self.colors['text_primary'], bg=self.colors['card_bg'], anchor=tk.W)
            text_label.pack(fill=tk.X)
            
            time_label = tk.Label(item_frame, text=time, font=self.fonts['small'], 
                                 fg=self.colors['text_light'], bg=self.colors['card_bg'])
            time_label.pack(side=tk.RIGHT)
        
        # Sağ kolon - hızlı özetler
        right_column = tk.Frame(activity_main, bg=self.colors['bg_primary'], width=300)
        right_column.pack(side=tk.RIGHT, fill=tk.Y)
        right_column.pack_propagate(False)
        
        # Bugünkü görevler
        today_frame = tk.Frame(right_column, bg=self.colors['card_bg'])
        today_frame.pack(fill=tk.X, pady=(0, 20))
        
        today_header = tk.Frame(today_frame, bg=self.colors['info_light'], height=50)
        today_header.pack(fill=tk.X)
        today_header.pack_propagate(False)
        
        today_title = tk.Label(today_header, text="📅 Bugünkü Görevler", 
                              font=self.fonts['subtitle'], fg=self.colors['info'], 
                              bg=self.colors['info_light'])
        today_title.pack(padx=20, pady=15)
        
        today_content = tk.Frame(today_frame, bg=self.colors['card_bg'])
        today_content.pack(fill=tk.X, padx=20, pady=15)
        
        today_tasks = [
            "Proje sunumu hazırla",
            "Müşteri görüşmesi",
            "Kod review yap"
        ]
        
        for task in today_tasks:
            task_item = tk.Label(today_content, text=f"• {task}", font=self.fonts['small'], 
                               fg=self.colors['text_primary'], bg=self.colors['card_bg'], anchor=tk.W)
            task_item.pack(fill=tk.X, pady=3)
    
    def show_tasks(self):
        self.clear_content()
        self.page_title.config(text="Görevlerim")
        self.breadcrumb.config(text="Ana Sayfa > Görevler")
        self.status_label.config(text="⏳ Görev modülü geliştiriliyor...")
        
        self.create_placeholder("📝", "Görev Yönetimi", "Bu modül Modül 2'de geliştirilecek", 
                               self.colors['accent_primary'])
    
    def show_calendar(self):
        self.clear_content()
        self.page_title.config(text="Takvim")
        self.breadcrumb.config(text="Ana Sayfa > Takvim")
        self.status_label.config(text="⏳ Takvim modülü geliştiriliyor...")
        
        self.create_placeholder("📅", "Takvim & Planlama", "Bu modül Modül 3'te geliştirilecek",
                               self.colors['success'])
    
    def show_projects(self):
        self.clear_content()
        self.page_title.config(text="Projeler")
        self.breadcrumb.config(text="Ana Sayfa > Projeler")
        self.status_label.config(text="⏳ Proje modülü geliştiriliyor...")
        
        self.create_placeholder("📊", "Proje Yönetimi", "Bu modül Modül 4'te geliştirilecek",
                               self.colors['warning'])
    
    def show_reports(self):
        self.clear_content()
        self.page_title.config(text="Raporlar")
        self.breadcrumb.config(text="Ana Sayfa > Raporlar")
        self.status_label.config(text="⏳ Rapor modülü geliştiriliyor...")
        
        self.create_placeholder("📈", "Raporlar & Analiz", "Bu modül Modül 5'te geliştirilecek",
                               self.colors['purple'])
    
    def show_settings(self):
        self.clear_content()
        self.page_title.config(text="Ayarlar")
        self.breadcrumb.config(text="Ana Sayfa > Ayarlar")
        self.status_label.config(text="⏳ Ayarlar modülü geliştiriliyor...")
        
        self.create_placeholder("⚙️", "Sistem Ayarları", "Bu modül Modül 6'da geliştirilecek",
                               self.colors['info'])
    
    def create_placeholder(self, icon, title, subtitle, color):
        """Modern placeholder oluştur"""
        placeholder = tk.Frame(self.content_area, bg=self.colors['card_bg'])
        placeholder.pack(fill=tk.BOTH, expand=True)
        
        content = tk.Frame(placeholder, bg=self.colors['card_bg'])
        content.pack(expand=True)
        
        # Icon circle
        icon_frame = tk.Frame(content, bg=color, width=80, height=80)
        icon_frame.pack(pady=30)
        icon_frame.pack_propagate(False)
        
        tk.Label(icon_frame, text=icon, font=self.fonts['title'], 
                fg='white', bg=color).pack(expand=True)
        
        tk.Label(content, text=title, font=self.fonts['title'], 
                fg=self.colors['text_primary'], bg=self.colors['card_bg']).pack(pady=10)
        tk.Label(content, text=subtitle, font=self.fonts['normal'], 
                fg=self.colors['text_light'], bg=self.colors['card_bg']).pack()
        
        # Coming soon badge
        badge = tk.Label(content, text="🚀 Yakında", font=self.fonts['small'], 
                        fg=color, bg=self.colors['card_bg'])
        badge.pack(pady=20)
    
    def run(self):
        """Uygulamayı başlat"""
        self.switch_page(self.show_dashboard, "dashboard")
        self.root.mainloop()

# Uygulamayı çalıştır
if __name__ == "__main__":
    # Önce giriş ekranını göster
    login = LoginWindow(None)
    login.run()