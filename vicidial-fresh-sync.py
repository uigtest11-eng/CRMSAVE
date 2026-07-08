#!/usr/bin/env python3
"""
Fresh ViciDial Sync - Imports ALL ViciDial SALE leads
No duplicate checking - complete fresh import to server database
"""

import json
import os
import sqlite3
import requests
from datetime import datetime
from bs4 import BeautifulSoup
import re
import urllib3
import time
import sys
import subprocess
sys.path.append('/var/www/vanguard')

# Deepgram configuration from environment
DEEPGRAM_API_KEY = os.environ.get("DEEPGRAM_API_KEY", "")

try:
    exec(open('/var/www/vanguard/openai-processor.py').read())
    OPENAI_AVAILABLE = True
except:
    OPENAI_AVAILABLE = False
    print("Warning: OpenAI not available")

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Configuration from environment
VICIDIAL_HOST = os.environ.get("VICIDIAL_HOST", "204.13.233.29")
VICIDIAL_USERNAME = os.environ.get("VICIDIAL_USER", "")
VICIDIAL_PASSWORD = os.environ.get("VICIDIAL_PASS", "")
DB_PATH = "/var/www/vanguard/vanguard.db"
PROGRESS_FILE = "/var/www/vanguard/sync-progress.json"

class FreshViciDialSync:
    def __init__(self):
        self.session = requests.Session()
        self.session.auth = requests.auth.HTTPBasicAuth(VICIDIAL_USERNAME, VICIDIAL_PASSWORD)
        self.session.verify = False
        self.total_steps = 0
        self.current_step = 0
        self.current_progress = 0
        self.openai = OpenAIProcessor() if OPENAI_AVAILABLE else None

        # Deepgram API configuration
        self.deepgram_api_key = DEEPGRAM_API_KEY
        print("✓ Using Deepgram for transcription")

    def transcribe_with_deepgram(self, audio_file):
        """Transcribe audio using Deepgram API with better timeout handling"""
        print(f"    Calling Deepgram API...")

        # Check file size first
        file_size = os.path.getsize(audio_file)
        if file_size > 10 * 1024 * 1024:  # 10MB
            print(f"    ⚠️ Large file ({file_size / 1024 / 1024:.1f}MB) - may take longer")

        # Deepgram API endpoint
        url = "https://api.deepgram.com/v1/listen"

        # Headers
        headers = {
            "Authorization": f"Token {self.deepgram_api_key}",
            "Content-Type": "audio/mpeg"
        }

        # Parameters
        params = {
            "model": "nova-2",
            "language": "en-US",
            "smart_format": "true",
            "diarize": "true",
            "punctuate": "true",
            "numerals": "true"
        }

        try:
            with open(audio_file, 'rb') as audio:
                audio_data = audio.read()

            # Increase timeout for larger files
            timeout_seconds = 30 if file_size < 5 * 1024 * 1024 else 60

            response = requests.post(url, headers=headers, params=params, data=audio_data, timeout=timeout_seconds)

            if response.status_code == 200:
                result = response.json()

                # Extract transcript with speaker labels
                words = result['results']['channels'][0]['alternatives'][0].get('words', [])
                transcript = result['results']['channels'][0]['alternatives'][0]['transcript']

                # Format with speakers if available
                if words:
                    lines = []
                    current_speaker = None
                    current_text = []

                    for word in words:
                        speaker = word.get('speaker', 0)

                        if speaker != current_speaker:
                            if current_text:
                                speaker_label = "Agent" if current_speaker == 0 else "Customer"
                                lines.append(f"{speaker_label}: {' '.join(current_text)}")

                            current_speaker = speaker
                            current_text = [word.get('punctuated_word', word.get('word', ''))]
                        else:
                            current_text.append(word.get('punctuated_word', word.get('word', '')))

                    if current_text:
                        speaker_label = "Agent" if current_speaker == 0 else "Customer"
                        lines.append(f"{speaker_label}: {' '.join(current_text)}")

                    return '\n'.join(lines)
                else:
                    return transcript
            else:
                print(f"    Deepgram error: {response.status_code}")
                return None

        except requests.exceptions.Timeout:
            print(f"    ⚠️ Deepgram request timed out after {timeout_seconds} seconds")
            return None
        except requests.exceptions.RequestException as e:
            print(f"    ⚠️ Deepgram request error: {e}")
            return None
        except Exception as e:
            print(f"    ⚠️ Deepgram exception: {e}")
            return None

    def update_progress(self, percentage, phase, details=""):
        """Update progress file for frontend"""
        progress_data = {
            "percentage": percentage,
            "phase": phase,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }

        with open(PROGRESS_FILE, 'w') as f:
            json.dump(progress_data, f)

        print(f"\rProgress: {percentage}% - {phase} - {details}", end="", flush=True)

    def scan_all_lists(self):
        """Scan ALL ViciDial lists for SALE leads"""
        self.update_progress(5, "Scanning ViciDial", "Connecting to ViciDial...")

        all_sale_leads = []

        # Known lists to check
        list_ids = ['999', '1000', '1001', '1002', '1003', '1005', '1006', '1213']

        # Try to get more lists
        try:
            lists_url = f"https://{VICIDIAL_HOST}/vicidial/admin.php?ADD=100"
            response = self.session.get(lists_url, timeout=10)

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')

                # Find additional list IDs
                for link in soup.find_all('a'):
                    href = link.get('href', '')
                    if 'list_id=' in href:
                        match = re.search(r'list_id=(\d+)', href)
                        if match:
                            list_ids.append(match.group(1))

                # Also check table cells
                for td in soup.find_all('td'):
                    text = td.text.strip()
                    if text.isdigit() and len(text) >= 3 and len(text) <= 5:
                        list_ids.append(text)
        except:
            pass

        # Remove duplicates
        list_ids = list(set(list_ids))
        total_lists = len(list_ids)

        print(f"\nChecking {total_lists} lists: {sorted(list_ids)}")

        # Scan each list
        for idx, list_id in enumerate(sorted(list_ids), 1):
            progress = 5 + int((idx / total_lists) * 25)  # 5-30% for scanning
            self.update_progress(progress, "Scanning Lists", f"List {list_id}")

            # Search for SALE leads in this list
            url = f"https://{VICIDIAL_HOST}/vicidial/admin_search_lead.php"
            params = {
                'list_id': list_id,
                'status': 'SALE',
                'DB': '',
                'submit': 'submit'
            }

            try:
                response = self.session.get(url, params=params, timeout=10)

                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')

                    # Parse lead data from tables
                    for table in soup.find_all('table'):
                        # Check if this is the data table (has LEAD ID header)
                        header_row = table.find('tr')
                        if header_row:
                            headers = [cell.text.strip() for cell in header_row.find_all(['th', 'td'])]
                            if 'LEAD ID' in headers:
                                # This is the data table, skip header row and process data
                                for row in table.find_all('tr')[1:]:  # Skip header
                                    cells = row.find_all('td')
                                    if len(cells) >= 11:
                                        # Column mapping based on actual structure:
                                        # 0: #, 1: LEAD ID, 2: STATUS, 3: VENDOR ID (DOT),
                                        # 4: LAST AGENT, 5: LIST ID, 6: PHONE, 7: NAME,
                                        # 8: CITY, 9: SECURITY/TITLE, 10: LAST CALL
                                        # NOTE: Title field appears in column 9 (SECURITY column)

                                        lead_id = cells[1].text.strip()  # LEAD ID column

                                        # Only process numeric lead IDs
                                        if lead_id and lead_id.isdigit():
                                            # Parse name (might be full name)
                                            full_name = cells[7].text.strip() if len(cells) > 7 else ''
                                            name_parts = full_name.split(' ', 1)
                                            first_name = name_parts[0] if name_parts else ''
                                            last_name = name_parts[1] if len(name_parts) > 1 else ''

                                            # Get title field (contains expiration date in MMDD format)
                                            title_field = cells[9].text.strip() if len(cells) > 9 else ''

                                            lead = {
                                                'lead_id': lead_id,
                                                'list_id': cells[5].text.strip() if len(cells) > 5 else list_id,
                                                'phone': cells[6].text.strip() if len(cells) > 6 else '',
                                                'first_name': first_name,
                                                'last_name': last_name,
                                                'full_name': full_name,
                                                'city': cells[8].text.strip() if len(cells) > 8 else '',
                                                'state': 'OH',  # Default to OH
                                                'vendor_code': cells[3].text.strip() if len(cells) > 3 else '',  # DOT number
                                                'title': title_field,  # Title field with expiration date
                                                'agent': cells[4].text.strip() if len(cells) > 4 else '',
                                                'last_call': cells[10].text.strip() if len(cells) > 10 else ''
                                            }

                                            # Add if not duplicate in our list
                                            if not any(l['lead_id'] == lead_id for l in all_sale_leads):
                                                all_sale_leads.append(lead)
                                                print(f"\n  ✓ Found SALE lead {lead_id} in list {list_id}")

            except Exception as e:
                print(f"\n  ⚠ Error scanning list {list_id}: {e}")

        print(f"\n✅ Found {len(all_sale_leads)} total SALE leads")
        return all_sale_leads

    def get_recording_url_for_lead(self, lead):
        """Get recording URL for a lead from ViciDial"""
        lead_id = lead['lead_id']
        list_id = lead.get('list_id', '1000')

        try:
            url = f"https://{VICIDIAL_HOST}/vicidial/admin_modify_lead.php"
            params = {
                'lead_id': lead_id,
                'list_id': list_id,
                'DB': ''
            }

            response = self.session.get(url, params=params, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')

                # Look for recording links
                for link in soup.find_all('a'):
                    href = link.get('href', '')
                    # Check for MP3 recording links
                    if '/RECORDINGS/' in href and '.mp3' in href:
                        # Convert relative to absolute URL if needed
                        if href.startswith('http'):
                            return href
                        else:
                            return f"http://{VICIDIAL_HOST}{href}"

                # Alternative: search in page text
                matches = re.findall(r'(https?://[^"\s]+/RECORDINGS/[^"\s]+\.mp3)', response.text)
                if matches:
                    return matches[0]
        except:
            pass

        return None

    def process_with_openai(self, transcription_text, lead):
        """Process transcription with OpenAI to extract structured data"""
        if not self.openai:
            return None

        try:
            result = self.openai.process_transcription(transcription_text, lead)
            if result['success']:
                return result['data']
        except Exception as e:
            print(f"OpenAI processing error: {e}")

        return None

    def get_real_transcription(self, lead):
        """Get REAL transcription by downloading and processing audio"""

        lead_id = lead['lead_id']

        # Update progress for recording search
        self.update_progress(
            self.current_progress,
            "Finding Recording",
            f"Lead {lead_id}: Searching for audio..."
        )

        # Step 1: Get recording URL
        recording_url = self.get_recording_url_for_lead(lead)

        if not recording_url:
            print(f"    No recording found for lead {lead_id}")
            return None

        print(f"    Found recording: {recording_url}")

        # Step 2: Download audio
        try:
            os.makedirs('/var/www/vanguard/recordings', exist_ok=True)
            audio_file = f'/var/www/vanguard/recordings/lead_{lead_id}.mp3'

            # ALWAYS download fresh (no caching for simulation)
            self.update_progress(
                self.current_progress,
                "Downloading Fresh Audio",
                f"Lead {lead_id}: Downloading from ViciDial..."
            )
            print(f"    Downloading FRESH audio from ViciDial (no cache)...")
            response = self.session.get(recording_url, stream=True, timeout=30)

            if response.status_code == 200:
                with open(audio_file, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                size_mb = os.path.getsize(audio_file) / 1024 / 1024
                print(f"    Downloaded FRESH: {os.path.getsize(audio_file):,} bytes")
                self.update_progress(
                    self.current_progress,
                    "Downloaded Fresh",
                    f"Lead {lead_id}: Got {size_mb:.1f}MB fresh audio"
                )
            else:
                print(f"    Download failed: Status {response.status_code}")
                return None

        except Exception as e:
            print(f"    Download error: {e}")
            return None

        # Step 3: Transcribe with Deepgram
        self.update_progress(
            self.current_progress,
            "Transcribing with Deepgram",
            f"Lead {lead_id}: Processing audio ({os.path.getsize(audio_file):,} bytes)"
        )

        # Use Deepgram for transcription
        transcription = self.transcribe_with_deepgram(audio_file)

        if transcription:
            print(f"    ✅ Transcribed with Deepgram successfully")
            return transcription
        else:
            print(f"    ❌ Deepgram transcription failed")
            # Update progress to show we're moving on
            self.update_progress(
                self.current_progress,
                "Processing",
                f"Lead {lead_id}: Transcription failed, skipping"
            )
            return None

    def get_transcription_for_lead(self, lead):
        """Get or generate transcription for a lead"""

        print(f"  Getting transcription for lead {lead['lead_id']}...")

        # TRY REAL TRANSCRIPTION FIRST
        real_transcription = self.get_real_transcription(lead)

        if real_transcription:
            print(f"    ✅ Using REAL transcription!")
            return real_transcription

        # NO FALLBACK - FAIL IF NO REAL TRANSCRIPTION
        print(f"    ❌ FAILED: No real transcription available")
        return None

    def extract_policy_details(self, transcription):
        """Extract insurance details from transcription"""
        details = {
            'current_carrier': '',
            'current_premium': 0,
            'quoted_premium': 0,
            'savings': 0,
            'liability': '$1,000,000',
            'cargo': '$100,000'
        }

        # Extract carrier
        carrier_match = re.search(r'(?:with|from)\s+(State Farm|Nationwide|Progressive|Geico|Allstate)', transcription, re.I)
        if carrier_match:
            details['current_carrier'] = carrier_match.group(1)

        # Extract current premium (in words)
        premium_patterns = [
            (r'twenty-one hundred', 2100),
            (r'eighteen hundred and fifty', 1850),
            (r'nineteen hundred', 1900),
            (r'seventeen hundred', 1700),
            (r'sixteen hundred', 1600)
        ]

        for pattern, amount in premium_patterns:
            if re.search(pattern, transcription, re.I):
                details['current_premium'] = amount
                break

        # Extract quoted premium
        quote_patterns = [
            (r'seventeen hundred and fifty', 1750),
            (r'fifteen hundred and fifty', 1550),
            (r'fourteen hundred', 1400),
            (r'sixteen hundred', 1600)
        ]

        for pattern, amount in quote_patterns:
            if re.search(pattern, transcription, re.I):
                details['quoted_premium'] = amount
                break

        # Calculate savings
        if details['current_premium'] and details['quoted_premium']:
            details['savings'] = details['current_premium'] - details['quoted_premium']

        return details

    def get_lead_details(self, lead_id, list_id):
        """Fetch all lead details from ViciDial lead page"""
        lead_details = {
            'comments': '',
            'email': '',
            'address3': '',  # Current carrier
            'vendor_lead_code': '',  # DOT number
            'phone_number': '',
            'first_name': '',
            'last_name': '',
            'address1': '',
            'address2': '',
            'city': '',
            'state': ''
        }

        try:
            detail_url = f"https://{VICIDIAL_HOST}/vicidial/admin_modify_lead.php"
            params = {
                'lead_id': lead_id,
                'list_id': list_id,
                'ADD': '3'
            }

            response = self.session.get(detail_url, params=params, verify=False, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')

                # Extract all form fields
                # Comments field
                comments_textarea = soup.find('textarea', {'name': 'comments'})
                if comments_textarea:
                    lead_details['comments'] = comments_textarea.text.strip()

                # Email field
                email_input = soup.find('input', {'name': 'email'})
                if email_input:
                    lead_details['email'] = email_input.get('value', '').strip()

                # Address3 field (contains current carrier)
                address3_input = soup.find('input', {'name': 'address3'})
                if address3_input:
                    lead_details['address3'] = address3_input.get('value', '').strip()

                # Vendor Lead Code (DOT number)
                vendor_input = soup.find('input', {'name': 'vendor_lead_code'})
                if vendor_input:
                    lead_details['vendor_lead_code'] = vendor_input.get('value', '').strip()

                # Phone number
                phone_input = soup.find('input', {'name': 'phone_number'})
                if phone_input:
                    lead_details['phone_number'] = phone_input.get('value', '').strip()

                # Name fields
                first_name_input = soup.find('input', {'name': 'first_name'})
                if first_name_input:
                    lead_details['first_name'] = first_name_input.get('value', '').strip()

                last_name_input = soup.find('input', {'name': 'last_name'})
                if last_name_input:
                    lead_details['last_name'] = last_name_input.get('value', '').strip()

                # Address fields
                address1_input = soup.find('input', {'name': 'address1'})
                if address1_input:
                    lead_details['address1'] = address1_input.get('value', '').strip()

                address2_input = soup.find('input', {'name': 'address2'})
                if address2_input:
                    lead_details['address2'] = address2_input.get('value', '').strip()

                city_input = soup.find('input', {'name': 'city'})
                if city_input:
                    lead_details['city'] = city_input.get('value', '').strip()

                state_input = soup.find('input', {'name': 'state'})
                if state_input:
                    lead_details['state'] = state_input.get('value', '').strip()

        except Exception as e:
            print(f"    Error fetching lead details: {e}")

        return lead_details

    def create_lead_record(self, vicidial_lead, transcription, policy_details):
        """Create a properly formatted lead record"""
        lead_id = vicidial_lead['lead_id']

        # Parse renewal date - check title, vendor_code, and comments fields
        title = vicidial_lead.get('title', '')
        vendor_code = vicidial_lead.get('vendor_code', '')  # Sometimes contains date
        renewal_date = ""

        # First check title field for MMDD format
        if title and len(title) == 4 and title.isdigit():
            # Title is in MMDD format (e.g., "1020" for October 20)
            month = title[:2]
            day = title[2:4]
            current_year = datetime.now().year
            # Format as MM/DD/YYYY
            renewal_date = f"{int(month)}/{int(day)}/{current_year}"

        # If no date in title, check vendor_code for MM/DD/YYYY format
        elif vendor_code and '/' in vendor_code:
            # vendor_code might contain date like "09/16/2025"
            date_match = re.match(r'^(\d{1,2})/(\d{1,2})/(\d{4})$', vendor_code)
            if date_match:
                month, day, year = date_match.groups()
                renewal_date = f"{int(month)}/{int(day)}/{year}"
                vendor_code = ""  # Clear vendor_code since it's a date, not DOT

        # Get ALL lead details from ViciDial (email, comments, address3, etc.)
        lead_details = self.get_lead_details(lead_id, vicidial_lead.get('list_id', '1000'))
        comments = lead_details.get('comments', '')
        email = lead_details.get('email', '')
        current_carrier = lead_details.get('address3', '')  # Current carrier is in address3
        phone_from_detail = lead_details.get('phone_number', '')

        # Extract company name from comments (format: "Company: NAME | DOT: ...")
        company_name = ""
        if comments:
            company_match = re.search(r'Company:\s*([^|]+)', comments)
            if company_match:
                company_name = company_match.group(1).strip()
                print(f"  📢 Extracted company name: {company_name}")

        # If still no date, check comments field for "Ins Exp:" pattern
        if not renewal_date and comments:
            # Look for "Ins Exp: YYYY-MM-DD" pattern
            exp_match = re.search(r'Ins Exp:\s*(\d{4})-(\d{2})-(\d{2})', comments)
            if exp_match:
                year, month, day = exp_match.groups()
                # Use current year since the dates in comments are old
                current_year = datetime.now().year
                renewal_date = f"{int(month)}/{int(day)}/{current_year}"
                print(f"  📅 Extracted renewal date from comments: {renewal_date}")

        # If still no date, check address3 field for renewal date
        if not renewal_date and current_carrier:
            # Check for various date formats in address3
            # MM/DD/YYYY format
            date_match = re.search(r'(\d{1,2})/(\d{1,2})/(\d{4})', current_carrier)
            if date_match:
                month, day, year = date_match.groups()
                renewal_date = f"{int(month)}/{int(day)}/{year}"
                print(f"  📅 Extracted renewal date from address3: {renewal_date}")
            else:
                # MMDD format (e.g., "1020" for October 20)
                mmdd_match = re.search(r'\b(\d{4})\b', current_carrier)
                if mmdd_match and len(mmdd_match.group(1)) == 4:
                    date_str = mmdd_match.group(1)
                    month = date_str[:2]
                    day = date_str[2:4]
                    # Validate month and day ranges
                    if 1 <= int(month) <= 12 and 1 <= int(day) <= 31:
                        current_year = datetime.now().year
                        renewal_date = f"{int(month)}/{int(day)}/{current_year}"
                        print(f"  📅 Extracted renewal date from address3 (MMDD): {renewal_date}")

        # Use lead details for names if available, otherwise use from initial scan
        full_name = vicidial_lead.get('full_name', '')
        first_name = lead_details.get('first_name') or vicidial_lead.get('first_name', '')
        last_name = lead_details.get('last_name') or vicidial_lead.get('last_name', '')

        # Determine actual DOT number from vendor_lead_code or vendor_code
        dot_number = lead_details.get('vendor_lead_code') or vendor_code
        if dot_number and '/' in dot_number:
            dot_number = ""  # Clear if it's a date

        # Use extracted company name if available
        if company_name:
            business_name = company_name
            contact_name = f"{first_name} {last_name}".strip() or full_name
        # Handle known leads by lead ID as fallback
        elif lead_id == '88546':
            business_name = "CHRISTOPHER STEVENS TRUCKING"
            contact_name = "CHRISTOPHER STEVENS"
            dot_number = "3481784"
        elif lead_id == '88571':
            business_name = company_name or "A & Z TRANSPORTATION LLC"  # Use actual company name
            contact_name = "ABDI OMAR"
            dot_number = "1297534"
        else:
            # Format like existing leads: "NAME / BUSINESS"
            if full_name:
                contact_name = full_name.upper()
                # Use last name for business or full name if no last name
                if last_name:
                    business_name = f"{contact_name} / {last_name.upper()} TRUCKING"
                else:
                    business_name = f"{contact_name} TRUCKING"
            elif dot_number:
                # Use DOT number if no name
                business_name = f"DOT {dot_number} TRUCKING"
                contact_name = f"DOT {dot_number}"
            else:
                # Fallback to lead ID
                business_name = f"LEAD {lead_id} TRUCKING"
                contact_name = f"LEAD {lead_id}"
            # dot_number already set correctly above

        # Use phone from detail page if available, otherwise from initial scan
        phone = phone_from_detail or vicidial_lead.get('phone', '')
        if phone:
            digits = re.sub(r'\D', '', phone)
            if len(digits) == 10:
                phone = f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"

        # Use actual email from ViciDial, not generated
        if not email:
            # Only generate email if we don't have one from ViciDial
            email = f"{contact_name.lower().replace(' ', '.')}@company.com" if contact_name else ""

        # Create lead data structure
        lead_data = {
            "id": lead_id,
            "name": business_name,
            "contact": contact_name,
            "phone": phone,
            "email": email,
            "product": "Commercial Auto",
            "stage": "new",
            "status": "hot_lead",
            "assignedTo": "Sales Team",
            "created": datetime.now().strftime("%-m/%-d/%Y"),
            "renewalDate": renewal_date,  # Set from title field (MMDD format)
            "premium": policy_details.get('quoted_premium', 0),
            "dotNumber": dot_number,
            "mcNumber": "",
            "yearsInBusiness": "5-10",
            "fleetSize": "1-5 units",
            "address": "",
            "city": vicidial_lead.get('city', '').upper() or "OHIO",
            "state": vicidial_lead.get('state', 'OH'),
            "zip": "",
            "radiusOfOperation": "Regional",
            "commodityHauled": "General Freight",
            "operatingStates": [vicidial_lead.get('state', 'OH')],
            "annualRevenue": "$300,000-500,000",
            "safetyRating": "Satisfactory",
            "currentCarrier": current_carrier or policy_details.get('current_carrier', ''),
            "currentPremium": f"${policy_details.get('current_premium', 0)}/month" if policy_details.get('current_premium') else "",
            "needsCOI": False,
            "insuranceLimits": {
                "liability": policy_details.get('liability', '$1,000,000'),
                "cargo": policy_details.get('cargo', '$100,000')
            },
            "source": "ViciDial",
            "leadScore": 95,
            "lastContactDate": datetime.now().strftime("%-m/%-d/%Y"),
            "followUpDate": "",
            "notes": f"SALE from ViciDial list {vicidial_lead.get('list_id', '1000')}. ",
            "transcription": transcription,
            "transcriptText": transcription,  # Frontend field
            "hasTranscript": True,
            "tags": ["ViciDial", "Sale", f"List-{vicidial_lead.get('list_id', '1000')}"]
        }

        # Add savings to notes
        if policy_details.get('savings'):
            lead_data['notes'] += f"Saves ${policy_details['savings']}/month. "

        if transcription:
            lead_data['notes'] += "Full transcript available."

        return lead_data

    def sync_all_leads(self):
        """Main sync function"""
        print("\n" + "=" * 60)
        print("FRESH VICIDIAL IMPORT - NO DUPLICATES CHECK")
        print("=" * 60)

        # Clear progress
        self.update_progress(0, "Starting", "Initializing sync...")

        # Step 1: Scan all lists (0-30%)
        all_leads = self.scan_all_lists()

        if not all_leads:
            self.update_progress(100, "Complete", "No SALE leads found")
            return {
                "success": True,
                "imported": 0,
                "message": "No SALE leads found in ViciDial"
            }

        total_leads = len(all_leads)
        print(f"\n📊 Processing {total_leads} SALE leads...")

        # Step 2: Process each lead (30-90%)
        processed_leads = []

        for idx, lead in enumerate(all_leads, 1):
            # Calculate base progress (30-90% range divided by number of leads)
            base_progress = 30
            progress_per_lead = 60 / total_leads
            self.current_progress = base_progress + int((idx - 1) * progress_per_lead)

            self.update_progress(
                self.current_progress,
                f"Processing Lead {idx}/{total_leads}",
                f"Starting lead {lead['lead_id']}..."
            )

            # Note: get_real_transcription will update progress internally
            # Get transcription (will try real transcription first)
            transcription = self.get_transcription_for_lead(lead)

            # SKIP THIS LEAD IF NO REAL TRANSCRIPTION
            if not transcription:
                print(f"  ⚠️ SKIPPING lead {lead['lead_id']} - No real transcription available")
                continue

            # Keep the FULL original transcription
            full_transcription = transcription

            # Process with OpenAI if available (for data extraction only)
            openai_data = self.process_with_openai(transcription, lead) if OPENAI_AVAILABLE else None

            # Use OpenAI-extracted details if available, otherwise use basic extraction
            if openai_data:
                policy_details = {
                    'current_carrier': openai_data.get('current_carrier', ''),
                    'current_premium': openai_data.get('current_premium', 0),
                    'quoted_premium': openai_data.get('quoted_premium', 0),
                    'savings': openai_data.get('savings', 0),
                    'liability': openai_data.get('coverage_liability', '$1,000,000'),
                    'cargo': openai_data.get('coverage_cargo', '$100,000')
                }
                # DO NOT replace the full transcription with OpenAI's summary!
                # Keep the complete Deepgram transcript
            else:
                # Fallback to basic extraction
                policy_details = self.extract_policy_details(transcription)

            # Create lead record with recording info
            lead_record = self.create_lead_record(lead, transcription, policy_details)

            # Add OpenAI-extracted details if available
            if openai_data:
                # RENEWAL DATE - Only override if we don't have one from title field
                if not lead_record.get('renewalDate') and openai_data.get('renewal_date'):
                    renewal = openai_data['renewal_date']
                    # Convert relative dates to actual dates
                    if 'month' in str(renewal).lower() or 'day' in str(renewal).lower():
                        # If it's relative like "next month" or "30 days", estimate
                        from datetime import timedelta
                        if 'month' in str(renewal).lower():
                            lead_record['renewalDate'] = (datetime.now() + timedelta(days=30)).strftime("%-m/%-d/%Y")
                        else:
                            lead_record['renewalDate'] = (datetime.now() + timedelta(days=45)).strftime("%-m/%-d/%Y")
                    else:
                        lead_record['renewalDate'] = renewal
                elif not lead_record.get('renewalDate') and openai_data.get('policy_expiring_soon'):
                    # If no date from title and marked as expiring soon, estimate 30-45 days
                    from datetime import timedelta
                    lead_record['renewalDate'] = (datetime.now() + timedelta(days=45)).strftime("%-m/%-d/%Y")

                # Company Information
                if openai_data.get('mc_number'):
                    lead_record['mcNumber'] = openai_data['mc_number']
                if openai_data.get('email'):
                    lead_record['email'] = openai_data['email']
                if openai_data.get('years_in_business'):
                    lead_record['yearsInBusiness'] = str(openai_data['years_in_business'])
                if openai_data.get('fleet_size'):
                    lead_record['fleetSize'] = f"{openai_data['fleet_size']} units"

                # Operation Details
                if openai_data.get('radius_of_operation'):
                    lead_record['radiusOfOperation'] = openai_data['radius_of_operation']
                if openai_data.get('commodity_hauled'):
                    lead_record['commodityHauled'] = openai_data['commodity_hauled']
                if openai_data.get('operating_states'):
                    lead_record['operatingStates'] = openai_data['operating_states']

                # Vehicles
                if openai_data.get('vehicles'):
                    lead_record['vehicles'] = openai_data['vehicles']

                # Trailers
                if openai_data.get('trailers'):
                    lead_record['trailers'] = openai_data['trailers']

                # Drivers
                if openai_data.get('drivers'):
                    lead_record['drivers'] = openai_data['drivers']

                # Insurance Details
                if openai_data.get('physical_damage'):
                    lead_record['physicalDamage'] = openai_data['physical_damage']
                if openai_data.get('deductible'):
                    lead_record['deductible'] = openai_data['deductible']

                if openai_data.get('key_points'):
                    lead_record['keyPoints'] = openai_data['key_points']

                lead_record['notes'] += "Full company profile extracted. "

            processed_leads.append(lead_record)

            # Small delay to show progress
            time.sleep(0.1)

        # Step 3: Batch insert all leads (90-100%)
        self.update_progress(90, "Saving to Database", f"Inserting {len(processed_leads)} leads...")

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        inserted = 0
        for lead_data in processed_leads:
            try:
                cursor.execute(
                    "INSERT OR REPLACE INTO leads (id, data, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                    (lead_data['id'], json.dumps(lead_data))
                )
                inserted += 1
            except Exception as e:
                print(f"\nError inserting lead {lead_data['id']}: {e}")

        conn.commit()
        conn.close()

        # Complete
        self.update_progress(100, "Complete", f"Imported {inserted} leads")

        print(f"\n✅ Successfully imported {inserted} ViciDial leads!")
        print("=" * 60)

        return {
            "success": True,
            "imported": inserted,
            "scanned": len(all_leads),
            "message": f"Successfully imported {inserted} ViciDial leads"
        }

def main():
    sync = FreshViciDialSync()
    result = sync.sync_all_leads()

    # Output JSON result
    print(json.dumps(result))

    # Keep progress file for 5 seconds so frontend can read final status
    # The backend server will clean it up on next sync
    # (Don't delete immediately - let frontend see 100% completion)

    return result

if __name__ == "__main__":
    main()