## Calaf.co Muhasebe & CRM — Svelte + SvelteKit Yeniden Yapım PRD

### Amaç (TL;DR)
Reklam ajanslarının cari hesap, personel maaşları, gelir–gider, teklif ve fatura süreçlerini tek bir modern, mobil uyumlu uygulamada toplamak. Mevcut Next.js/React sürümündeki işlevselliği birebir koruyarak Svelte + SvelteKit ile istemci-tarafı (CSR) odaklı, hızlı ve sezgisel bir arayüz sunmak.

### İş Hedefleri (prd.md’den doğrulanmış)
- Kullanıcı başına aylık aktiflik oranını %40 artırmak
- Finansal süreçlerde manuel iş yükünü %60 azaltmak
- İlk 6 ayda 100+ ajansı platforma taşımak
- Kullanıcı başına teklif oluşturma oranını %30 artırmak

### Kullanıcı Hedefleri (prd.md’den doğrulanmış)
- Carileri ve finansal işlemleri tek ekrandan yönetmek
- Teklif, gelir–gider, fatura süreçlerini hızlıca tamamlamak
- Tekrarlayan kayıtlarla operasyonu otomatikleştirmek
- Mobil ve masaüstünde aksamadan çalışmak

### Kapsam Dışı (prd.md’den doğrulanmış)
- Resmi muhasebe entegrasyonları ve vergi beyannameleri
- Banka entegrasyonları ile otomatik transfer
- Karmaşık ERP süreçleri

### Persona’lar (özet)
- Ajans Yöneticisi: Hızlı karar, özet metrikler, teklif/fatura görünürlüğü
- Finans Sorumlusu: Detaylı kayıt, filtreleme, dışa aktarma
- Operasyon Uzmanı: Mobilde hızlı teklif, durum takibi


## Mimari Tasarım

### Çerçeve ve Render Politikası
- SvelteKit (TypeScript) kullanılacak.
- Global SSR kapalı: tüm UI saf CSR.
  - SvelteKit’te kök layout’ta `export const ssr = false;`.
- Hydration guard eşleniği: `onMount` ile mount tamamlanana kadar “Yükleniyor…” fallback gösterilir.
- Tema yönetimi: `document.documentElement.classList` ile `light|dark` class’ı uygulanır.

### Dizin Yapısı (öneri)
```
src/
  lib/
    types/schema.ts         # Aşağıdaki veri modelleri
    stores/app.ts          # Tüm state ve aksiyonlar (localStorage persist)
    utils/format.ts        # Para/tarih formatlama, yardımcılar
  components/
    ui/*                   # Button, Card, Input, Table, Select, Switch, Dialog, Dropdown, Tabs, Textarea, Label, Badge
    layout/Header.svelte
    layout/Sidebar.svelte
    HydrationGuard.svelte
  routes/
    +layout.ts             # ssr=false
    +layout.svelte         # Guard + tema + layout (Header/Sidebar)
    +page.svelte           # Root yönlendirme (login/dashboard)
    login/+page.svelte
    dashboard/+page.svelte
    clients/+page.svelte
    clients/[id]/+page.svelte
    employees/+page.svelte
    employees/[id]/+page.svelte
    income/+page.svelte
    expenses/+page.svelte
    cash-accounts/+page.svelte
    cash-accounts/[id]/+page.svelte
    invoices/+page.svelte
    quotes/+page.svelte
    debts/+page.svelte
    regular-payments/+page.svelte
    settings/+page.svelte
```

### Bağımlılıklar
- Tailwind CSS (+ tailwind-merge opsiyonel)
- date-fns (+ `tr` locale)
- lucide-svelte (ikonlar)
- html2canvas, jspdf (PDF üretimi)
- Ses: `public/assets/sounds/ios-notification.mp3`

### Temel İlkeler
- Tüm görsel/etkileşimli bileşenler istemci bileşenidir.
- Global store tek kaynaktır; localStorage ile persist edilir.
- Re-render azami verim için Svelte reactivity kullanılır.


## Veri Modeli (mevcut şemaya eşlenik)

Not: Aşağıdaki tipler `src/lib/database-schema.ts` ile birebir korunacaktır; Svelte projesinde `src/lib/types/schema.ts` olarak taşınır.

- User: id, email, password, name, username?, role?('admin'|'user'), companyName, createdAt, updatedAt
- Currency: id, code, name, symbol, isActive
- Category: id, name, type('income'|'expense'), color, isDefault, userId, createdAt
- Client: id, name, email?, phone?, address?, taxNumber?, contactPerson?, contractStartDate?, contractEndDate?, currencyId, balance, isActive, userId, createdAt, updatedAt
- Employee: id, name, position, netSalary, currencyId, payrollPeriod('monthly'|'weekly'|'biweekly'), paymentDay, isActive, userId, iletişim ve sözleşme alanları, createdAt/updatedAt
- Transaction: id, type('income'|'expense'), amount, currencyId, categoryId, clientId?, employeeId?, cashAccountId?, description, notes?, transactionDate, isVatIncluded, vatRate, isRecurring(+period), parentTransactionId?, userId, createdAt/updatedAt
- Bonus: id, employeeId, type('bonus'|'advance'|'overtime'|'commission'), amount, currencyId, description, paymentDate, userId, createdAt
- Quote & QuoteItem: teklif başlığı/kalemleri, subtotal, vatAmount, total, tevkifat alanları (applied/rate/amount/net), status, dates, currencyId
- Debt: id, clientId?, title, amount, currencyId, dueDate, status('pending'|'paid'|'overdue'), type('payable'|'receivable'), description?, userId, createdAt/updatedAt
- Invoice & InvoiceItem: invoiceNumber, clientId, issueDate, dueDate, items, subtotal, vatRate, vatAmount, tevkifatApplied/rate/amount, total, netAmountAfterTevkifat, status, notes, recurring (period/months/parent/index), payment durumu (paidAmount, remainingAmount, paymentDate), currencyId, userId, createdAt/updatedAt
- PendingBalance: id, clientId, invoiceId, amount, dueDate, description, status('pending'|'paid'|'overdue'), createdAt
- RegularPayment: id, title, amount, currencyId, dueDate, frequency('weekly'|'monthly'|'quarterly'|'yearly'), category('loan'|'installment'|'rent'|'utilities'|'food'|'insurance'|'other'), status('pending'|'paid'), description?, userId, createdAt/updatedAt
- CompanySettings: id, companyName, address, phone, email, website?, taxNumber?, lightModeLogo?, darkModeLogo?, quoteLogo?, tevkifatRates?: TevkifatRate[], createdAt/updatedAt
- TevkifatRate: id, code, numerator, denominator, description, isActive
- AppNotification: id, type('receivable_due'|'payable_due'|'regular_payment_due'|'quote_followup'), title, description?, link?, date, createdAt, read
- NotificationPreferences: enableNotifications, enableSound, enableNative


## Durum Yönetimi (Store)

### Genel
- Svelte `writable` store; tek kaynak: `app`.
- Persist: localStorage (`calaf-storage`).
- İlk mount’ta restore; mount tamamlanana kadar UI guard.

### Durum Alanları
- Auth: `isAuthenticated`, `user`, `users`
- Veriler: `clients, employees, transactions, categories, currencies, quotes, debts, bonuses, cashAccounts, invoices, pendingBalances, regularPayments`
- Bildirimler: `notifications`, `notificationPrefs`
- Ayarlar: `companySettings`, `theme`, `showAmounts`, `sidebarOpen`
- Hata/yükleme: `error`, `loading`

### Aksiyonlar (mevcut uygulamayla birebir)
- Auth: `login`, `register`, `changePassword`, `setAuth`, `logout`
- UI: `setTheme`, `setSidebarOpen`, `toggleShowAmounts`, `setError`, `setLoading`
- CRUD: add/update/delete (clients, employees, categories, transactions, quotes, debts, bonuses, cashAccounts, regularPayments)
- Invoice özel: `addInvoice`, `updateInvoice`, `deleteInvoice`, `markInvoiceAsPaid`, `generateRecurringInvoices`
- PendingBalance: `addPendingBalance`, `markPendingBalanceAsPaid`, `deletePendingBalance`
- Notifications: `generateNotifications`, `deleteNotification`, `markNotificationAsRead`, `clearAllNotifications`, `updateNotificationPrefs`
- Helpers: `getClientBalance`, `getClientPendingBalance`, `getTotalPendingBalances`, `processPaymentFromTransaction`
- Demo: `initDemoData`

### Persist Ayrıntıları
- Anahtar: `calaf-storage`
- Kısmi persist: mevcut projedeki alanların tamamı korunur


## Rotalar ve Sayfalar

### Root `/`
- Mount sonrası yönlendirme: `isAuthenticated ? /dashboard : /login`

### `/login`
- Demo login ve kayıt; başarı sonrası `/dashboard`

### `/dashboard`
- Kartlar: Bu ay ciro, kasa durumu (seçili kasa), aktif cariler, personel sayısı, dönem net, bekleyen alacaklar
- Bölümler: Gelir–gider analizi (dinamik tarih aralığı), yaklaşan borçlar/maaşlar/düzenli ödemeler, bekleyen fatura bakiyeleri, yaklaşan gelirler, kredi borçları
- Grafik: Günlük gelir, gider (+bonus +düzenli ödeme), kredi borçları, maaş; net
- “Rakamları Göster/Gizle” tüm metriklere uygulanır

### `/clients`, `/clients/[id]`
- Cari CRUD, arama/filtre; bakiye ve pending balance hesapları; detay sayfası

### `/employees`, `/employees/[id]`
- Personel CRUD; bonus/avans/mesai/komisyon kayıtları; maaş dönemselliği ve özetler

### `/income`, `/expenses`
- Transaction listeleri; yeni kayıt; filtreler

### `/cash-accounts`, `/cash-accounts/[id]`
- Kasa CRUD; default kasa; bakiye (base + ilgili transactions)

### `/invoices`
- Fatura oluştur/düzenle: kalemler, KDV, tevkifat, tekrar (period, months)
- İşlemler: görüntüle/düzenle/sil; `Mark as Paid` (ödeme transaction + pending balance güncelleme)
- Liste sütunları: No, Cari, Açıklama, Tarih, Vade, Durum, Tutar, Kalan

### `/quotes`
- Teklif oluştur/düzenle; KDV/tevkifat hesapları; PDF üretimi (html2canvas + jsPDF, çok sayfa)
- Durumlar: draft, sent, accepted, rejected, expired; hızlı kopyalama

### `/debts`
- Borç/Alacak kayıtları (payable/receivable), vade ve durum yönetimi

### `/regular-payments`
- Düzenli ödeme CRUD; kategori/sıklık; yaklaşanlar listesi (vade sırasına göre)

### `/settings`
- Kategoriler (varsayılanlar silinemez), Kullanıcılar, Şirket Bilgileri, Tevkifat Oranları, Logo & Tasarım, Genel (tema, profil readonly, şifre değişimi)


## İş Kuralları ve Hesaplamalar

### Kimlik Doğrulama
- `login(username,password)`:
  1) Store’daki kullanıcılar (güncel şifreler) 
  2) Mevcut session user 
  3) Default admin (ilk kullanıcı yoksa): `admin@calaf.co / 532d7315`
- `changePassword`: mevcut şifre kontrolü, min 6, users dizisinde ve localStorage’da güncelle, 1 sn sonra auto logout

### Dashboard Hesaplamaları
- Bu ay ciro: tarih aralığı filtreli income toplamı
- Yaklaşan borç/gelir: 30 gün penceresi, tip ve tarih filtresi
- Bekleyen bakiyeler: `pendingBalances` durum/duedate sıralı
- Maaş projeksiyonu: payrollPeriod’e göre occurrence üret; ayın ilk ödeme gününde bonus/avans ayarlaması tek kez
- Düzenli ödemeler projeksiyonu: frequency ile aralıkta tüm occurrence’lar
- Grafik: gün bazında gelir, gider (+bonus +düzenli), kredi borçları, maaş ve net

### Fatura Kuralları
- Kalemler → `subtotal`
- KDV: `vatAmount = subtotal * (vatRate/100)`
- Tevkifat: yalnız KDV üzerinden: `tevkifatAmount = vatAmount * (num/den)`
- Toplam: `total = subtotal + vatAmount`
- Net tahsilat: `netAmountAfterTevkifat = total - tevkifatAmount`
- Tekrarlayan fatura: `isRecurring + recurringPeriod(monthly|quarterly|yearly) + recurringMonths`
  - Ana fatura tarihine göre her periyotta yeni fatura; `parentInvoiceId`, `recurringIndex`
  - Her tekrarlanan fatura için `PendingBalance` oluştur
- Ödeme:
  - `markInvoiceAsPaid(id, amount, paymentDate?)`: income transaction ekle; fatura `paidAmount/remainingAmount/status/paymentDate` güncelle; ilgili pendingBalance `paid`
- Transaction’dan ödeme işleme:
  - `processPaymentFromTransaction(id)`: description `Fatura: <no>` içeriyorsa ve tutar yeterliyse ilgili fatura `paid`, pendingBalance `paid`
- Silme:
  - Fatura silerken: açıklamasında `Fatura: <no>` geçen transactions ve ilgili pendingBalance temizlenir
  - Parent fatura silinirse child tekrarlayanların tümü silinir

### Teklif Kuralları
- KDV/Tevkifat hesapları fatura ile aynı mantık; tevkifat KDV’den düşer
- PDF: görünmez container → html2canvas → jsPDF; çok sayfa desteği

### Düzenli Ödemeler
- CRUD; kategori ve sıklıkla plan; yaklaşanlar 30 gün penceresi

### Bildirimler
- Koşullar:
  - 1 hafta içinde yaklaşan alacak/ödemeler (debts)
  - Düzenli ödemelerin sıradaki occurrence’ı 1 hafta içinde ise
  - Teklifler: `sent` durumunda validUntil yaklaşan ya da 7+ gündür yanıt yoksa
- Prefs: `enableNotifications`, `enableSound`, `enableNative`
- Yeni bildirim sayısı arttığında ses çal (izin hataları silent `catch`)

### Kasa
- Bakiye: default/seçili kasanın base balance + ilgili transactions toplam etkisi

### Ayarlar
- Kategori CRUD (varsayılan silinemez), kullanıcı CRUD, şirket bilgileri (adres/iletişim), logo (light/dark/quote) base64, tevkifat oranları CRUD, tema toggle, şifre değişimi


## UI/UX Gereksinimleri

- Tailwind + modern, minimal tasarım; responsive
- TR yerelleştirme (date-fns `tr`), para formatı (₺ vb.)
- Erişilebilirlik: focus ring’ler, ESC ile dialog kapatma, klavye navigasyonu
- Sidebar: mobil overlay, pb-24 alt boşluk ile footer çakışmasını önleme; tüm menüler her sayfada görünür (özellikle “Faturalar” ve “Düzenli Ödemeler”)


## Test ve Kabul Kriterleri

- Auth: yanlış şifre hatası, başarıda yönlendirme, şifre değişiminde auto logout
- Sidebar: tüm cihazlarda menüler görünür; mobilde overlay kapanır
- Dashboard: tarih aralığına göre metrik ve grafikler tutarlı; show/hide amounts çalışır
- Invoices: KDV/tevkifat, recurring, pendingBalances doğru; `Mark as Paid` akışı doğru; silme ilişkileri temizler
- Quotes: KDV/tevkifat doğru; PDF indirme ve çok sayfa çalışır
- Regular Payments: CRUD ve vade sırası doğru
- Notifications: kurallara göre üretim; sayı arttığında ses
- Cash Accounts: bakiye hesabı doğru
- Settings: kategori (default korunur), kullanıcı, şirket bilgisi, logo (base64), tevkifat CRUD, tema, şifre değişimi


## Performans ve Erişilebilirlik

- SSR kapalı; hızlı CSR gezinmesi
- Büyük listelerde minimal DOM, gerekiyorsa sanallaştırma planlanabilir
- Dialog/menü erişilebilirliği; düşük gecikmeli etkileşimler


## Dağıtım ve Konfigürasyon

- SvelteKit prod build; statik asset’ler optimize
- Ortam değişkenlerine ihtiyaç yok (demo); ses ve PDF kütüphaneleri client’ta


## Göç Planı

- Tarayıcı bazlı veriyi korumak için aynı localStorage anahtarı kullanılabilir: `calaf-storage`.
- Şema ve alan adları korunursa kullanıcı verileri doğrudan restore edilir.


## Açık Sorular

- Demo auth ileride gerçek backend ile değiştirilecek mi? OAuth/SSO?
- Çoklu organizasyon/rol tabanlı yetki kapsam dahil edilecek mi?
- Teklif kalemleri store’a çok satırlı yapı olarak taşınacak mı (şu an PDF görüntülemede tek satır simülasyonu var)?


## Ek: Svelte Bileşen ve Layout Notları

- `+layout.ts`: `export const ssr = false;`
- `+layout.svelte`: `onMount` ile store `restore()` ve `applyThemeToDocument()`; mount bitene kadar guard fallback
- `Header.svelte`: bildirim ses player, tema toggle, mobil menü butonu
- `Sidebar.svelte`: navigationItems (Dashboard, Clients, Employees, Income, Expenses, Cash Accounts, Quotes, Invoices, Debts, Regular Payments, Settings); `pb-24` alt boşluk
- UI bileşenleri: mevcut Tailwind sınıfları korunacak şekilde Svelte portu (variant/size kombinasyonları dahil)


