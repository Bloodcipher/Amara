# AMARA ERP/MIS - Product Requirements Document

## Overview
AMARA is a jewellery manufacturing MIS (Management Information System) for a jewellery startup. Built with React frontend + FastAPI backend + Supabase PostgreSQL.

## Architecture
- **Frontend**: React 19, Tailwind CSS, Framer Motion, shadcn/ui components
- **Backend**: FastAPI (Python), SQLAlchemy async, Supabase PostgreSQL
- **Database**: Supabase PostgreSQL 17.6 (16 tables, RLS enabled)
- **SKU Engine**: PL/pgSQL BEFORE INSERT trigger with Base-36 encoding

## User Personas
1. **Business Owner** - Overview dashboard, inventory value tracking
2. **Operations Manager** - Job cards, production workflow, QC logs
3. **Artisan** - View assigned job cards (future: artisan portal)
4. **QC Inspector** - Quality control inspections, defect logging

## Core Requirements
1. 7 SKU Lookup Tables (Face Value, Category, Material, Motif, Finding, Locking, Size)
2. Products with auto-generated 10-character Base-36 SKU (7-char prefix + 3-char suffix)
3. Manufacturing (Dices, M2M mappings to motif/locking)
4. Production (Job Cards with status workflow, QC Logs)
5. Inventory (stock qty, unit cost, selling price, MRP, weight, location)
6. Production details (material assigned, costs, wastage)
7. Users/Artisans management
8. SQL Migration files (organized, viewable, copyable)

## What's Been Implemented (Feb 26, 2026)
- [x] 9 SQL migration files executed against Supabase
- [x] 16 tables with RLS enabled + permissive policies for backend
- [x] PL/pgSQL Base-36 SKU trigger (handles 0-46,655 per prefix)
- [x] Dashboard with live KPIs from Supabase
- [x] SKU Configuration (CRUD for all 7 lookup tables)
- [x] Products catalog with auto-SKU generation
- [x] Interactive SKU Generator tool (preview without creating)
- [x] Manufacturing (Dices, Motif/Locking M2M mappings)
- [x] Production & QC (Job Cards with status updates, QC Logs)
- [x] Inventory management (stock, pricing, location)
- [x] SQL Migrations viewer with copy functionality
- [x] Dark luxury theme (Obsidian + Gold)
- [x] Seed data (10 face values, 10 categories, 8 materials, 10 motifs, 9 findings, 8 lockings, 8 sizes, 6 users, 6 dices)
- [x] Backend: 29/29 API tests passed

## Database Schema (16 tables)
- sku_face_value, sku_category, sku_material, sku_motif, sku_finding, sku_locking, sku_size
- users, products, dices
- dice_motif_mapping, dice_locking_mapping
- job_cards, qc_logs
- inventory, production

## Prioritized Backlog

### P0 (Critical)
- None remaining for MVP

### P1 (High Priority)
- Product edit/update functionality
- Job card status workflow automation (auto-update completed_qty from QC logs)
- Search and filtering across all data tables
- Pagination for large datasets

### P2 (Medium Priority)
- ER diagram / schema visualization
- Export data to CSV/Excel
- Dice-to-product recommendation engine (based on motif/locking mappings)
- Production cost calculator
- Artisan performance dashboard
- Barcode/QR generation for SKUs

### P3 (Nice to Have)
- User authentication (login/signup)
- Role-based access control
- Real-time notifications for job card status changes
- Mobile-responsive layout
- Dark/Light theme toggle
- Report generation (PDF)

## Next Tasks
1. Add product edit/update and delete functionality
2. Implement search & filter across data tables
3. Add pagination for products and job cards
4. Build ER diagram visualization
5. Add export to CSV/Excel functionality
