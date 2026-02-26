# AMARA ERP/MIS - Product Requirements Document

## Overview
AMARA is a jewellery manufacturing MIS (Management Information System) for a jewellery startup. Built with React frontend + FastAPI backend + Supabase PostgreSQL.

## Architecture
- **Frontend**: React 19, Tailwind CSS, Framer Motion, Lucide icons
- **Backend**: FastAPI (Python), SQLAlchemy async, psycopg2-binary
- **Database**: Supabase PostgreSQL 17.6 (16 tables, RLS enabled)
- **SKU Engine**: PL/pgSQL BEFORE INSERT trigger with Base-36 encoding
- **Exports**: CSV via StreamingResponse

## User Personas
1. **Business Owner** - Dashboard, inventory value, export reports
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

## What's Been Implemented

### Phase 1 - MVP (Feb 26, 2026)
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
- [x] Seed data populated

### Phase 2 - Feature Expansion (Feb 26, 2026)
- [x] Product edit/update (inline editing with save/cancel)
- [x] Product soft delete (sets is_active=false, with reference check for hard delete)
- [x] Search & filtering across all data tables (Products, Job Cards, QC Logs, Inventory, Dices)
- [x] Pagination for Products, Job Cards, QC Logs
- [x] Schema Explorer / ER Diagram (16 tables, 17 relationships, grouped by domain)
- [x] CSV Export for Products, Inventory, Job Cards, QC Logs
- [x] Status filter for Job Cards
- [x] Reusable UI components (SearchBar, Pagination, ExportButton)

### Phase 3 - Real-Time Production Tracker (Feb 26, 2026)
- [x] Control Tower (production floor dashboard with live status)
- [x] Supabase Realtime enabled on job_cards, qc_logs, production tables
- [x] Live WebSocket connection with 15s polling fallback
- [x] Status overview strip (Pending/In Progress/Completed/On Hold/Cancelled)
- [x] In Progress jobs with progress rings and quick actions (Complete/Hold)
- [x] Pending Queue with Start buttons
- [x] Artisan Workload panel (active/queued counts per artisan)
- [x] Activity Feed (real-time event stream)
- [x] Today's Summary (completed today, QC pass rate, inventory value)
- [x] Artisan Portal (select artisan -> personal dashboard)
- [x] Artisan job management (Start, Complete, Hold, inline QC logging)
- [x] Sample job card data seeded (4 cards across 3 artisans)

## Database Schema (16 tables)
- **SKU Lookups**: sku_face_value, sku_category, sku_material, sku_motif, sku_finding, sku_locking, sku_size
- **Core**: products (auto-SKU trigger), users
- **Manufacturing**: dices, dice_motif_mapping, dice_locking_mapping
- **Production**: job_cards, qc_logs
- **Inventory**: inventory, production

## Test Results
- Backend: 91.5% (Phase 3), Frontend: 100%, Realtime: 100%
- All core CRUD, search, pagination, export, and real-time features working

## Prioritized Backlog

### P1 (High Priority)
- User authentication (login/signup with Supabase Auth)
- Job card status workflow automation (auto-update from QC)
- Bulk import/export (CSV upload to seed lookup tables)
- Dashboard charts (production trends, QC rates over time)

### P2 (Medium Priority)
- Dice-to-product recommendation engine (auto-suggest dices)
- Production cost calculator
- Artisan performance dashboard
- Barcode/QR generation for SKUs
- Print job card labels

### P3 (Nice to Have)
- Role-based access control
- Real-time notifications (Supabase Realtime)
- Mobile-responsive layout
- Dark/Light theme toggle
- PDF report generation
- Odoo REST API bridge (if needed later)

## Next Tasks
1. Add Supabase Auth for user login
2. Build dashboard charts (production trends, QC rates)
3. Implement bulk CSV import for lookup tables
4. Add barcode/QR generation for SKUs
