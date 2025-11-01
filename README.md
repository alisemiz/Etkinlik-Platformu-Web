# 🚀 Gerçek Zamanlı Etkinlik Yönetim Platformu

Bu proje, modern web teknolojilerini (React, Vite) kullanarak Google Firebase'in gerçek zamanlı veritabanı (Firestore) ve kullanıcı kimlik doğrulama (Authentication) hizmetlerini entegre eden tam kapsamlı bir etkinlik yönetim platformudur.

Platform, anlık veri senkronizasyonu sayesinde sayfayı yenilemeye gerek kalmadan tüm kullanıcılar için canlı güncellemeler sağlar.

## ✨ Temel Özellikler

- **Gerçek Zamanlı Senkronizasyon (Live Sync):** Veritabanındaki (Firestore) herhangi bir değişiklik (oluşturma, katılım, silme), tüm aktif kullanıcılara anında yansıtılır.
- **Tam CRUD İşlevselliği:** Etkinlikleri oluşturma, okuma, güncelleme ve silme imkanı.
- **Kullanıcı Yetkilendirme:** Firebase Auth ile güvenli giriş, kayıt ve oturum yönetimi.
- **Akıllı Filtreleme:** Kullanıcı tarafından oluşturulan veya katıldığı etkinlikleri gösterme sekmeleri.
- **Dinamik Arama:** Etkinlik başlığına göre anlık filtreleme yapan arama çubuğu.
- **Profesyonel Arayüz:** Düz CSS ile hazırlanmış koyu tema (Dark Mode) ve akıcı animasyonlar.

## 🛠️ Kullanılan Teknolojiler

| Kategori             | Teknoloji                     | Açıklama                                          |
| :------------------- | :---------------------------- | :------------------------------------------------ |
| **Ön Uç (Frontend)** | **React.js (Vite)**           | Hızlı ve modern kullanıcı arayüzü kütüphanesi.    |
| **Veritabanı**       | **Google Firebase Firestore** | Gerçek zamanlı NoSQL veritabanı.                  |
| **Kimlik Doğrulama** | **Firebase Authentication**   | Kullanıcı girişi ve yönetimi.                     |
| **Tasarım**          | **Custom CSS**                | Özelleştirilmiş, mobil uyumlu koyu tema stilleri. |

## ⚙️ Kurulum ve Çalıştırma

### Ön Koşullar

1.  Node.js (LTS sürümü)
2.  Bir **Firebase Projesi** (Firestore ve Authentication etkinleştirilmiş).

### Adım 1: Proje Dosyalarını Hazırlama

1.  Bu depoyu (repository) yerel makinenize klonlayın.
2.  Firebase Konsolundan (Proje Ayarları > Uygulama Ekle > Web) aldığınız yapılandırma (config) bilgilerini kopyalayın.
3.  `frontend/src/firebase.js` dosyasını açın ve `firebaseConfig` objesinin içeriğini kendi bilgilerinizle değiştirin.

### Adım 2: Bağımlılıkları Yükleme ve Uygulamayı Başlatma

Terminali açın ve projenizin ana klasöründen `frontend` dizinine geçin:

```bash
cd etkinlik-platformu/frontend
```
Gerekli tüm bağımlılıkları (React, Firebase, vb.) yükleyin:
                    npm install
Geliştirme sunucusunu başlatın:
                      npm run dev
