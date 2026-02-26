-- ============================================================
-- AMARA ERP/MIS - Migration 006: Production & QC Tables
-- Job Cards and Quality Control Logs
-- ============================================================

-- Job Cards table
CREATE TABLE IF NOT EXISTS job_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    job_card_number VARCHAR(50) NOT NULL UNIQUE,
    target_qty INTEGER NOT NULL CHECK (target_qty > 0),
    completed_qty INTEGER DEFAULT 0,
    assigned_artisan_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_progress', 'completed', 'on_hold', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'normal'
        CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    start_date DATE,
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_cards_product ON job_cards(product_id);
CREATE INDEX IF NOT EXISTS idx_job_cards_artisan ON job_cards(assigned_artisan_id);
CREATE INDEX IF NOT EXISTS idx_job_cards_status ON job_cards(status);
CREATE INDEX IF NOT EXISTS idx_job_cards_number ON job_cards(job_card_number);

-- QC Logs table
CREATE TABLE IF NOT EXISTS qc_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_card_id UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
    inspected_by UUID REFERENCES users(id) ON DELETE SET NULL,
    qty_passed INTEGER NOT NULL DEFAULT 0 CHECK (qty_passed >= 0),
    qty_failed INTEGER NOT NULL DEFAULT 0 CHECK (qty_failed >= 0),
    defect_reason TEXT,
    inspection_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qc_logs_job_card ON qc_logs(job_card_id);
CREATE INDEX IF NOT EXISTS idx_qc_logs_inspector ON qc_logs(inspected_by);
