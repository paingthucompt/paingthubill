# Invoice Craftsman - Self-Hosting Guide

## Project Overview

**Invoice Craftsman** is a specialized invoice generator and payout management tool designed for freelancers and agencies handling multi-currency transactions (Thai Baht THB and Myanmar Kyat MMK). This application streamlines the entire workflow of managing client payouts, tracking transactions, calculating commissions automatically, and generating professional invoices.

### Repository Contents

This repository contains:
- ✅ **Frontend Application** - React + Vite + TypeScript + shadcn/ui + Tailwind CSS
- ✅ **Database Schema** - SQL migrations for PostgreSQL (in `/supabase/migrations/`)
- ❌ **Backend Server** - **NOT INCLUDED** (originally used Supabase/Lovable Cloud)

**Important:** To self-host this application, you need to build a custom backend API server that implements the required endpoints and business logic described in this guide.

---

## How It Works (User Workflow)

Here's the typical workflow for using Invoice Craftsman:

1. **Sign Up / Login**
   - Create a new account with email and password
   - Secure authentication with session management
   - Access your personal dashboard

2. **Add Clients**
   - Enter client details (name, phone, commission percentage)
   - Set preferred payout currency (THB or MMK)
   - Add multiple bank accounts with:
     - Account number
     - Bank name
     - Account holder name
   - Add platform details (e.g., Facebook, YouTube, TikTok) with optional Payout IDs
   - Platform Payout IDs are optional - not all platforms require them

3. **Record Transactions**
   - Select a client from your list
   - Enter transaction details:
     - Original amount (USD) - optional
     - Incoming amount (THB) - required
     - Source platform (selected from client's platforms or "Other")
     - Destination bank account (selected from client's accounts)
     - Exchange rate (MMK) - **conditionally required**:
       - Required only if client's preferred currency is MMK
       - Optional/not needed if client prefers THB
     - Additional fees (if any)
     - Transaction date
     - Notes (optional)
   - System automatically calculates:
     - Commission amount based on client's percentage
     - Net payout amount
     - Currency conversion (if applicable)

4. **Generate Invoices**
   - Navigate to the Invoices tab
   - Select a transaction to generate an invoice
   - System automatically generates:
     - Sequential invoice number (PT-000001, PT-000002, etc.)
     - Complete invoice with all transaction details
     - Commission breakdown
     - Net payout amount
   - Export options:
     - PDF format for professional documentation
     - JPEG format for easy sharing

5. **Manage Your Data**
   - **Clients Tab:** View, edit, delete clients
   - **Transactions Tab:** View all transactions (sorted newest first), edit or delete
   - **Invoices Tab:** View all invoices (sorted newest first)
   - **Copy Feature:** One-click copy of bank account numbers for easy reference

6. **Access Information**
   - About page with app information
   - Contact page for support
   - Privacy Policy page

---

## Usefulness (Who Should Use This?)

### Target Users

- **Freelancers** managing payouts from multiple platforms (Facebook, YouTube, TikTok, Instagram)
- **Digital Agencies** handling client payments across different currencies
- **Content Creators** receiving payments from various sources
- **Payout Managers** who need to track commissions and conversions

### Key Benefits

✅ **Simplifies Multi-Currency Management**
   - Handles THB and MMK seamlessly
   - Automatic exchange rate calculations
   - No manual currency conversion errors

✅ **Automates Commission Calculations**
   - Set commission percentage per client
   - Automatic deduction from payouts
   - Transparent commission breakdown in invoices

✅ **Professional Invoice Generation**
   - Sequential numbering system
   - PDF and JPEG export options
   - Complete transaction documentation

✅ **Organized Record Keeping**
   - All clients in one place
   - Transaction history with sorting
   - Easy search and reference

✅ **Time Saving**
   - No manual calculations needed
   - Quick invoice generation
   - Copy-paste bank details instantly

✅ **Flexible Platform Support**
   - Multiple platform tracking per client
   - Optional Payout ID field (not all platforms need it)
   - "Other" option for unlisted platforms

---

## Key Features (Summary)

- 🔐 **Secure User Authentication** - Email/password registration and login system
- 👥 **Client Management** - Track commissions, currency preferences, multiple bank accounts (with account names), platform details with optional payout IDs
- 💰 **Transaction Recording** - Log original USD amounts, incoming THB, source platforms, conditional exchange rates, destination bank selection
- 🔄 **Automatic Payout Calculation** - Multi-currency support with commission and fee handling
- 📄 **Invoice Generation** - Sequential numbering (PT-XXXXXX format) with PDF and JPEG export
- 📊 **Dashboard Management** - View and manage invoices (newest first), transactions (newest first), and clients
- 📋 **Copy Account Numbers** - One-click copy feature for bank account numbers
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices
- 🌐 **Informational Pages** - About, Contact, and Privacy Policy pages

---

## Frontend Setup (Running Locally)

### Prerequisites

- Node.js (v18 or higher)
- pnpm package manager (recommended) or npm

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/deskhei9-bot/invoice-craftsman-32.git
   cd invoice-craftsman-32
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api
   ```

4. **Run the development server:**
   ```bash
   pnpm dev
   ```

5. **Access the application:**
   Open `http://localhost:8080` in your browser.

**Note:** The frontend requires a running backend API to function properly. See the next section for backend setup.

---

## Building a Custom Backend (Self-Hosting Guide)

Since this application was originally built on Supabase/Lovable Cloud, you need to create a custom backend to self-host it.

### Step 1: Choose Your Backend Technology

Select a backend framework based on your preference:
- **Node.js/Express** - JavaScript/TypeScript
- **Python/Django or Flask** - Python
- **PHP/Laravel** - PHP
- **Ruby on Rails** - Ruby
- **Go/Gin** - Go

### Step 2: Database Setup

1. **Install PostgreSQL** on your server (version 12 or higher)

2. **Create a database:**
   ```bash
   createdb invoice_craftsman_db
   ```

3. **Apply the schema:**
   Run the SQL migration files from `/supabase/migrations/` in order:
   ```bash
   psql -d invoice_craftsman_db -f supabase/migrations/20240101000000_initial_schema.sql
   psql -d invoice_craftsman_db -f supabase/migrations/20240101000001_add_functions.sql
   # Apply all migration files in chronological order
   ```

### Step 3: Database Schema Overview

The database includes these main tables:

**`clients` table:**
- `id` (uuid, primary key)
- `user_id` (uuid, references auth users)
- `name` (text, required)
- `phone` (text, optional)
- `commission_percentage` (numeric, default 0.00)
- `preferred_payout_currency` (text: 'THB' or 'MMK', default 'THB')
- `bank_account` (jsonb array) - Each entry contains:
  - `accountNumber` (string)
  - `bankName` (string)
  - `accountName` (string) - Account holder name
- `platform_details` (jsonb array) - Each entry contains:
  - `platform_name` (string, required) - e.g., 'Facebook', 'YouTube', 'TikTok', 'Instagram', 'Other'
  - `payout_id` (string, **optional**) - Not all platforms require a Payout ID
- `created_at`, `updated_at` (timestamps)

**`transactions` table:**
- `id` (uuid, primary key)
- `client_id` (uuid, references clients)
- `original_amount_usd` (numeric, nullable)
- `incoming_amount_thb` (numeric, required)
- `fees` (numeric, default 0.00)
- `payout_currency` (text: 'THB' or 'MMK', default 'THB')
- `payout_amount` (numeric, calculated)
- `exchange_rate_mmk` (numeric, default 0.00) - Only required for MMK payouts
- `source_platform` (text, nullable) - Selected from client's platform_details
- `source_platform_payout_id` (text, nullable) - Corresponding payout_id if available
- `payment_destination` (jsonb) - Selected bank account containing:
  - `accountNumber` (string)
  - `bankName` (string)
  - `accountName` (string)
- `transaction_date` (date, default CURRENT_DATE)
- `notes` (text, nullable)
- `created_at`, `updated_at` (timestamps)

**`invoices` table:**
- `id` (uuid, primary key)
- `invoice_number` (text, unique, format: 'PT-XXXXXX')
- `client_id` (uuid, references clients)
- `transaction_id` (uuid, references transactions)
- `total_amount` (numeric) - Incoming amount
- `commission_amount` (numeric) - Calculated commission
- `net_amount` (numeric) - Final payout amount
- `created_at` (timestamp)

**Database Functions:**
- `generate_invoice_number()` - Generates sequential invoice numbers with 'PT-' prefix (e.g., PT-000001, PT-000002)
- `update_updated_at_column()` - Trigger function for automatic timestamp updates on UPDATE operations

**Important Schema Notes:**
- All Supabase-specific SQL (RLS policies, `auth.uid()` references) have been removed from migrations
- Migrations use standard PostgreSQL syntax
- Invoice numbering uses 'PT-' prefix (customizable in the function)
- Exchange rate field defaults to 0.00 for THB transactions
- Platform payout IDs are optional to support platforms without specific identifiers

### Step 4: Implement Authentication

Create a user authentication system:

1. **User Registration:**
   - Accept email and password
   - Hash passwords (use bcrypt or similar)
   - Store user in `auth.users` table or create your own `users` table
   - Return JWT token

2. **User Login:**
   - Verify email and password
   - Generate JWT token with user ID
   - Return token to client

3. **Session Management:**
   - Validate JWT tokens on protected endpoints
   - Extract user ID from token for authorization

### Step 5: Build API Endpoints

Implement the following REST API endpoints:

#### Authentication Endpoints
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Get current user session

#### Client Endpoints
- `GET /api/clients` - List all clients for logged-in user
- `POST /api/clients` - Create new client (set user_id from JWT)
- `PUT /api/clients/:id` - Update client (verify ownership)
- `DELETE /api/clients/:id` - Delete client (verify ownership)

#### Transaction Endpoints
- `GET /api/transactions` - List transactions for user's clients (ordered by created_at DESC)
- `POST /api/transactions` - Create transaction with auto-calculation
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

#### Invoice Endpoints
- `GET /api/invoices` - List invoices for user's clients (ordered by created_at DESC)
- `POST /api/invoices` - Generate invoice from transaction
- `GET /api/invoices/:id/pdf` - Generate PDF invoice
- `GET /api/invoices/:id/jpeg` - Generate JPEG invoice

### Step 6: Implement Authorization

Ensure Row-Level Security (RLS) equivalent logic:

- **Clients:** Users can only access their own clients (`WHERE user_id = <logged_in_user_id>`)
- **Transactions:** Users can only access transactions for their clients (join with clients table)
- **Invoices:** Users can only access invoices for their clients (join with clients table)

### Step 7: Implement Business Logic

#### Payout Amount Calculation (POST /api/transactions)

```javascript
// Pseudo-code for payout calculation
function calculatePayoutAmount(transaction, client) {
  const incomingAmount = transaction.incoming_amount_thb;
  const fees = transaction.fees || 0;
  const commissionRate = client.commission_percentage / 100;
  
  // Calculate commission
  const commissionAmount = incomingAmount * commissionRate;
  
  // Calculate net amount in THB
  const netAmountTHB = incomingAmount - fees - commissionAmount;
  
  // Convert to client's preferred currency
  if (client.preferred_payout_currency === 'MMK') {
    const exchangeRate = transaction.exchange_rate_mmk;
    if (!exchangeRate || exchangeRate === 0) {
      throw new Error('Exchange rate is required for MMK payouts');
    }
    return netAmountTHB * exchangeRate;
  }
  
  // For THB payouts, no conversion needed
  return netAmountTHB;
}
```

**Key Business Logic Notes:**
- Exchange rate is **only required** when `client.preferred_payout_currency === 'MMK'`
- For THB payouts, the exchange rate can be 0.00 or omitted
- Commission is calculated on the incoming THB amount
- Fees are deducted before currency conversion
- Final payout amount is in the client's preferred currency

#### Invoice Number Generation

Use the `generate_invoice_number()` database function or implement in backend:

```sql
-- Function already exists in migrations
-- Returns format: 'PT-000001', 'PT-000002', etc.
SELECT generate_invoice_number();
```

### Step 8: Implement Invoice Generation

#### PDF Generation (Server-side)

Use a library like:
- **Node.js:** Puppeteer, PDFKit, jsPDF
- **Python:** ReportLab, WeasyPrint
- **PHP:** TCPDF, FPDF

Generate invoices with:
- Invoice number (PT-XXXXXX)
- Client details
- Transaction details
- Commission breakdown
- Net payout amount

#### JPEG Generation

Convert PDF to JPEG or use HTML-to-image libraries:
- **Node.js:** Puppeteer (screenshot), sharp
- **Python:** Pillow, wkhtmltoimage

---

## Connecting Frontend to Custom Backend

### Step 1: Update Supabase Client

Replace or bypass `src/integrations/supabase/client.ts`:

**Option A:** Create a new API client (`src/lib/api-client.ts`):
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  
  return response.json();
}
```

### Step 2: Update Component Data Fetching

Modify these files to use your custom API:

**`src/pages/Auth.tsx`:**
- Replace `supabase.auth.signUp()` with `POST /api/auth/signup`
- Replace `supabase.auth.signInWithPassword()` with `POST /api/auth/login`

**`src/components/dashboard/ClientsTab.tsx`:**
- Replace `supabase.from('clients').select()` with `GET /api/clients`
- Replace `supabase.from('clients').insert()` with `POST /api/clients`
- Replace `supabase.from('clients').update()` with `PUT /api/clients/:id`
- Replace `supabase.from('clients').delete()` with `DELETE /api/clients/:id`

**`src/components/dashboard/TransactionsTab.tsx`:**
- Replace `supabase.from('transactions').select()` with `GET /api/transactions`
- Replace `supabase.from('transactions').insert()` with `POST /api/transactions`

**`src/components/dashboard/InvoicesTab.tsx`:**
- Replace `supabase.from('invoices').select()` with `GET /api/invoices`
- Replace invoice generation logic to call backend endpoints

### Step 3: Update Authentication Flow

In `src/pages/Dashboard.tsx`:
- Replace `supabase.auth.getSession()` with `GET /api/auth/session`
- Replace `supabase.auth.onAuthStateChange()` with custom auth state management

---

## Environment Variables

### Backend Environment Variables

Create a `.env` file in your backend project:

```env
# Database Connection
DATABASE_URL=postgresql://user:password@localhost:5432/invoice_craftsman_db

# Server Configuration
PORT=3000
NODE_ENV=production

# Authentication & Security
JWT_SECRET=your-secret-key-here-change-this
JWT_EXPIRATION=7d

# CORS Configuration (allow frontend domain)
CORS_ORIGIN=https://your-frontend-domain.com
```

### Frontend Environment Variables

Update `.env` in the frontend project root:

```env
# Custom Backend API URL
VITE_API_BASE_URL=https://your-backend-api.com/api

# ============================================
# REMOVE these Supabase variables if present:
# ============================================
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_PUBLISHABLE_KEY=...
# VITE_SUPABASE_PROJECT_ID=...
```

**Important Notes:**
- The original `.env` file contains Supabase configuration that must be removed or replaced
- `VITE_API_BASE_URL` should point to your custom backend API
- For local development, use `http://localhost:3000/api`
- For production, use your actual backend domain
- Make sure CORS is properly configured on your backend to allow requests from your frontend domain

---

## Deployment

### Backend Deployment

1. **Build your backend application** (if using TypeScript or requires a build step)
   ```bash
   npm run build
   # or
   pnpm build
   ```

2. **Set up PostgreSQL** on your server
   ```bash
   # Install PostgreSQL
   sudo apt-get update
   sudo apt-get install postgresql postgresql-contrib
   
   # Create database
   sudo -u postgres createdb invoice_craftsman_db
   ```

3. **Run migrations** to create database schema
   ```bash
   psql -d invoice_craftsman_db -f supabase/migrations/[migration-file].sql
   # Run all migration files in order
   ```

4. **Set environment variables** on the server
   - Copy `.env.example` to `.env`
   - Update all values with production credentials

5. **Deploy backend** using one of these methods:
   
   **Option A: PM2 (Recommended for Node.js)**
   ```bash
   npm install -g pm2
   pm2 start server.js --name invoice-api
   pm2 startup
   pm2 save
   ```
   
   The project includes a PM2 configuration file at `deploy/pm2.config.cjs` that you can use:
   ```bash
   pm2 start deploy/pm2.config.cjs
   ```
   
   **Option B: Docker**
   ```dockerfile
   # Create Dockerfile for your backend
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install --production
   COPY . .
   EXPOSE 3000
   CMD ["node", "server.js"]
   ```
   
   **Option C: Systemd Service**
   ```bash
   # Create /etc/systemd/system/invoice-api.service
   sudo systemctl enable invoice-api
   sudo systemctl start invoice-api
   ```

### Frontend Deployment

1. **Build the frontend:**
   ```bash
   pnpm build
   # Creates /dist folder with optimized static files
   ```

2. **Deploy static files** using one of these methods:
   
   **Option A: Nginx (Recommended for VPS)**
   
   The project includes an Nginx setup script at `deploy/setup-nginx.sh`. You can use it as a reference or run it:
   ```bash
   sudo bash deploy/setup-nginx.sh
   ```
   
   Manual Nginx configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       root /var/www/invoice-craftsman/dist;
       index index.html;
       
       # Handle React Router
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       # Proxy API requests to backend
       location /api {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
   
   **Option B: Apache**
   ```apache
   <VirtualHost *:80>
       ServerName your-domain.com
       DocumentRoot /var/www/invoice-craftsman/dist
       
       <Directory /var/www/invoice-craftsman/dist>
           Options -Indexes +FollowSymLinks
           AllowOverride All
           Require all granted
           
           # Handle React Router
           RewriteEngine On
           RewriteBase /
           RewriteRule ^index\.html$ - [L]
           RewriteCond %{REQUEST_FILENAME} !-f
           RewriteCond %{REQUEST_FILENAME} !-d
           RewriteRule . /index.html [L]
       </Directory>
       
       # Proxy API requests
       ProxyPass /api http://localhost:3000/api
       ProxyPassReverse /api http://localhost:3000/api
   </VirtualHost>
   ```
   
   **Option C: Vercel/Netlify**
   - Connect your GitHub repository
   - Set build command: `pnpm build`
   - Set output directory: `dist`
   - Add environment variables in platform settings
   - Auto-deploy on push to main branch
   
   **Option D: Docker**
   ```dockerfile
   FROM nginx:alpine
   COPY dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

3. **Configure environment variables** on your hosting platform
   - Set `VITE_API_BASE_URL` to your backend API URL
   - For build-time variables, rebuild after changing them

4. **Set up HTTPS** (Recommended)
   ```bash
   # Using Let's Encrypt with Certbot
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   sudo certbot renew --dry-run  # Test auto-renewal
   ```

### Deployment Checklist

- [ ] PostgreSQL database set up and migrations applied
- [ ] Backend environment variables configured
- [ ] Backend server running and accessible
- [ ] Frontend built with correct `VITE_API_BASE_URL`
- [ ] Frontend deployed and serving static files
- [ ] CORS configured on backend to allow frontend domain
- [ ] HTTPS/SSL certificates installed
- [ ] DNS records pointing to your server
- [ ] Firewall rules configured (allow ports 80, 443, and backend port)
- [ ] PM2 or systemd configured for auto-restart
- [ ] Database backups scheduled
- [ ] Monitoring and logging set up

---

## Original Lovable Project

This project was originally created with Lovable.dev and used Supabase backend.

**Original Project URL:** https://lovable.dev/projects/b83f4982-0452-4160-906e-525f2204918f

To use the original Lovable Cloud backend, refer to the Lovable documentation or contact Lovable support.

---

## Technology Stack

- **Frontend:** React 18, Vite, TypeScript
- **UI Components:** shadcn/ui, Radix UI
- **Styling:** Tailwind CSS
- **State Management:** TanStack Query (React Query)
- **Forms:** React Hook Form + Zod
- **Routing:** React Router v6
- **Database Schema:** PostgreSQL
- **PDF Generation:** jsPDF (client-side, needs backend reimplementation)
- **Image Generation:** html-to-image (client-side, needs backend reimplementation)

---

## License

[Add your license here]

---

## Support

For issues related to self-hosting, please open an issue on GitHub:
https://github.com/deskhei9-bot/invoice-craftsman-32/issues

For the original Lovable.dev version, contact Lovable support.
