# Vercel Deployment Rehberi - Calaf.co Muhasebe

## Ön Hazırlık

### 1. Veritabanı Seçimi (Önerilen: PlanetScale)

**PlanetScale (MySQL Uyumlu, Serverless)**
```bash
# PlanetScale CLI kur
npm install -g @planetscale/cli

# Hesap oluştur ve giriş yap
pscale auth login

# Veritabanı oluştur
pscale database create calafco-prod

# Connection string al
pscale connect calafco-prod
```

**Alternatif Seçenekler:**
- Railway MySQL
- AWS RDS MySQL
- Aiven MySQL

### 2. GitHub Repository Hazırlama
```bash
# Kodları GitHub'a yükle
git add .
git commit -m "Production ready: Vercel deployment hazır"
git push origin main
```

## Vercel Deployment

### 1. Vercel Dashboard
1. [Vercel Dashboard](https://vercel.com/dashboard)'a git
2. **"New Project"** tıkla
3. GitHub repository'sini seç: `calafco-accounting`
4. **Framework Preset**: Next.js (otomatik algılanır)

### 2. Environment Variables Ayarla
Vercel Dashboard > Project Settings > Environment Variables:

```env
# Database (PlanetScale örneği)
DB_HOST=aws.connect.psdb.cloud
DB_USERNAME=your-planetscale-username
DB_PASSWORD=pscale_pw_xxxxxxxxxxxxxxxx
DB_DATABASE=calafco-prod
DB_PORT=3306

# Application
NEXTAUTH_SECRET=your-super-secret-32-character-string
NEXTAUTH_URL=https://your-domain.vercel.app
NODE_ENV=production
```

### 3. Custom Domain (Opsiyonel)
1. **Settings** > **Domains**
2. Custom domain ekle
3. DNS ayarlarını güncelle

## Deployment Sonrası

### 1. İlk Kullanıcı Oluşturma
Deploy edildikten sonra:
1. `https://your-domain.vercel.app/login` adresine git
2. **"Kayıt Ol"** sekmesine geç
3. İlk kullanıcını oluştur:
   - **Kullanıcı Adı**: admin
   - **Ad Soyad**: Admin User
   - **E-posta**: admin@yourcompany.com
   - **Firma Adı**: Your Company Name
   - **Şifre**: (güçlü bir şifre)

### 2. Veritabanı Kontrolü
Production setup script otomatik olarak:
- Temel tabloları oluşturur
- Default para birimlerini ekler (TRY, USD, EUR, GBP)
- Firma ayarlarını başlatır

## Önemli Notlar

### Güvenlik
- Environment variables Vercel dashboard'dan yönetilir
- Database credentials asla kodda bulunmaz
- HTTPS otomatik aktif (Vercel default)

### Performans
- Edge caching aktif
- Static generation optimize edilmiş
- CDN dağıtımı otomatik

### Monitoring
```bash
# Vercel CLI ile logs
vercel logs

# Performance monitoring
vercel analytics enable
```

### Backup Stratejisi
- **PlanetScale**: Otomatik backup (7 gün)
- **Railway**: Manuel backup scheduler
- **AWS RDS**: Automated backup (7-35 gün)

## Deployment Komutu
```bash
# Manual deployment
vercel --prod

# GitHub push otomatik deploy tetikler
git push origin main
```

## Sorun Giderme

### Build Hatası
```bash
# Local build test
npm run build

# Type check
npm run type-check
```

### Database Connection
```bash
# Connection test (local)
npm run test:db
```

### Logs Kontrolü
```bash
# Vercel logs
vercel logs --follow

# Function logs
vercel logs --scope=functions
```

## Domain Örnekleri
- `calafco-accounting.vercel.app` (default)
- `muhasebe.yourcompany.com` (custom)
- `app.calaf.co` (custom)

## Maliyet Tahmini
- **Vercel Pro**: $20/ay
- **PlanetScale**: $29/ay
- **Custom Domain**: $12/yıl
- **Toplam**: ~$50-60/ay

## Destek
Deployment sorunları için:
1. Vercel Documentation
2. PlanetScale Documentation  
3. GitHub Issues
