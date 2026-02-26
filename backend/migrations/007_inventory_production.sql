-- ============================================================
-- AMARA ERP/MIS - Migration 007: Inventory & Production Details
-- Inventory with pricing, Production with material tracking
-- ============================================================

-- Inventory table (with prices)
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    stock_qty INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
    reserved_qty INTEGER NOT NULL DEFAULT 0 CHECK (reserved_qty >= 0),
    unit_cost DECIMAL(12, 2) DEFAULT 0.00,
    selling_price DECIMAL(12, 2) DEFAULT 0.00,
    mrp DECIMAL(12, 2) DEFAULT 0.00,
    weight_grams DECIMAL(10, 3),
    location VARCHAR(100),
    last_restocked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory(location);

-- Production table (with material assigned)
CREATE TABLE IF NOT EXISTS production (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_card_id UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
    material_assigned VARCHAR(200),
    material_weight_grams DECIMAL(10, 3),
    material_cost DECIMAL(12, 2),
    wastage_grams DECIMAL(10, 3) DEFAULT 0,
    production_date DATE DEFAULT CURRENT_DATE,
    completion_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'allocated'
        CHECK (status IN ('allocated', 'in_process', 'finished', 'rejected')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_production_job_card ON production(job_card_id);
CREATE INDEX IF NOT EXISTS idx_production_status ON production(status);
CREATE INDEX IF NOT EXISTS idx_production_date ON production(production_date);
