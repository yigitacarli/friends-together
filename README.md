# 🌍 Friends Together - Sosyal Medya Takip Platformu

**Friends Together**, arkadaşlarınla film, dizi, kitap ve oyun deneyimlerini paylaşabileceğin, modern ve güvenli bir sosyal ağdır. Ne izlediğini, ne okuduğunu takip et, incelemelerini yaz ve arkadaşlarının neler yaptığını keşfet!

🌐 **Canlı Site:** [friendstogether.com.tr](https://friendstogether.com.tr)

---

## ✨ Özellikler

### 👥 Sosyal Etkileşim
*   **Arkadaşlık Sistemi:** İstek gönder, kabul et veya reddet.
*   **Topluluk:** Siteye kayıtlı herkesi gör, profillerini ziyaret et.
*   **Özel Akış (Feed):** Sadece arkadaşlarının paylaşımlarını gör.
*   **Yorumlar:** Arkadaşlarının incelemelerine yorum yap (Gizlilik korumalı!).

### 🎬 Medya Takibi
*   **4 Kategori:** Film, Dizi, Kitap, Oyun.
*   **Durum Yönetimi:** İzleniyor, Tamamlandı, İstek Listesi, Yarım Bırakıldı.
*   **Detaylı İnceleme:** Puan ver, yorum yaz, favorilerine ekle.
*   **İstatistikler:** Hangi kategoride ne kadar içerik tükettiğini gör.

### 🛡️ Güvenlik ve Yetkilendirme
*   **Invite-Only:** Sadece davet kodu ile üye olunabilir.
*   **Rol Yönetimi:** Yöneticiler (Admin) özel yetkilere sahiptir.
*   **İçerik Gizliliği:** Arkadaşın olmayanlar senin profiline yorum yapamaz.

---

## 🚀 Kurulum (Geliştirici)

Projeyi yerel ortamda çalıştırmak için:

1.  **Repoyu Klonla:**
    ```bash
    git clone https://github.com/yigitacarli/friends-together.git
    cd friends-together
    ```

2.  **Bağımlılıkları Yükle:**
    ```bash
    npm install
    # veya
    pnpm install
    ```

3.  **Çevresel Değişkenler (.env):**
    Proje kök dizininde `.env` dosyası oluştur ve Firebase yapılandırma bilgilerini gir:
    ```env
    VITE_FIREBASE_API_KEY=YOUR_API_KEY
    VITE_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
    VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
    ...
    ```

4.  **Başlat:**
    ```bash
    npm run dev
    ```

---

## 🛠️ Teknolojiler

*   **Frontend:** React, Vite
*   **Backend / Database:** Firebase (Firestore, Auth)
*   **Stil:** Modern CSS3, Responsive Tasarım, Animasyonlar
*   **Deploy:** GitHub Pages + Custom Domain

---

## 👑 Yönetim

*   **Kurucu:** Yiğit Acarli
*   **İletişim:** acarliyigit@gmail.com

---

© 2026 Friends Together. Tüm hakları saklıdır.
