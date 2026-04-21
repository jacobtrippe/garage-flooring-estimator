# Garage Flooring Estimator

## Project Overview
A full-stack web application for a residential garage flooring business to manage customer information and generate professional estimates with dynamic pricing for different coating and design options.

**Owner:** Jacob (jacob@orangelips.com)
**Status:** MVP with core features implemented
**Live:** http://localhost:3000

## Tech Stack
- **Framework:** Next.js 16.2.4 (App Router, TypeScript)
- **Database:** PostgreSQL via Supabase
- **ORM:** Prisma 5.18.0
- **Auth:** NextAuth.js (credentials-based)
- **Styling:** Tailwind CSS
- **PDF/Signature:** @react-pdf/renderer, react-signature-canvas
- **Node:** v22.13.0, npm 10.9.2

## Database Schema

### Customer
- `id`, `name`, `email`, `phone`
- `street`, `city`, `state`, `zip`
- `garageSqft` (float), `carPorts` (1|2|3|4+)
- `notes` (text), `createdAt`, `updatedAt`

### Section
- `id`, `title`, `displayOrder`
- Contains multiple products
- Admin-managed via drag-and-drop

### Product
- `id`, `sectionId`, `name`
- `pricingType` (PER_SQFT | FLAT)
- `price` (float), `isActive` (boolean), `displayOrder`

### Estimate
- `id`, `customerId`, `items[]` (JSON), `totalPrice`
- `status` (draft|sent|signed), `signatureDataUrl`

## Features Implemented

### ✅ Customer Management
- Add/view/edit customers
- Store garage sqft and car port count (1-4+)
- Customer list with search capability

### ✅ Admin Panel (`/admin`)
- **Sections Management:** Create, edit name, delete, drag-to-reorder sections
- **Products Management:** Create, edit name/pricing/type, toggle active, delete, drag-to-reorder
- Pricing types: Per Sqft or Flat Fee
- Real-time database updates

### ✅ Estimate Builder (`/estimates/new?customer=[id]`)
- Shows customer info (name, address, garage size)
- Browse products grouped by section
- Click to select/deselect products
- **Dynamic pricing:** 
  - Per Sqft: `price × customer.garageSqft`
  - Flat: Fixed price
- Running total calculation
- Visual feedback (blue highlight on selection)

### 🚧 In Progress
- PDF generation & download
- E-signature capture (canvas pad)
- Signed PDF embedding

### 📋 Not Yet Built
- Email estimates to customers
- Estimate history & status tracking
- Analytics dashboard
- Multiple admin users

## Key Pages & Routes

| Route | Purpose |
|-------|---------|
| `/` | Redirects to /customers |
| `/login` | Admin login (email + password) |
| `/customers` | Customer list, add button |
| `/customers/new` | Customer form |
| `/estimates/new?customer=ID` | Estimate builder |
| `/admin` | Admin dashboard |
| `/admin/sections` | Manage sections with drag-drop |
| `/admin/products?section=ID` | Manage products for section |
| `/api/customers` | CRUD customers |
| `/api/sections` | CRUD sections |
| `/api/products` | CRUD products |
| `/api/auth/[...nextauth]` | NextAuth handler |

## Authentication

**Login:**
- Email: `jacob@orangelips.com`
- Password: `jtplstinstalls`

**Details:**
- NextAuth with credentials provider
- Plain text password comparison (dev only, hardcoded env vars)
- Session-based, protects `/admin` routes

## Environment Setup

**.env.local required:**
```
DATABASE_URL="postgresql://..." # Supabase connection
NEXTAUTH_SECRET="..." # For session signing
NEXTAUTH_URL="http://localhost:3000"
ADMIN_EMAIL="jacob@orangelips.com"
ADMIN_PASSWORD="jtplstinstalls"
```

**Initial setup:**
```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

## Important Notes

### Next.js 16 Breaking Changes
- `params` in route handlers is a Promise, must be awaited: `const { id } = await params;`
- Uses Turbopack for faster dev builds

### Drag-and-Drop Ordering
- Tables show `⋮⋮` handle on left
- Click and drag to reorder sections/products
- Display order syncs to database immediately

### Pricing Logic
- Per Sqft items multiply: `price × customer.garageSqft`
- Flat Fee items use price as-is
- Can toggle type per product without losing price

### Sections & Products
- Only active products show in estimate builder
- Products can be hidden (inactive) instead of deleted
- Display order controls appearance in estimate

## Development Commands

```bash
npm run dev          # Start dev server on :3000
npm run build        # Build for production
npm run start        # Run production build
npm run lint         # Run ESLint
npx prisma studio   # Open Prisma visual editor
npx prisma migrate dev  # Run new migration
```

## Deployment Notes

**Vercel ready:**
- `.env.local` values → project env vars
- Prisma migrations run in build step
- Database must be PostgreSQL (Supabase works great)

**Next session checklist:**
- Confirm `.env.local` DATABASE_URL points to Supabase
- Check Prisma schema hasn't changed (`schema.prisma`)
- Admin/sections/products pages should all work with drag-drop
- Estimate builder pulls live product data from DB

## Recent Work (Latest Session)

1. ✅ Created full project scaffold with Next.js, Prisma, Supabase
2. ✅ Built customer CRUD with all fields
3. ✅ Created admin panel with sections & products management
4. ✅ Added drag-and-drop reordering for sections & products
5. ✅ Built estimate builder with dynamic pricing
6. ✅ Fixed Next.js 16 params handling (must await)
7. ✅ Integrated inline editing for products/sections (no delete required)

## Next Steps (Priority Order)

1. **PDF Export** - Generate professional PDF with customer info + selected items + total
2. **E-Signature** - Capture signature on PDF, embed it, allow download
3. **Estimate History** - Save estimates, show past estimates per customer
4. **Email** - Send estimates to customer email
5. **Polish UI** - Better error messages, loading states, confirmations
6. **Analytics** - Dashboard for estimates generated, revenue, popular products

## Code Quality Notes

- No unnecessary comments
- Uses TypeScript throughout
- Error handling added where needed (API calls)
- Prisma for type safety
- Tailwind for consistent styling
- Session validation on protected routes
