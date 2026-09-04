#!/usr/bin/env python3
"""
ViciDial Lead Uploader - Adds leads to ViciDial lists via the non_agent_api.php
"""
import requests
import urllib3
import json
import sys
import time
from urllib.parse import urlencode

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ViciDial Configuration
VICIDIAL_HOST = "204.13.233.29"
VICIDIAL_USER = "6666"
VICIDIAL_PASS = "corp06"
VICIDIAL_SOURCE = "vanguard_crm"

def decode_vin_year(vin):
    """Decode the model year from a VIN (10th character). Returns full 4-digit year."""
    if not vin or len(vin) < 10:
        return "XXXX"

    year_char = vin[9].upper()  # 10th character (0-indexed)

    year_map = {
        'A': '2010', 'B': '2011', 'C': '2012', 'D': '2013', 'E': '2014',
        'F': '2015', 'G': '2016', 'H': '2017', 'J': '2018', 'K': '2019',
        'L': '2020', 'M': '2021', 'N': '2022', 'P': '2023', 'R': '2024',
        'S': '2025', 'T': '2026', 'V': '2027', 'W': '2028', 'X': '2029',
        'Y': '2030',
        '1': '2001', '2': '2002', '3': '2003', '4': '2004', '5': '2005',
        '6': '2006', '7': '2007', '8': '2008', '9': '2009'
    }

    return year_map.get(year_char, "XXXX")

def add_lead_to_vicidial(list_id, lead_data):
    """Add a single lead to ViciDial using the non_agent_api.php endpoint"""

    try:
        # Debug: Print the lead data we received
        print(f"DEBUG: Processing lead data type: {type(lead_data)}")
        if isinstance(lead_data, dict):
            print(f"DEBUG: Processing lead data keys: {list(lead_data.keys())}")
        else:
            print(f"DEBUG: ERROR - lead_data is not a dict, it's: {lead_data}")
            return {'success': False, 'error': f'Invalid lead data type: {type(lead_data)}'}

        # ViciDial API endpoint
        api_url = f"https://{VICIDIAL_HOST}/vicidial/non_agent_api.php"

        # Clean phone number
        phone = str(lead_data.get('phone', '')).replace('-', '').replace(' ', '').replace('(', '').replace(')', '')
        if not phone:
            return {'success': False, 'error': 'No phone number provided'}

        # ── Commercial lead fast-path ─────────────────────────────────────────
        if lead_data.get('source_type') == 'commercial':
            company_name = str(lead_data.get('company', lead_data.get('name', 'Unknown'))).strip()
            target_lines = str(lead_data.get('target_lines', lead_data.get('insuranceType', ''))).strip()
            vertical     = str(lead_data.get('vertical', '')).strip()
            api_params = {
                "source":          VICIDIAL_SOURCE,
                "user":            VICIDIAL_USER,
                "pass":            VICIDIAL_PASS,
                "function":        "add_lead",
                "list_id":         list_id,
                "phone_number":    phone,
                "phone_code":      "1",
                "status":          "NEW",
                "duplicate_check": "DUPUPDATE",
                "title":           company_name[:40],
                "first_name":      company_name[:20],
                "last_name":       "Commercial Lead",
                "address1":        str(lead_data.get('street_address', lead_data.get('address', '')))[:100],
                "address2":        str(lead_data.get('website', '')).split('?')[0][:100],  # strip query params to avoid encoding issues
                "address3":        target_lines[:100],
                "email":           str(lead_data.get('email', '')),
                "city":            str(lead_data.get('city', '')),
                "state":           str(lead_data.get('state', '')),
                "province":        str(lead_data.get('state', '')),
                "postal_code":     str(lead_data.get('zip', lead_data.get('postal_code', ''))),
                "comments":        f"Vertical: {vertical}\nLines: {target_lines}\nSource: {lead_data.get('source','')}\nWebsite: {lead_data.get('website','')}\nEmail: {lead_data.get('email','')}",
                "vendor_lead_code": str(lead_data.get('sourceId', '')),
            }
            response = requests.post(api_url, data=api_params, verify=False, timeout=30)
            success = 'lead_id' in response.text.lower() or 'added' in response.text.lower() or response.status_code == 200
            return {'success': success, 'response': response.text[:200]}
        # ── End commercial fast-path ──────────────────────────────────────────

    except Exception as e:
        print(f"DEBUG: Exception in initial processing: {str(e)}")
        return {'success': False, 'error': f'Initial processing error: {str(e)}'}

    try:
        # Extract company name from various possible fields
        company_name = (lead_data.get('business_name') or
                       lead_data.get('company_name') or
                       lead_data.get('legal_name') or
                       lead_data.get('dba_name') or
                       lead_data.get('name') or
                       'Unknown Company')

        print(f"DEBUG: Company name extracted: '{company_name}'")

        # Extract officer/representative name - use the officer name from new schema
        rep_name = (lead_data.get('representative_name') or
                    lead_data.get('officer_name') or
                    lead_data.get('contact') or
                    lead_data.get('contact_name') or
                    lead_data.get('primary_contact') or
                    'Unknown Rep')

        print(f"DEBUG: Rep name extracted: '{rep_name}'")

        # Build insurance expiry information
        insurance_company = lead_data.get('insurance_company', lead_data.get('current_carrier', ''))
        expiry_date = lead_data.get('insurance_expiry', lead_data.get('insurance_expiration', lead_data.get('renewal_date', '')))
        fleet_size = lead_data.get('fleet_size', lead_data.get('power_units', ''))

        print(f"DEBUG: Insurance company: '{insurance_company}', Expiry: '{expiry_date}', Fleet: '{fleet_size}'")

        # Get driver and fleet information from new schema
        drivers = lead_data.get('drivers', lead_data.get('total_drivers', ''))

        print(f"DEBUG: Drivers: '{drivers}'")

    except Exception as e:
        print(f"DEBUG: Exception in field extraction: {str(e)}")
        return {'success': False, 'error': f'Field extraction error: {str(e)}'}

    try:
        # Make code to full name mapping (FMCSA codes → full names)
        MAKE_NAMES = {
            # Freightliner
            'FRHT': 'Freightliner', 'FREI': 'Freightliner',
            # Peterbilt
            'PETE': 'Peterbilt', 'PTRB': 'Peterbilt',
            # Kenworth
            'KNWT': 'Kenworth', 'KENW': 'Kenworth',
            # Other power unit makes
            'INTL': 'International', 'MACK': 'Mack', 'VOLV': 'Volvo',
            'WSTR': 'Western Star', 'FORD': 'Ford', 'GMCK': 'GMC',
            'DODG': 'Dodge', 'HINO': 'Hino', 'MITB': 'Mitsubishi Fuso',
            'ISUZ': 'Isuzu', 'MERZ': 'Mercedes-Benz', 'NAVI': 'International',
            'STER': 'Sterling', 'AUTO': 'Autocar',
            # Trailer makes
            'GDAN': 'Great Dane', 'GRTD': 'Great Dane',
            'WABH': 'Wabash National', 'WABP': 'Wabash National',
            'UTIL': 'Utility Trailer', 'STLT': 'Stoughton',
            'TRLT': 'Trail King', 'HYND': 'Hyundai Translead',
            'STRC': 'Strick', 'CRGO': 'Cargo', 'QUIC': 'Quick Draw',
            'TRLR': 'Trailer', 'BYSU': 'Bison', 'UNPU': 'Unknown', 'UNKN': 'Unknown', 'DIAM': 'Diamond',
            'VSCO': 'Vanguard',
            'CIMC': 'CIMC', 'DORR': 'Dorsey', 'LUFK': 'Lufkin',
            'POLI': 'Polar', 'WILS': 'Wilson', 'MAXO': 'Maxon',
            'VSGM': 'Vanguard', 'SMIT': 'Smith', 'CHAP': 'Chaparral',
            'REIT': 'Reitnouer', 'FONT': 'Fontaine',
        }

        def get_trailer_type(vtype_str):
            """Detect trailer subtype from the type field string."""
            v = vtype_str.upper()
            if 'REEFER' in v or 'REFRIGER' in v: return 'Reefer'
            if 'FLATBED' in v or 'FLAT BED' in v or 'FLAT-BED' in v: return 'Flatbed'
            if 'TANK' in v: return 'Tanker'
            if 'LOWBOY' in v or 'LOW BOY' in v: return 'Lowboy'
            if 'STEP DECK' in v or 'STEPDECK' in v or 'STEP-DECK' in v: return 'Step Deck'
            if 'DRY VAN' in v or 'DRYVAN' in v or 'DRY-VAN' in v: return 'Dry Van'
            if 'DUMP' in v: return 'Dump'
            if 'CURTAIN' in v: return 'Curtainsider'
            if 'LOG' in v: return 'Logging'
            if 'AUTO CARR' in v or 'CAR CARR' in v: return 'Auto Carrier'
            if 'POLE' in v: return 'Pole'
            return 'Dry Van'  # Most common default for generic TRAILER type

        def get_unit_type_label(vtype_str):
            """Return human-readable power unit type."""
            v = vtype_str.upper()
            if 'TRACTOR' in v: return 'Truck Tractor'
            if 'STRAIGHT' in v: return 'Straight Truck'
            if 'MOTOR COACH' in v: return 'Motor Coach'
            if 'BUS' in v: return 'Bus'
            return vtype_str.title()

        def decode_cargo_carried(raw):
            """Decode the positional FMCSA cargo_carried flag string into human-readable names."""
            if not raw or not raw.strip():
                return ''
            cargo_types = [
                'General Freight', 'Household Goods', 'Metal Sheets/Coils/Rolls',
                'Motor Vehicles', 'Drive/Tow Away', 'Logs/Poles/Beams/Lumber',
                'Building Materials', 'Mobile Homes', 'Machinery/Large Objects',
                'Fresh Produce', 'Liquids/Gases', 'Intermodal Containers',
                'Passengers', 'Oilfield Equipment', 'Livestock', 'Grain/Feed/Hay',
                'Coal/Coke', 'Meat', 'Garbage/Refuse', 'US Mail',
                'Chemicals', 'Dry Bulk', 'Refrigerated Food', 'Beverages',
                'Paper Products', 'Utility', 'Farm Supplies', 'Construction',
                'Water Well', 'Other'
            ]
            active = []
            for i, val in enumerate(raw.split(',')):
                if val.strip() == 'X' and i < len(cargo_types):
                    active.append(cargo_types[i])
            return ', '.join(active)

        # Build header line
        driver_count_val = drivers if drivers else '?'
        fleet_size_val = fleet_size if fleet_size else '?'
        header_line = f"Driver count: {driver_count_val} | Fleet size: {fleet_size_val}"

        # Fleet size integer for unit padding
        try:
            fleet_size_int = int(fleet_size) if fleet_size and str(fleet_size).strip().isdigit() else 0
        except Exception:
            fleet_size_int = 0

        # Build dynamic DRIVERS INFO section
        try:
            num_drivers = int(drivers) if drivers and str(drivers).strip().isdigit() else 1
        except Exception:
            num_drivers = 1
        num_drivers = max(1, min(num_drivers, 20))

        driver_blocks = []
        for d in range(1, num_drivers + 1):
            driver_blocks.append(f"Driver {d}\nName:\nDOB:\nDL#:\nCDL Length:\nHire Date: MM/YYYY")
        drivers_info_section = f"--DRIVERS INFO({num_drivers})-----\n" + "\n\n".join(driver_blocks)

        # Build vehicle sections — read vehicles and trailers separately from CRM data
        vehicles = lead_data.get('vehicles', [])
        trailers_data = lead_data.get('trailers', [])
        unit_lines = []
        trailer_lines = []

        def resolve_make(raw_make):
            """Resolve raw make field (code or full name) to display name."""
            code = str(raw_make or 'UNKN').upper()[:4]
            return MAKE_NAMES.get(code, code)

        # Process vehicles array — route trailers vs power units during the loop
        if vehicles and isinstance(vehicles, list):
            print(f"DEBUG: Found {len(vehicles)} vehicles in lead data")
            for idx, vehicle in enumerate(vehicles[:20]):
                if isinstance(vehicle, dict):
                    make_name = resolve_make(vehicle.get('make', 'UNKN'))
                    full_vin = vehicle.get('vin', '') or 'XXXXXXXXXXXXXXXX'
                    vtype = str(vehicle.get('type', 'STRAIGHT TRUCK'))
                    year = vehicle.get('year', '') or (decode_vin_year(full_vin) if full_vin != 'XXXXXXXXXXXXXXXX' else 'XXXX')
                    value = vehicle.get('value', '') or ''
                    print(f"DEBUG: Vehicle {idx+1}: Make={make_name}, VIN={full_vin}, Type={vtype}, Year={year}")
                    if 'TRAILER' in vtype.upper():
                        trailer_type = get_trailer_type(vtype)
                        print(f"DEBUG:   -> routed to trailers (type={vtype})")
                        trailer_lines.append(
                            f"Year: {year}\n"
                            f"Make: {make_name}\n"
                            f"Type: {trailer_type}\n"
                            f"VIN: {full_vin}\n"
                            f"Value: {value}"
                        )
                    else:
                        type_label = get_unit_type_label(vtype)
                        unit_lines.append(
                            f"Year: {year}\n"
                            f"Make: {make_name}\n"
                            f"Model:\n"
                            f"Type: {type_label}\n"
                            f"VIN: {full_vin}\n"
                            f"Value: {value}"
                        )

        # Process CRM trailers array (separate from vehicles)
        if trailers_data and isinstance(trailers_data, list):
            print(f"DEBUG: Found {len(trailers_data)} trailers in lead data")
            for idx, trailer in enumerate(trailers_data[:20]):
                if isinstance(trailer, dict):
                    make_name = resolve_make(trailer.get('make', 'UNKN'))
                    full_vin = trailer.get('vin', '') or 'XXXXXXXXXXXXXXXX'
                    vtype = trailer.get('type', 'Dry Van')
                    year = trailer.get('year', '') or (decode_vin_year(full_vin) if full_vin != 'XXXXXXXXXXXXXXXX' else 'XXXX')
                    value = trailer.get('value', '') or ''
                    trailer_type = get_trailer_type(vtype)
                    print(f"DEBUG: Trailer {idx+1}: Make={make_name}, VIN={full_vin}, Type={trailer_type}, Year={year}")
                    trailer_lines.append(
                        f"Year: {year}\n"
                        f"Make: {make_name}\n"
                        f"Type: {trailer_type}\n"
                        f"VIN: {full_vin}\n"
                        f"Value: {value}"
                    )

        # Fleet size pads both units AND trailers with unknowns up to fleet count
        while len(unit_lines) < fleet_size_int:
            unit_lines.append("Year: XXXX\nMake: Unknown\nModel:\nType: Unknown\nVIN: XXXXXXXXXXXXXXXX\nValue:")
        while len(trailer_lines) < fleet_size_int:
            trailer_lines.append("Year: XXXX\nMake: Unknown\nType: Unknown\nVIN: XXXXXXXXXXXXXXXX\nValue:")

        units_count = len(unit_lines)
        trailers_count = len(trailer_lines)
        # Blank line between each entry for readability (Value: already included in each entry)
        units_body = '\n\n'.join(unit_lines)
        trailers_body = '\n\n'.join(trailer_lines)

        # Auto-fill commodities — use pre-decoded value first, then parse raw flags
        commodities = (
            lead_data.get('commodities_hauled') or       # already decoded by server.js
            lead_data.get('commodity_info') or
            lead_data.get('commodities') or
            decode_cargo_carried(lead_data.get('cargo_carried', ''))  # parse raw X,,, flags
        )
        commodities_line = f"Commodities: {commodities}" if commodities else "Commodities:"

        comments = f"""{header_line}

-----NEXT CALL---------------
Date: MM/DD/2026 Time: 00:00AM
Callback Notes:

---DOCUMENTATION----- Requested = RQ | Received = RC
COI ( )
DEC PAGE ( )
LOSS RUNS ( )
IFTAS ( )

----OWNERS INFO-------
Name: {rep_name if rep_name not in ('Unknown Rep', '') else ''}
DOB:
DL#:
CDL Length:

---OPERATION-------
Mile Radius:
{commodities_line}
MTC: $100k

{drivers_info_section}

-----UNITS({units_count})----------
{units_body}

-----TRAILERS({trailers_count})----------
{trailers_body}"""

        print(f"DEBUG: Comments created successfully, length: {len(comments)}")

    except Exception as e:
        print(f"DEBUG: Exception in comments/vehicle processing: {str(e)}")
        return {'success': False, 'error': f'Comments processing error: {str(e)}'}

    try:
        # Prepare lead data for ViciDial with proper trucking field mapping
        usdot = str(lead_data.get('usdot_number', lead_data.get('dot_number', '')))
        email = str(lead_data.get('email', lead_data.get('email_address', '')))
        city = str(lead_data.get('city', lead_data.get('physical_city', '')))
        state = str(lead_data.get('state', lead_data.get('physical_state', '')))
        postal_code = str(lead_data.get('postal_code', lead_data.get('zip_code', lead_data.get('physical_zip_code', ''))))

        print(f"DEBUG: Building API params - USDOT: {usdot}, Email: {email}, City: {city}, State: {state}")

        api_params = {
            "source": VICIDIAL_SOURCE,
            "user": VICIDIAL_USER,
            "pass": VICIDIAL_PASS,
            "function": "add_lead",
            "list_id": list_id,
            "phone_number": phone,
            "phone_code": "1",
            "status": "NEW",  # Set status to NEW so leads aren't removed
            "duplicate_check": "DUPUPDATE",  # Update existing leads with same phone

            # TRUCKING-SPECIFIC FIELD MAPPING:
            "title": str(company_name)[:40],  # Company Name in Title field
            "first_name": str(company_name)[:20],  # Company Name in First Name field
            "last_name": str(rep_name)[:30],   # Full Representative Name in Last Name field
            "address1": usdot[:100],  # USDOT Number
            "address2": str(insurance_company)[:100],  # Insurance Company
            "address3": str(expiry_date)[:100],  # Insurance Expiry Date
            "email": email,
            "city": city,
            "state": state,
            "province": state,  # ViciDial uses province field
            "postal_code": postal_code,
            "vendor_lead_code": usdot,  # DOT for tracking
            "comments": comments,  # Insurance Expiry + Fleet Size + other details

            # Additional fields
            "alt_phone": str(lead_data.get('alt_phone', lead_data.get('cell_phone', ''))),
        }

        print(f"DEBUG: API params created successfully")

    except Exception as e:
        print(f"DEBUG: Exception in API params creation: {str(e)}")
        return {'success': False, 'error': f'API params error: {str(e)}'}

    try:
        # Make the API request
        response = requests.post(api_url, data=api_params, verify=False, timeout=30)

        if response.status_code == 200:
            response_text = response.text.strip()

            # Check for success patterns
            if "SUCCESS" in response_text:
                return {'success': True, 'message': response_text}
            elif "DUPLICATE" in response_text:
                return {'success': True, 'message': 'Duplicate lead updated', 'duplicate': True}
            else:
                return {'success': False, 'error': f'ViciDial API error: {response_text}'}
        else:
            return {'success': False, 'error': f'HTTP error: {response.status_code}'}

    except Exception as e:
        return {'success': False, 'error': f'Request failed: {str(e)}'}

def create_vicidial_list(list_id, list_name=None):
    """Create a ViciDial list if it doesn't exist"""

    if not list_name:
        list_name = f"Vanguard List {list_id}"

    api_url = f"https://{VICIDIAL_HOST}/vicidial/non_agent_api.php"

    print(f"Attempting to create ViciDial list {list_id}: {list_name}")

    # Method 1: Try direct list creation
    api_params_1 = {
        "source": VICIDIAL_SOURCE,
        "user": VICIDIAL_USER,
        "pass": VICIDIAL_PASS,
        "function": "add_list",
        "list_id": list_id,
        "list_name": list_name,
        "campaign_id": "VANGUARD",
        "active": "Y"
    }

    try:
        response = requests.post(api_url, data=api_params_1, timeout=30, verify=False)
        if response.status_code == 200:
            response_text = response.text.strip()
            print(f"Method 1 response: {response_text}")
            if "SUCCESS" in response_text or "GOOD" in response_text:
                return {'success': True, 'message': f'List {list_id} created successfully'}
    except Exception as e:
        print(f"Method 1 failed: {e}")

    # Method 2: Try adding a dummy lead to force list creation
    print(f"Method 1 failed, trying to create list {list_id} by adding dummy lead...")

    dummy_params = {
        "source": VICIDIAL_SOURCE,
        "user": VICIDIAL_USER,
        "pass": VICIDIAL_PASS,
        "function": "add_lead",
        "list_id": list_id,
        "phone_number": "0000000001",  # Dummy phone
        "phone_code": "1",
        "status": "NEW",
        "duplicate_check": "DUPUPDATE",
        "title": list_name,
        "first_name": "LIST",
        "last_name": "CREATOR",
        "comments": f"Dummy lead to create list {list_id} - can be deleted"
    }

    try:
        response = requests.post(api_url, data=dummy_params, timeout=30, verify=False)
        if response.status_code == 200:
            response_text = response.text.strip()
            print(f"Method 2 response: {response_text}")
            if "SUCCESS" in response_text or "GOOD" in response_text:
                print(f"✅ List {list_id} created via dummy lead method")
                return {'success': True, 'message': f'List {list_id} created with dummy lead'}
            else:
                print(f"Method 2 also failed: {response_text}")
                return {'success': False, 'error': f'Could not create list {list_id}: {response_text}'}
    except Exception as e:
        print(f"Method 2 failed: {e}")
        return {'success': False, 'error': f'All list creation methods failed: {str(e)}'}

def upload_leads_batch(list_id, leads):
    """Upload multiple leads to ViciDial"""

    results = {
        'uploaded': 0,
        'duplicates': 0,
        'errors': 0,
        'error_details': []
    }

    # First, ensure the list exists
    print(f"Ensuring ViciDial list {list_id} exists...")
    list_result = create_vicidial_list(list_id)
    if not list_result['success']:
        print(f"Warning: Could not create/verify list {list_id}: {list_result['error']}")
        print("Proceeding with upload anyway...")
    else:
        print(f"✅ List {list_id} is ready")

    print(f"Starting upload of {len(leads)} leads to ViciDial list {list_id}")

    for i, lead in enumerate(leads, 1):
        try:
            # Add lead to ViciDial
            result = add_lead_to_vicidial(list_id, lead)

            if result['success']:
                if result.get('duplicate'):
                    results['duplicates'] += 1
                    print(f"  {i}/{len(leads)}: Duplicate updated - {lead.get('phone', 'no phone')}")
                else:
                    results['uploaded'] += 1
                    print(f"  {i}/{len(leads)}: Uploaded - {lead.get('phone', 'no phone')}")
            else:
                results['errors'] += 1
                error_msg = f"Lead {i}: {result['error']}"
                results['error_details'].append(error_msg)
                print(f"  {i}/{len(leads)}: ERROR - {result['error']}")

            # Progress update every 50 leads
            if i % 50 == 0:
                print(f"Progress: {i}/{len(leads)} leads processed ({results['uploaded']} uploaded, {results['duplicates']} duplicates, {results['errors']} errors)")

            # Small delay to avoid overwhelming ViciDial (reduced for faster uploads)
            time.sleep(0.05)

        except Exception as e:
            results['errors'] += 1
            error_msg = f"Lead {i}: Exception - {str(e)}"
            results['error_details'].append(error_msg)
            print(f"  {i}/{len(leads)}: EXCEPTION - {str(e)}")

    print(f"\nUpload complete:")
    print(f"  Uploaded: {results['uploaded']}")
    print(f"  Duplicates: {results['duplicates']}")
    print(f"  Errors: {results['errors']}")

    return results

def main():
    """Main function for command line usage"""
    if len(sys.argv) != 3:
        print("Usage: python vicidial-lead-uploader.py <list_id> <json_leads_file>")
        sys.exit(1)

    list_id = sys.argv[1]
    json_file = sys.argv[2]

    try:
        # Load leads from JSON file
        with open(json_file, 'r') as f:
            data = json.load(f)

        # Extract leads from the data
        if 'leads' in data:
            leads = data['leads']
        elif isinstance(data, list):
            leads = data
        else:
            print("Error: JSON must contain 'leads' array or be an array of leads")
            sys.exit(1)

        # Upload leads
        results = upload_leads_batch(list_id, leads)

        # Output results as JSON for the calling system
        output = {
            'success': True,
            'list_id': list_id,
            'uploaded': results['uploaded'],
            'duplicates': results['duplicates'],
            'errors': results['errors'],
            'total_processed': len(leads),
            'error_details': results['error_details'][:5]  # Limit error details
        }

        print("\n" + "="*50)
        print(json.dumps(output, indent=2))

    except Exception as e:
        error_output = {
            'success': False,
            'error': str(e),
            'list_id': list_id if 'list_id' in locals() else None
        }
        print(json.dumps(error_output, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()