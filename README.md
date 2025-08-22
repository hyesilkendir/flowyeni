# Calaf.co Hesap Defteri (Accounting Ledger)

A comprehensive CRM and accounting assistant for advertising agencies, built with Next.js, TypeScript, and MySQL.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd calafco-hesap-defteri
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your database credentials
   ```

4. **Setup database**
   ```bash
   # Test database connection
   node test-db-connection.js
   
   # Run migrations and seed data
   npm run db:migrate:fresh
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - URL: `http://localhost:3000`
   - Default admin: `admin` / `532d7315`

## 🏗️ Project Architecture

### Technology Stack
- **Frontend:** Next.js 14 (App Router) + React 18 + TypeScript
- **Backend:** Next.js API Routes + Drizzle ORM
- **Database:** MySQL with UTF-8 encoding
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** Zustand with persistence
- **UI Framework:** Radix UI primitives

### Core Modules
1. **Cari Hesap Yönetimi** (Client Management)
2. **Maaş Giderleri** (Salary Expenses)
3. **Gelir-Gider Takibi** (Income-Expense Tracking)
4. **Teklif Yönetimi** (Quote Management)
5. **Dashboard & Raporlama** (Dashboard & Reporting)

## 📋 Build Rules & Requirements

### Environment Variables
```bash
# Required Database Configuration
DB_HOST=localhost
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=calafco_accounting
DB_PORT=3306

# Required Application Configuration
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
```

### Database Setup Rules
- MySQL server must be running on specified port
- Database must use UTF-8 encoding (`utf8mb4_unicode_ci`)
- All tables must be created via Drizzle migrations
- Initial seed data must be loaded for currencies and default categories

### Development Scripts
```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database Management
npm run db:generate      # Generate new migrations
npm run db:migrate       # Push migrations to database
npm run db:studio        # Open Drizzle Studio
npm run db:drop          # Drop all tables
npm run db:migrate:run   # Run custom migration script
npm run db:migrate:fresh # Fresh migration with seed data
```

### Database Schema Rules

**Core Tables (Required):**
- `users` - User authentication and profiles
- `currencies` - Currency definitions (TRY, USD, EUR)
- `categories` - Income/expense categories
- `clients` - Customer/supplier management
- `employees` - Staff and salary management
- `transactions` - Financial transactions
- `quotes` - Quote/proposal management
- `debts` - Receivable/payable tracking
- `bonuses` - Employee bonus/advance payments
- `company_settings` - Company configuration
- `tevkifat_rates` - Turkish tax withholding rates

**Data Integrity Rules:**
- All foreign keys must be properly indexed
- Currency relationships must be maintained
- User isolation (multi-tenant) must be enforced
- Soft deletes for critical data (clients, employees)

### Application Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Main dashboard
│   ├── clients/          # Client management
│   ├── employees/        # Employee management
│   ├── income/           # Income tracking
│   ├── expenses/         # Expense tracking
│   ├── quotes/           # Quote management
│   ├── debts/            # Debt tracking
│   ├── cash-accounts/    # Cash account management
│   └── settings/         # Application settings
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui components
│   └── layout/          # Layout components
├── lib/                 # Business logic
│   ├── db/              # Database schema and connection
│   ├── store.ts         # Zustand state management
│   └── utils.ts         # Utility functions
└── hooks/               # Custom React hooks
```

### State Management Rules

**Zustand Store Structure:**
- Authentication state (user, isAuthenticated)
- Data arrays (clients, employees, transactions, etc.)
- UI state (theme, sidebar, showAmounts)
- Actions for CRUD operations
- Persistence with localStorage

**Required Store Actions:**
- User authentication (login, logout, setAuth)
- CRUD operations for all entities
- Theme switching (light/dark)
- Data filtering and search
- Demo data initialization

### UI/UX Requirements

**Design System:**
- Tailwind CSS with custom color palette
- shadcn/ui component library
- Responsive design (mobile-first)
- Dark/light theme support
- Accessibility compliance

**Layout Structure:**
- Sidebar navigation (collapsible)
- Header with user info and theme toggle
- Main content area with breadcrumbs
- Modal dialogs for forms
- Toast notifications for feedback

### Feature Implementation Rules

**Client Management:**
- Add, edit, delete clients
- Contact information and contract dates
- Balance tracking (receivable/payable)
- Transaction history
- Search and filtering

**Employee Management:**
- Employee profiles with salary info
- Payroll period configuration
- Automatic salary expense creation
- Bonus and advance payment tracking

**Financial Tracking:**
- Income and expense categorization
- Recurring transaction support
- VAT calculation and tracking
- Multi-currency support
- Date-based filtering

**Quote Management:**
- Quote templates and items
- PDF generation and export
- Email integration
- Status tracking (draft, sent, accepted)
- Turkish tax calculations (Tevkifat)

**Reporting & Dashboard:**
- Monthly income/expense charts
- Client-based revenue analysis
- Category-wise expense breakdown
- Debt aging reports
- Custom date range filtering

### Security & Performance Rules

**Security Requirements:**
- User authentication and authorization
- Data validation on client and server
- SQL injection prevention via ORM
- XSS protection
- CSRF protection

**Performance Requirements:**
- Lazy loading for large datasets
- Pagination for lists
- Optimistic updates for better UX
- Image optimization
- Bundle size optimization

### Testing & Quality Assurance

**Code Quality:**
- TypeScript strict mode enabled
- ESLint configuration for code standards
- Prettier for code formatting
- Proper error handling throughout

**Testing Requirements:**
- Unit tests for business logic
- Integration tests for API routes
- E2E tests for critical user flows
- Database migration testing

### Deployment Rules

**Build Process:**
```bash
# Production build
npm run build

# Database migration (production)
npm run db:migrate:run

# Start production server
npm start
```

**Environment Requirements:**
- Node.js 18+ on production server
- MySQL 8.0+ database
- SSL certificate for HTTPS
- Environment variables properly configured
- Database backups configured

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify MySQL server is running
   - Check environment variables in `.env.local`
   - Run `node test-db-connection.js` to test connection

2. **Migration Errors**
   - Ensure database exists: `CREATE DATABASE calafco_accounting`
   - Check UTF-8 encoding: `ALTER DATABASE calafco_accounting CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
   - Run `npm run db:migrate:fresh` for fresh setup

3. **Build Errors**
   - Clear Next.js cache: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && npm install`
   - Check TypeScript errors: `npx tsc --noEmit`

4. **Environment Variables**
   - Copy `env.example` to `.env.local`
   - Ensure all required variables are set
   - Restart development server after changes

## 📊 Development Workflow

### Git Workflow
- Feature branches for new development
- Pull request reviews required
- Semantic commit messages
- Automated testing on CI/CD

### Database Changes
- All schema changes via Drizzle migrations
- Migration files must be version controlled
- Seed data for development environment
- Backup before major schema changes

## 🎯 Success Metrics

### User-Centric Metrics
- Aylık aktif kullanıcı oranı %40+
- Kullanıcı başına ortalama günlük işlem sayısı 10+
- Teklif oluşturma ve gönderme süresi <3 dakika
- Kullanıcı memnuniyet skoru (NPS) 8+
- Mobil cihazdan giriş yapan kullanıcı oranı %50+

### Technical Metrics
- Ortalama yanıt süresi <500ms
- %99,9 uptime
- GDPR ve KVKK uyumluluğu
- Yatay ölçeklenebilirlik ve yük dengeleme

---

**Built for Calaf.co - Modern Accounting for Advertising Agencies** 