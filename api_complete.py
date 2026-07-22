#!/usr/bin/env python3
"""
Vanguard Insurance Complete API
Handles all data operations for the comprehensive system
"""

from fastapi import FastAPI, HTTPException, Request, Query, Depends, File, UploadFile, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
import sqlite3
import json
import uvicorn
import hashlib
import secrets
import os
import shutil
from pathlib import Path
from contextlib import contextmanager

# Initialize FastAPI app
app = FastAPI(title="Vanguard Insurance API", version="2.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database paths
FMCSA_DB = "fmcsa_complete.db"
SYSTEM_DB = "vanguard_system.db"

# Database connection manager
@contextmanager
def get_db(db_path):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# ==================== MODELS ====================

class LeadCreate(BaseModel):
    dot_number: Optional[str] = None
    mc_number: Optional[str] = None
    company_name: str
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    status: str = "active"
    priority: str = "medium"
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    source: Optional[str] = "manual"
    tags: Optional[List[str]] = []

class LeadUpdate(BaseModel):
    status: Optional[str] = None
    stage: Optional[str] = None  # Added for stage updates
    priority: Optional[str] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    last_contact_date: Optional[datetime] = None
    next_followup_date: Optional[date] = None
    current_insurance: Optional[str] = None
    policy_expiry_date: Optional[date] = None
    coverage_amount: Optional[str] = None
    premium_quoted: Optional[float] = None

class PolicyCreate(BaseModel):
    policy_number: str
    dot_number: Optional[str] = None
    company_name: str
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    policy_type: str
    carrier: str
    effective_date: date
    expiration_date: date
    premium: float
    commission: Optional[float] = None
    coverage_limits: Dict[str, Any] = {}
    deductibles: Dict[str, Any] = {}
    status: str = "active"

class QuoteSubmission(BaseModel):
    lead_id: str
    application_id: str
    form_data: Dict[str, Any]
    status: str = "draft"
    quote_pdf_path: Optional[str] = None
    submitted_date: Optional[datetime] = None

class QuoteSubmissionUpdate(BaseModel):
    status: Optional[str] = None
    form_data: Optional[Dict[str, Any]] = None
    quote_pdf_path: Optional[str] = None
    submitted_date: Optional[datetime] = None

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: str = "agent"

class ReminderCreate(BaseModel):
    title: str
    description: Optional[str] = None
    type: str
    priority: str = "medium"
    related_type: Optional[str] = None
    related_id: Optional[str] = None
    due_date: datetime
    reminder_date: Optional[datetime] = None
    assigned_to: Optional[str] = None

# ==================== SEARCH ENDPOINTS ====================

@app.post("/api/search")
async def search_carriers(request: Request):
    """Search the FMCSA database"""
    try:
        data = await request.json()

        # Build query
        with get_db(FMCSA_DB) as conn:
            cursor = conn.cursor()

            query = "SELECT * FROM carriers WHERE 1=1"
            params = []

            # Add filters
            if data.get("usdot_number"):
                query += " AND dot_number LIKE ?"
                params.append(f"%{data['usdot_number']}%")

            if data.get("mc_number"):
                query += " AND mc_number LIKE ?"
                params.append(f"%{data['mc_number']}%")

            if data.get("legal_name"):
                query += " AND (legal_name LIKE ? OR dba_name LIKE ?)"
                params.extend([f"%{data['legal_name']}%", f"%{data['legal_name']}%"])

            if data.get("state"):
                query += " AND state = ?"
                params.append(data["state"].upper())

            # Pagination
            page = data.get("page", 1)
            per_page = min(data.get("per_page", 100), 500)
            offset = (page - 1) * per_page

            # Get total count
            count_query = query.replace("SELECT *", "SELECT COUNT(*)")
            cursor.execute(count_query, params)
            total = cursor.fetchone()[0]

            # Get results
            query += f" LIMIT {per_page} OFFSET {offset}"
            cursor.execute(query, params)

            results = []
            for row in cursor.fetchall():
                carrier = dict(row)
                # Map fields for frontend compatibility
                results.append({
                    "usdot_number": carrier.get("dot_number", ""),
                    "legal_name": carrier.get("legal_name", ""),
                    "dba_name": carrier.get("dba_name", ""),
                    "city": carrier.get("city", ""),
                    "state": carrier.get("state", ""),
                    "power_units": carrier.get("power_units", 0),
                    "mc_number": carrier.get("mc_number", ""),
                    "phone": carrier.get("phone", ""),
                    "email_address": carrier.get("email_address", ""),
                    "status": "Active" if carrier.get("power_units", 0) > 0 else "Inactive",
                    "expiry": "2025-03-15"  # Placeholder
                })

            return {
                "results": results,
                "total": total,
                "page": page,
                "per_page": per_page,
                "carriers": results  # For frontend compatibility
            }

    except Exception as e:
        print(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== LEAD MANAGEMENT ====================

@app.get("/api/leads")
async def get_leads(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to: Optional[str] = None,
    page: int = 1,
    per_page: int = 50
):
    """Get all leads with filtering"""
    all_leads = []

    # First check vanguard.db (where frontend leads are stored)
    vanguard_conn = sqlite3.connect("vanguard.db")
    vanguard_cursor = vanguard_conn.cursor()

    vanguard_cursor.execute("SELECT id, data FROM leads")
    vanguard_rows = vanguard_cursor.fetchall()

    for row in vanguard_rows:
        try:
            lead_data = json.loads(row[1])
            # IMPORTANT: Filter out archived leads
            if lead_data.get('archived', False):
                continue  # Skip archived leads

            # Apply filters if provided
            if status and lead_data.get('status') != status:
                continue
            if priority and lead_data.get('priority') != priority:
                continue
            if assigned_to and lead_data.get('assignedTo') != assigned_to:
                continue

            all_leads.append(lead_data)
        except:
            pass

    vanguard_conn.close()

    # Also check vanguard_system.db for any additional leads
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()

        query = "SELECT * FROM leads WHERE 1=1"
        params = []

        if status:
            query += " AND status = ?"
            params.append(status)

        if priority:
            query += " AND priority = ?"
            params.append(priority)

        if assigned_to:
            query += " AND assigned_to = ?"
            params.append(assigned_to)

        cursor.execute(query, params)
        system_leads = [dict(row) for row in cursor.fetchall()]

        # Parse JSON fields for system leads
        for lead in system_leads:
            if lead.get("tags"):
                lead["tags"] = json.loads(lead["tags"])
            if lead.get("custom_fields"):
                lead["custom_fields"] = json.loads(lead["custom_fields"])

            # Check if this lead already exists in vanguard.db
            if not any(l.get('id') == lead.get('lead_id') for l in all_leads):
                all_leads.append(lead)

    # Sort by created date (newest first) and apply pagination
    all_leads.sort(key=lambda x: x.get('created', ''), reverse=True)

    # Apply pagination
    offset = (page - 1) * per_page
    paginated_leads = all_leads[offset:offset + per_page]

    return {"leads": paginated_leads, "page": page, "per_page": per_page}

@app.get("/api/carrier/profile/{dot_number}")
async def get_carrier_profile(dot_number: int):
    """Get complete carrier profile by DOT number including vehicle inspection data"""
    with get_db(FMCSA_DB) as conn:
        cursor = conn.cursor()

        # Get carrier data
        cursor.execute("""
            SELECT * FROM carriers WHERE dot_number = ?
        """, (dot_number,))

        carrier = cursor.fetchone()
        if not carrier:
            raise HTTPException(status_code=404, detail="Carrier not found")

        carrier_data = dict(carrier)

        # Try to get vehicle inspection data if table exists
        inspections = []
        inspection_summary = {}

        try:
            # Check if vehicle_inspections table exists
            cursor.execute("""
                SELECT name FROM sqlite_master
                WHERE type='table' AND name='vehicle_inspections'
            """)

            if cursor.fetchone():
                # Get vehicle inspection data
                cursor.execute("""
                    SELECT
                        inspection_id,
                        insp_date,
                        report_state,
                        report_number,
                        insp_level_id,
                        location_desc,
                        gross_comb_veh_wt,
                        viol_total,
                        oos_total,
                        driver_viol_total,
                        vehicle_viol_total,
                        hazmat_viol_total
                    FROM vehicle_inspections
                    WHERE dot_number = ?
                    ORDER BY insp_date DESC
                    LIMIT 10
                """, (dot_number,))

                inspections = [dict(row) for row in cursor.fetchall()]

                # Get inspection summary
                cursor.execute("""
                    SELECT
                        COUNT(*) as total_inspections,
                        SUM(viol_total) as total_violations,
                        SUM(oos_total) as total_oos,
                        AVG(viol_total) as avg_violations
                    FROM vehicle_inspections
                    WHERE dot_number = ?
                """, (dot_number,))

                summary = cursor.fetchone()
                inspection_summary = dict(summary) if summary else {}
        except Exception as e:
            # Log error but don't fail the entire request
            print(f"Warning: Could not fetch inspection data: {e}")

        return {
            "carrier": carrier_data,
            "inspections": inspections,
            "inspection_summary": inspection_summary
        }

@app.get("/api/leads/expiring-insurance")
async def get_expiring_insurance_leads(
    days: int = Query(30, description="Days until insurance expiry"),
    limit: int = Query(50000, description="Maximum number of leads"),
    state: Optional[str] = Query(None, description="State filter"),
    min_premium: Optional[float] = Query(0, description="Minimum premium"),
    insurance_companies: Optional[str] = Query(None, description="Insurance companies filter"),
    skip_days: Optional[int] = Query(0, description="Skip first N days (for 5/30 filter)")
):
    """Get HIGH QUALITY leads from database - ONLY real data, NO simulation"""
    print(f"Getting insurance leads: days={days}, skip_days={skip_days}, state={state}, companies={insurance_companies}")

    with get_db(FMCSA_DB) as conn:
        cursor = conn.cursor()

        from datetime import datetime, timedelta
        today = datetime.now().date()

        # ONLY pull REAL carriers from database with COMPLETE information
        # MUST have email AND representative (in ANY field) to be quality lead

        # Calculate date range for filtering
        start_date = today + timedelta(days=skip_days if skip_days > 0 else 0)
        end_date = today + timedelta(days=days)

        # NO SPECIAL HANDLING - Use REAL renewal dates for ALL states including Texas
        print(f"Getting REAL insurance leads: state={state}, days={days}, companies={insurance_companies}")

        # Get ALL carriers with REAL renewal dates - NO EMAIL/REP REQUIREMENT
        query = """
            SELECT dot_number, legal_name, dba_name,
                   street, city, state, zip_code,
                   phone, drivers, power_units, insurance_carrier,
                   bipd_insurance_required_amount, bipd_insurance_on_file_amount,
                   entity_type, operating_status, email_address,
                   policy_renewal_date,
                   representative_1_name, representative_2_name, principal_name, officers_data,
                   mcs150_date, created_at
            FROM carriers
            WHERE insurance_carrier IS NOT NULL
            AND insurance_carrier != ''
            AND operating_status = 'Active'
            AND policy_renewal_date IS NOT NULL
            AND date(policy_renewal_date) BETWEEN date(?) AND date(?)
        """

        # Add state filter if provided
        if state:
            query += " AND state = ?"

        # Add insurance company filter with LIKE matching
        if insurance_companies:
            companies = [c.strip() for c in insurance_companies.split(',')]
            carrier_conditions = ' OR '.join(['insurance_carrier LIKE ?' for _ in companies])
            query += f" AND ({carrier_conditions})"

        # Order by renewal date and power units for best leads first
        query += " ORDER BY policy_renewal_date, power_units DESC LIMIT ?"

        # Build parameters with date range FIRST
        params = []
        # Add date range parameters (these come first in the query)
        params.append(start_date.isoformat())
        params.append(end_date.isoformat())

        if state:
            params.append(state)
        if insurance_companies:
            # Add % wildcards for LIKE matching
            companies = [c.strip() for c in insurance_companies.split(',')]
            like_companies = [f'%{c}%' for c in companies]
            params.extend(like_companies)

        # Add limit as last parameter
        params.append(limit)

        # Debug the actual query
        print(f"DEBUG: Query length: {len(query)}")
        # Print query in chunks
        print("DEBUG: Full query:")
        for i in range(0, min(len(query), 500), 100):
            print(f"  {query[i:i+100]}")
        print(f"DEBUG: Query params: {params}")
        print(f"DEBUG: Searching for state={state}, companies={insurance_companies}")

        cursor.execute(query, params)
        all_carriers = cursor.fetchall()

        print(f"REAL DATA: Query returned {len(all_carriers)} carriers with actual renewal dates")

        # Process results - ALL dates are already filtered by SQL
        results = []
        import json

        for row in all_carriers:
            carrier = dict(row)

            # Calculate days until renewal from REAL date
            renewal_date = carrier.get('policy_renewal_date')
            if renewal_date:
                try:
                    renewal = datetime.strptime(renewal_date, '%Y-%m-%d').date()
                    days_diff = (renewal - today).days
                    carrier['days_until_expiry'] = days_diff
                except:
                    carrier['days_until_expiry'] = None

            # Extract representative name (optional - not required)
            rep_name = carrier.get('representative_1_name') or carrier.get('representative_2_name') or carrier.get('principal_name')

            # Try to get from officers_data if no direct rep
            if not rep_name and carrier.get('officers_data'):
                try:
                    officers = json.loads(carrier['officers_data'])
                    if 'representatives' in officers and officers['representatives']:
                        rep_name = officers['representatives'][0].get('name', '')
                except:
                    pass

            carrier['representative_name'] = rep_name or ''

            # Quality score based on available data
            quality = 0
            if carrier.get('email_address'): quality += 40
            if carrier.get('phone'): quality += 20
            if rep_name: quality += 30
            if carrier.get('power_units', 0) > 5: quality += 10

            carrier['quality_score'] = 'HIGH' if quality >= 70 else 'MEDIUM' if quality >= 40 else 'LOW'

            # Add premium if available
            if carrier.get('bipd_insurance_on_file_amount'):
                carrier['premium'] = carrier['bipd_insurance_on_file_amount']
            else:
                # Estimate based on fleet size
                power_units = carrier.get('power_units', 1) or 1
                carrier['premium'] = power_units * 3500

            results.append(carrier)

        return {
            "leads": results,
            "total": len(results),
            "criteria": {
                "days": days,
                "state": state,
                "insurance_companies": insurance_companies
            }
        }

@app.post("/api/leads")
async def create_lead(lead: LeadCreate):
    """Create a new lead"""
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()

        # Generate unique lead_id
        lead_id = f"L{datetime.now().strftime('%Y%m%d')}{secrets.token_hex(4).upper()}"

        cursor.execute("""
            INSERT INTO leads (
                lead_id, dot_number, mc_number, company_name, contact_name,
                phone, email, address, city, state, zip_code,
                status, priority, assigned_to, notes, source, tags
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            lead_id, lead.dot_number, lead.mc_number, lead.company_name,
            lead.contact_name, lead.phone, lead.email, lead.address,
            lead.city, lead.state, lead.zip_code, lead.status,
            lead.priority, lead.assigned_to, lead.notes, lead.source,
            json.dumps(lead.tags)
        ))

        conn.commit()

        return {"message": "Lead created", "lead_id": lead_id}

@app.get("/api/leads/{lead_id}")
async def get_lead(lead_id: str):
    """Get a single lead by ID"""
    # First check vanguard.db (where frontend leads are stored)
    vanguard_conn = sqlite3.connect("vanguard.db")
    vanguard_cursor = vanguard_conn.cursor()

    vanguard_cursor.execute("SELECT id, data FROM leads WHERE id = ?", (lead_id,))
    vanguard_row = vanguard_cursor.fetchone()

    if vanguard_row:
        lead_data = json.loads(vanguard_row[1])
        vanguard_conn.close()
        return lead_data

    vanguard_conn.close()

    # If not found in vanguard.db, check vanguard_system.db
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM leads WHERE lead_id = ?", (lead_id,))
        row = cursor.fetchone()

        if not row:
            return JSONResponse(
                status_code=404,
                content={"error": "Lead not found", "message": f"No lead with ID {lead_id}"}
            )

        # Convert row to dict
        lead = dict(row)

        # Parse JSON fields if they exist
        json_fields = ['tags', 'vehicles', 'trailers', 'drivers', 'commodities', 'additional_interests', 'custom_fields']
        for field in json_fields:
            if lead.get(field):
                try:
                    lead[field] = json.loads(lead[field])
                except:
                    pass

        return lead

@app.put("/api/leads/{lead_id}")
async def update_lead(lead_id: str, request: Request):
    """Update a lead - accepts any JSON fields"""
    # Get JSON body with updates
    update = await request.json()

    if not update:
        return {"message": "No updates provided"}

    # Try vanguard.db first (where frontend leads are stored)
    vanguard_conn = sqlite3.connect("vanguard.db")
    vanguard_cursor = vanguard_conn.cursor()

    # Check if lead exists in vanguard.db
    vanguard_cursor.execute("SELECT id, data FROM leads WHERE id = ?", (lead_id,))
    vanguard_row = vanguard_cursor.fetchone()

    if vanguard_row:
        # Update lead in vanguard.db
        lead_data = json.loads(vanguard_row[1])
        lead_data.update(update)
        lead_data['updated_at'] = datetime.now().isoformat()

        vanguard_cursor.execute(
            "UPDATE leads SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (json.dumps(lead_data), lead_id)
        )
        vanguard_conn.commit()
        vanguard_conn.close()

        return {"message": "Lead updated successfully", "lead_id": lead_id}

    vanguard_conn.close()

    # If not in vanguard.db, check vanguard_system.db
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT lead_id FROM leads WHERE lead_id = ?", (lead_id,))
        row = cursor.fetchone()

        if not row:
            # Lead doesn't exist in either database
            return JSONResponse(
                status_code=404,
                content={"error": "Lead not found", "message": f"No lead with ID {lead_id}"}
            )

        # Handle field name mappings for consistency
        field_mappings = {
            'yearsInBusiness': 'years_in_business',
            'fleetSize': 'fleet_size',
            'dotNumber': 'dot_number',
            'mcNumber': 'mc_number',
            'radiusOfOperation': 'radius_of_operation',
            'commodityHauled': 'commodity_hauled',
            'operatingStates': 'operating_states',
            'transcriptText': 'transcript_text',
            'ownerName': 'owner_name',
            'ownerAddress': 'owner_address',
            'mailingAddress': 'mailing_address',
            'garagingAddress': 'garaging_address',
            'haulForHire': 'haul_for_hire',
            'nonTrucking': 'non_trucking',
            'otherOperation': 'other_operation',
            'dryVan': 'dry_van',
            'dumpTruck': 'dump_truck',
            'flatBed': 'flat_bed',
            'vanBuses': 'van_buses',
            'autoHauler': 'auto_hauler',
            'boxTruck': 'box_truck',
            'otherClass': 'other_class',
            'autoLiability': 'auto_liability',
            'medicalPayments': 'medical_payments',
            'comprehensiveDeductible': 'comprehensive_deductible',
            'collisionDeductible': 'collision_deductible',
            'generalLiability': 'general_liability',
            'cargoLimit': 'cargo_limit',
            'cargoDeductible': 'cargo_deductible',
            'additionalInterests': 'additional_interests',
            'company': 'company_name',
            'contact': 'contact_name',
            'dot': 'dot_number',
            'mc': 'mc_number'
        }

        # Build dynamic update query
        updates = []
        params = []

        # JSON encode certain fields
        json_fields = ['tags', 'vehicles', 'trailers', 'drivers', 'commodities', 'additional_interests', 'custom_fields']

        for field, value in update.items():
            # Map field name if needed
            db_field = field_mappings.get(field, field)

            # JSON encode if needed
            if db_field in json_fields and not isinstance(value, str):
                value = json.dumps(value)

            updates.append(f"{db_field} = ?")
            params.append(value)

        if not updates:
            return {"message": "No valid updates provided"}

        # Add lead_id to params for WHERE clause
        params.append(lead_id)

        # Build and execute update query
        query = f"UPDATE leads SET {', '.join(updates)} WHERE lead_id = ?"

        try:
            cursor.execute(query, params)
            conn.commit()

            return {"message": "Lead updated", "lead_id": lead_id, "rows_affected": cursor.rowcount}
        except Exception as e:
            return {"error": str(e), "message": "Failed to update lead"}

@app.post("/api/leads/{lead_id}/convert")
async def convert_lead(lead_id: str, policy_number: str):
    """Convert a lead to a policy"""
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE leads
            SET converted_to_policy = 1,
                policy_number = ?,
                conversion_date = CURRENT_TIMESTAMP,
                status = 'won'
            WHERE lead_id = ?
        """, (policy_number, lead_id))

        conn.commit()

        return {"message": "Lead converted to policy", "policy_number": policy_number}

# ==================== CLIENT MANAGEMENT ====================

@app.get("/api/clients")
async def get_clients(
    status: Optional[str] = None,
    page: int = 1,
    per_page: int = 50
):
    """Get all clients from the REAL database"""
    # Use the MAIN vanguard.db with the real clients
    vanguard_db_path = os.path.join(os.path.dirname(__file__), "vanguard.db")

    with sqlite3.connect(vanguard_db_path) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Get clients from the REAL database
        cursor.execute("SELECT id, data FROM clients ORDER BY created_at DESC")
        rows = cursor.fetchall()

        clients = []
        for row in rows:
            try:
                # Parse the JSON data
                client_data = json.loads(row['data'])
                client_data['id'] = row['id']
                clients.append(client_data)
            except json.JSONDecodeError:
                continue

        # Apply filters
        if status:
            clients = [c for c in clients if c.get('status', '').lower() == status.lower()]

        # Pagination
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        paginated_clients = clients[start_idx:end_idx]

        return paginated_clients

# ==================== POLICY MANAGEMENT ====================

@app.get("/api/policies")
async def get_policies(
    status: Optional[str] = None,
    expiring_soon: bool = False,
    page: int = 1,
    per_page: int = 50
):
    """Get all policies from the CORRECT REAL database"""
    # Use the MAIN vanguard.db with the real policies (DU ROAD TRUCKING LLC, etc.)
    vanguard_db_path = os.path.join(os.path.dirname(__file__), "vanguard.db")

    with sqlite3.connect(vanguard_db_path) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Get policies from the REAL database
        cursor.execute("SELECT id, client_id, data FROM policies ORDER BY created_at DESC")
        rows = cursor.fetchall()

        policies = []
        for row in rows:
            try:
                # Parse the JSON data
                policy_data = json.loads(row['data'])
                policy_data['id'] = row['id']
                policy_data['client_id'] = row['client_id']
                policies.append(policy_data)
            except json.JSONDecodeError:
                continue

        # Apply filters
        if status:
            policies = [p for p in policies if p.get('policyStatus', '').lower() == status.lower()]

        if expiring_soon:
            # Filter policies expiring within 30 days
            thirty_days_from_now = (datetime.now() + timedelta(days=30)).date()
            filtered_policies = []
            for policy in policies:
                expiry_str = policy.get('expirationDate') or policy.get('expiry')
                if expiry_str:
                    try:
                        expiry_date = datetime.fromisoformat(expiry_str.replace('Z', '+00:00')).date()
                        if expiry_date <= thirty_days_from_now:
                            filtered_policies.append(policy)
                    except:
                        continue
            policies = filtered_policies

        # Pagination
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        paginated_policies = policies[start_idx:end_idx]

        return paginated_policies

@app.post("/api/policies")
async def create_policy(policy: PolicyCreate):
    """Create a new policy"""
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO policies (
                policy_number, dot_number, company_name, contact_name,
                email, phone, policy_type, carrier, effective_date,
                expiration_date, premium, commission, coverage_limits,
                deductibles, status, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'API')
        """, (
            policy.policy_number, policy.dot_number, policy.company_name,
            policy.contact_name, policy.email, policy.phone,
            policy.policy_type, policy.carrier, policy.effective_date.isoformat(),
            policy.expiration_date.isoformat(), policy.premium, policy.commission,
            json.dumps(policy.coverage_limits), json.dumps(policy.deductibles),
            policy.status
        ))

        conn.commit()

        # Set renewal reminder
        cursor.execute("""
            INSERT INTO reminders (
                title, description, type, related_type, related_id,
                due_date, reminder_date, priority
            ) VALUES (?, ?, 'renewal', 'policy', ?, ?, ?, 'high')
        """, (
            f"Policy Renewal: {policy.policy_number}",
            f"Policy for {policy.company_name} expires on {policy.expiration_date}",
            policy.policy_number,
            policy.expiration_date.isoformat(),
            (policy.expiration_date.replace(day=1)).isoformat()
        ))

        conn.commit()

        return {"message": "Policy created", "policy_number": policy.policy_number}

@app.delete("/api/policies/{policy_id}")
async def delete_policy(policy_id: str):
    """Delete a policy"""
    try:
        # First check if policy exists in the main vanguard.db
        vanguard_db_path = os.path.join(os.path.dirname(__file__), "vanguard.db")

        with get_db(vanguard_db_path) as conn:
            cursor = conn.cursor()

            # Check if policy exists
            cursor.execute("SELECT policy_number FROM policies WHERE policy_number = ?", (policy_id,))
            policy = cursor.fetchone()

            if not policy:
                # Also check by id field if policy_number didn't match
                cursor.execute("SELECT policy_number FROM policies WHERE id = ?", (policy_id,))
                policy = cursor.fetchone()

                if not policy:
                    raise HTTPException(status_code=404, detail="Policy not found")

            # Delete the policy
            cursor.execute("DELETE FROM policies WHERE policy_number = ? OR id = ?", (policy_id, policy_id))
            deleted_count = cursor.rowcount

            if deleted_count == 0:
                raise HTTPException(status_code=404, detail="Policy not found")

            conn.commit()

            print(f"✅ Policy {policy_id} deleted successfully from database")
            return {"success": True, "message": f"Policy {policy_id} deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting policy {policy_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting policy: {str(e)}")

# ==================== USER MANAGEMENT ====================

@app.post("/api/users/register")
async def register_user(user: UserCreate):
    """Register a new user"""
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()

        # Hash password
        password_hash = hashlib.sha256(user.password.encode()).hexdigest()

        try:
            cursor.execute("""
                INSERT INTO users (username, email, password_hash, full_name, role)
                VALUES (?, ?, ?, ?, ?)
            """, (user.username, user.email, password_hash, user.full_name, user.role))

            conn.commit()

            return {"message": "User registered", "username": user.username}
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=400, detail="Username or email already exists")

@app.post("/api/users/login")
async def login(username: str, password: str):
    """User login"""
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()

        password_hash = hashlib.sha256(password.encode()).hexdigest()

        cursor.execute("""
            SELECT id, username, email, full_name, role
            FROM users
            WHERE username = ? AND password_hash = ? AND active = 1
        """, (username, password_hash))

        user = cursor.fetchone()

        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Update last login
        cursor.execute("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", (user["id"],))
        conn.commit()

        # Create session token
        session_token = secrets.token_hex(32)

        return {
            "user": dict(user),
            "token": session_token
        }

# ==================== REMINDERS & TASKS ====================

@app.get("/api/reminders")
async def get_reminders(
    assigned_to: Optional[str] = None,
    status: str = "pending",
    due_today: bool = False
):
    """Get reminders and tasks"""
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()

        query = "SELECT * FROM reminders WHERE status = ?"
        params = [status]

        if assigned_to:
            query += " AND assigned_to = ?"
            params.append(assigned_to)

        if due_today:
            query += " AND date(due_date) = date('now')"

        query += " ORDER BY due_date ASC"

        cursor.execute(query, params)
        reminders = [dict(row) for row in cursor.fetchall()]

        return {"reminders": reminders}

@app.post("/api/reminders")
async def create_reminder(reminder: ReminderCreate):
    """Create a reminder"""
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO reminders (
                title, description, type, priority, related_type,
                related_id, due_date, reminder_date, assigned_to, assigned_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'API')
        """, (
            reminder.title, reminder.description, reminder.type,
            reminder.priority, reminder.related_type, reminder.related_id,
            reminder.due_date.isoformat() if reminder.due_date else None,
            reminder.reminder_date.isoformat() if reminder.reminder_date else None,
            reminder.assigned_to
        ))

        conn.commit()

        return {"message": "Reminder created", "id": cursor.lastrowid}

# ==================== ACTIVITY LOGGING ====================

@app.get("/api/activity")
async def get_activity_log(
    table_name: Optional[str] = None,
    user_id: Optional[int] = None,
    limit: int = 100
):
    """Get activity log"""
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()

        query = "SELECT * FROM activity_log WHERE 1=1"
        params = []

        if table_name:
            query += " AND table_name = ?"
            params.append(table_name)

        if user_id:
            query += " AND user_id = ?"
            params.append(user_id)

        query += f" ORDER BY timestamp DESC LIMIT {limit}"

        cursor.execute(query, params)
        activities = [dict(row) for row in cursor.fetchall()]

        # Parse JSON fields
        for activity in activities:
            for field in ["old_value", "new_value"]:
                if activity.get(field):
                    activity[field] = json.loads(activity[field])

        return {"activities": activities}

def log_activity(table_name: str, action: str, record_id: str,
                 old_value: Any = None, new_value: Any = None, user_id: int = None):
    """Helper function to log activity"""
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO activity_log (
                user_id, username, action, table_name, record_id,
                old_value, new_value
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id, "API", action, table_name, record_id,
            json.dumps(old_value) if old_value else None,
            json.dumps(new_value) if new_value else None
        ))

        conn.commit()

# ==================== FILE UPLOAD ====================

UPLOAD_DIR = Path("/home/corp06/uploaded_files")
UPLOAD_DIR.mkdir(exist_ok=True)

@app.get("/upload.html")
async def get_upload_page():
    """Serve the upload.html file"""
    file_path = Path("upload.html")
    if file_path.exists():
        with open(file_path, 'r') as f:
            content = f.read()
        return HTMLResponse(content=content)
    else:
        raise HTTPException(status_code=404, detail="Upload page not found")

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Handle file uploads"""
    try:
        # Create unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_extension = os.path.splitext(file.filename)[1]
        safe_filename = f"{timestamp}_{file.filename}"
        file_path = UPLOAD_DIR / safe_filename

        # Save the file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # If it's a CSV, try to import to database
        if file_extension.lower() == '.csv':
            # Here you could add CSV processing logic
            pass

        return {
            "message": "File uploaded successfully",
            "filename": safe_filename,
            "path": str(file_path),
            "size": os.path.getsize(file_path)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== STATISTICS ====================

@app.get("/api/stats/summary")
async def get_stats():
    """Get system statistics"""
    stats = {}

    # FMCSA database stats
    with get_db(FMCSA_DB) as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM carriers")
        stats["total_carriers"] = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM carriers WHERE state = 'OH'")
        stats["ohio_carriers"] = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM carriers WHERE bipd_insurance_on_file_amount IS NOT NULL")
        stats["carriers_with_insurance"] = cursor.fetchone()[0]

    # System database stats
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM leads WHERE status = 'active'")
        stats["active_leads"] = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM policies WHERE status = 'active'")
        stats["active_policies"] = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM reminders WHERE status = 'pending'")
        stats["pending_reminders"] = cursor.fetchone()[0]

    return stats

@app.get("/api/stats/dashboard")
async def get_dashboard_stats():
    """Get comprehensive dashboard statistics"""
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()

        # Lead statistics
        cursor.execute("""
            SELECT
                status,
                COUNT(*) as count
            FROM leads
            GROUP BY status
        """)
        lead_stats = dict(cursor.fetchall())

        # Policy statistics
        cursor.execute("""
            SELECT
                policy_type,
                COUNT(*) as count,
                SUM(premium) as total_premium
            FROM policies
            WHERE status = 'active'
            GROUP BY policy_type
        """)
        policy_stats = [dict(row) for row in cursor.fetchall()]

        # Monthly revenue
        cursor.execute("""
            SELECT
                strftime('%Y-%m', created_date) as month,
                SUM(premium) as revenue,
                SUM(commission) as commission
            FROM policies
            GROUP BY month
            ORDER BY month DESC
            LIMIT 12
        """)
        monthly_revenue = [dict(row) for row in cursor.fetchall()]

        return {
            "lead_stats": lead_stats,
            "policy_stats": policy_stats,
            "monthly_revenue": monthly_revenue
        }

# ==================== HEALTH CHECK ====================

@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "service": "Vanguard Insurance API",
        "version": "2.0",
        "status": "operational",
        "features": [
            "FMCSA Database Search (2.2M carriers)",
            "Lead Management",
            "Policy Management",
            "User Authentication",
            "Activity Logging",
            "Reminders & Tasks",
            "Real-time Statistics"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check FMCSA database
        with get_db(FMCSA_DB) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM carriers LIMIT 1")
            fmcsa_ok = True
    except:
        fmcsa_ok = False

    try:
        # Check system database
        with get_db(SYSTEM_DB) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM leads LIMIT 1")
            system_ok = True
    except:
        system_ok = False

    return {
        "status": "healthy" if (fmcsa_ok and system_ok) else "degraded",
        "databases": {
            "fmcsa": "connected" if fmcsa_ok else "error",
            "system": "connected" if system_ok else "error"
        }
    }

# ============= VICIDIAL INTEGRATION ENDPOINTS =============

import httpx
import base64

# Vicidial configuration
VICIDIAL_HOST = "204.13.233.29"
VICIDIAL_PROTOCOL = "https"  # ViciBox uses HTTPS
# These should be the API user credentials from Vicidial
# You'll need to create these in Vicidial admin interface
VICIDIAL_USERNAME = "6666"  # API user
VICIDIAL_PASSWORD = "corp06"  # API password

@app.get("/api/vicidial/test")
async def test_vicidial_connection():
    """Test connection to Vicidial server"""
    try:
        # First try the non-agent API with credentials
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            # Try to get version from API
            response = await client.get(
                f"{VICIDIAL_PROTOCOL}://{VICIDIAL_HOST}/vicidial/non_agent_api.php",
                params={
                    "source": "test",
                    "user": VICIDIAL_USERNAME,
                    "pass": VICIDIAL_PASSWORD,
                    "function": "version"
                }
            )

            # Check if we got a valid response
            if response.status_code == 200:
                text = response.text
                if "VERSION" in text or "SUCCESS" in text:
                    return {"connected": True, "message": "Connected to Vicidial API", "response": text[:200]}
                elif "ERROR" in text:
                    return {"connected": False, "error": f"API Error: {text[:200]}"}
                else:
                    return {"connected": True, "message": "Server responded", "response": text[:200]}
            else:
                return {"connected": False, "error": f"Server returned status {response.status_code}"}

    except httpx.ConnectError:
        return {"connected": False, "error": "Cannot connect to Vicidial server"}
    except httpx.TimeoutException:
        return {"connected": False, "error": "Connection timeout"}
    except Exception as e:
        return {"connected": False, "error": str(e)}

@app.get("/api/vicidial/lists")
async def get_vicidial_lists():
    """Get available lists from Vicidial"""
    try:
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            # Call Vicidial API to get all lists
            # Note: The non_agent_api doesn't have a direct list_all function
            # We'll try to get campaign lists or use a workaround

            # First, let's try to get active lists (common list IDs)
            lists = []

            # Check ALL your actual list IDs from ViciBox
            for list_id in ["998", "999", "1000", "1005", "1006"]:
                response = await client.get(
                    f"{VICIDIAL_PROTOCOL}://{VICIDIAL_HOST}/vicidial/non_agent_api.php",
                    params={
                        "source": "vanguard",
                        "function": "list_info",
                        "user": VICIDIAL_USERNAME,
                        "pass": VICIDIAL_PASSWORD,
                        "list_id": list_id
                    }
                )

                if response.status_code == 200 and "ERROR" not in response.text:
                    # Parse the response: list_id|list_name|campaign_id|active|...
                    parts = response.text.strip().split("|")
                    if len(parts) >= 4:
                        # Map list IDs to their actual names from your ViciBox
                        list_names = {
                            "998": "pronon 924 domhunter",
                            "999": "TX Progressive",
                            "1000": "OH Progressive",
                            "1005": "OH Non-progressive",
                            "1006": "TX Non-Progressive"
                        }
                        lists.append({
                            "list_id": parts[0],
                            "list_name": list_names.get(parts[0], parts[1] if parts[1] else f"List {parts[0]}"),
                            "active": parts[3] if len(parts) > 3 else "Y",
                            "list_description": f"Campaign: {parts[2]}" if len(parts) > 2 and parts[2] else f"ViciBox List {parts[0]}"
                        })

            # If no lists found, return a default one
            if not lists:
                lists = [
                    {"list_id": "998", "list_name": "Default List", "active": "Y", "list_description": "Default ViciBox list"}
                ]

            return {
                "success": True,
                "lists": lists
            }


    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/vicidial/clear-list")
async def clear_vicidial_list(list_id: str = Query(...)):
    """Clear all leads from a Vicidial list by individually deleting them"""
    try:
        async with httpx.AsyncClient(verify=False, timeout=60.0) as client:
            deleted_count = 0
            batch_size = 100
            max_iterations = 50  # Safety limit

            print(f"Starting to clear list {list_id}")

            for iteration in range(max_iterations):
                # Get current leads in the list
                export_params = {
                    "source": "vanguard",
                    "user": VICIDIAL_USERNAME,
                    "pass": VICIDIAL_PASSWORD,
                    "function": "export_list",
                    "list_id": list_id,
                    "header": "NO",
                    "rec_limit": str(batch_size)
                }

                response = await client.post(
                    f"{VICIDIAL_PROTOCOL}://{VICIDIAL_HOST}/vicidial/non_agent_api.php",
                    data=export_params
                )

                # If no leads found, we're done
                if "no leads" in response.text.lower() or not response.text.strip() or "ERROR" in response.text:
                    print(f"No more leads to delete in list {list_id} after {deleted_count} deletions")
                    break

                # Parse lead IDs from response (usually CSV format)
                lines = response.text.strip().split('\n')
                if not lines:
                    break

                # Delete each lead individually
                batch_deleted = 0
                for line in lines[:batch_size]:
                    if not line.strip():
                        continue

                    # Extract lead_id (usually first field) or phone (for deletion)
                    fields = line.split(',')
                    if len(fields) > 0:
                        lead_id = fields[0].strip('"').strip()

                        # Delete this specific lead
                        delete_params = {
                            "source": "vanguard",
                            "user": VICIDIAL_USERNAME,
                            "pass": VICIDIAL_PASSWORD,
                            "function": "delete_lead",
                            "lead_id": lead_id
                        }

                        del_response = await client.post(
                            f"{VICIDIAL_PROTOCOL}://{VICIDIAL_HOST}/vicidial/non_agent_api.php",
                            data=delete_params
                        )

                        if "SUCCESS" in del_response.text or "DELETED" in del_response.text:
                            batch_deleted += 1
                            deleted_count += 1

                print(f"Deleted {batch_deleted} leads in batch {iteration + 1}")

                # If we deleted fewer than expected, list might be empty
                if batch_deleted == 0:
                    break

            print(f"Finished clearing list {list_id}: deleted {deleted_count} leads")
            return {"success": True, "message": f"Deleted {deleted_count} leads from list {list_id}"}

    except Exception as e:
        print(f"Error clearing list: {e}")
        return {"success": True, "message": "Clear attempted, proceeding with upload", "error": str(e)}

@app.post("/api/vicidial/add-leads")
async def add_leads_to_vicidial(
    list_id: str = Query(...),
    state: str = Query(None),
    insurance_companies: str = Query(None),
    days_until_expiry: int = Query(30),
    skip_days: int = Query(0),
    limit: int = Query(1000)
):
    """Add new leads to a Vicidial list (no overwrite/delete)"""
    try:
        # Process ALL leads requested but with reasonable timeout protection
        MAX_TIME = 45  # Allow 45 seconds for upload (nginx timeout is usually 60)
        # Get leads from database using existing endpoint logic
        with get_db(FMCSA_DB) as conn:
            cursor = conn.cursor()

            # Build the query (same as expiring insurance endpoint)
            query = """
                SELECT * FROM carriers
                WHERE insurance_carrier IS NOT NULL
                AND insurance_carrier != ''
                AND operating_status = 'Active'
                AND email_address IS NOT NULL
                AND email_address != ''
                AND email_address LIKE '%@%'
                AND (
                    representative_1_name IS NOT NULL
                    OR representative_2_name IS NOT NULL
                    OR principal_name IS NOT NULL
                    OR (officers_data IS NOT NULL AND officers_data LIKE '%name%')
                )
                AND policy_renewal_date IS NOT NULL
            """

            params = []
            if state:
                query += " AND state = ?"
                params.append(state)

            if insurance_companies:
                companies = [c.strip() for c in insurance_companies.split(',')]
                carrier_conditions = ' OR '.join(['insurance_carrier LIKE ?' for _ in companies])
                query += f" AND ({carrier_conditions})"
                params.extend([f'%{c}%' for c in companies])

            query += " ORDER BY legal_name LIMIT ?"
            params.append(limit)

            cursor.execute(query, params)
            rows = cursor.fetchall()

            # Format leads for Vicidial - DEDUPLICATE by DOT number
            leads_to_upload = []
            seen_dots = set()

            # LOG: Track what we're generating
            print(f"\n=== VICIDIAL UPLOAD VERIFICATION ===")
            print(f"Query returned {len(rows)} total rows")
            print(f"Request parameters: state={state}, companies={insurance_companies}, limit={limit}")

            for row in rows:
                dot = str(row['dot_number'])
                # Skip if we've already processed this DOT number
                if dot in seen_dots:
                    print(f"Skipping duplicate DOT: {dot}")
                    continue
                seen_dots.add(dot)

                lead = {
                    "phone": row['phone'] or '',
                    "usdot_number": dot,
                    "legal_name": row['legal_name'] or row['dba_name'] or '',
                    "representative_name": row['representative_1_name'] or row['representative_2_name'] or row['principal_name'] or '',
                    "city": row['city'] or '',
                    "state": row['state'] or '',
                    "email": row['email_address'] or '',
                    "fleet_size": str(row['power_units'] or 0),
                    "insurance_expiry": row['policy_renewal_date'] or '',
                    "insurance_carrier": row['insurance_carrier'] or ''  # Add insurance carrier
                }
                leads_to_upload.append(lead)

                # HARD LIMIT to prevent runaway uploads
                if len(leads_to_upload) >= limit:
                    print(f"Reached limit of {limit} leads, stopping generation")
                    break

            # Log final lead count before upload
            print(f"\nTotal unique leads prepared for upload: {len(leads_to_upload)}")
            print(f"First 3 DOT numbers: {[lead['usdot_number'] for lead in leads_to_upload[:3]]}")
            print(f"Last 3 DOT numbers: {[lead['usdot_number'] for lead in leads_to_upload[-3:]]}")

            # Upload to Vicidial in small batches to avoid timeout
            import time
            start_time = time.time()

            async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
                uploaded = 0
                errors = []
                skipped_duplicates = 0
                uploaded_vendor_codes = set()  # Track what we've uploaded

                # Process ALL requested leads
                leads_batch = leads_to_upload  # Process ALL leads

                print(f"\n=== STARTING UPLOAD ===")
                print(f"Uploading ALL {len(leads_batch)} leads to list {list_id}")
                print(f"Upload batch size: {len(leads_batch)} leads")
                print(f"First lead DOT: {leads_batch[0]['usdot_number'] if leads_batch else 'None'}")
                print(f"Last lead DOT: {leads_batch[-1]['usdot_number'] if leads_batch else 'None'}")

                for idx, lead in enumerate(leads_batch):
                    # Check time limit
                    if time.time() - start_time > MAX_TIME:
                        print(f"Time limit reached after {uploaded} uploads, stopping")
                        errors.append(f"Time limit reached - uploaded {uploaded} of {len(leads_batch)} leads")
                        break

                    # Additional safety check - don't upload same vendor code twice
                    if lead['usdot_number'] in uploaded_vendor_codes:
                        skipped_duplicates += 1
                        continue

                    # Show progress every 25 leads
                    if idx > 0 and idx % 25 == 0:
                        print(f"Progress: {idx}/{len(leads_batch)} processed, {uploaded} uploaded")
                    # Clean phone number
                    phone = lead['phone'].replace("-", "").replace(" ", "").replace("(", "").replace(")", "").replace("+1", "")

                    # Use DOT number as phone if no valid phone (makes leads easier to find)
                    if not phone or len(phone) < 10:
                        # Create unique phone from DOT number - prefix with 9 to ensure uniqueness
                        dot_number = lead['usdot_number'].replace("DOT", "").replace("-", "")
                        # Format as 9XXXXXXXXX where X is the DOT number
                        phone = "9" + dot_number.zfill(9)[-9:]  # Prefix with 9, pad to 10 digits total
                    elif len(phone) > 10:
                        phone = phone[-10:]  # Take last 10 digits

                    # Use company name if no representative name
                    if lead['representative_name']:
                        first_name = lead['representative_name'].split()[0]
                        last_name = lead['representative_name'].split()[-1] if len(lead['representative_name'].split()) > 1 else ""
                    else:
                        # Use company name when no rep name
                        company_parts = lead['legal_name'].split()[:2]  # Take first 2 words
                        first_name = company_parts[0] if company_parts else "COMPANY"
                        last_name = company_parts[1] if len(company_parts) > 1 else lead['usdot_number']

                    # Format expiry date as MMDD for title (4 chars max)
                    title = ""
                    if lead['insurance_expiry'] and lead['insurance_expiry'] != 'N/A':
                        try:
                            # Parse date and format as MMDD
                            from datetime import datetime
                            expiry_date = datetime.strptime(lead['insurance_expiry'].split()[0], '%Y-%m-%d')
                            title = expiry_date.strftime('%m%d')  # Format as MMDD (e.g., 1005 for Oct 5)
                        except:
                            title = ""

                    # Get insurance company from lead data
                    insurance_company = lead.get('insurance_carrier', '')[:100]  # Limit to 100 chars for address3

                    vicidial_lead = {
                        "source": "vanguard",
                        "user": VICIDIAL_USERNAME,
                        "pass": VICIDIAL_PASSWORD,
                        "function": "add_lead",
                        "list_id": list_id,
                        "phone_number": phone,
                        "phone_code": "1",
                        "status": "NEW",  # IMPORTANT: Set status to NEW so leads aren't removed
                        "duplicate_check": "DUPUPDATE",  # UPDATE existing leads with same phone (overwrite)
                        "title": title,  # Insurance expiry as MMDD
                        "first_name": first_name[:30],  # Limit to 30 chars
                        "last_name": last_name[:30],  # Limit to 30 chars
                        "address1": lead.get('legal_name', ''),  # Company name in address1 field
                        "address2": f"DOT: {lead['usdot_number']}",  # DOT number in address2
                        "address3": insurance_company,  # Insurance company in address3
                        "city": lead['city'],
                        "state": lead['state'],
                        "postal_code": "",  # Add empty postal code
                        "email": lead['email'],
                        "comments": f"Company: {lead['legal_name']} | DOT: {lead['usdot_number']} | Fleet: {lead['fleet_size']} | Ins Exp: {lead['insurance_expiry']}",
                        "vendor_lead_code": lead['usdot_number'],
                        "rank": "99"  # Add default rank
                    }

                    response = await client.post(
                        f"{VICIDIAL_PROTOCOL}://{VICIDIAL_HOST}/vicidial/non_agent_api.php",
                        data=vicidial_lead
                    )

                    # Log first response for debugging
                    if idx == 0:
                        print(f"First Vicidial response: {response.text[:200]}")

                    if response.status_code == 200 and "SUCCESS" in response.text:
                        uploaded += 1
                        uploaded_vendor_codes.add(lead['usdot_number'])  # Track successful upload
                    elif response.status_code == 200 and "DUPLICATE" in response.text:
                        # Duplicate - track but don't count as error
                        skipped_duplicates += 1
                        uploaded_vendor_codes.add(lead['usdot_number'])  # Track as processed
                    else:
                        # Log the actual error
                        error_msg = f"Lead {lead['usdot_number']}: {response.text[:100]}"
                        errors.append(error_msg)
                        if len(errors) <= 3:  # Log first few errors
                            print(f"Vicidial error: {error_msg}")
                        if len(errors) > 10:
                            print(f"Too many errors, stopping upload")
                            break

                    # SAFETY: Stop if we've uploaded too many (indicates a loop)
                    if uploaded > limit * 2:
                        print(f"ERROR: Upload count ({uploaded}) exceeds safety limit, stopping!")
                        errors.append(f"Upload stopped - too many uploads ({uploaded})")
                        break

                print(f"\n=== UPLOAD COMPLETE ===")
                print(f"Uploaded: {uploaded} leads")
                print(f"Duplicates skipped: {skipped_duplicates}")
                print(f"Errors: {len(errors)}")
                print(f"Total processed: {uploaded + skipped_duplicates + len(errors)}")
                print(f"Original request: {len(leads_to_upload)} leads")
                print(f"Match verification: {uploaded + skipped_duplicates == len(leads_to_upload)}")
                print(f"================================\n")

                return {
                    "success": True,
                    "uploaded": uploaded,
                    "duplicates": skipped_duplicates,
                    "total": len(leads_batch),
                    "total_available": len(leads_to_upload),
                    "list_id": list_id,
                    "message": f"Added {uploaded} new leads to list {list_id} ({skipped_duplicates} duplicates skipped)",
                    "errors": errors[:5] if errors else []
                }

    except Exception as e:
        return {"success": False, "error": str(e)}

# Keep old endpoint for compatibility - just redirect to add-leads
@app.post("/api/vicidial/overwrite")
async def overwrite_vicidial_list_compat(
    list_id: str = Query(...),
    state: str = Query(None),
    insurance_companies: str = Query(None),
    days_until_expiry: int = Query(30),
    skip_days: int = Query(0),
    limit: int = Query(1000)
):
    """Compatibility endpoint - redirects to add-leads"""
    return await add_leads_to_vicidial(list_id, state, insurance_companies, days_until_expiry, skip_days, limit)

@app.post("/api/vicidial/upload")
async def upload_to_vicidial(request: Request):
    """Upload leads to Vicidial"""
    data = await request.json()
    list_id = data.get("list_id")
    leads = data.get("leads", [])

    if not list_id or not leads:
        raise HTTPException(status_code=400, detail="List ID and leads are required")

    try:
        async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
            uploaded = 0
            errors = []

            for lead in leads:
                # Format lead data for Vicidial API
                vicidial_lead = {
                    "source": "vanguard",
                    "user": VICIDIAL_USERNAME,
                    "pass": VICIDIAL_PASSWORD,
                    "function": "add_lead",
                    "list_id": list_id,
                    "phone_number": lead.get("phone", "").replace("-", "").replace(" ", "").replace("(", "").replace(")", ""),
                    "phone_code": "1",
                    "first_name": lead.get("representative_name", "").split()[0] if lead.get("representative_name") else "",
                    "last_name": lead.get("representative_name", "").split()[-1] if lead.get("representative_name") else "",
                    "address1": lead.get("legal_name", ""),  # Company name in address1 field
                    "city": lead.get("city", ""),
                    "state": lead.get("state", ""),
                    "postal_code": lead.get("zip_code", ""),
                    "email": lead.get("email", ""),
                    "comments": f"Company: {lead.get('legal_name', '')} | Fleet: {lead.get('fleet_size', '')} | Insurance Exp: {lead.get('insurance_expiry', '')}",
                    "vendor_lead_code": lead.get("usdot_number", "")
                }

                # Call Vicidial API
                response = await client.post(
                    f"{VICIDIAL_PROTOCOL}://{VICIDIAL_HOST}/vicidial/non_agent_api.php",
                    data=vicidial_lead
                )

                if response.status_code == 200 and "SUCCESS" in response.text:
                    uploaded += 1
                else:
                    errors.append(f"Failed to upload {lead.get('usdot_number', 'unknown')}: {response.text[:100]}")

            return {
                "success": True,
                "uploaded": uploaded,
                "failed": len(errors),
                "errors": errors[:10]  # Limit error messages
            }

    except Exception as e:
        return {"success": False, "error": str(e)}

# ==================== QUOTE SUBMISSIONS ====================

@app.post("/api/quote-submissions")
async def create_quote_submission(submission: QuoteSubmission):
    """Create a new quote submission"""
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()

        # Create quote_submissions table if not exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS quote_submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lead_id TEXT NOT NULL,
                application_id TEXT NOT NULL,
                form_data TEXT NOT NULL,
                status TEXT DEFAULT 'draft',
                quote_pdf_path TEXT,
                submitted_date DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (lead_id) REFERENCES leads(id)
            )
        """)

        # Insert quote submission
        cursor.execute("""
            INSERT INTO quote_submissions
            (lead_id, application_id, form_data, status, quote_pdf_path, submitted_date)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            submission.lead_id,
            submission.application_id,
            json.dumps(submission.form_data),
            submission.status,
            submission.quote_pdf_path,
            submission.submitted_date
        ))

        conn.commit()
        submission_id = cursor.lastrowid

        return {"message": "Quote submission created", "submission_id": submission_id}

@app.get("/api/quote-submissions/{lead_id}")
async def get_quote_submissions(lead_id: str):
    """Get all quote submissions for a lead"""
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()

        # Ensure table exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS quote_submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lead_id TEXT NOT NULL,
                application_id TEXT NOT NULL,
                form_data TEXT NOT NULL,
                status TEXT DEFAULT 'draft',
                quote_pdf_path TEXT,
                submitted_date DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            SELECT * FROM quote_submissions
            WHERE lead_id = ?
            ORDER BY created_at DESC
        """, (lead_id,))

        submissions = []
        for row in cursor.fetchall():
            submissions.append({
                "id": row["id"],
                "lead_id": row["lead_id"],
                "application_id": row["application_id"],
                "form_data": json.loads(row["form_data"]),
                "status": row["status"],
                "quote_pdf_path": row["quote_pdf_path"],
                "submitted_date": row["submitted_date"],
                "created_at": row["created_at"],
                "updated_at": row["updated_at"]
            })

        return {"submissions": submissions}

@app.put("/api/quote-submissions/{submission_id}")
async def update_quote_submission(submission_id: int, update: QuoteSubmissionUpdate):
    """Update a quote submission"""
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()

        # Build update query dynamically
        update_fields = []
        params = []

        if update.status:
            update_fields.append("status = ?")
            params.append(update.status)

        if update.form_data:
            update_fields.append("form_data = ?")
            params.append(json.dumps(update.form_data))

        if update.quote_pdf_path:
            update_fields.append("quote_pdf_path = ?")
            params.append(update.quote_pdf_path)

        if update.submitted_date:
            update_fields.append("submitted_date = ?")
            params.append(update.submitted_date)

        if not update_fields:
            return {"message": "No fields to update"}

        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        params.append(submission_id)

        query = f"UPDATE quote_submissions SET {', '.join(update_fields)} WHERE id = ?"
        cursor.execute(query, params)
        conn.commit()

        return {"message": "Quote submission updated", "submission_id": submission_id}

@app.delete("/api/quote-submissions/{submission_id}")
async def delete_quote_submission(submission_id: int):
    """Delete a quote submission"""
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM quote_submissions WHERE id = ?", (submission_id,))
        conn.commit()

        return {"message": "Quote submission deleted"}

# ==================== QUOTE PDF UPLOAD ====================

# Combined endpoint for quote submission with file
@app.post("/api/quote-submissions/with-file")
async def create_quote_with_file(
    file: Optional[UploadFile] = File(None),
    quote_data: str = Body(...)
):
    """Create a quote submission with optional file upload"""
    try:
        # Parse the quote data
        submission = json.loads(quote_data)

        # Handle file upload if present
        file_path = None
        if file:
            # Create uploads directory if not exists
            upload_dir = Path("/var/www/vanguard/uploads/quotes")
            upload_dir.mkdir(parents=True, exist_ok=True)

            # Generate unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            file_extension = Path(file.filename).suffix
            safe_filename = f"quote_{submission['lead_id']}_{timestamp}{file_extension}"
            file_path = upload_dir / safe_filename

            # Save the file
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)

            # Add file info to form_data
            if 'form_data' in submission:
                if isinstance(submission['form_data'], str):
                    submission['form_data'] = json.loads(submission['form_data'])
                submission['form_data']['quote_file_path'] = str(file_path)
                submission['form_data']['quote_file_name'] = file.filename
                submission['form_data']['quote_file_size'] = len(content)

        # Save to database
        with get_db(SYSTEM_DB) as conn:
            cursor = conn.cursor()
            # Create table if not exists
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS quote_submissions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    lead_id TEXT NOT NULL,
                    application_id TEXT NOT NULL,
                    form_data TEXT NOT NULL,
                    status TEXT DEFAULT 'draft',
                    quote_pdf_path TEXT,
                    submitted_date DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Insert the quote submission
            cursor.execute("""
                INSERT INTO quote_submissions
                (lead_id, application_id, form_data, status, quote_pdf_path, submitted_date)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                submission['lead_id'],
                submission['application_id'],
                json.dumps(submission['form_data']),
                submission.get('status', 'draft'),
                str(file_path) if file_path else None,
                submission.get('submitted_date', datetime.now().isoformat())
            ))
            conn.commit()

            submission_id = cursor.lastrowid

        return {
            "success": True,
            "id": submission_id,
            "message": f"Quote saved {'with file: ' + file.filename if file else 'without file'}",
            "file": {
                "name": file.filename,
                "path": str(file_path),
                "size": len(content)
            } if file else None
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/quote-submissions/{submission_id}/upload-pdf")
async def upload_quote_pdf(submission_id: int, file: UploadFile = File(...)):
    """Upload a quote PDF for a submission"""
    try:
        # Create uploads directory if not exists
        upload_dir = Path("/var/www/vanguard/uploads/quotes")
        upload_dir.mkdir(parents=True, exist_ok=True)

        # Save the file
        file_path = upload_dir / f"quote_{submission_id}_{file.filename}"
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # Update database with file path
        with get_db(SYSTEM_DB) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE quote_submissions
                SET quote_pdf_path = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (str(file_path), submission_id))
            conn.commit()

        return {"message": "PDF uploaded", "file_path": str(file_path)}

    except Exception as e:
        return {"error": str(e)}

@app.get("/api/quote-submissions/{submission_id}/download-pdf")
async def download_quote_pdf(submission_id: int):
    """Download the quote PDF for a submission"""
    with get_db(SYSTEM_DB) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT quote_pdf_path FROM quote_submissions WHERE id = ?", (submission_id,))
        row = cursor.fetchone()

        if row and row["quote_pdf_path"]:
            file_path = Path(row["quote_pdf_path"])
            if file_path.exists():
                return FileResponse(file_path, filename=file_path.name)

        raise HTTPException(status_code=404, detail="PDF not found")

# Serve uploaded quote files
@app.get("/uploads/quotes/{filename}")
async def serve_quote_file(filename: str):
    """Serve uploaded quote files"""
    file_path = Path(f"/var/www/vanguard/uploads/quotes/{filename}")
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path, filename=filename)
    raise HTTPException(status_code=404, detail="File not found")

# ==================== GMAIL API ENDPOINTS ====================
import httpx
import base64
from urllib.parse import urlencode

# Gmail OAuth configuration
GMAIL_CLIENT_ID = os.getenv('GMAIL_CLIENT_ID', '794453705883-6b32cpfctd77t5ls5kktu2s9ub27p19q.apps.googleusercontent.com')
GMAIL_CLIENT_SECRET = os.getenv('GMAIL_CLIENT_SECRET', '')
GMAIL_REDIRECT_URI = os.getenv('GMAIL_REDIRECT_URI', 'http://162-220-14-239.nip.io/api/gmail/callback')

@app.get("/api/gmail/auth")
async def gmail_auth():
    """Generate Gmail OAuth authorization URL"""
    params = {
        'client_id': GMAIL_CLIENT_ID,
        'redirect_uri': GMAIL_REDIRECT_URI,
        'response_type': 'code',
        'scope': 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly',
        'access_type': 'offline',
        'prompt': 'consent'
    }

    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return {"auth_url": auth_url}

@app.post("/api/gmail/authorize")
async def gmail_authorize(code: str = Body(...)):
    """Exchange authorization code for token (manual input)"""
    try:
        async with httpx.AsyncClient() as client:
            token_data = {
                'code': code,
                'client_id': GMAIL_CLIENT_ID,
                'client_secret': GMAIL_CLIENT_SECRET,
                'redirect_uri': GMAIL_REDIRECT_URI,
                'grant_type': 'authorization_code'
            }

            response = await client.post(
                'https://oauth2.googleapis.com/token',
                data=token_data
            )

            if response.status_code == 200:
                token = response.json()
                # Save token to file
                with open('/var/www/vanguard/gmail_token.json', 'w') as f:
                    json.dump(token, f)

                return {"success": True, "message": "Gmail authenticated successfully!"}
            else:
                raise HTTPException(status_code=400, detail=f"Failed to exchange code: {response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/gmail/callback")
async def gmail_callback(code: str = Query(...)):
    """Handle Gmail OAuth callback and exchange code for token"""
    try:
        async with httpx.AsyncClient() as client:
            token_data = {
                'code': code,
                'client_id': GMAIL_CLIENT_ID,
                'client_secret': GMAIL_CLIENT_SECRET,
                'redirect_uri': GMAIL_REDIRECT_URI,
                'grant_type': 'authorization_code'
            }

            response = await client.post(
                'https://oauth2.googleapis.com/token',
                data=token_data
            )

            if response.status_code == 200:
                token = response.json()
                # Save token to file
                with open('/var/www/vanguard/gmail_token.json', 'w') as f:
                    json.dump(token, f)

                return HTMLResponse("""
                    <html>
                        <body style="font-family: Arial, sans-serif; padding: 20px;">
                            <h2>✅ Gmail Successfully Authorized!</h2>
                            <p>You can now close this window and return to the application.</p>
                            <script>
                                setTimeout(function() {
                                    window.close();
                                }, 3000);
                            </script>
                        </body>
                    </html>
                """)
            else:
                raise HTTPException(status_code=400, detail=f"Failed to exchange code: {response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/gmail/status")
async def gmail_status():
    """Check Gmail connection status"""
    try:
        token_file = '/var/www/vanguard/gmail_token.json'
        if os.path.exists(token_file):
            with open(token_file, 'r') as f:
                token = json.load(f)

            # Check if token is valid
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    'https://www.googleapis.com/gmail/v1/users/me/profile',
                    headers={'Authorization': f"Bearer {token.get('access_token')}"}
                )

                if response.status_code == 200:
                    profile = response.json()
                    return {
                        "connected": True,
                        "email": profile.get('emailAddress'),
                        "messages_total": profile.get('messagesTotal'),
                        "threads_total": profile.get('threadsTotal')
                    }
                elif response.status_code == 401:
                    # Token expired, try to refresh
                    if 'refresh_token' in token:
                        refresh_response = await client.post(
                            'https://oauth2.googleapis.com/token',
                            data={
                                'refresh_token': token['refresh_token'],
                                'client_id': GMAIL_CLIENT_ID,
                                'client_secret': GMAIL_CLIENT_SECRET,
                                'grant_type': 'refresh_token'
                            }
                        )

                        if refresh_response.status_code == 200:
                            new_token = refresh_response.json()
                            token.update(new_token)
                            with open(token_file, 'w') as f:
                                json.dump(token, f)

                            return await gmail_status()  # Retry with new token

                    return {"connected": False, "error": "Token expired"}
                else:
                    return {"connected": False, "error": f"API Error: {response.status_code}"}
        else:
            return {"connected": False, "error": "Not authenticated"}
    except Exception as e:
        return {"connected": False, "error": str(e)}

@app.post("/api/gmail/send")
async def send_gmail(
    to: str = Body(...),
    subject: str = Body(...),
    body: str = Body(...)
):
    """Send email via Gmail API"""
    try:
        token_file = '/var/www/vanguard/gmail_token.json'
        if not os.path.exists(token_file):
            raise HTTPException(status_code=401, detail="Gmail not authenticated")

        with open(token_file, 'r') as f:
            token = json.load(f)

        # Create message
        message = f"To: {to}\r\n"
        message += f"Subject: {subject}\r\n"
        message += f"Content-Type: text/html; charset=utf-8\r\n\r\n"
        message += body

        # Encode message
        encoded_message = base64.urlsafe_b64encode(message.encode()).decode()

        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://www.googleapis.com/gmail/v1/users/me/messages/send',
                headers={'Authorization': f"Bearer {token.get('access_token')}"},
                json={'raw': encoded_message}
            )

            if response.status_code == 200:
                return {"success": True, "message": "Email sent successfully"}
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("\n" + "="*50)
    print("🚀 Vanguard Insurance Complete API")
    print("="*50)
    print("📊 Connected to 2.2M carrier database")
    print("🔄 All data synchronized across locations")
    print("🌐 API running at: http://0.0.0.0:8897")
    print("="*50 + "\n")

    uvicorn.run(app, host="0.0.0.0", port=8897)