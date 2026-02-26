from fastapi import FastAPI, APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
import io
import csv
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime, timezone, date
from database import AsyncSessionLocal, engine
from sqlalchemy import text

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

app = FastAPI(title="AMARA ERP/MIS API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# --- Pydantic Models ---
class LookupItem(BaseModel):
    id: str
    name: str
    code: str
    description: Optional[str] = None
    created_at: Optional[str] = None

class LookupCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None

class ProductOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    sku: Optional[str] = None
    sequence_num: Optional[int] = None
    face_value_id: str
    category_id: str
    material_id: str
    motif_id: str
    finding_id: str
    locking_id: str
    size_id: str
    is_active: bool = True
    created_at: Optional[str] = None
    face_value_code: Optional[str] = None
    category_code: Optional[str] = None
    material_code: Optional[str] = None
    motif_code: Optional[str] = None
    finding_code: Optional[str] = None
    locking_code: Optional[str] = None
    size_code: Optional[str] = None
    face_value_name: Optional[str] = None
    category_name: Optional[str] = None
    material_name: Optional[str] = None
    motif_name: Optional[str] = None
    finding_name: Optional[str] = None
    locking_name: Optional[str] = None
    size_name: Optional[str] = None

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    face_value_id: str
    category_id: str
    material_id: str
    motif_id: str
    finding_id: str
    locking_id: str
    size_id: str

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
    total_pages: int

class DiceOut(BaseModel):
    id: str
    dice_number: str
    dice_type: str
    description: Optional[str] = None
    is_active: bool = True
    created_at: Optional[str] = None

class DiceCreate(BaseModel):
    dice_number: str
    dice_type: str
    description: Optional[str] = None

class MappingOut(BaseModel):
    id: str
    dice_id: str
    target_id: str
    dice_number: Optional[str] = None
    target_name: Optional[str] = None
    target_code: Optional[str] = None

class MappingCreate(BaseModel):
    dice_id: str
    target_id: str

class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    phone: Optional[str] = None
    is_active: bool = True

class JobCardOut(BaseModel):
    id: str
    product_id: str
    job_card_number: str
    target_qty: int
    completed_qty: int = 0
    assigned_artisan_id: Optional[str] = None
    status: str
    priority: str = "normal"
    start_date: Optional[str] = None
    due_date: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[str] = None
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    artisan_name: Optional[str] = None

class JobCardCreate(BaseModel):
    product_id: str
    job_card_number: str
    target_qty: int
    assigned_artisan_id: Optional[str] = None
    status: str = "pending"
    priority: str = "normal"
    start_date: Optional[str] = None
    due_date: Optional[str] = None
    notes: Optional[str] = None

class QCLogOut(BaseModel):
    id: str
    job_card_id: str
    inspected_by: Optional[str] = None
    qty_passed: int
    qty_failed: int
    defect_reason: Optional[str] = None
    inspection_date: Optional[str] = None
    notes: Optional[str] = None
    job_card_number: Optional[str] = None
    inspector_name: Optional[str] = None

class QCLogCreate(BaseModel):
    job_card_id: str
    inspected_by: Optional[str] = None
    qty_passed: int
    qty_failed: int
    defect_reason: Optional[str] = None
    notes: Optional[str] = None

class InventoryOut(BaseModel):
    id: str
    product_id: str
    stock_qty: int
    reserved_qty: int = 0
    unit_cost: Optional[float] = None
    selling_price: Optional[float] = None
    mrp: Optional[float] = None
    weight_grams: Optional[float] = None
    location: Optional[str] = None
    product_name: Optional[str] = None
    product_sku: Optional[str] = None

class InventoryCreate(BaseModel):
    product_id: str
    stock_qty: int = 0
    reserved_qty: int = 0
    unit_cost: Optional[float] = None
    selling_price: Optional[float] = None
    mrp: Optional[float] = None
    weight_grams: Optional[float] = None
    location: Optional[str] = None

class ProductionOut(BaseModel):
    id: str
    job_card_id: str
    material_assigned: Optional[str] = None
    material_weight_grams: Optional[float] = None
    material_cost: Optional[float] = None
    wastage_grams: Optional[float] = None
    production_date: Optional[str] = None
    status: str
    notes: Optional[str] = None
    job_card_number: Optional[str] = None

class ProductionCreate(BaseModel):
    job_card_id: str
    material_assigned: Optional[str] = None
    material_weight_grams: Optional[float] = None
    material_cost: Optional[float] = None
    production_date: Optional[str] = None
    notes: Optional[str] = None

class MigrationFile(BaseModel):
    filename: str
    content: str

class DashboardStats(BaseModel):
    total_products: int
    active_job_cards: int
    total_inventory_value: float
    qc_pass_rate: float
    total_users: int
    total_dices: int
    pending_jobs: int
    completed_jobs: int

def serialize_row(row, keys):
    d = {}
    for i, k in enumerate(keys):
        val = row[i]
        if isinstance(val, (datetime, date)):
            d[k] = val.isoformat()
        elif val is None:
            d[k] = None
        else:
            d[k] = str(val) if isinstance(val, uuid.UUID) else val
    return d

def make_csv_response(rows, headers, filename):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    for row in rows:
        writer.writerow(row)
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# --- Health Check ---
@api_router.get("/")
async def root():
    return {"message": "AMARA ERP/MIS API", "status": "operational"}

@api_router.get("/health")
async def health():
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT 1"))
            result.fetchone()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}

# --- Dashboard Stats ---
@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(db=Depends(get_db)):
    r = await db.execute(text("SELECT COUNT(*) FROM products"))
    total_products = r.scalar()
    r = await db.execute(text("SELECT COUNT(*) FROM job_cards WHERE status IN ('pending','in_progress')"))
    active_job_cards = r.scalar()
    r = await db.execute(text("SELECT COALESCE(SUM(stock_qty * selling_price), 0) FROM inventory"))
    total_inv_value = float(r.scalar())
    r = await db.execute(text("SELECT COALESCE(SUM(qty_passed),0), COALESCE(SUM(qty_passed + qty_failed),0) FROM qc_logs"))
    row = r.fetchone()
    qc_pass_rate = (float(row[0]) / float(row[1]) * 100) if row[1] > 0 else 100.0
    r = await db.execute(text("SELECT COUNT(*) FROM users"))
    total_users = r.scalar()
    r = await db.execute(text("SELECT COUNT(*) FROM dices"))
    total_dices = r.scalar()
    r = await db.execute(text("SELECT COUNT(*) FROM job_cards WHERE status='pending'"))
    pending = r.scalar()
    r = await db.execute(text("SELECT COUNT(*) FROM job_cards WHERE status='completed'"))
    completed = r.scalar()
    return DashboardStats(
        total_products=total_products, active_job_cards=active_job_cards,
        total_inventory_value=total_inv_value, qc_pass_rate=round(qc_pass_rate, 1),
        total_users=total_users, total_dices=total_dices,
        pending_jobs=pending, completed_jobs=completed,
    )

# --- Lookup CRUD ---
LOOKUP_TABLES = {
    "face_value": "sku_face_value", "category": "sku_category",
    "material": "sku_material", "motif": "sku_motif",
    "finding": "sku_finding", "locking": "sku_locking", "size": "sku_size",
}

@api_router.get("/lookups/{table_key}", response_model=List[LookupItem])
async def get_lookup_items(table_key: str, search: str = Query("", alias="q"), db=Depends(get_db)):
    if table_key not in LOOKUP_TABLES:
        raise HTTPException(status_code=404, detail=f"Unknown lookup: {table_key}")
    tbl = LOOKUP_TABLES[table_key]
    if search:
        r = await db.execute(text(f"SELECT id, name, code, description, created_at FROM {tbl} WHERE LOWER(name) LIKE :s OR LOWER(code) LIKE :s ORDER BY code"), {"s": f"%{search.lower()}%"})
    else:
        r = await db.execute(text(f"SELECT id, name, code, description, created_at FROM {tbl} ORDER BY code"))
    return [LookupItem(**serialize_row(row, ["id","name","code","description","created_at"])) for row in r.fetchall()]

@api_router.post("/lookups/{table_key}", response_model=LookupItem)
async def create_lookup_item(table_key: str, item: LookupCreate, db=Depends(get_db)):
    if table_key not in LOOKUP_TABLES:
        raise HTTPException(status_code=404, detail=f"Unknown lookup: {table_key}")
    tbl = LOOKUP_TABLES[table_key]
    try:
        r = await db.execute(
            text(f"INSERT INTO {tbl} (name, code, description) VALUES (:name, :code, :desc) RETURNING id, name, code, description, created_at"),
            {"name": item.name, "code": item.code.upper(), "desc": item.description}
        )
        await db.commit()
        row = r.fetchone()
        return LookupItem(**serialize_row(row, ["id","name","code","description","created_at"]))
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/lookups/{table_key}/{item_id}")
async def delete_lookup_item(table_key: str, item_id: str, db=Depends(get_db)):
    if table_key not in LOOKUP_TABLES:
        raise HTTPException(status_code=404, detail=f"Unknown lookup: {table_key}")
    tbl = LOOKUP_TABLES[table_key]
    try:
        await db.execute(text(f"DELETE FROM {tbl} WHERE id = :id"), {"id": item_id})
        await db.commit()
        return {"status": "deleted"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# --- Products with search, pagination, update, delete ---
PRODUCTS_BASE_QUERY = """
    SELECT p.id, p.name, p.description, p.sku, p.sequence_num,
           p.face_value_id, p.category_id, p.material_id, p.motif_id,
           p.finding_id, p.locking_id, p.size_id, p.is_active, p.created_at,
           fv.code, cat.code, mat.code, mot.code, fin.code, loc.code, sz.code,
           fv.name, cat.name, mat.name, mot.name, fin.name, loc.name, sz.name
    FROM products p
    JOIN sku_face_value fv ON p.face_value_id = fv.id
    JOIN sku_category cat ON p.category_id = cat.id
    JOIN sku_material mat ON p.material_id = mat.id
    JOIN sku_motif mot ON p.motif_id = mot.id
    JOIN sku_finding fin ON p.finding_id = fin.id
    JOIN sku_locking loc ON p.locking_id = loc.id
    JOIN sku_size sz ON p.size_id = sz.id
"""

PRODUCT_KEYS = ["id","name","description","sku","sequence_num",
    "face_value_id","category_id","material_id","motif_id",
    "finding_id","locking_id","size_id","is_active","created_at",
    "face_value_code","category_code","material_code","motif_code",
    "finding_code","locking_code","size_code",
    "face_value_name","category_name","material_name","motif_name",
    "finding_name","locking_name","size_name"]

@api_router.get("/products")
async def get_products(
    q: str = "", page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=200),
    category: str = "", material: str = "", db=Depends(get_db)
):
    where_clauses = []
    params = {}
    if q:
        where_clauses.append("(LOWER(p.name) LIKE :q OR LOWER(p.sku) LIKE :q OR LOWER(p.description) LIKE :q)")
        params["q"] = f"%{q.lower()}%"
    if category:
        where_clauses.append("cat.name = :cat")
        params["cat"] = category
    if material:
        where_clauses.append("mat.name = :mat")
        params["mat"] = material

    where = (" WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

    count_r = await db.execute(text(f"SELECT COUNT(*) FROM products p JOIN sku_category cat ON p.category_id=cat.id JOIN sku_material mat ON p.material_id=mat.id{where}"), params)
    total = count_r.scalar()

    offset = (page - 1) * page_size
    params["limit"] = page_size
    params["offset"] = offset
    r = await db.execute(text(f"{PRODUCTS_BASE_QUERY}{where} ORDER BY p.created_at DESC LIMIT :limit OFFSET :offset"), params)
    rows = r.fetchall()
    items = [ProductOut(**serialize_row(row, PRODUCT_KEYS)).model_dump() for row in rows]
    total_pages = max(1, (total + page_size - 1) // page_size)
    return {"items": items, "total": total, "page": page, "page_size": page_size, "total_pages": total_pages}

@api_router.post("/products", response_model=ProductOut)
async def create_product(item: ProductCreate, db=Depends(get_db)):
    try:
        r = await db.execute(
            text("""INSERT INTO products (name, description, face_value_id, category_id, material_id, motif_id, finding_id, locking_id, size_id)
                    VALUES (:name, :description, :fv, :cat, :mat, :mot, :fin, :loc, :sz)
                    RETURNING id, sku, sequence_num, created_at"""),
            {"name": item.name, "description": item.description,
             "fv": item.face_value_id, "cat": item.category_id, "mat": item.material_id,
             "mot": item.motif_id, "fin": item.finding_id, "loc": item.locking_id, "sz": item.size_id}
        )
        await db.commit()
        row = r.fetchone()
        return ProductOut(
            id=str(row[0]), name=item.name, description=item.description,
            sku=row[1], sequence_num=row[2],
            face_value_id=item.face_value_id, category_id=item.category_id,
            material_id=item.material_id, motif_id=item.motif_id,
            finding_id=item.finding_id, locking_id=item.locking_id,
            size_id=item.size_id, created_at=row[3].isoformat() if row[3] else None
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/products/{product_id}", response_model=ProductOut)
async def update_product(product_id: str, item: ProductUpdate, db=Depends(get_db)):
    try:
        sets = []
        params = {"id": product_id}
        if item.name is not None:
            sets.append("name = :name")
            params["name"] = item.name
        if item.description is not None:
            sets.append("description = :desc")
            params["desc"] = item.description
        if item.is_active is not None:
            sets.append("is_active = :active")
            params["active"] = item.is_active
        if not sets:
            raise HTTPException(status_code=400, detail="No fields to update")
        sets.append("updated_at = NOW()")
        await db.execute(text(f"UPDATE products SET {', '.join(sets)} WHERE id = :id"), params)
        await db.commit()
        r = await db.execute(text(f"{PRODUCTS_BASE_QUERY} WHERE p.id = :id"), {"id": product_id})
        row = r.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Product not found")
        return ProductOut(**serialize_row(row, PRODUCT_KEYS))
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, hard: bool = Query(False), db=Depends(get_db)):
    try:
        if hard:
            # Check for references first
            for tbl in ["job_cards", "inventory"]:
                r = await db.execute(text(f"SELECT COUNT(*) FROM {tbl} WHERE product_id = :id"), {"id": product_id})
                if r.scalar() > 0:
                    raise HTTPException(status_code=409, detail=f"Cannot delete - product has {tbl} referencing it. Use soft delete instead.")
            await db.execute(text("DELETE FROM products WHERE id = :id"), {"id": product_id})
        else:
            await db.execute(text("UPDATE products SET is_active = FALSE, updated_at = NOW() WHERE id = :id"), {"id": product_id})
        await db.commit()
        return {"status": "deleted", "mode": "hard" if hard else "soft"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# --- CSV Export ---
@api_router.get("/export/products")
async def export_products_csv(db=Depends(get_db)):
    r = await db.execute(text(f"{PRODUCTS_BASE_QUERY} ORDER BY p.sku"))
    headers = ["SKU","Name","Description","Category","Material","Motif","Finding","Locking","Size","Active","Created"]
    rows = []
    for row in r.fetchall():
        d = serialize_row(row, PRODUCT_KEYS)
        rows.append([d["sku"],d["name"],d["description"],d["category_name"],d["material_name"],
                     d["motif_name"],d["finding_name"],d["locking_name"],d["size_name"],d["is_active"],d["created_at"]])
    return make_csv_response(rows, headers, "amara_products.csv")

@api_router.get("/export/inventory")
async def export_inventory_csv(db=Depends(get_db)):
    r = await db.execute(text("""
        SELECT p.sku, p.name, i.stock_qty, i.reserved_qty, i.unit_cost, i.selling_price, i.mrp, i.weight_grams, i.location
        FROM inventory i JOIN products p ON i.product_id = p.id ORDER BY p.sku
    """))
    headers = ["SKU","Product","Stock Qty","Reserved","Unit Cost","Selling Price","MRP","Weight (g)","Location"]
    return make_csv_response(r.fetchall(), headers, "amara_inventory.csv")

@api_router.get("/export/job-cards")
async def export_job_cards_csv(db=Depends(get_db)):
    r = await db.execute(text("""
        SELECT jc.job_card_number, p.sku, p.name, jc.target_qty, jc.completed_qty, u.name, jc.status, jc.priority, jc.start_date, jc.due_date
        FROM job_cards jc JOIN products p ON jc.product_id=p.id LEFT JOIN users u ON jc.assigned_artisan_id=u.id ORDER BY jc.created_at DESC
    """))
    headers = ["Job Card #","SKU","Product","Target Qty","Completed","Artisan","Status","Priority","Start Date","Due Date"]
    return make_csv_response(r.fetchall(), headers, "amara_job_cards.csv")

@api_router.get("/export/qc-logs")
async def export_qc_logs_csv(db=Depends(get_db)):
    r = await db.execute(text("""
        SELECT jc.job_card_number, u.name, q.qty_passed, q.qty_failed, q.defect_reason, q.inspection_date
        FROM qc_logs q JOIN job_cards jc ON q.job_card_id=jc.id LEFT JOIN users u ON q.inspected_by=u.id ORDER BY q.inspection_date DESC
    """))
    headers = ["Job Card #","Inspector","Passed","Failed","Defect Reason","Inspection Date"]
    return make_csv_response(r.fetchall(), headers, "amara_qc_logs.csv")

# --- Users ---
@api_router.get("/users", response_model=List[UserOut])
async def get_users(db=Depends(get_db)):
    r = await db.execute(text("SELECT id, name, email, role, phone, is_active FROM users ORDER BY name"))
    return [UserOut(**serialize_row(row, ["id","name","email","role","phone","is_active"])) for row in r.fetchall()]

# --- Dices ---
@api_router.get("/dices", response_model=List[DiceOut])
async def get_dices(q: str = "", db=Depends(get_db)):
    if q:
        r = await db.execute(text("SELECT id, dice_number, dice_type, description, is_active, created_at FROM dices WHERE LOWER(dice_number) LIKE :q OR LOWER(dice_type) LIKE :q ORDER BY dice_number"), {"q": f"%{q.lower()}%"})
    else:
        r = await db.execute(text("SELECT id, dice_number, dice_type, description, is_active, created_at FROM dices ORDER BY dice_number"))
    return [DiceOut(**serialize_row(row, ["id","dice_number","dice_type","description","is_active","created_at"])) for row in r.fetchall()]

@api_router.post("/dices", response_model=DiceOut)
async def create_dice(item: DiceCreate, db=Depends(get_db)):
    try:
        r = await db.execute(
            text("INSERT INTO dices (dice_number, dice_type, description) VALUES (:dn, :dt, :desc) RETURNING id, dice_number, dice_type, description, is_active, created_at"),
            {"dn": item.dice_number, "dt": item.dice_type, "desc": item.description}
        )
        await db.commit()
        row = r.fetchone()
        return DiceOut(**serialize_row(row, ["id","dice_number","dice_type","description","is_active","created_at"]))
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# --- Dice Mappings ---
@api_router.get("/dice-mappings/motif", response_model=List[MappingOut])
async def get_dice_motif_mappings(db=Depends(get_db)):
    r = await db.execute(text("""
        SELECT dm.id, dm.dice_id, dm.motif_id, d.dice_number, m.name, m.code
        FROM dice_motif_mapping dm JOIN dices d ON dm.dice_id=d.id JOIN sku_motif m ON dm.motif_id=m.id ORDER BY d.dice_number
    """))
    return [MappingOut(**serialize_row(row, ["id","dice_id","target_id","dice_number","target_name","target_code"])) for row in r.fetchall()]

@api_router.post("/dice-mappings/motif", response_model=MappingOut)
async def create_dice_motif_mapping(item: MappingCreate, db=Depends(get_db)):
    try:
        r = await db.execute(text("INSERT INTO dice_motif_mapping (dice_id, motif_id) VALUES (:did, :tid) RETURNING id, dice_id, motif_id"), {"did": item.dice_id, "tid": item.target_id})
        await db.commit()
        row = r.fetchone()
        return MappingOut(id=str(row[0]), dice_id=str(row[1]), target_id=str(row[2]))
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/dice-mappings/locking", response_model=List[MappingOut])
async def get_dice_locking_mappings(db=Depends(get_db)):
    r = await db.execute(text("""
        SELECT dm.id, dm.dice_id, dm.locking_id, d.dice_number, l.name, l.code
        FROM dice_locking_mapping dm JOIN dices d ON dm.dice_id=d.id JOIN sku_locking l ON dm.locking_id=l.id ORDER BY d.dice_number
    """))
    return [MappingOut(**serialize_row(row, ["id","dice_id","target_id","dice_number","target_name","target_code"])) for row in r.fetchall()]

@api_router.post("/dice-mappings/locking", response_model=MappingOut)
async def create_dice_locking_mapping(item: MappingCreate, db=Depends(get_db)):
    try:
        r = await db.execute(text("INSERT INTO dice_locking_mapping (dice_id, locking_id) VALUES (:did, :tid) RETURNING id, dice_id, locking_id"), {"did": item.dice_id, "tid": item.target_id})
        await db.commit()
        row = r.fetchone()
        return MappingOut(id=str(row[0]), dice_id=str(row[1]), target_id=str(row[2]))
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# --- Job Cards with search & pagination ---
@api_router.get("/job-cards")
async def get_job_cards(q: str = "", status: str = "", page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=200), db=Depends(get_db)):
    where_clauses = []
    params = {}
    if q:
        where_clauses.append("(LOWER(jc.job_card_number) LIKE :q OR LOWER(p.name) LIKE :q OR LOWER(p.sku) LIKE :q)")
        params["q"] = f"%{q.lower()}%"
    if status:
        where_clauses.append("jc.status = :st")
        params["st"] = status
    where = (" WHERE " + " AND ".join(where_clauses)) if where_clauses else ""
    base = f"""FROM job_cards jc JOIN products p ON jc.product_id=p.id LEFT JOIN users u ON jc.assigned_artisan_id=u.id{where}"""

    count_r = await db.execute(text(f"SELECT COUNT(*) {base}"), params)
    total = count_r.scalar()
    offset = (page - 1) * page_size
    params["limit"] = page_size
    params["offset"] = offset
    r = await db.execute(text(f"""
        SELECT jc.id, jc.product_id, jc.job_card_number, jc.target_qty, jc.completed_qty,
               jc.assigned_artisan_id, jc.status, jc.priority, jc.start_date, jc.due_date,
               jc.notes, jc.created_at, p.name, p.sku, u.name
        {base} ORDER BY jc.created_at DESC LIMIT :limit OFFSET :offset
    """), params)
    keys = ["id","product_id","job_card_number","target_qty","completed_qty","assigned_artisan_id","status","priority","start_date","due_date","notes","created_at","product_name","product_sku","artisan_name"]
    items = [JobCardOut(**serialize_row(row, keys)).model_dump() for row in r.fetchall()]
    total_pages = max(1, (total + page_size - 1) // page_size)
    return {"items": items, "total": total, "page": page, "page_size": page_size, "total_pages": total_pages}

@api_router.post("/job-cards", response_model=JobCardOut)
async def create_job_card(item: JobCardCreate, db=Depends(get_db)):
    try:
        r = await db.execute(
            text("""INSERT INTO job_cards (product_id, job_card_number, target_qty, assigned_artisan_id, status, priority, start_date, due_date, notes)
                    VALUES (:pid, :jcn, :tq, :aaid, :st, :pr, :sd::date, :dd::date, :notes)
                    RETURNING id, created_at, completed_qty"""),
            {"pid": item.product_id, "jcn": item.job_card_number, "tq": item.target_qty,
             "aaid": item.assigned_artisan_id, "st": item.status, "pr": item.priority,
             "sd": item.start_date, "dd": item.due_date, "notes": item.notes}
        )
        await db.commit()
        row = r.fetchone()
        return JobCardOut(
            id=str(row[0]), product_id=item.product_id, job_card_number=item.job_card_number,
            target_qty=item.target_qty, completed_qty=row[2] or 0,
            assigned_artisan_id=item.assigned_artisan_id, status=item.status, priority=item.priority,
            start_date=item.start_date, due_date=item.due_date, notes=item.notes,
            created_at=row[1].isoformat() if row[1] else None
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@api_router.patch("/job-cards/{jc_id}/status")
async def update_job_card_status(jc_id: str, status: str = Query(...), db=Depends(get_db)):
    try:
        r = await db.execute(text("SELECT id FROM job_cards WHERE id = :id"), {"id": jc_id})
        if not r.fetchone():
            raise HTTPException(status_code=404, detail="Job card not found")
        await db.execute(text("UPDATE job_cards SET status=:st, updated_at=NOW() WHERE id=:id"), {"st": status, "id": jc_id})
        await db.commit()
        return {"status": "updated"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# --- QC Logs ---
@api_router.get("/qc-logs")
async def get_qc_logs(q: str = "", page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=200), db=Depends(get_db)):
    where = ""
    params = {}
    if q:
        where = " WHERE LOWER(jc.job_card_number) LIKE :q OR LOWER(u.name) LIKE :q OR LOWER(q.defect_reason) LIKE :q"
        params["q"] = f"%{q.lower()}%"
    base = f"FROM qc_logs q JOIN job_cards jc ON q.job_card_id=jc.id LEFT JOIN users u ON q.inspected_by=u.id{where}"
    count_r = await db.execute(text(f"SELECT COUNT(*) {base}"), params)
    total = count_r.scalar()
    offset = (page - 1) * page_size
    params["limit"] = page_size
    params["offset"] = offset
    r = await db.execute(text(f"""
        SELECT q.id, q.job_card_id, q.inspected_by, q.qty_passed, q.qty_failed,
               q.defect_reason, q.inspection_date, q.notes, jc.job_card_number, u.name
        {base} ORDER BY q.inspection_date DESC LIMIT :limit OFFSET :offset
    """), params)
    keys = ["id","job_card_id","inspected_by","qty_passed","qty_failed","defect_reason","inspection_date","notes","job_card_number","inspector_name"]
    items = [QCLogOut(**serialize_row(row, keys)).model_dump() for row in r.fetchall()]
    total_pages = max(1, (total + page_size - 1) // page_size)
    return {"items": items, "total": total, "page": page, "page_size": page_size, "total_pages": total_pages}

@api_router.post("/qc-logs", response_model=QCLogOut)
async def create_qc_log(item: QCLogCreate, db=Depends(get_db)):
    try:
        r = await db.execute(
            text("""INSERT INTO qc_logs (job_card_id, inspected_by, qty_passed, qty_failed, defect_reason, notes)
                    VALUES (:jcid, :iby, :qp, :qf, :dr, :notes) RETURNING id, inspection_date"""),
            {"jcid": item.job_card_id, "iby": item.inspected_by, "qp": item.qty_passed,
             "qf": item.qty_failed, "dr": item.defect_reason, "notes": item.notes}
        )
        await db.commit()
        row = r.fetchone()
        return QCLogOut(
            id=str(row[0]), job_card_id=item.job_card_id, inspected_by=item.inspected_by,
            qty_passed=item.qty_passed, qty_failed=item.qty_failed,
            defect_reason=item.defect_reason, notes=item.notes,
            inspection_date=row[1].isoformat() if row[1] else None
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# --- Inventory with search ---
@api_router.get("/inventory")
async def get_inventory(q: str = "", db=Depends(get_db)):
    where = ""
    params = {}
    if q:
        where = " WHERE LOWER(p.name) LIKE :q OR LOWER(p.sku) LIKE :q OR LOWER(i.location) LIKE :q"
        params["q"] = f"%{q.lower()}%"
    r = await db.execute(text(f"""
        SELECT i.id, i.product_id, i.stock_qty, i.reserved_qty, i.unit_cost, i.selling_price,
               i.mrp, i.weight_grams, i.location, p.name, p.sku
        FROM inventory i JOIN products p ON i.product_id=p.id{where} ORDER BY p.sku
    """), params)
    keys = ["id","product_id","stock_qty","reserved_qty","unit_cost","selling_price","mrp","weight_grams","location","product_name","product_sku"]
    return [InventoryOut(**serialize_row(row, keys)).model_dump() for row in r.fetchall()]

@api_router.post("/inventory", response_model=InventoryOut)
async def create_inventory(item: InventoryCreate, db=Depends(get_db)):
    try:
        r = await db.execute(
            text("""INSERT INTO inventory (product_id, stock_qty, reserved_qty, unit_cost, selling_price, mrp, weight_grams, location)
                    VALUES (:pid, :sq, :rq, :uc, :sp, :mrp, :wg, :loc) RETURNING id"""),
            {"pid": item.product_id, "sq": item.stock_qty, "rq": item.reserved_qty,
             "uc": item.unit_cost, "sp": item.selling_price, "mrp": item.mrp,
             "wg": item.weight_grams, "loc": item.location}
        )
        await db.commit()
        row = r.fetchone()
        return InventoryOut(id=str(row[0]), product_id=item.product_id,
                           stock_qty=item.stock_qty, reserved_qty=item.reserved_qty,
                           unit_cost=item.unit_cost, selling_price=item.selling_price,
                           mrp=item.mrp, weight_grams=item.weight_grams, location=item.location)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# --- Production ---
@api_router.get("/production", response_model=List[ProductionOut])
async def get_production(db=Depends(get_db)):
    r = await db.execute(text("""
        SELECT pr.id, pr.job_card_id, pr.material_assigned, pr.material_weight_grams,
               pr.material_cost, pr.wastage_grams, pr.production_date, pr.status, pr.notes, jc.job_card_number
        FROM production pr JOIN job_cards jc ON pr.job_card_id=jc.id ORDER BY pr.production_date DESC
    """))
    keys = ["id","job_card_id","material_assigned","material_weight_grams","material_cost","wastage_grams","production_date","status","notes","job_card_number"]
    return [ProductionOut(**serialize_row(row, keys)) for row in r.fetchall()]

@api_router.post("/production", response_model=ProductionOut)
async def create_production(item: ProductionCreate, db=Depends(get_db)):
    try:
        r = await db.execute(
            text("""INSERT INTO production (job_card_id, material_assigned, material_weight_grams, material_cost, production_date, notes)
                    VALUES (:jcid, :ma, :mwg, :mc, :pd::date, :notes) RETURNING id, status"""),
            {"jcid": item.job_card_id, "ma": item.material_assigned, "mwg": item.material_weight_grams,
             "mc": item.material_cost, "pd": item.production_date, "notes": item.notes}
        )
        await db.commit()
        row = r.fetchone()
        return ProductionOut(
            id=str(row[0]), job_card_id=item.job_card_id,
            material_assigned=item.material_assigned, material_weight_grams=item.material_weight_grams,
            material_cost=item.material_cost, production_date=item.production_date,
            status=row[1], notes=item.notes
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# --- Migrations ---
@api_router.get("/migrations", response_model=List[MigrationFile])
async def get_migrations():
    files = sorted((ROOT_DIR / 'migrations').glob('*.sql'))
    return [MigrationFile(filename=f.name, content=f.read_text()) for f in files]

# --- SKU Preview ---
@api_router.post("/sku/preview")
async def preview_sku(item: ProductCreate, db=Depends(get_db)):
    codes = []
    for tbl, col_id in [("sku_face_value", item.face_value_id), ("sku_category", item.category_id),
                         ("sku_material", item.material_id), ("sku_motif", item.motif_id),
                         ("sku_finding", item.finding_id), ("sku_locking", item.locking_id),
                         ("sku_size", item.size_id)]:
        r = await db.execute(text(f"SELECT code FROM {tbl} WHERE id = :id"), {"id": col_id})
        row = r.fetchone()
        codes.append(row[0] if row else "?")
    prefix = "".join(codes)
    r = await db.execute(text("SELECT COALESCE(MAX(sequence_num), -1) FROM products WHERE sku LIKE :p"), {"p": prefix + "___"})
    max_seq = r.scalar()
    next_seq = (max_seq or -1) + 1
    base36_chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    quotient = next_seq
    suffix = ""
    for _ in range(3):
        suffix = base36_chars[quotient % 36] + suffix
        quotient //= 36
    return {"prefix": prefix, "suffix": suffix, "full_sku": prefix + suffix, "next_sequence": next_seq, "codes": codes}

# --- Schema & ER Diagram ---
@api_router.get("/schema")
async def get_schema(db=Depends(get_db)):
    r = await db.execute(text("""
        SELECT table_name, column_name, data_type, is_nullable, column_default
        FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position
    """))
    schema = {}
    for row in r.fetchall():
        tbl = row[0]
        if tbl not in schema:
            schema[tbl] = []
        schema[tbl].append({"column": row[1], "type": row[2], "nullable": row[3], "default": row[4]})
    return schema

@api_router.get("/er-diagram")
async def get_er_diagram(db=Depends(get_db)):
    r = await db.execute(text("""
        SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name=tc.constraint_name AND ccu.table_schema=tc.table_schema
        WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema='public'
    """))
    relationships = [{"from_table": row[0], "from_column": row[1], "to_table": row[2], "to_column": row[3]} for row in r.fetchall()]

    r2 = await db.execute(text("""
        SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name
    """))
    tables = [row[0] for row in r2.fetchall()]

    schema = {}
    for tbl in tables:
        r3 = await db.execute(text("""
            SELECT column_name, data_type, is_nullable, column_default,
                   (SELECT COUNT(*) FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name
                    WHERE tc.table_name=c.table_name AND kcu.column_name=c.column_name AND tc.constraint_type='PRIMARY KEY') as is_pk
            FROM information_schema.columns c WHERE table_schema='public' AND table_name=:tbl ORDER BY ordinal_position
        """), {"tbl": tbl})
        schema[tbl] = [{"column": row[0], "type": row[1], "nullable": row[2], "default": row[3], "is_pk": row[4] > 0} for row in r3.fetchall()]

    return {"tables": tables, "relationships": relationships, "schema": schema}

# --- Include router ---
app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','), allow_methods=["*"], allow_headers=["*"])

@app.on_event("shutdown")
async def shutdown():
    await engine.dispose()
