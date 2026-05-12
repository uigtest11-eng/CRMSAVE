#!/usr/bin/env python3
"""
Vanguard ViciDial Sync - Adapted from Lead-Transfer to work with Vanguard format
Matches existing lead format like "CHARLES V MUMFORD JR / MUMFORD FARMS"
"""

import json
import logging
import os
import sqlite3
import requests
from datetime import datetime
from bs4 import BeautifulSoup
import re
import urllib3

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("/var/www/vanguard/logs/vicidial-sync.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ViciDial Configuration
USERNAME = "6666"
PASSWORD = "corp06"
VICIDIAL_HOST = "204.13.233.29"
DB_PATH = "/var/www/vanguard/vanguard.db"

class VanguardViciDialSync:
    def __init__(self):
        self.session = requests.Session()
        self.session.auth = requests.auth.HTTPBasicAuth(USERNAME, PASSWORD)
        self.session.verify = False
        self.db = sqlite3.connect(DB_PATH)
        self.processed_leads = self.load_processed_leads()
        # Auto-assignment configuration
        self.representatives = ["Hunter", "Grant", "Maureen", "Carson"]
        self.assignment_index = self.get_current_assignment_index()

    def load_processed_leads(self):
        """Load list of already-processed lead IDs that DON'T need re-checking.
        Leads still at 'new' stage are excluded so ViciDial comment changes can be picked up."""
        cursor = self.db.cursor()
        # Only consider fully-processed leads (non-'new' stage) as done
        cursor.execute("""SELECT id FROM leads
            WHERE JSON_EXTRACT(data, '$.source') = 'ViciDial'
            AND JSON_EXTRACT(data, '$.stage') != 'new'
            AND JSON_EXTRACT(data, '$.stage') IS NOT NULL""")
        return set(row[0] for row in cursor.fetchall())

    def get_current_assignment_index(self):
        """Get the current round-robin assignment index"""
        cursor = self.db.cursor()
        # Create assignment tracking table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vicidial_assignment_tracker (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                current_index INTEGER DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Get current index
        cursor.execute("SELECT current_index FROM vicidial_assignment_tracker WHERE id = 1")
        result = cursor.fetchone()

        if result:
            return result[0]
        else:
            # Initialize with 0
            cursor.execute("INSERT INTO vicidial_assignment_tracker (id, current_index) VALUES (1, 0)")
            self.db.commit()
            return 0

    def get_next_representative(self):
        """Get the next representative in round-robin and update the index"""
        current_rep = self.representatives[self.assignment_index]

        # Update to next index (with wrap-around)
        self.assignment_index = (self.assignment_index + 1) % len(self.representatives)

        # Save updated index to database
        cursor = self.db.cursor()
        cursor.execute("""
            UPDATE vicidial_assignment_tracker
            SET current_index = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
        """, (self.assignment_index,))
        self.db.commit()

        logger.info(f"Auto-assigned to {current_rep} (next will be {self.representatives[self.assignment_index]})")
        return current_rep

    def get_assigned_agent_for_list(self, list_id):
        """Determine assigned agent based on list ID"""
        # Mapping based on Vicidial list assignment
        list_agent_mapping = {
            '998': 'Hunter',    # OH Hunter's list
            '999': 'Grant',     # TX Hunter's list
            '1000': 'Hunter',   # IN Hunter's list
            '1001': 'Grant',    # OH Grant's list
            '1002': 'Maureen',  # TEST list - Maureen
            '1005': 'Grant',    # TX Grant's list
            '1006': 'Grant',    # IN Grant's list
            '1007': 'Carson',   # OH Carson's list
            '1008': 'Carson',   # TX Carson's list
            '1009': 'Carson'    # IN Carson's list
        }

        assigned_agent = list_agent_mapping.get(list_id, 'Hunter')  # Default to Hunter
        logger.info(f"List {list_id} assigned to agent: {assigned_agent}")
        return assigned_agent

    def get_sale_leads_from_list(self, list_id="1000"):
        """Get SALE leads from ViciDial list using web scraping"""
        url = f"https://{VICIDIAL_HOST}/vicidial/admin_search_lead.php"
        params = {
            'list_id': list_id,
            'status': 'SALE',
            'DB': '',
            'submit': 'submit'
        }

        logger.info(f"Fetching SALE leads from list {list_id}")
        response = self.session.get(url, params=params)

        if response.status_code != 200:
            logger.error(f"Failed to fetch leads: {response.status_code}")
            return []

        soup = BeautifulSoup(response.text, 'html.parser')
        leads = []

        # Parse the HTML table for lead data
        for table in soup.find_all('table'):
            rows = table.find_all('tr')
            for row in rows:
                cells = row.find_all('td')
                if len(cells) > 10:
                    # Get the actual lead ID - it's in column 1, not column 0
                    actual_lead_id = cells[1].text.strip()
                    lead_id = cells[0].text.strip()

                    # ALWAYS prefer the actual lead ID (column 1) if it's a pure numeric value
                    if actual_lead_id and actual_lead_id.isdigit() and len(actual_lead_id) > 3:
                        lead_id = actual_lead_id
                    # Only use column 0 if it's also a pure numeric value (no prefixes)
                    elif lead_id and lead_id.isdigit() and len(lead_id) > 3:
                        lead_id = lead_id
                    else:
                        # Skip leads with invalid ID formats (like 88126125)
                        continue

                    # Skip leads that are fully processed (have non-'new' stage already)
                    # Leads still at 'new' stage are re-checked for ViciDial comment updates
                    if lead_id in self.processed_leads:
                        continue

                    # Extract lead details - Fixed column mapping based on debug output
                    # Based on actual parsing results:
                    # Column 0: Some ID (1)
                    # Column 1: Lead ID (123477) - THE REAL LEAD ID
                    # Column 2: Status (SALE)
                    # Column 3: Unknown field (3591796)
                    # Column 4: Unknown field (1001)
                    # Column 5: Unknown field (1001)
                    # Column 6: Phone number (5168173515)
                    # Column 7: Company Name (THIRD GEN TRUCKING L Unknown Rep)
                    # Column 8: City (MONROE)
                    # Column 10: Date

                    phone = cells[6].text.strip() if len(cells) > 6 else ''  # Column 6 has real phone
                    first_name = ''  # ViciDial doesn't seem to have separate first/last in this view
                    last_name = ''
                    company_name = cells[7].text.strip() if len(cells) > 7 else ''  # Column 7 has company name
                    city = cells[8].text.strip() if len(cells) > 8 else ''
                    state = cells[9].text.strip() if len(cells) > 9 else 'OH'
                    vendor_code = cells[3].text.strip() if len(cells) > 3 else ''  # This might be DOT number

                    lead = {
                        'lead_id': lead_id,
                        'phone': phone,
                        'first_name': first_name,
                        'last_name': last_name,
                        'company_name': company_name,
                        'city': city,
                        'state': state,
                        'vendor_code': vendor_code,
                        'list_id': list_id
                    }

                    # Only add unique leads
                    if not any(l['lead_id'] == lead_id for l in leads):
                        leads.append(lead)
                        logger.info(f"Found new SALE lead: {lead_id} - Company: {company_name}, Phone: {phone}, Name: {first_name} {last_name}")

        return leads

    def get_lead_details(self, lead_id):
        """Get detailed information for a specific lead"""
        url = f"https://{VICIDIAL_HOST}/vicidial/admin_modify_lead.php"
        params = {
            'lead_id': lead_id,
            'archive_search': 'No',
            'archive_log': '0'
        }

        response = self.session.get(url, params=params)
        if response.status_code != 200:
            return None

        soup = BeautifulSoup(response.text, 'html.parser')

        # Extract additional details from the lead detail page
        details = {}

        # Look for comments/notes
        for textarea in soup.find_all('textarea'):
            if 'comments' in str(textarea.get('name', '')).lower():
                details['comments'] = textarea.text.strip()

        # Extract any custom fields including address3 (renewal date)
        for input_field in soup.find_all('input'):
            name = input_field.get('name', '')
            value = input_field.get('value', '')
            if name and value:
                details[name] = value
                # Specifically capture address3 for renewal date
                if name.lower() == 'address3':
                    details['address3'] = value.strip()
                    logger.info(f"Found renewal date in address3: {value}")

        # Extract recording URL from the page
        recording_url = self.extract_recording_url(response.text)
        if recording_url:
            details['recording_url'] = recording_url
            logger.info(f"Found recording URL for lead {lead_id}: {recording_url}")

        return details

    def extract_recording_url(self, page_html):
        """Extract recording URL from ViciDial lead page HTML"""
        # Pattern 1: Look for href links to recording files
        recording_pattern = r'href="(http[^"]*RECORDINGS[^"]*\.(?:mp3|wav))"'
        matches = re.findall(recording_pattern, page_html, re.IGNORECASE)
        if matches:
            return matches[0]

        # Pattern 2: Look for src attributes with recording files
        source_pattern = r'(?:src|href)=["\']([^"\']*RECORDINGS[^"\']*\.(?:mp3|wav))["\']'
        source_matches = re.findall(source_pattern, page_html, re.IGNORECASE)
        if source_matches:
            recording_url = source_matches[0]
            if not recording_url.startswith('http'):
                recording_url = f"http://{VICIDIAL_HOST}{recording_url}"
            return recording_url

        return None

    def download_recording(self, recording_url, lead_id):
        """Download recording and save to local storage"""
        try:
            recordings_dir = '/var/www/vanguard/recordings'
            os.makedirs(recordings_dir, exist_ok=True)

            response = self.session.get(recording_url, stream=True, timeout=30)
            if response.status_code == 200:
                file_ext = '.mp3' if '.mp3' in recording_url.lower() else '.wav'
                local_filename = f"recording_{lead_id}{file_ext}"
                local_path = os.path.join(recordings_dir, local_filename)

                with open(local_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)

                if os.path.exists(local_path) and os.path.getsize(local_path) > 1000:
                    logger.info(f"✅ Recording downloaded: {local_path}")
                    return f"/recordings/{local_filename}"
                else:
                    logger.warning(f"⚠️ Downloaded recording is too small or empty")
            else:
                logger.warning(f"⚠️ Failed to download recording: HTTP {response.status_code}")
        except Exception as e:
            logger.warning(f"⚠️ Error downloading recording: {str(e)[:50]}")
        return None

    def format_business_name(self, first_name, last_name, vendor_code, company_name=None):
        """Format business name like existing leads"""
        # First priority: Use the actual company name from ViciDial if available
        if company_name and company_name.strip():
            # Clean up the company name (remove "Unknown Rep" suffix if present)
            cleaned_company = company_name.strip()
            if 'Unknown Rep' in cleaned_company:
                cleaned_company = cleaned_company.replace('Unknown Rep', '').strip()
            if cleaned_company:
                return cleaned_company.upper()

        # Fallback: Use first/last name if available
        if first_name and last_name:
            # Create business name in proper format
            full_name = f"{first_name} {last_name}".upper()

            # Check for common business indicators
            if any(word in full_name for word in ['LLC', 'INC', 'CORP', 'TRUCKING', 'TRANSPORT']):
                return full_name

            # If it's a person's name, add business suffix
            if 'TRUCKING' not in full_name and 'TRANSPORT' not in full_name:
                # Format like "CHARLES V MUMFORD JR / MUMFORD FARMS"
                business_suffix = f"{last_name} TRUCKING".upper()
                return f"{full_name} / {business_suffix}"

            return full_name
        elif vendor_code:
            return f"DOT {vendor_code} TRUCKING"
        else:
            return "UNKNOWN TRUCKING"

    def format_phone(self, phone):
        """Format phone number to (XXX) XXX-XXXX"""
        # Remove all non-digits
        digits = re.sub(r'\D', '', phone)

        if len(digits) == 10:
            return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
        elif len(digits) == 11 and digits[0] == '1':
            return f"({digits[1:4]}) {digits[4:7]}-{digits[7:]}"
        else:
            return phone

    def format_renewal_date(self, raw_date):
        """Format renewal date from ViciDial address3 field to M/D/YYYY format"""
        if not raw_date:
            return ""

        # Clean up the raw date string
        raw_date = raw_date.strip()
        logger.info(f"Processing renewal date: '{raw_date}'")

        # PRIORITY: Handle the most common Vicidial format first (YYYY-MM-DD)
        if re.match(r'^\d{4}-\d{1,2}-\d{1,2}$', raw_date):
            try:
                year, month, day = raw_date.split('-')
                formatted = f"{int(month)}/{int(day)}/{year}"
                logger.info(f"YYYY-MM-DD format detected: '{raw_date}' -> '{formatted}'")
                return formatted
            except (ValueError, IndexError) as e:
                logger.warning(f"Failed to parse YYYY-MM-DD format: {raw_date}, error: {e}")

        # Try other date formats that might be in address3
        date_patterns = [
            (r'(\d{1,2})/(\d{1,2})/(\d{4})', 'M/D/YYYY'),  # M/D/YYYY or MM/DD/YYYY
            (r'(\d{1,2})-(\d{1,2})-(\d{4})', 'M-D-YYYY'),  # M-D-YYYY or MM-DD-YYYY
            (r'(\d{4})/(\d{1,2})/(\d{1,2})', 'YYYY/M/D'),  # YYYY/M/D format
            (r'(\d{1,2})/(\d{1,2})/(\d{2})', 'M/D/YY'),    # M/D/YY or MM/DD/YY
        ]

        for pattern, format_name in date_patterns:
            match = re.search(pattern, raw_date)
            if match:
                if format_name in ['M/D/YYYY', 'M-D-YYYY']:
                    month, day, year = match.groups()
                    formatted = f"{int(month)}/{int(day)}/{year}"
                    logger.info(f"{format_name} format detected: '{raw_date}' -> '{formatted}'")
                    return formatted
                elif format_name == 'YYYY/M/D':
                    year, month, day = match.groups()
                    formatted = f"{int(month)}/{int(day)}/{year}"
                    logger.info(f"{format_name} format detected: '{raw_date}' -> '{formatted}'")
                    return formatted
                elif format_name == 'M/D/YY':
                    month, day, year = match.groups()
                    full_year = f"20{year}" if int(year) < 50 else f"19{year}"
                    formatted = f"{int(month)}/{int(day)}/{full_year}"
                    logger.info(f"{format_name} format detected: '{raw_date}' -> '{formatted}'")
                    return formatted

        # If no standard date pattern found, look for month names
        month_names = {
            'jan': '1', 'january': '1',
            'feb': '2', 'february': '2',
            'mar': '3', 'march': '3',
            'apr': '4', 'april': '4',
            'may': '5',
            'jun': '6', 'june': '6',
            'jul': '7', 'july': '7',
            'aug': '8', 'august': '8',
            'sep': '9', 'september': '9',
            'oct': '10', 'october': '10',
            'nov': '11', 'november': '11',
            'dec': '12', 'december': '12'
        }

        raw_lower = raw_date.lower()
        for month_name, month_num in month_names.items():
            if month_name in raw_lower:
                # Extract year and day if possible
                year_match = re.search(r'(\d{4})', raw_date)
                day_match = re.search(r'\b(\d{1,2})\b', raw_date)
                if year_match and day_match:
                    return f"{month_num}/{day_match.group(1)}/{year_match.group(1)}"

        # If nothing matches, return the original string
        return raw_date

    def extract_policy_from_comments(self, comments):
        """Extract insurance policy details and fleet size from comments/notes"""
        policy_info = {
            'current_carrier': '',
            'current_premium': '',
            'quoted_premium': 0,
            'liability': '$1,000,000',
            'cargo': '$100,000',
            'fleet_size': 0,
            'calculated_premium': 0
        }

        if not comments:
            return policy_info

        # Extract fleet size from multiple possible patterns
        # Primary pattern: "Insurance Expires: xxxx-xx-xx | Fleet Size: x"
        fleet_patterns = [
            # NEW FORMAT: "Fl: 2" pattern (highest priority)
            r'Fl:\s*(\d+)',  # NEW: "Fl: 2" pattern for newest ViciDial format
            r'Dr:\s*\d+\s*\|\s*Fl:\s*(\d+)',  # NEW: "Dr: 2 | Fl: 2" combined pattern
            r'Insurance Expires:.*?\|\s*Fleet Size:?\s*(\d+)',  # Original pattern
            r'Size:\s*(\d+)',  # NEW: "Size: 10" pattern for new ViciDial format
            r'Fleet Size:?\s*(\d+)',  # Simple "Fleet Size: x" pattern
            r'Fleet\s*Size\s*:\s*(\d+)',  # "Fleet Size : x" with spaces
            r'(\d+)\s*vehicles?',  # "9 vehicles" pattern
            r'fleet\s*of\s*(\d+)',  # "fleet of 9" pattern
            r'(\d+)\s*units?',  # "5 units" pattern
            r'(\d+)\s*trucks?',  # "3 trucks" pattern
            r'(\d+)\s*power\s*units?',  # "4 power units" pattern
            r'units?\s*:\s*(\d+)',  # "Units: 5" pattern
            r'truck\s*count\s*:\s*(\d+)',  # "Truck count: 3" pattern
            r'total\s*vehicles?\s*:\s*(\d+)',  # "Total vehicles: 7" pattern
        ]

        fleet_size = 0
        for pattern in fleet_patterns:
            fleet_match = re.search(pattern, comments, re.I)
            if fleet_match:
                fleet_size = int(fleet_match.group(1))
                policy_info['fleet_size'] = fleet_size
                # Calculate premium at $14,400 per vehicle
                calculated_premium = fleet_size * 14400
                policy_info['calculated_premium'] = calculated_premium
                logger.info(f"✓ Fleet size extracted with pattern '{pattern}': {fleet_size} vehicles, calculated premium: ${calculated_premium:,}")
                break

        if fleet_size == 0:
            logger.warning(f"⚠️ No fleet size found in comments: '{comments}'")

        # Extract carrier
        carrier_match = re.search(r'(State Farm|Progressive|Nationwide|Geico|Allstate|Liberty)', comments, re.I)
        if carrier_match:
            policy_info['current_carrier'] = carrier_match.group(1)

        # Extract current premium
        current_match = re.search(r'(?:paying|current)\s*\$?([\d,]+)\s*(?:per|/)\s*month', comments, re.I)
        if current_match:
            amount = int(re.sub(r'[^\d]', '', current_match.group(1)))
            policy_info['current_premium'] = f"${amount}/month (${amount * 12:,}/year)"

        # Extract quoted premium
        quoted_match = re.search(r'(?:quoted?|offer)\s*\$?([\d,]+)\s*(?:per|/)\s*month', comments, re.I)
        if quoted_match:
            policy_info['quoted_premium'] = int(re.sub(r'[^\d]', '', quoted_match.group(1)))

        return policy_info

    def create_lead_record(self, vicidial_lead, lead_details=None):
        """Create lead record in Vanguard format"""
        lead_id = vicidial_lead['lead_id']

        # Format business name
        business_name = self.format_business_name(
            vicidial_lead.get('first_name', ''),
            vicidial_lead.get('last_name', ''),
            vicidial_lead.get('vendor_code', ''),
            vicidial_lead.get('company_name', '')
        )

        # Format contact name - try multiple sources for better contact info
        contact_name = f"{vicidial_lead.get('first_name', '')} {vicidial_lead.get('last_name', '')}".strip()

        # If we don't have proper first/last name, try other sources
        company_name = vicidial_lead.get('company_name', '')
        email = lead_details.get('email', '') if lead_details else ''

        # Try to extract contact from email address (e.g., "john.doe@company.com" -> "John Doe")
        if (not contact_name or contact_name == ' ' or contact_name in ['1001', '1002', '1000', '1003']) and email and '@' in email:
            email_prefix = email.split('@')[0].replace('.', ' ').replace('_', ' ').replace('-', ' ')
            # Convert to proper case (john doe -> John Doe)
            if email_prefix and not email_prefix.isdigit():
                contact_name = ' '.join(word.capitalize() for word in email_prefix.split())
                logger.info(f"Extracted contact from email: '{email}' -> '{contact_name}'")

        # If still no good contact, try to extract from company name
        if (not contact_name or contact_name == ' ' or contact_name in ['1001', '1002', '1000', '1003']) and company_name:
            if 'Unknown Rep' in company_name:
                # For "TANNER TRUCKING INC Unknown Rep", use a generic contact
                base_company = company_name.replace('Unknown Rep', '').strip()
                contact_name = "Owner/Manager"  # Generic professional contact
                logger.info(f"Using generic contact for company: {base_company}")
            else:
                contact_name = company_name
        elif not contact_name or contact_name == ' ':
            contact_name = business_name.split('/')[0].strip()

        # Format phone
        phone = self.format_phone(vicidial_lead.get('phone', ''))

        # Extract fleet size and insurance info from comments
        comments = lead_details.get('comments', '') if lead_details else ''
        policy_info = self.extract_policy_from_comments(comments)

        # Extract insurance company from address fields
        insurance_company = ""
        if lead_details:
            # Check address1 and address2 for insurance company
            address1 = lead_details.get('address1', '').strip()
            address2 = lead_details.get('address2', '').strip()

            # Common insurance company patterns
            insurance_patterns = [
                r'(State Farm|Progressive|Nationwide|Geico|Allstate|Liberty|USAA|Farmers|Travelers)',
                r'([A-Z\s]+CASUALTY\s+CO\.?)',  # "GREAT WEST CASUALTY CO."
                r'([A-Z\s]+Insurance)',
                r'([A-Z\s]+Mutual)',
                r'([A-Z\s]+General)',
                r'([A-Z\s]+Casualty)',  # General casualty pattern
                r'(\w+.*INSURANCE.*)',  # Any text with INSURANCE
            ]

            # Check address1 first, then address2
            for address_field in [address1, address2]:
                if address_field:
                    for pattern in insurance_patterns:
                        match = re.search(pattern, address_field, re.I)
                        if match:
                            insurance_company = match.group(1).title()
                            field_name = "address1" if address_field == address1 else "address2"
                            logger.info(f"✓ Insurance company extracted: '{insurance_company}' from {field_name}: '{address_field}'")
                            break
                    if insurance_company:
                        break

        logger.info(f"✓ Policy info extracted - Fleet: {policy_info['fleet_size']} units, Premium: ${policy_info['calculated_premium']:,}, Insurance: {insurance_company}")

        # Extract renewal date from address3 field (where ViciDial stores renewal date)
        renewal_date = ""
        if lead_details and 'address3' in lead_details:
            raw_renewal = lead_details['address3'].strip()
            if raw_renewal:
                # Try to format the renewal date to match existing format (M/D/YYYY)
                renewal_date = self.format_renewal_date(raw_renewal)
                logger.info(f"Formatted renewal date: '{raw_renewal}' -> '{renewal_date}'")

        # Fallback: try to get renewal from vendor_code or other fields
        if not renewal_date and vicidial_lead.get('vendor_code'):
            # Sometimes renewal date is in other fields, check lead data
            logger.info(f"No renewal date in address3, lead data: {vicidial_lead}")

        # Get assigned representative based on list ID (intelligent assignment)
        assigned_representative = self.get_assigned_agent_for_list(vicidial_lead.get('list_id', '1000'))

        # Download recording if available
        recording_path = None
        call_duration_str = None
        call_talk_time = None
        call_timestamp = None
        if lead_details and lead_details.get('recording_url'):
            recording_url = lead_details['recording_url']
            recording_path = self.download_recording(recording_url, lead_id)
            if recording_path:
                # Get actual duration from downloaded file using ffprobe
                local_path = f"/var/www/vanguard{recording_path}"
                try:
                    import subprocess as _sp
                    _r = _sp.run(
                        ['ffprobe', '-v', 'quiet', '-show_entries',
                         'format=duration', '-of', 'csv=p=0', local_path],
                        capture_output=True, text=True, timeout=10
                    )
                    if _r.returncode == 0 and _r.stdout.strip():
                        _secs = int(float(_r.stdout.strip()))
                        mins, secs = divmod(_secs, 60)
                        call_duration_str = f"{mins}:{secs:02d}"
                        call_talk_time = f"{mins} min" if secs == 0 else f"{mins} min {secs} sec"
                        if _secs < 60:
                            call_talk_time = f"{_secs} sec"
                        logger.info(f"✅ Recording duration: {call_talk_time} ({_secs}s)")
                except Exception as _e:
                    logger.warning(f"⚠️ ffprobe failed: {_e}")
                # Extract timestamp from recording filename (e.g. 20260226-210307_...)
                _ts_m = re.search(r'(\d{8})-(\d{6})', recording_url)
                if _ts_m:
                    try:
                        _ts = datetime.strptime(f"{_ts_m.group(1)} {_ts_m.group(2)}", "%Y%m%d %H%M%S")
                        call_timestamp = _ts.isoformat()
                    except Exception:
                        pass

        # Parse stage and callback from ViciDial comments
        parsed_stage = 'new'
        parsed_callback_date = ''
        parsed_callback_time = ''
        parsed_owner_name = ''
        if comments:
            # Custom stage: "Custom: some text"
            custom_match = re.search(r'Custom:\s*(.+)', comments, re.IGNORECASE)
            if custom_match and custom_match.group(1).strip():
                parsed_stage = custom_match.group(1).strip()
                logger.info(f"✅ Custom stage from comments: '{parsed_stage}'")
            else:
                # Standard stages with X marker (check most specific first)
                if re.search(r'LR Rec:\s*[Xx]', comments, re.IGNORECASE):
                    parsed_stage = 'loss_runs_received'
                elif re.search(r'LR Req:\s*[Xx]', comments, re.IGNORECASE):
                    parsed_stage = 'info_requested'
                elif re.search(r'New:\s*[Xx]', comments, re.IGNORECASE):
                    parsed_stage = 'new'
                # Old format fallback
                elif re.search(r'Loss Runs Received:\s*[Xx]', comments, re.IGNORECASE):
                    parsed_stage = 'loss_runs_received'
                elif re.search(r'(Loss Runs Requested|Info Requested):\s*[Xx]', comments, re.IGNORECASE):
                    parsed_stage = 'info_requested'
                logger.info(f"✅ Stage from comments: '{parsed_stage}'")

            # NEXT CALL parsing
            cb_match = re.search(r'NEXT CALL\s*\n\s*Date:\s*(\S+)\s+Time:\s*([^\n\r]+)', comments, re.IGNORECASE | re.MULTILINE)
            if not cb_match:
                cb_match = re.search(r'--scheduled next call-+\s*\n\s*Date:\s*(\S+)\s+Time:\s*([^\n\r]+)', comments, re.IGNORECASE | re.MULTILINE)
            if cb_match:
                parsed_callback_date = cb_match.group(1).strip()
                parsed_callback_time = cb_match.group(2).strip()
                logger.info(f"✅ Callback from comments: {parsed_callback_date} at {parsed_callback_time}")

            # Owner name
            name_match = re.search(r'------------Name--------------\s*\n\s*([^\n\r-]+)', comments, re.IGNORECASE | re.MULTILINE)
            if name_match:
                parsed_owner_name = name_match.group(1).strip()

        # Create lead data matching existing format
        lead_data = {
            "id": lead_id,
            "name": business_name,
            "contact": contact_name.upper(),
            "phone": phone,
            "email": f"{contact_name.lower().replace(' ', '.')}@company.com" if contact_name else "",
            "product": "Commercial Auto",
            "stage": parsed_stage,
            "status": "hot_lead",
            "assignedTo": assigned_representative,
            "assigned_to": assigned_representative,  # Also save underscore format for frontend compatibility
            "created": datetime.now().strftime("%-m/%-d/%Y"),
            "renewalDate": renewal_date,
            "premium": policy_info['calculated_premium'],  # Use calculated premium from fleet size
            "dotNumber": vicidial_lead.get('vendor_code', ''),
            "mcNumber": "",
            "yearsInBusiness": "",
            "fleetSize": str(policy_info['fleet_size']) if policy_info['fleet_size'] > 0 else "Unknown",
            "insuranceCompany": insurance_company,  # New field for current insurance company
            "address": "",
            "city": vicidial_lead.get('city', '').upper(),
            "state": vicidial_lead.get('state', 'OH'),
            "zip": "",
            "radiusOfOperation": "Regional",
            "commodityHauled": "",
            "operatingStates": [vicidial_lead.get('state', 'OH')],
            "annualRevenue": "",
            "safetyRating": "Satisfactory",
            "currentCarrier": insurance_company,  # Use extracted insurance company
            "currentPremium": policy_info['current_premium'],  # Use extracted premium info
            "needsCOI": False,
            "insuranceLimits": {
                "liability": "$1,000,000",
                "cargo": "$100,000"
            },
            "source": "ViciDial",
            "archived": False,  # CRITICAL: Explicitly set ViciDial leads as NOT archived
            "leadScore": 85,
            "lastContactDate": datetime.now().strftime("%-m/%-d/%Y"),
            "followUpDate": "",
            "notes": f"SALE from ViciDial list {vicidial_lead.get('list_id', '1000')}.",
            "tags": ["ViciDial", "Sale", f"List-{vicidial_lead.get('list_id', '1000')}"],
            "recordingPath": recording_path or "",
            "hasRecording": bool(recording_path),
            "reachOut": {
                "callAttempts": 1,
                "callsConnected": 1,
                "emailCount": 0,
                "textCount": 0,
                "voicemailCount": 0,
                "contacted": True,
                "callLogs": [{
                    "timestamp": call_timestamp or datetime.now().isoformat(),
                    "connected": True,
                    "duration": call_talk_time or call_duration_str or "< 1 min",
                    "leftVoicemail": False,
                    "notes": f"ViciDial SALE call{' — ' + call_talk_time if call_talk_time else ''}"
                }]
            },
            "ownerName": parsed_owner_name or contact_name.upper()
        }

        # Add callback if parsed from comments — skip placeholder dates like "MM/DD/2026"
        if parsed_callback_date and parsed_callback_time and not parsed_callback_date.startswith('MM'):
            try:
                time_str = re.sub(r'(\d+:\d+)([AP]M)', r'\1 \2', parsed_callback_time.upper())
                cb_datetime = datetime.strptime(f"{parsed_callback_date} {time_str}", "%m/%d/%Y %I:%M %p")
                cb_id = str(int(datetime.now().timestamp() * 1000))
                cb_iso = cb_datetime.isoformat()
                lead_data["scheduledCallbacks"] = [{
                    "id": cb_id,
                    "datetime": cb_iso,
                    "date": parsed_callback_date,
                    "time": parsed_callback_time,
                    "notes": "Auto-scheduled from ViciDial",
                    "source": "vicidial_sync"
                }]
                # Also insert into scheduled_callbacks table so the UI displays it
                try:
                    cursor = self.db.cursor()
                    cursor.execute(
                        """INSERT OR IGNORE INTO scheduled_callbacks (callback_id, lead_id, date_time, notes, completed)
                           VALUES (?, ?, ?, ?, 0)""",
                        (cb_id, lead_id, cb_iso, "Auto-scheduled from ViciDial")
                    )
                    self.db.commit()
                    logger.info(f"📅 Created callback in DB table for {parsed_callback_date} {parsed_callback_time}")
                except Exception as db_err:
                    logger.warning(f"⚠️ Error inserting callback into DB table: {db_err}")
                logger.info(f"📅 Created callback for {parsed_callback_date} {parsed_callback_time}")
            except Exception as e:
                logger.warning(f"⚠️ Error creating callback: {e}")

        # Simplified - no complex logging needed
        logger.info(f"✓ Created lead record for {lead_data['name']} (ID: {lead_id}) stage={parsed_stage} duration={call_talk_time or 'N/A'}")

        return lead_data

    def save_lead(self, lead_data):
        """Save lead to database"""
        cursor = self.db.cursor()

        # CRITICAL: Never re-insert permanently deleted leads
        cursor.execute("SELECT id FROM deleted_leads WHERE id = ?", (lead_data['id'],))
        if cursor.fetchone():
            logger.info(f"🚫 Skipping deleted lead {lead_data['id']} — present in deleted_leads table")
            self.processed_leads.add(lead_data['id'])
            return

        # Check if lead already exists
        cursor.execute("SELECT id, data FROM leads WHERE id = ?", (lead_data['id'],))
        existing_row = cursor.fetchone()
        if existing_row:
            logger.info(f"Lead {lead_data['id']} already exists, updating...")
            try:
                existing_data = json.loads(existing_row[1])

                # USER-MANAGED FIELDS: Never overwrite with sync data if the existing record
                # already has a value — mirrors server.js insertOrUpdateLead() protection.
                USER_MANAGED_FIELDS = {
                    'stageUpdatedAt', 'confirmedPremium',
                    'priority', 'notes', 'assignedTo', 'appStage',
                    'callDuration', 'transcriptText', 'transcriptWords',
                    'callTimestamp', 'brokerTracking'
                }
                for field in USER_MANAGED_FIELDS:
                    existing_val = existing_data.get(field)
                    has_value = (
                        existing_val is not None
                        and existing_val != ''
                        and existing_val != 0
                        and existing_val != []
                        and existing_val != {}
                    )
                    if has_value:
                        lead_data[field] = existing_val

                # Stage: only preserve existing if new stage is just 'new' (default)
                # If ViciDial comments provided a specific stage, use it
                new_stage = lead_data.get('stage', 'new')
                existing_stage = existing_data.get('stage', 'new')
                if new_stage == 'new' and existing_stage and existing_stage != 'new':
                    lead_data['stage'] = existing_stage
                elif new_stage != 'new':
                    lead_data['stage'] = new_stage
                    logger.info(f"📋 Updating stage from ViciDial comments: '{existing_stage}' → '{new_stage}'")

                # Preserve premium — only use calculated value if no existing premium
                if existing_data.get('premium'):
                    lead_data['premium'] = existing_data['premium']

                # Preserve existing recordingPath/hasRecording if new sync didn't find a recording
                if not lead_data.get('recordingPath') and existing_data.get('recordingPath'):
                    lead_data['recordingPath'] = existing_data['recordingPath']
                    lead_data['hasRecording'] = existing_data.get('hasRecording', True)
                    logger.info(f"Preserving existing recording: {lead_data['recordingPath']}")

                # Preserve DOT-lookup-populated fields so 5-min sync doesn't erase them
                # Treat "Unknown" as missing — only preserve real values from DOT lookup
                for dot_field in ['yearsInBusiness', 'commodityHauled', 'vehicles', 'trailers', 'drivers']:
                    existing_val = existing_data.get(dot_field)
                    if existing_val and existing_val != 'Unknown' and not lead_data.get(dot_field):
                        lead_data[dot_field] = existing_val

                # Preserve reachOut and merge call logs so 5-min sync doesn't wipe them
                existing_reach = existing_data.get('reachOut', {})
                existing_logs = existing_reach.get('callLogs', []) if isinstance(existing_reach, dict) else []
                if existing_logs:
                    if 'reachOut' not in lead_data or not isinstance(lead_data.get('reachOut'), dict):
                        lead_data['reachOut'] = dict(existing_reach)
                    else:
                        new_logs = lead_data['reachOut'].get('callLogs', [])
                        # Merge: keep existing, add new non-duplicate logs
                        merged = list(existing_logs)
                        for nl in new_logs:
                            is_dup = any(
                                l.get('timestamp') == nl.get('timestamp') or
                                (l.get('notes') == nl.get('notes') and nl.get('notes'))
                                for l in existing_logs
                            )
                            if not is_dup:
                                merged.append(nl)
                        lead_data['reachOut']['callLogs'] = merged
                    logger.info(f"📞 Preserved {len(existing_logs)} existing call log(s)")

                # Merge scheduledCallbacks: keep existing, add new ViciDial ones
                existing_callbacks = existing_data.get('scheduledCallbacks', [])
                new_callbacks = lead_data.get('scheduledCallbacks', [])
                if new_callbacks and existing_callbacks:
                    # Add new callbacks that don't duplicate existing ones
                    for nc in new_callbacks:
                        is_dup = any(c.get('datetime') == nc.get('datetime') for c in existing_callbacks)
                        if not is_dup:
                            existing_callbacks.append(nc)
                    lead_data['scheduledCallbacks'] = existing_callbacks
                elif existing_callbacks and not new_callbacks:
                    lead_data['scheduledCallbacks'] = existing_callbacks

                # Preserve ownerName if already set
                if existing_data.get('ownerName') and not lead_data.get('ownerName'):
                    lead_data['ownerName'] = existing_data['ownerName']
            except Exception:
                pass
            cursor.execute(
                "UPDATE leads SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (json.dumps(lead_data), lead_data['id'])
            )
        else:
            cursor.execute(
                "INSERT INTO leads (id, data, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                (lead_data['id'], json.dumps(lead_data))
            )
            logger.info(f"✓ Added new lead: {lead_data['id']} - {lead_data['name']}")

        self.db.commit()
        self.processed_leads.add(lead_data['id'])

    def sync_vicidial_leads(self):
        """Main sync function - called by Sync ViciDial Now button"""
        logger.info("=" * 60)
        logger.info("Starting ViciDial sync...")

        total_imported = 0

        # Check multiple lists if needed - each assigned to different agents
        lists_to_check = ["998", "999", "1000", "1001", "1002", "1005", "1006", "1007", "1008", "1009"]  # All active lists including Carson's lists

        for list_id in lists_to_check:
            logger.info(f"Checking list {list_id}...")
            leads = self.get_sale_leads_from_list(list_id)

            for lead in leads:
                try:
                    # Get additional lead details if available
                    lead_details = self.get_lead_details(lead['lead_id'])

                    # Create lead record in Vanguard format
                    lead_data = self.create_lead_record(lead, lead_details)

                    # Save to database
                    self.save_lead(lead_data)
                    total_imported += 1

                except Exception as e:
                    logger.error(f"Error processing lead {lead['lead_id']}: {e}")

        logger.info(f"Sync complete! Imported {total_imported} new leads")
        logger.info("=" * 60)

        return {
            "success": True,
            "imported": total_imported,
            "message": f"Successfully imported {total_imported} ViciDial leads"
        }

def main():
    """Run the sync manually or via cron"""
    sync = VanguardViciDialSync()
    result = sync.sync_vicidial_leads()
    print(json.dumps(result))

if __name__ == "__main__":
    main()