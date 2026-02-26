-- ============================================================
-- AMARA ERP/MIS - Migration 005: Manufacturing & M2M Tables
-- Dices and their mappings to SKU attributes
-- ============================================================

-- Dices table
CREATE TABLE IF NOT EXISTS dices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dice_number VARCHAR(50) NOT NULL UNIQUE,
    dice_type VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dices_number ON dices(dice_number);
CREATE INDEX IF NOT EXISTS idx_dices_type ON dices(dice_type);

-- Many-to-Many: Dice <-> Motif mapping
CREATE TABLE IF NOT EXISTS dice_motif_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dice_id UUID NOT NULL REFERENCES dices(id) ON DELETE CASCADE,
    motif_id UUID NOT NULL REFERENCES sku_motif(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(dice_id, motif_id)
);

CREATE INDEX IF NOT EXISTS idx_dice_motif_dice ON dice_motif_mapping(dice_id);
CREATE INDEX IF NOT EXISTS idx_dice_motif_motif ON dice_motif_mapping(motif_id);

-- Many-to-Many: Dice <-> Locking mapping
CREATE TABLE IF NOT EXISTS dice_locking_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dice_id UUID NOT NULL REFERENCES dices(id) ON DELETE CASCADE,
    locking_id UUID NOT NULL REFERENCES sku_locking(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(dice_id, locking_id)
);

CREATE INDEX IF NOT EXISTS idx_dice_locking_dice ON dice_locking_mapping(dice_id);
CREATE INDEX IF NOT EXISTS idx_dice_locking_locking ON dice_locking_mapping(locking_id);
