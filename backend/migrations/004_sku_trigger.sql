-- ============================================================
-- AMARA ERP/MIS - Migration 004: PL/pgSQL Base-36 SKU Generator
-- BEFORE INSERT trigger on products table
-- Handles edge cases up to 46,655 (ZZZ in Base-36)
-- ============================================================

-- Drop existing trigger and function if they exist (for idempotency)
DROP TRIGGER IF EXISTS trg_generate_sku ON products;
DROP FUNCTION IF EXISTS generate_product_sku();

-- Create the Base-36 SKU generation function
CREATE OR REPLACE FUNCTION generate_product_sku()
RETURNS TRIGGER AS $$
DECLARE
    v_prefix VARCHAR(7);
    v_face_code CHAR(1);
    v_cat_code CHAR(1);
    v_mat_code CHAR(1);
    v_motif_code CHAR(1);
    v_find_code CHAR(1);
    v_lock_code CHAR(1);
    v_size_code CHAR(1);
    v_max_seq INTEGER;
    v_new_seq INTEGER;
    v_suffix VARCHAR(3);
    v_base36_chars VARCHAR(36) := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    v_remainder INTEGER;
    v_quotient INTEGER;
BEGIN
    -- -------------------------------------------------------
    -- Step 1: Read the 1-character code from all 7 lookup tables
    -- -------------------------------------------------------
    SELECT code INTO STRICT v_face_code FROM sku_face_value WHERE id = NEW.face_value_id;
    SELECT code INTO STRICT v_cat_code FROM sku_category WHERE id = NEW.category_id;
    SELECT code INTO STRICT v_mat_code FROM sku_material WHERE id = NEW.material_id;
    SELECT code INTO STRICT v_motif_code FROM sku_motif WHERE id = NEW.motif_id;
    SELECT code INTO STRICT v_find_code FROM sku_finding WHERE id = NEW.finding_id;
    SELECT code INTO STRICT v_lock_code FROM sku_locking WHERE id = NEW.locking_id;
    SELECT code INTO STRICT v_size_code FROM sku_size WHERE id = NEW.size_id;

    -- -------------------------------------------------------
    -- Step 2: Concatenate to form the 7-character prefix
    -- Example: '0BSFXSS'
    -- -------------------------------------------------------
    v_prefix := v_face_code || v_cat_code || v_mat_code || v_motif_code || v_find_code || v_lock_code || v_size_code;

    -- -------------------------------------------------------
    -- Step 3: Find the highest sequence_num for this prefix
    -- -------------------------------------------------------
    SELECT COALESCE(MAX(sequence_num), -1)
    INTO v_max_seq
    FROM products
    WHERE sku LIKE v_prefix || '___';

    -- Increment (first product with this prefix starts at 0)
    v_new_seq := v_max_seq + 1;

    -- -------------------------------------------------------
    -- Step 4: Validate - Max Base-36 with 3 chars is ZZZ = 46655
    -- -------------------------------------------------------
    IF v_new_seq > 46655 THEN
        RAISE EXCEPTION 'SKU sequence overflow for prefix %. Maximum 46,656 products per prefix combination.', v_prefix;
    END IF;

    -- -------------------------------------------------------
    -- Step 5: Convert integer to 3-character Base-36 string
    -- Examples: 0 -> '000', 10 -> '00A', 35 -> '00Z', 36 -> '010'
    -- -------------------------------------------------------
    v_quotient := v_new_seq;
    v_suffix := '';

    -- Build the Base-36 string from least significant to most significant digit
    FOR i IN 1..3 LOOP
        v_remainder := v_quotient % 36;
        v_suffix := SUBSTRING(v_base36_chars FROM (v_remainder + 1) FOR 1) || v_suffix;
        v_quotient := v_quotient / 36;
    END LOOP;

    -- -------------------------------------------------------
    -- Step 6: Compose the final 10-character SKU
    -- -------------------------------------------------------
    NEW.sku := v_prefix || v_suffix;
    NEW.sequence_num := v_new_seq;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the BEFORE INSERT trigger
CREATE TRIGGER trg_generate_sku
    BEFORE INSERT ON products
    FOR EACH ROW
    EXECUTE FUNCTION generate_product_sku();
