# Vercel KV Deployment Rehberi - Calaf.co Muhasebe 

## 🆓 Tamamen Ücretsiz Deployment

### Avantajlar
- ✅ **$0 maliyet** (Hobby plan)
- ✅ **30,000 commands/month** ücretsiz
- ✅ **256MB storage** 
- ✅ **Native Vercel entegrasyonu**
- ✅ **Redis tabanlı hız**
- ✅ **Sıfır konfigürasyon**

## 🚀 Hızlı Deployment (5 Dakika)

### 1. Vercel'e Git
1. [Vercel Dashboard](https://vercel.com/dashboard)'a giriş yapın
2. **"New Project"** tıklayın
3. GitHub'dan **`hyesilkendir/floww`** repository'sini seçin
4. **Import** tıklayın

### 2. Storage Kurulumu (Tek Tıkla!)
1. Project import olduktan sonra > **"Settings"** tab
2. Sol menüden **"Storage"** sekmesi
3. **"Create Database"** > **"KV"** seçin
4. Database adı: `calaf-kv` (veya istediğiniz isim)
5. **"Create"** tıklayın

**🎉 Bu kadar! Environment variables otomatik eklenir.**

### 3. Deploy & Test
1. **"Deployments"** tabına gidin
2. Son deployment'a tıklayın
3. **"Visit"** ile uygulamayı açın
4. İlk kullanıcı oluşturun:
   - **Kullanıcı Adı**: `admin`
   - **Şifre**: `admin123`
   - (veya kendi bilgilerinizi girin)

## 📊 Vercel KV Özellikleri

### Kapasiteler (Ücretsiz)
```
✅ 30K commands/month (günde ~1000 işlem)
✅ 256MB total storage
✅ 30MB max request
✅ Redis data types destekli
✅ TTL (expire) desteği
```

### Performance
```
🚀 Edge locations'da çalışır
🚀 <10ms latency (global)
🚀 JSON optimizasyonu
🚀 Connection pooling
```

## 🔧 Otomatik Konfigürasyon

Deployment sonrası otomatik olarak:

1. **Environment Variables** eklenir:
   ```
   KV_REST_API_URL=https://xxx.kv.vercel-storage.com
   KV_REST_API_TOKEN=xxx
   KV_URL=redis://xxx
   ```

2. **Default data** oluşturulur:
   - Para birimleri (TRY, USD, EUR, GBP)
   - Firma ayarları
   - Default kategoriler

3. **Admin user** hazır:
   - Username: `admin`
   - Password: `admin123`

## 📱 Domain Ayarları

### Custom Domain Ekleme
1. **Settings** > **Domains**
2. Domain adınızı girin: `muhasebe.yourcompany.com`
3. DNS ayarlarını güncelleyin:
   ```
   CNAME muhasebe your-project.vercel.app
   ```

### Önerilen Domain'ler
- `app.calaf.co`
- `muhasebe.yourcompany.com`
- `accounting.yourcompany.com`

## 🔍 Monitoring & Debug

### Logs Kontrolü
```bash
# Vercel CLI ile
vercel logs --follow

# Web'den
Dashboard > Functions > View Function Logs
```

### KV Database Kontrolü
```bash
# Vercel Dashboard
Settings > Storage > calaf-kv > Browser
```

### Performance Monitoring
```bash
# Analytics aktifleştir
vercel analytics enable
```

## 🛠️ Development Workflow

### Local Development
```bash
# KV emülasyonu için
npm install -g @vercel/cli
vercel dev

# Veya normal Next.js
npm run dev
```

### Environment Sync
```bash
# Production env'i locale çek
vercel env pull .env.local
```

## 📈 Scaling Options

### Ücretsiz Limitler Aşıldığında
- **Pro Plan**: $20/ay
- **Unlimited KV**: 100M commands/ay
- **Team features**: Collaboration tools

### Alternative Scaling
- KV → PostgreSQL (Neon)
- KV → PlanetScale MySQL
- Data export/import tools

## 🚨 Önemli Notlar

### Data Persistence
- ✅ **Kalıcı storage** - veriler silinmez
- ✅ **Automatic backup** by Vercel
- ✅ **Point-in-time recovery** (Pro plan)

### Security
- ✅ **HTTPS zorunlu**
- ✅ **Environment variables** encrypted
- ✅ **Edge network** protection
- ✅ **DDoS protection** included

### Limitations
- ⚠️ **Single region** (ücretsiz)
- ⚠️ **30K commands/month** limit
- ⚠️ **No SQL joins** (NoSQL)

## 🆘 Troubleshooting

### Common Issues

**1. KV Connection Error**
```
Çözüm: Vercel Dashboard > Storage > Recreate KV
```

**2. Environment Variables Missing**
```
Çözüm: Settings > Environment Variables > Add manually
```

**3. Build Errors**
```bash
# Local build test
npm run build
```

**4. Deploy Hook**
```
Çözüm: Settings > Git > Redeploy
```

## 🎯 Production Checklist

- [ ] KV Database oluşturuldu
- [ ] Environment variables otomatik eklendi  
- [ ] Custom domain bağlandı (opsiyonel)
- [ ] İlk admin kullanıcı oluşturuldu
- [ ] Test data eklendi
- [ ] Analytics aktifleştirildi
- [ ] Error monitoring kuruldu

## 📞 Support

### Vercel Support
- [Vercel Docs](https://vercel.com/docs)
- [KV Documentation](https://vercel.com/docs/storage/vercel-kv)
- [Discord Community](https://vercel.com/discord)

### Project Support
- GitHub Issues
- Email: info@calaf.co

---

**🎉 Deployment tamamlandı! Artık tamamen ücretsiz, hızlı ve güvenilir bir muhasebe uygulamanız var.**
