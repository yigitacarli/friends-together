# Friends Together

Friends Together, arkadaş çevresi için kapalı bir sosyal paylaşım uygulamasıdır.
Kullanıcılar içerik (film, dizi, kitap, oyun, anime, müzik, yazılım) paylaşabilir, kısa metin postu atabilir, beğeni/yorum yapabilir ve topluluk içindeki üyeleri görebilir.

Canlı adres: https://friendstogether.com.tr

## Teknoloji

- Next.js 15 (App Router, TypeScript)
- TailwindCSS + shadcn/ui
- Firebase Auth + Firestore
- GitHub Pages (static export)

## Önemli Not (GitHub Pages Uyumu)

Bu proje `Next.js static export` ile yayınlanır. Bu nedenle dinamik route'lar query tabanlıdır:

- Üye detayı: `/member?uid=<uid>`
- Post detayı: `/post?id=<postId>`

## Özellikler

- Invite-only kayıt/giriş
  - Firestore `settings/inviteConfig` içindeki davet kodu
  - veya `invites` koleksiyonunda e-posta whitelist
- Akış (feed)
  - Firestore'dan gerçek zamanlı post çekme
  - Beğeni/yorum
  - Tür filtresi + popüler sıralama
- Yeni Ekle modalı
  - Yıldız puanı zorunlu
  - İçerik tipi, durum, görünürlük
- Profil
  - Görünen isim, kullanıcı adı, tag düzenleme
- Topluluk
  - Kayıtlı üyeler ve profillere geçiş
- Sohbet Alanı
  - Ortak chat akışı
- Admin Paneli
  - Davet kodu yönetimi
  - Davet e-posta yönetimi
  - Üye adı/kullanıcı adı/tag düzenleme

## Hızlı Başlangıç

```bash
npm install
npm run dev:next
```

Uygulama: `http://localhost:3000`

Production build:

```bash
npm run build:next
npm run start:next
```

## Ortam Değişkenleri

`.env.local` dosyası:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_INVITE_CODE=TRACKER2026
```

Örnek dosya: `.env.local.example`

## GitHub Pages Deploy

Workflow dosyası: `.github/workflows/deploy.yml`

- Build komutu: `npm run build:next`
- Artifact klasörü: `out/`
- Branch: `main`

Repository Secrets (önerilen):

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_INVITE_CODE`

Not: Workflow içinde geriye dönük uyumluluk için `VITE_*` secret fallback desteği de vardır.

## Güvenlik

### 1) "API key açıkta" uyarısı normal mi?

Kısmen normal. Firebase Web API key (`NEXT_PUBLIC_FIREBASE_API_KEY`) istemci tarafında görünür olmak zorundadır.
Bu key tek başına gizli veri erişimi vermez.

Asıl güvenliği sağlayanlar:

- Firestore Security Rules
- Auth zorunluluğu
- Rol tabanlı yetki
- Gerekirse App Check

### 2) Gerçek risk nerede?

Aşağıdakiler repo'ya girerse risklidir:

- Service account JSON
- `private_key`
- Admin SDK gizli anahtarları
- `.env.local` içindeki özel değerler

Bu repoda izlenen dosyalarda bu tip gizli anahtar bulunmamalıdır.

### 3) Hemen yapman gerekenler

1. Google Cloud Console'da Web API key için **HTTP referrer restriction** aç:
   - `https://friendstogether.com.tr/*`
   - `https://www.friendstogether.com.tr/*`
   - `http://localhost:*/*`
2. API restriction ile sadece gerekli API'leri açık bırak.
3. Firestore rules'u sıkılaştır (aşağıdaki örnek).
4. Şüphe varsa key rotate et.
5. Firebase App Check'i etkinleştir (özellikle abuse önleme için).

## Örnek Firestore Rules

Detaylı örnek: `firestore.rules.example`

## Lisans

Bu proje özel kullanım içindir.
