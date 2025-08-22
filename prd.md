# Calaf.co için geliştirilecek - AI Development Brief

## 🎯 TL;DR
Calaf.co için geliştirilecek bu tam entegre CRM ve muhasebe asistanı, reklam ajanslarının cari hesap, maaş giderleri, gelir-gider takibi ve teklif yönetimini tek bir modern platformda birleştirir. Hedef kullanıcılar, ajans yöneticileri ve finans ekipleri olup, uygulama otomasyon, kolay raporlama ve hızlı veri girişiyle iş süreçlerini hızlandırır. Ürün, mobil uyumlu ve kullanıcı dostu arayüzüyle sektörde fark yaratır.

## 🚀 GOALS

### Business Goals
- Kullanıcı başına aylık aktiflik oranını %40 artırmak
- Ajansların finansal süreçlerinde manuel iş yükünü %60 azaltmak
- İlk 6 ayda 100+ ajansın platforma geçişini sağlamak
- Kullanıcı başına teklif oluşturma oranını %30 artırmak
- Pazar liderliği için yenilikçi otomasyon özellikleriyle öne çıkmak

### User Goals  
- Cari hesap ve finansal işlemleri tek ekrandan yönetmek
- Teklif ve gelir-gider takibini hızlıca yapmak
- Otomatik tekrar eden kayıtlarla zamandan tasarruf etmek
- Kendi raporlarını ve analizlerini kolayca oluşturmak
- Mobil ve masaüstü cihazlarda sorunsuz çalışmak

### Non-Goals
- Vergi beyannamesi hazırlama veya resmi muhasebe entegrasyonu sağlamak
- Banka entegrasyonları üzerinden otomatik para transferi yapmak
- Karmaşık ERP süreçlerini yönetmek
- Ajans dışı sektörlere özel modüller geliştirmek

## 👥 USER PERSONAS & STORIES


**Ajans Yöneticisi (Elif, 38)**
Ajansın finansal süreçlerinden sorumlu, hızlı karar almak isteyen, teknolojiye yatkın.

User Stories:
- Bir ajans yöneticisi olarak, tüm cari hesaplarımı ve bakiyelerini tek ekranda görmek istiyorum ki finansal durumumu anında analiz edebileyim.
- Bir ajans yöneticisi olarak, personel maaş ödemelerini otomatik olarak kaydedebilmek istiyorum ki manuel iş yüküm azalsın.
- Bir ajans yöneticisi olarak, teklifleri hızlıca oluşturup müşterilere göndermek istiyorum ki iş fırsatlarını kaçırmayayım.


**Finans Sorumlusu (Mert, 29)**
Günlük gelir-gider takibi ve raporlama yapan, detaylara önem veren, masaüstü ağırlıklı çalışan.

User Stories:
- Bir finans sorumlusu olarak, gelir-gider kayıtlarını kategori ve cariye göre filtreleyebilmek istiyorum ki detaylı analiz yapabileyim.
- Bir finans sorumlusu olarak, otomatik tekrar eden kayıtları takvimde görebilmek istiyorum ki ödemeleri kaçırmayayım.
- Bir finans sorumlusu olarak, aylık raporları kolayca dışa aktarabilmek istiyorum ki yönetime hızlıca sunabileyim.


**Operasyon Uzmanı (Zeynep, 25)**
Teklif hazırlama ve müşteri iletişimiyle ilgilenen, mobil cihazlardan da çalışan, pratik çözümler arayan.

User Stories:
- Bir operasyon uzmanı olarak, teklif şablonlarını kullanarak hızlıca yeni teklifler oluşturmak istiyorum ki zamandan tasarruf edeyim.
- Bir operasyon uzmanı olarak, tekliflerin onay durumunu takip edebilmek istiyorum ki müşteri süreçlerini yönetebileyim.
- Bir operasyon uzmanı olarak, mobilde de tüm işlemleri kolayca yapabilmek istiyorum ki ofis dışında da verimli olayım.


## 🛠️ FUNCTIONAL REQUIREMENTS


### Cari Hesap Yönetimi (High Priority)
Ajansın tüm müşteri ve tedarikçi hesaplarını merkezi olarak yönetme.

Implementation Details:
- Yeni cari ekleme, düzenleme ve silme işlemleri
- Cari detaylarında iletişim, yetkili, sözleşme/abonelik tarihleri gösterimi
- Cari bakiye (alacak/borç) otomatik hesaplama ve gösterimi
- Cari hareket geçmişi ve filtreleme
- Cari bazında otomatik tekrar eden kayıtlar


### Maaş Giderleri ve Personel Yönetimi (High Priority)
Personel maaşlarının ve bordro periyotlarının otomatik takibi ve kaydı.

Implementation Details:
- Personel kayıt formu (ad, pozisyon, maaş, bordro periyodu)
- Aylık sabit masraf olarak maaş gideri oluşturma
- Otomatik tekrar eden maaş ödemesi kaydı
- Personel bazında geçmiş maaş ödemeleri görüntüleme
- Maaş giderlerinin gelir-gider raporlarına entegrasyonu


### Gelir-Gider Takibi ve Raporlama (High Priority)
Günlük finansal işlemlerin kaydı, filtrelenmesi ve raporlanması.

Implementation Details:
- Gelir-gider kayıt formu (kategori, tutar, tarih, açıklama)
- Otomatik ve manuel kayıt ekleme
- Dönem, kategori ve cariye göre filtreleme
- Raporlama ve dışa aktarma (PDF/Excel)
- Kullanıcı tanımlı rapor ve gösterge oluşturma


### Teklif Yönetimi ve Otomasyon (Medium Priority)
Teklif oluşturma, şablon yönetimi ve otomatik gönderim süreçleri.

Implementation Details:
- Teklif şablonları (hizmet kalemi, birim fiyat, miktar, KDV)
- PDF/Word indirme ve e-posta ile gönderme
- Teklif geçerlilik tarihi ve onay durumu takibi
- Otomatik tekrar eden teklif oluşturma
- Tekliflerin cari ile ilişkilendirilmesi


### Arayüz ve Kullanıcı Deneyimi (High Priority)
Modern, hızlı ve erişilebilir kullanıcı arayüzü.

Implementation Details:
- Responsive (mobil/masaüstü) tasarım
- Sol menü + üst bar ile kolay gezinme
- Klavye kısayolları desteği
- Karanlık/aydınlık tema seçimi
- Hızlı veri girişi ve hata önleyici validasyonlar


## 🎨 USER EXPERIENCE

### İlk Giriş ve Onboarding
- Kullanıcı e-posta ile davet edilir veya kayıt olur.
- Kısa bir tanıtım turu ile modüller tanıtılır.
- Demo verisiyle ana ekran ve dashboard gösterilir.
- Kullanıcı ilk cari hesabını veya personelini ekler.
- Klavye kısayolları ve tema seçimi önerilir.

### Core Experience

**Step 1: Cari Hesap Yönetimi**
Kullanıcı, sol menüden 'Cariler' modülüne girer ve yeni cari ekler.

Details:
- Formda zorunlu alanlar: ad, iletişim, yetkili, sözleşme tarihi
- Kaydedilen cari, listede anında görünür
- Cari detayında bakiye ve hareket geçmişi gösterilir
- Düzenleme ve silme işlemleri için onay penceresi


**Step 2: Maaş Giderleri ve Personel**
Personel modülünde yeni çalışan eklenir, maaş ve bordro periyodu tanımlanır.

Details:
- Personel listesi ve detay ekranı
- Aylık otomatik maaş gideri oluşturma
- Geçmiş maaş ödemeleri tablosu


**Step 3: Gelir-Gider Takibi**
Gelir veya gider kaydı eklenir, kategori ve cariye atanır.

Details:
- Kayıt formunda kategori, tutar, tarih, açıklama alanları
- Otomatik tekrar eden kayıtlar için periyot seçimi
- Filtreleme ve arama fonksiyonu


**Step 4: Teklif Oluşturma ve Gönderme**
Teklif şablonundan yeni teklif hazırlanır, PDF/Word olarak indirilir veya e-posta ile gönderilir.

Details:
- Hizmet kalemi, birim fiyat, miktar, KDV hesaplama
- Geçerlilik tarihi ve onay durumu takibi
- Teklifin cariye atanması


**Step 5: Dashboard ve Raporlama**
Ana ekranda grafikler, istatistikler ve özelleştirilebilir raporlar görüntülenir.

Details:
- Aylık gelir-gider grafikleri (çizgi, çubuk)
- Cari bazında ciro dağılımı (pasta)
- Kullanıcı tanımlı tarih aralığı ve gösterge seçimi


### Gelişmiş Özellikler ve Kenar Durumlar
- Klavye kısayolları ile hızlı veri girişi
- Karanlık/aydınlık tema geçişi
- Otomatik hatırlatıcılar ve bildirimler
- Kullanıcı bazında yetkilendirme ve erişim kontrolü
- Hatalı veri girişinde anlık uyarı ve düzeltme önerisi

### Arayüz ve UX Vurguları
- Modern, minimal ve mobil uyumlu tasarım
- Sol menü + üst bar ile sezgisel gezinme
- Renk körlüğü ve erişilebilirlik desteği
- Hızlı yükleme ve düşük gecikme süresi
- Klavye kısayolları ve hızlı işlem butonları

## 📖 NARRATIVE
Elif, ajansının finansal süreçlerini yönetirken sürekli Excel dosyaları ve e-posta trafiğiyle uğraşmaktan yorulmuştu. Yeni CRM ve muhasebe asistanını kullanmaya başladığında, ilk gününde tüm cari hesaplarını kolayca ekleyip bakiyelerini anında görebildi. Personel maaşlarını otomatik olarak sisteme tanımladı ve her ayın 5’inde otomatik ödeme kaydı oluşturdu. Artık gelir-gider takibini tek ekrandan yapıyor, teklifleri birkaç tıkla hazırlayıp müşterilere gönderiyor ve tüm finansal raporları anında yönetimle paylaşabiliyor. 

Mert ise, günlük işlemleri ve raporlamayı çok daha hızlı yapabildiği için zamandan tasarruf ediyor. Zeynep, ofis dışında bile mobil cihazından teklif hazırlayabiliyor ve müşteri onaylarını anlık takip edebiliyor. Ajans ekibi, modern ve sezgisel arayüz sayesinde iş yükünü azaltırken, yöneticiler de finansal görünürlüğü ve kontrolü artırıyor. Bu dönüşüm, ajansın hem verimliliğini hem de müşteri memnuniyetini önemli ölçüde yükseltiyor.

## 📊 SUCCESS METRICS

### User-Centric Metrics
- Aylık aktif kullanıcı oranı %40+
- Kullanıcı başına ortalama günlük işlem sayısı 10+
- Teklif oluşturma ve gönderme süresi <3 dakika
- Kullanıcı memnuniyet skoru (NPS) 8+
- Mobil cihazdan giriş yapan kullanıcı oranı %50+
- Klavye kısayolu kullanım oranı %30+

### Business Metrics
- İlk 6 ayda 100+ ajansın platforma geçişi
- Kullanıcı başına teklif oluşturma oranında %30 artış
- Finansal süreçlerde manuel iş yükünde %60 azalma
- Yıllık müşteri kaybı oranında %20 azalma
- Pazar liderliği için yenilikçi özelliklerin lansmanı

### Technical Metrics
- Ortalama yanıt süresi <500ms
- %99,9 uptime
- GDPR ve KVKK uyumluluğu
- Yatay ölçeklenebilirlik ve yük dengeleme

### Tracking Plan
- Kullanıcı kaydı ve ilk giriş
- Yeni cari ekleme ve düzenleme
- Gelir-gider kaydı oluşturma
- Teklif oluşturma ve gönderme
- Otomatik tekrar eden kayıt oluşturma
- Dashboard ve rapor görüntüleme
- Tema ve kısayol tercihleri

## 🔧 TECHNICAL CONSIDERATIONS

### Technical Needs
- React veya Vue tabanlı modern frontend
- Node.js/Express veya .NET Core backend
- PostgreSQL veya MySQL ilişkisel veritabanı
- RESTful API ve WebSocket ile gerçek zamanlı bildirimler
- PDF/Word dosya üretimi için sunucu tarafı servis
- Mobil uyumlu responsive tasarım
- Kapsamlı test otomasyonu

### Integration Points
- E-posta gönderimi için SMTP/SendGrid entegrasyonu
- Kullanıcı doğrulama için OAuth2/SSO
- PDF/Word dosya üretimi için üçüncü parti kütüphaneler
- Bildirimler için push servisleri
- Raporlama için dışa aktarım API’leri

### Data Storage & Privacy
- Tüm hassas veriler için AES-256 şifreleme
- Kullanıcı verilerinde GDPR/KVKK uyumu
- Veri yedekleme ve felaket kurtarma planı
- Kullanıcıya veri silme ve dışa aktarma hakkı
- Rol bazlı erişim kontrolü

### Scalability & Performance
- Yatay ölçeklenebilir mikroservis mimarisi
- Önbellekleme ve sorgu optimizasyonu
- Gerçek zamanlı bildirimler için yük dengeleme
- Otomatik izleme ve hata raporlama

### Potential Challenges
- Karmaşık finansal iş akışlarının doğru modellenmesi
- Kullanıcıların eski sistemlerden veri migrasyonu
- Mobil ve masaüstü deneyimin tutarlı olması
- Klavye kısayolları ve erişilebilirlik desteğinin uygulanması
- Yasal mevzuat ve veri gizliliği gereksinimlerinin karşılanması

---
**Original Business Idea:** Sen, Calaf.co reklam ajansı için tam entegre bir CRM ve muhasebe asistanısın. Kullanıcı aşağıdaki özelliklerde bir web/masaüstü uygulama geliştirmeni istiyor. Öncelikle, her modülü ayrıntılı şekilde planla; sonra da gerekli veri yapıları, iş akışları ve kullanıcı arayüzü unsurlarını özetle:

1. Cari Hesap Yönetimi  
   - Yeni cari ekleme, düzenleme ve silme  
   - Cari detaylarında iletişim bilgileri, yetkili kişileri, sözleşme/abonelik tarihlerini gösterme  
   - Cari bakiye takibi (alacak/borç dengesi)

2. Maaş Giderleri  
   - Personel kayıt formu (ad, pozisyon, maaş, bordro periyotları)  
   - Aylık sabit masraf olarak “Maaş Giderleri” kalemi  
   - Otomatik tekrar eden ödeme kaydı (örneğin her ayın 5’inde)

3. Günlük Gelir–Gider Takibi  
   - Kayıt formunda; kategori (ofis, pazarlama vb.), tutar, tarih, açıklama  
   - Otomatik ve manuel günlük kayıt imkânı  
   - Filtreleme: döneme, kategoriye, cariye göre

4. Fiyat Teklif Formu Oluşturma  
   - Teklif şablonları: hizmet kalemleri, birim fiyat, miktar, KDV hesaplama  
   - PDF/Word indirme ve e-posta ile direkt gönderme  
   - Teklif geçerlilik tarihi, onay durumu takibi

5. Otomatik Tekrar Eden Kayıtlar  
   - Cari bazlı satış/borç girişi formunda “Aylık otomatik tekrar et” seçeneği  
   - Kullanıcı dilediği periyodu (aylık, üç aylık vb.) tanımlayabilsin  
   - Oluşturulan tekrar kayıtların takvimde görünmesi ve uyarı/hatırlatma

6. Grafikler & İstatistikler  
   - Dashboard: aylık gelir–gider grafikleri (çizgi, çubuk), cari bazında ciro dağılımı (pasta)  
   - Gelir–gider trend analizleri, en kârlı–zararlı cari listesi  
   - Dilersen kullanıcı kendi raporlarını oluşturmak için tarih aralığı ve gösterge seçebilsin

7. Arayüz Tasarımı  
   - Modern, minimal ve mobil uyumlu (responsive)  
   - Net renk paleti, kolay gezinme (sol menü + üst bar)  
   - Veri girişi modüllerinde hızlı “klavye kısayolları” desteği  
   - Karanlık ve aydınlık tema seçeneği

Son olarak, her modülün başında kısa bir “Nasıl Kullanılır?” rehberi metni olsun. Tüm özelliklerin listesini, gerekli veri tablolarını (örn. Cariler, İşlemler, Personel), ve uygulamanın ana ekran akışını (wireframe metni) sıralı bir şekilde sun.



**IMPORTANT:** Before starting to code the above PRD, ask the user a limited number of clarifying questions to make sure you're clear on what they want. When considering the questions you're going to ask the user, understand that the user is not a technical user, so ask more things regarding the functionality or the taste.