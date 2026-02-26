-- ============================================================
-- AMARA ERP/MIS - Migration 003: Core Products Table
-- Links to all 7 SKU lookup tables with auto-generated SKU
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    face_value_id UUID NOT NULL REFERENCES sku_face_value(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES sku_category(id) ON DELETE RESTRICT,
    material_id UUID NOT NULL REFERENCES sku_material(id) ON DELETE RESTRICT,
    motif_id UUID NOT NULL REFERENCES sku_motif(id) ON DELETE RESTRICT,
    finding_id UUID NOT NULL REFERENCES sku_finding(id) ON DELETE RESTRICT,
    locking_id UUID NOT NULL REFERENCES sku_locking(id) ON DELETE RESTRICT,
    size_id UUID NOT NULL REFERENCES sku_size(id) ON DELETE RESTRICT,
    sku VARCHAR(10) UNIQUE,
    sequence_num INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_material ON products(material_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
