import nodemailer from 'nodemailer';

// Env değişkenlerini kontrol et
if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
  console.warn('E-posta göndermek için GMAIL_USER ve GMAIL_APP_PASSWORD env değişkenleri gerekli');
}

// E-posta gönderici ayarları
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // TLS kullanımı
  auth: {
    user: process.env.GMAIL_USER || '',
    pass: process.env.GMAIL_APP_PASSWORD || '',
  },
});

// E-posta gönderme fonksiyonu
export async function sendEmail({
  to,
  subject,
  html,
  text,
  attachments = [],
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: any[];
}): Promise<boolean> {
  try {
    // E-posta bilgileri geçerli mi kontrol et
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('E-posta göndermek için GMAIL_USER ve GMAIL_APP_PASSWORD env değişkenleri gerekli');
      return false;
    }

    // E-posta gönder
    const info = await transporter.sendMail({
      from: `"ErmakPlan" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text,
      html,
      attachments,
    });

    console.log('E-posta gönderildi:', info.messageId);
    return true;
  } catch (error) {
    console.error('E-posta gönderirken hata oluştu:', error);
    return false;
  }
}

// Transporter test fonksiyonu (isteğe bağlı kullanım)
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    // Ayarları doğrula
    await transporter.verify();
    console.log('E-posta sunucusu bağlantısı başarılı');
    return true;
  } catch (error) {
    console.error('E-posta sunucusu bağlantısı başarısız:', error);
    return false;
  }
}