import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { log } from './vite';

// WebSocket bağlantı havuzu
const clients = new Set<WebSocket>();

// Mesaj tipleri
interface WebSocketMessage {
  type: 'location_report' | 'notification' | 'reminder';
  action: 'create' | 'update' | 'delete';
  data: any;
}

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  wss.on('connection', (ws) => {
    log('WebSocket bağlantısı kuruldu', 'websocket');
    
    // Yeni bağlantıyı havuza ekle
    clients.add(ws);
    
    // Bağlantı sağlığını kontrol et
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    
    // Bağlantı kapatıldığında
    ws.on('close', () => {
      log('WebSocket bağlantısı kapandı', 'websocket');
      clients.delete(ws);
    });
    
    // Hata durumunda
    ws.on('error', (error) => {
      log(`WebSocket hatası: ${error.message}`, 'websocket');
    });
    
    // Yeni bir mesaj alındığında (genellikle kullanılmaz, server-initiated)
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        log(`WebSocket mesajı alındı: ${JSON.stringify(data)}`, 'websocket');
      } catch (error) {
        log(`WebSocket mesaj işleme hatası: ${error.message}`, 'websocket');
      }
    });
    
    // Bağlantı kurulduğunda hoşgeldin mesajı
    const welcomeMessage: WebSocketMessage = {
      type: 'notification',
      action: 'create',
      data: { message: 'WebSocket bağlantısı başarıyla kuruldu' }
    };
    
    ws.send(JSON.stringify(welcomeMessage));
  });
  
  // Bağlantı sağlığı kontrolü (her 30 saniyede bir)
  const interval = setInterval(() => {
    wss.clients.forEach((ws: WebSocket & { isAlive?: boolean }) => {
      if (ws.isAlive === false) {
        clients.delete(ws);
        return ws.terminate();
      }
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);
  
  // Server kapatıldığında interval'i temizle
  wss.on('close', () => {
    clearInterval(interval);
  });
  
  log('WebSocket sunucusu başlatıldı', 'websocket');
  
  return wss;
}

// Tüm bağlı istemcilere mesaj gönder
export function broadcastMessage(message: WebSocketMessage) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Konum bildirimi oluşturulduğunda
export function notifyLocationReportCreated(report: any) {
  broadcastMessage({
    type: 'location_report',
    action: 'create',
    data: report
  });
}

// Konum bildirimi güncellendiğinde
export function notifyLocationReportUpdated(report: any) {
  broadcastMessage({
    type: 'location_report',
    action: 'update',
    data: report
  });
}

// Konum bildirimi silindiğinde
export function notifyLocationReportDeleted(reportId: number) {
  broadcastMessage({
    type: 'location_report',
    action: 'delete',
    data: { id: reportId }
  });
}