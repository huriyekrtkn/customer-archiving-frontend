# Müşteri Arşiv Sistemi (Frontend)
Bu proje, müşterilerin dijital ortamda arşivlenmesini, yönetilmesini ve güvenli bir şekilde takip edilmesini sağlayan bir React tabanlı müşteri yönetim arayüzüdür. Sistem, backend (Spring Boot) ile entegre çalışır ve JWT (JSON Web Token) tabanlı güvenli bir kimlik doğrulama mekanizmasına sahiptir.

## 🚀 Proje Özellikleri
* Güvenli Kimlik Doğrulama: JWT ile oturum yönetimi.
* Token Yenileme (Refresh Token): Oturum süresi dolduğunda kesintisiz kullanıcı deneyimi için otomatik token yenileme mantığı.
* CRUD İşlemleri: Müşteri ekleme, listeleme, güncelleme ve silme fonksiyonları.
* Modern Arayüz: Kullanıcı dostu ve hızlı yanıt veren bileşenler.
* API Entegrasyonu: Spring Boot backend servisi ile CORS uyumlu iletişim.

## 🛠 Kullanılan Teknolojiler
* Frontend: React (v19.x), JavaScript (ES6+)
* Build Tool: Create React App
* State Management: React Hooks (useState, useEffect)
* HTTP Client: Fetch API (Interceptor mantığı ile özelleştirilmiş)

## 📋 Kurulum ve Çalıştırma
Projeyi yerel bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyin:

1. Gereksinimler
    * Node.js (LTS sürümü önerilir)
    * npm veya yarn

2. Adımlar
    * Projeyi klonlayın:
        git clone https://github.com/huriyekrtkn/customer-archiving-frontend.git
        cd customer-archiving-frontend
    * Bağımlılıkları yükleyin:
        npm install
    * Uygulamayı başlatın:
        npm start
        Uygulama otomatik olarak http://localhost:3000 adresinde açılacaktır.

## 🔐 Kimlik Doğrulama ve Güvenlik Akışı
Sistem, istemci tarafında sessionStorage kullanarak tokenları saklar. İstekler esnasında otomatik olarak Authorization: Bearer <token> başlığı eklenir. Eğer API'den 401 Unauthorized hatası dönerse, sistem arka planda sahip olduğu refreshToken değerini kullanarak yeni bir erişim anahtarı talep eder ve kullanıcının oturumunu kesintisiz devam ettirir.

## 📜 Komutlar
* npm start : Geliştirme modunda çalıştırır.
* npm run build : Projeyi üretim (production) için optimize edilmiş şekilde paketler.
* npm test : Testleri çalıştırır.

## 📁 Dosya Yapısı
* App.jsx: Uygulamanın ana mantığı, API istekleri, token yenileme (interceptor) ve ana arayüz bileşenlerini içerir.
* package.json: Proje bağımlılıkları ve script tanımları.
* public/: Favicon, manifest dosyası ve statik varlıklar.

---
*Bu proje, Müşteri Arşivleme Sistemi'nin istemci tarafı bileşenlerini temsil etmektedir.*