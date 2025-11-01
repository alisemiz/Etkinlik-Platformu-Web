const express = require("express");
const cors = require("cors");

// Uygulamayı başlat
const app = express();
const PORT = 5000; // Backend'imizin çalışacağı port

// Middleware'leri (ara yazılımları) kullan
app.use(cors()); // CORS'a izin ver
app.use(express.json()); // Gelen isteklerin JSON body'lerini parse et

// --- TEMEL BİR TEST ROTASI OLUŞTURALIM ---
// Frontend'den buraya istek atıp "Merhaba" mesajını alacağız.
app.get("/api/test", (req, res) => {
  res.json({ message: "Tebrikler! Backend API ile bağlantı kurdunuz." });
});

// Sunucuyu dinlemeye başla
app.listen(PORT, () => {
  console.log(`Backend sunucusu http://localhost:${PORT} adresinde çalışıyor.`);
});
