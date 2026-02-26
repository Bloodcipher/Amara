-- ============================================================
-- AMARA ERP/MIS - Migration 008: Enable Row Level Security
-- RLS enabled on all tables (policies to be added later)
-- ============================================================

ALTER TABLE sku_face_value ENABLE ROW LEVEL SECURITY;
ALTER TABLE sku_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE sku_material ENABLE ROW LEVEL SECURITY;
ALTER TABLE sku_motif ENABLE ROW LEVEL SECURITY;
ALTER TABLE sku_finding ENABLE ROW LEVEL SECURITY;
ALTER TABLE sku_locking ENABLE ROW LEVEL SECURITY;
ALTER TABLE sku_size ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE dices ENABLE ROW LEVEL SECURITY;
ALTER TABLE dice_motif_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE dice_locking_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE production ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Permissive policies for the postgres role (backend access)
-- These allow full CRUD for authenticated backend connections
-- ============================================================

DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN
        SELECT unnest(ARRAY[
            'sku_face_value', 'sku_category', 'sku_material', 'sku_motif',
            'sku_finding', 'sku_locking', 'sku_size', 'users', 'products',
            'dices', 'dice_motif_mapping', 'dice_locking_mapping',
            'job_cards', 'qc_logs', 'inventory', 'production'
        ])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS allow_all_%s ON %I', t, t);
        EXECUTE format(
            'CREATE POLICY allow_all_%s ON %I FOR ALL TO postgres USING (true) WITH CHECK (true)',
            t, t
        );
    END LOOP;
END;
$$;
