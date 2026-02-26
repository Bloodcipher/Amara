-- ============================================================
-- AMARA ERP/MIS - Migration 009: Seed Data
-- Sample data for all lookup tables and test records
-- ============================================================

-- SKU Face Value (0-9, A-Z representing value ranges)
INSERT INTO sku_face_value (name, code, description) VALUES
    ('Economy', '0', 'Economy range - under 1000'),
    ('Standard', '1', 'Standard range - 1000-5000'),
    ('Premium', '2', 'Premium range - 5000-15000'),
    ('Luxury', '3', 'Luxury range - 15000-50000'),
    ('Ultra Luxury', '4', 'Ultra luxury range - 50000+'),
    ('Bridal', '5', 'Bridal collection'),
    ('Festive', '6', 'Festive/seasonal collection'),
    ('Heritage', '7', 'Heritage/antique collection'),
    ('Contemporary', '8', 'Contemporary modern collection'),
    ('Limited Edition', '9', 'Limited edition pieces')
ON CONFLICT (code) DO NOTHING;

-- SKU Category
INSERT INTO sku_category (name, code, description) VALUES
    ('Bugadi', 'B', 'Traditional nose ring'),
    ('Nath', 'N', 'Nose ring with chain'),
    ('Jhumka', 'J', 'Bell-shaped earring'),
    ('Kada', 'K', 'Rigid bangle'),
    ('Pendant', 'P', 'Necklace pendant'),
    ('Ring', 'R', 'Finger ring'),
    ('Anklet', 'A', 'Ankle bracelet'),
    ('Choker', 'C', 'Short necklace'),
    ('Mangalsutra', 'M', 'Wedding necklace'),
    ('Tikka', 'T', 'Forehead ornament')
ON CONFLICT (code) DO NOTHING;

-- SKU Material
INSERT INTO sku_material (name, code, description) VALUES
    ('Silver 925', 'S', 'Sterling silver 925'),
    ('Gold 22K', 'G', 'Gold 22 karat'),
    ('Gold 18K', 'H', 'Gold 18 karat'),
    ('Platinum', 'P', 'Platinum 950'),
    ('Rose Gold', 'R', 'Rose gold 18K'),
    ('Brass', 'B', 'Brass alloy'),
    ('Copper', 'C', 'Pure copper'),
    ('White Gold', 'W', 'White gold 18K')
ON CONFLICT (code) DO NOTHING;

-- SKU Motif
INSERT INTO sku_motif (name, code, description) VALUES
    ('Floral', 'F', 'Flower and petal designs'),
    ('Geometric', 'G', 'Geometric patterns'),
    ('Paisley', 'P', 'Traditional paisley motif'),
    ('Temple', 'T', 'Temple-inspired design'),
    ('Peacock', 'K', 'Peacock feather motif'),
    ('Abstract', 'A', 'Modern abstract design'),
    ('Vine', 'V', 'Vine and leaf patterns'),
    ('Mandala', 'M', 'Sacred mandala design'),
    ('Filigree', 'I', 'Intricate filigree work'),
    ('None', 'X', 'No motif / plain')
ON CONFLICT (code) DO NOTHING;

-- SKU Finding
INSERT INTO sku_finding (name, code, description) VALUES
    ('NA', 'X', 'Not applicable'),
    ('Post', 'P', 'Post/stud back'),
    ('Hook', 'H', 'Hook/wire back'),
    ('Clip', 'C', 'Clip-on back'),
    ('Lever', 'L', 'Lever back'),
    ('Lobster', 'B', 'Lobster claw clasp'),
    ('Spring', 'S', 'Spring ring clasp'),
    ('Toggle', 'T', 'Toggle clasp'),
    ('Magnetic', 'M', 'Magnetic clasp')
ON CONFLICT (code) DO NOTHING;

-- SKU Locking
INSERT INTO sku_locking (name, code, description) VALUES
    ('Screw', 'S', 'Screw-back locking'),
    ('Push', 'P', 'Push-back locking'),
    ('Hook', 'H', 'Hook locking'),
    ('Snap', 'N', 'Snap-fit locking'),
    ('Hinge', 'I', 'Hinge locking'),
    ('None', 'X', 'No locking mechanism'),
    ('Clasp', 'C', 'Clasp locking'),
    ('Pin', 'D', 'Pin-based locking')
ON CONFLICT (code) DO NOTHING;

-- SKU Size
INSERT INTO sku_size (name, code, description) VALUES
    ('Extra Small', 'T', 'XS - Tiny'),
    ('Small', 'S', 'Small size'),
    ('Medium', 'M', 'Medium size'),
    ('Large', 'L', 'Large size'),
    ('Extra Large', 'X', 'XL size'),
    ('Free Size', 'F', 'One size fits all'),
    ('Custom', 'C', 'Custom sizing'),
    ('Adjustable', 'A', 'Adjustable size')
ON CONFLICT (code) DO NOTHING;

-- Sample Users (Artisans)
INSERT INTO users (name, email, role, phone) VALUES
    ('Rajesh Kumar', 'rajesh@amara.com', 'artisan', '+91-9876543210'),
    ('Priya Sharma', 'priya@amara.com', 'artisan', '+91-9876543211'),
    ('Amit Patel', 'amit@amara.com', 'supervisor', '+91-9876543212'),
    ('Sunita Devi', 'sunita@amara.com', 'artisan', '+91-9876543213'),
    ('Vikram Singh', 'vikram@amara.com', 'qc_inspector', '+91-9876543214'),
    ('Meera Joshi', 'meera@amara.com', 'admin', '+91-9876543215')
ON CONFLICT (email) DO NOTHING;

-- Sample Dices
INSERT INTO dices (dice_number, dice_type, description) VALUES
    ('D-101', 'stamping', 'Floral stamping die for bugadi'),
    ('D-102', 'casting', 'Casting mold for jhumka bells'),
    ('D-103', 'embossing', 'Paisley embossing die'),
    ('D-104', 'cutting', 'Geometric cutting die for pendants'),
    ('D-105', 'stamping', 'Temple motif stamping die'),
    ('D-106', 'filigree', 'Filigree wire shaping die')
ON CONFLICT (dice_number) DO NOTHING;
