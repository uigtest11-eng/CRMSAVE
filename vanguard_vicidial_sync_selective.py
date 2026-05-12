#!/usr/bin/env python3
"""
ViciDial Selective Sync - Import specific lead IDs with full premium/insurance extraction
"""

import sys
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

class VanguardViciDialSelectiveSync:
    def __init__(self):
        self.session = requests.Session()
        self.session.auth = requests.auth.HTTPBasicAuth(USERNAME, PASSWORD)
        self.session.verify = False
        self.db = sqlite3.connect(DB_PATH)

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
        details = {}

        # Look for comments/notes
        for textarea in soup.find_all('textarea'):
            if 'comments' in str(textarea.get('name', '')).lower():
                details['comments'] = textarea.text.strip()

        # Extract any custom fields including address3 (renewal date) and list_id
        for input_field in soup.find_all('input'):
            name = input_field.get('name', '')
            value = input_field.get('value', '')
            if name and value:
                details[name] = value
                # Specifically capture address3 for renewal date
                if name.lower() == 'address3':
                    details['address3'] = value.strip()
                    logger.info(f"Found renewal date in address3: {value}")
                # Capture list_id from the form
                if name.lower() == 'list_id':
                    details['list_id'] = value.strip()
                    logger.info(f"✅ Found list ID: {value}")

        # Also try to extract list_id from URL parameters or page content
        if 'list_id' not in details:
            import re
            # Look for list_id in hidden inputs or other form elements
            list_id_patterns = [
                r'name=["\']list_id["\'][^>]*value=["\'](\d+)["\']',
                r'value=["\'](\d+)["\'][^>]*name=["\']list_id["\']',
                r'List\s*(?:ID|#):\s*(\d+)',
                r'list_id["\']?\s*[:=]\s*["\']?(\d+)',
                r'<input[^>]*list_id[^>]*value=["\'](\d+)["\']'
            ]

            for pattern in list_id_patterns:
                matches = re.search(pattern, response.text, re.IGNORECASE)
                if matches:
                    details['list_id'] = matches.group(1).strip()
                    logger.info(f"✅ Found list ID with pattern: {details['list_id']}")
                    break

        # Extract recording URL from the page
        recording_url = self.extract_recording_url(response.text)
        if recording_url:
            details['recording_url'] = recording_url
            logger.info(f"✅ Found recording URL: {recording_url}")

        # Extract call duration and timestamp information
        call_info = self.extract_call_info(response.text, lead_id)
        if call_info['call_duration'] or call_info['call_timestamp']:
            details.update(call_info)
            logger.info(f"✅ Found call info: duration={call_info['call_duration']}, timestamp={call_info['call_timestamp']}")

        return details

    def extract_recording_url(self, page_html):
        """Extract recording URL from ViciDial lead page HTML"""
        import re

        # Pattern 1: Look for href links to recording files
        recording_pattern = r'href="(http[^"]*RECORDINGS[^"]*\.(?:mp3|wav))"'
        matches = re.findall(recording_pattern, page_html, re.IGNORECASE)

        if matches:
            return matches[0]  # Take the first recording found

        # Pattern 2: Look for audio source tags
        source_pattern = r'src\s*=\s*[\'"]([^"\']*RECORDINGS[^"\']*\.(?:mp3|wav))[\'"]'
        source_matches = re.findall(source_pattern, page_html, re.IGNORECASE)

        if source_matches:
            recording_url = source_matches[0]
            if not recording_url.startswith('http'):
                recording_url = f"http://{VICIDIAL_HOST}{recording_url}"
            return recording_url

        # Pattern 3: Look for any RECORDINGS URLs in the text
        general_pattern = r'(http://[^"\s]*RECORDINGS[^"\s]*\.(?:mp3|wav))'
        general_matches = re.findall(general_pattern, page_html, re.IGNORECASE)

        if general_matches:
            return general_matches[0]

        return None

    def download_recording(self, recording_url, lead_id):
        """Download recording and save to local storage"""
        try:
            import os

            # Create recordings directory
            recordings_dir = '/var/www/vanguard/recordings'
            os.makedirs(recordings_dir, exist_ok=True)

            # Download the recording
            response = self.session.get(recording_url, stream=True, timeout=30)
            if response.status_code == 200:
                # Determine file extension
                file_ext = '.mp3' if '.mp3' in recording_url.lower() else '.wav'
                local_filename = f"recording_{lead_id}{file_ext}"
                local_path = os.path.join(recordings_dir, local_filename)

                # Save the file
                with open(local_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)

                # Verify file was downloaded
                if os.path.exists(local_path) and os.path.getsize(local_path) > 1000:
                    logger.info(f"✅ Recording downloaded: {local_filename}")
                    return f"/recordings/{local_filename}"  # Return web-accessible path
                else:
                    logger.warning(f"⚠️ Downloaded recording is too small or empty")
                    return None
            else:
                logger.warning(f"⚠️ Failed to download recording: HTTP {response.status_code}")
                return None

        except Exception as e:
            logger.warning(f"⚠️ Error downloading recording: {str(e)[:50]}")
            return None

    def extract_call_info(self, page_html, lead_id=None):
        """Enhanced call duration extraction with improved reliability"""
        import re
        import os
        import subprocess
        from bs4 import BeautifulSoup

        call_info = {
            'call_duration': None,
            'call_timestamp': None,
            'talk_time': None,
            'extraction_method': None
        }

        try:
            # STRATEGY 1: Parse HTML with BeautifulSoup for better structure understanding
            soup = BeautifulSoup(page_html, 'html.parser')

            # Look for RECORDINGS section specifically
            recordings_markers = soup.find_all(string=re.compile(r"RECORDINGS FOR THIS LEAD", re.IGNORECASE))

            if recordings_markers:
                logger.info(f"🎬 Found RECORDINGS markers: {len(recordings_markers)}")

                # Get the parent elements and find nearby table data
                for marker in recordings_markers:
                    parent = marker.parent

                    # Look for the next table after this marker
                    table = parent.find_next('table')
                    if table:
                        logger.info("📊 Found table after RECORDINGS marker")

                        # Look for rows with numeric data that could be call duration
                        rows = table.find_all('tr')

                        for i, row in enumerate(rows):
                            cells = row.find_all(['td', 'th'])

                            # Look for header row first to understand structure
                            if any('SECONDS' in cell.get_text().upper() for cell in cells):
                                logger.info(f"🎯 Found SECONDS header in row {i}")

                                # The next data row should contain the actual duration
                                if i + 1 < len(rows):
                                    data_row = rows[i + 1]
                                    data_cells = data_row.find_all(['td', 'th'])

                                    # Find the cell that corresponds to SECONDS column
                                    seconds_col_index = None
                                    for idx, cell in enumerate(cells):
                                        if 'SECONDS' in cell.get_text().upper():
                                            seconds_col_index = idx
                                            break

                                    if seconds_col_index is not None and seconds_col_index < len(data_cells):
                                        seconds_text = data_cells[seconds_col_index].get_text().strip()

                                        # Extract numeric value
                                        seconds_match = re.search(r'(\d{1,4})', seconds_text)
                                        if seconds_match:
                                            seconds = int(seconds_match.group(1))

                                            if 1 <= seconds <= 3600:  # Reasonable bounds
                                                call_info['call_duration'] = self.format_duration(seconds)
                                                call_info['talk_time'] = self.format_talk_time(seconds)
                                                call_info['extraction_method'] = 'HTML_TABLE_SECONDS_COLUMN'
                                                logger.info(f"✅ Method 1 (Table SECONDS): {call_info['talk_time']} ({seconds}s)")
                                                return self.add_timestamp(call_info, page_html)

            # STRATEGY 2: Enhanced regex patterns with better structure awareness
            if not call_info['call_duration']:
                logger.info("🔍 Trying enhanced regex patterns...")

                # More specific patterns for ViciDial RECORDINGS section
                enhanced_patterns = [
                    # Pattern 1: Full RECORDINGS table structure
                    r'(?s)RECORDINGS FOR THIS LEAD:.*?SECONDS.*?<tr[^>]*>.*?<td[^>]*>\s*\d+\s*</td>.*?<td[^>]*>[^<]*</td>.*?<td[^>]*>[^<]*</td>.*?<td[^>]*>\s*(\d{1,4})\s*</td>',

                    # Pattern 2: Any SECONDS cell after RECORDINGS marker
                    r'(?s)RECORDINGS FOR THIS LEAD:.*?SECONDS.*?<td[^>]*>\s*(\d{1,4})\s*</td>',

                    # Pattern 3: Look for patterns like "123 seconds" or "123s" after RECORDINGS
                    r'(?s)RECORDINGS FOR THIS LEAD:.*?(\d{1,4})\s*(?:seconds?|sec|s)\b',

                    # Pattern 4: Numeric value followed by recording ID pattern
                    r'(?s)RECORDINGS FOR THIS LEAD:.*?(\d{1,4})\s+\d{6,}\s+',

                    # Pattern 5: Time duration in table cell format
                    r'<td[^>]*>\s*(\d{2,4})\s*</td>',

                    # Pattern 6: Look for time patterns anywhere
                    r'\b(\d{1,4})\s*(?:seconds?|sec)\b',
                ]

                for i, pattern in enumerate(enhanced_patterns, 1):
                    matches = re.findall(pattern, page_html, re.IGNORECASE)

                    for match in matches:
                        try:
                            seconds = int(match if isinstance(match, str) else match[0])

                            # Better bounds checking
                            if 5 <= seconds <= 1800:  # 5 seconds to 30 minutes
                                call_info['call_duration'] = self.format_duration(seconds)
                                call_info['talk_time'] = self.format_talk_time(seconds)
                                call_info['extraction_method'] = f'REGEX_PATTERN_{i}'
                                logger.info(f"✅ Method 2 (Pattern {i}): {call_info['talk_time']} ({seconds}s)")
                                return self.add_timestamp(call_info, page_html)

                        except (ValueError, IndexError):
                            continue

            # STRATEGY 3: Parse raw text for RECORDINGS section
            if not call_info['call_duration']:
                logger.info("🔍 Trying raw text parsing...")

                # Find RECORDINGS section in plain text
                recordings_match = re.search(r'RECORDINGS FOR THIS LEAD:(.*?)(?:\n\n|\n[A-Z]|$)', page_html, re.DOTALL)

                if recordings_match:
                    recordings_section = recordings_match.group(1)
                    logger.info(f"📋 RECORDINGS section found: {recordings_section[:200]}...")

                    # Look for numeric patterns in the recordings section
                    # ViciDial format is typically: LEAD_ID DATE/TIME SECONDS RECORDING_ID
                    lines = recordings_section.strip().split('\n')

                    for line in lines:
                        line = line.strip()
                        if line and not 'SECONDS' in line.upper():  # Skip header
                            # Look for pattern: numbers, datetime, seconds, recording_id
                            parts = line.split()

                            for part in parts:
                                if part.isdigit():
                                    seconds = int(part)
                                    # If it's a reasonable call duration (not a date/ID)
                                    if 5 <= seconds <= 1800:
                                        call_info['call_duration'] = self.format_duration(seconds)
                                        call_info['talk_time'] = self.format_talk_time(seconds)
                                        call_info['extraction_method'] = 'RAW_TEXT_PARSING'
                                        logger.info(f"✅ Method 3 (Raw Text): {call_info['talk_time']} ({seconds}s)")
                                        return self.add_timestamp(call_info, page_html)

            # STRATEGY 4: Recording file duration fallback (if file exists)
            if not call_info['call_duration'] and lead_id:
                logger.info("🎵 Trying recording file duration...")

                recording_paths = [
                    f"/var/www/vanguard/recordings/recording_{lead_id}.mp3",
                    f"/var/www/vanguard/recordings/recording_8{lead_id}.mp3"
                ]

                for recording_path in recording_paths:
                    if os.path.exists(recording_path):
                        try:
                            result = subprocess.run([
                                'ffprobe', '-v', 'quiet', '-show_entries',
                                'format=duration', '-of', 'csv=p=0', recording_path
                            ], capture_output=True, text=True, timeout=10)

                            if result.returncode == 0 and result.stdout.strip():
                                duration_seconds = int(float(result.stdout.strip()))

                                call_info['call_duration'] = self.format_duration(duration_seconds)
                                call_info['talk_time'] = self.format_talk_time(duration_seconds)
                                call_info['extraction_method'] = 'RECORDING_FILE_FFPROBE'
                                logger.info(f"✅ Method 4 (File): {call_info['talk_time']} ({duration_seconds}s)")
                                return self.add_timestamp(call_info, page_html)

                        except Exception as e:
                            logger.warning(f"⚠️ ffprobe error for {recording_path}: {e}")

            # STRATEGY 5: Last resort - look for any reasonable numbers
            if not call_info['call_duration']:
                logger.info("🔍 Last resort: scanning all numbers...")

                # Find all numbers in the page
                all_numbers = re.findall(r'\b(\d{1,4})\b', page_html)

                # Sort by value (longer calls more likely to be real)
                valid_numbers = []
                for num_str in all_numbers:
                    num = int(num_str)
                    if 30 <= num <= 1800:  # 30 seconds to 30 minutes
                        valid_numbers.append(num)

                if valid_numbers:
                    # Take the longest reasonable duration
                    valid_numbers.sort(reverse=True)
                    seconds = valid_numbers[0]

                    call_info['call_duration'] = self.format_duration(seconds)
                    call_info['talk_time'] = self.format_talk_time(seconds)
                    call_info['extraction_method'] = 'LAST_RESORT_LONGEST'
                    logger.info(f"✅ Method 5 (Last Resort): {call_info['talk_time']} ({seconds}s)")
                    return self.add_timestamp(call_info, page_html)

            logger.warning("❌ No call duration found with any method")

        except Exception as e:
            logger.error(f"❌ Error in enhanced call duration extraction: {e}")

        return self.add_timestamp(call_info, page_html)

    def format_duration(self, seconds):
        """Format seconds into MM:SS format"""
        if seconds <= 0:
            return "0:00"

        minutes = seconds // 60
        remaining_seconds = seconds % 60
        return f"{minutes}:{remaining_seconds:02d}"

    def format_talk_time(self, seconds):
        """Format seconds into human readable format"""
        if seconds <= 0:
            return "0 sec"

        if seconds < 60:
            return f"{seconds} sec"

        minutes = seconds // 60
        remaining_seconds = seconds % 60

        if remaining_seconds == 0:
            return f"{minutes} min"
        else:
            return f"{minutes} min {remaining_seconds} sec"

    def add_timestamp(self, call_info, page_html):
        """Add timestamp extraction to call_info"""

        # Pattern 2: Look for call timestamp
        timestamp_patterns = [
            r'Call\s*Time:\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})',
            r'Start\s*Time:\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})',
            r'call_date[^>]*>([^<]+)<',
            r'start_epoch[^>]*>(\d+)<',
            r'(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})',  # Generic datetime format
            r'(\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2}:\d{2})',  # MM/DD/YYYY format
        ]

        for pattern in timestamp_patterns:
            matches = re.findall(pattern, page_html, re.IGNORECASE)
            if matches:
                call_info['call_timestamp'] = matches[0]
                logger.info(f"✅ Found call timestamp: {call_info['call_timestamp']}")
                break

        return call_info

    def create_auto_call_log(self, lead_data, call_info):
        """Create an automatic call log entry from ViciDial call information"""
        if not call_info.get('call_duration') and not call_info.get('call_timestamp'):
            return lead_data

        # Initialize reachOut structure if it doesn't exist
        if 'reachOut' not in lead_data:
            lead_data['reachOut'] = {
                'contacted': False,
                'completedAt': None,
                'reachOutCompletedAt': None,
                'callLogs': []
            }

        if 'callLogs' not in lead_data['reachOut']:
            lead_data['reachOut']['callLogs'] = []

        # Create call log entry
        call_log = {
            'timestamp': call_info.get('call_timestamp') or datetime.now().isoformat(),
            'connected': True,  # Assume connected since we have a recording
            'duration': call_info.get('talk_time') or call_info.get('call_duration') or 'Unknown',
            'leftVoicemail': False,
            'notes': f"ViciDial Call - Duration: {call_info.get('talk_time') or 'Unknown'}"
        }

        # Add the call log
        lead_data['reachOut']['callLogs'].append(call_log)

        # Mark as contacted if we have call information
        lead_data['reachOut']['contacted'] = True

        logger.info(f"✅ Created automatic call log for lead {lead_data['name']}: {call_log['duration']}")
        return lead_data

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
        fleet_patterns = [
            # NEW FORMAT: "Fl: 2" pattern (highest priority)
            r'Fl:\s*(\d+)',  # NEW: "Fl: 2" pattern for newest ViciDial format
            r'Dr:\s*\d+\s*\|\s*Fl:\s*(\d+)',  # NEW: "Dr: 2 | Fl: 2" combined pattern
            # OLD FORMAT: "Size:" patterns
            r'Size:\s*(\d+)',  # "Size: 10" pattern for previous ViciDial format
            r'Insurance Expires:.*?\|\s*Fleet Size:?\s*(\d+)',  # Original pattern
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

    def parse_enhanced_comments(self, comments):
        """Parse enhanced comments format to extract owner name, lead stage, and callback info"""
        parsed_info = {
            'owner_name': '',
            'lead_stage': 'new',
            'callback_date': '',
            'callback_time': '',
            'stage_selections': {}
        }

        if not comments:
            return parsed_info

        logger.info(f"🔍 Parsing enhanced comments: {comments[:200]}...")

        try:
            # Extract owner name from Name section
            name_match = re.search(r'------------Name--------------\s*\n\s*([^\n\r-]+)', comments, re.IGNORECASE | re.MULTILINE)
            if name_match:
                parsed_info['owner_name'] = name_match.group(1).strip()
                logger.info(f"✅ Owner name extracted: '{parsed_info['owner_name']}'")

            # Extract stage selections and determine current stage - updated for new format
            # Check for Custom stage first (Custom: followed by non-empty text)
            custom_match = re.search(r'Custom:\s*(.+)', comments, re.IGNORECASE)
            if custom_match and custom_match.group(1).strip():
                custom_text = custom_match.group(1).strip()
                parsed_info['stage_selections']['custom'] = True
                parsed_info['lead_stage'] = custom_text
                logger.info(f"✅ Custom stage detected: '{custom_text}'")

            stage_patterns = [
                # Try new format first
                ('new', r'New:\s*([Xx])', 'new'),
                ('info_requested', r'LR Req:\s*([Xx])', 'info_requested'),
                ('loss_runs_requested', r'LR Req:\s*([Xx])', 'loss_runs_requested'),  # Same as info_requested in new format
                ('loss_runs_received', r'LR Rec:\s*([Xx])', 'loss_runs_received'),
                # Fallback to old format
                ('info_requested_old', r'Info Requested:\s*([Xx])', 'info_requested'),
                ('loss_runs_requested_old', r'Loss Runs Requested:\s*([Xx])', 'loss_runs_requested'),
                ('loss_runs_received_old', r'Loss Runs Received:\s*([Xx])', 'loss_runs_received')
            ]

            for stage_key, pattern, stage_value in stage_patterns:
                if re.search(pattern, comments, re.IGNORECASE):
                    parsed_info['stage_selections'][stage_key] = True
                    # Only override if no custom stage was already set
                    if 'custom' not in parsed_info['stage_selections']:
                        parsed_info['lead_stage'] = stage_value
                    logger.info(f"✅ Stage detected: {stage_value}")

            # Extract callback information - updated for new format
            # Try new format first: "NEXT CALL\nDate: MM/DD/YYYY Time: HH:MMAM/PM"
            callback_match = re.search(r'NEXT CALL\s*\n\s*Date:\s*([^\s]+)\s+Time:\s*([^\n\r]+)', comments, re.IGNORECASE | re.MULTILINE)

            # Fallback to old format: "--scheduled next call---------\nDate: MM/DD/YYYY Time: HH:MMAM/PM"
            if not callback_match:
                callback_match = re.search(r'--scheduled next call-+\s*\n\s*Date:\s*([^\s]+)\s+Time:\s*([^\n\r]+)', comments, re.IGNORECASE | re.MULTILINE)
            if callback_match:
                parsed_info['callback_date'] = callback_match.group(1).strip()
                parsed_info['callback_time'] = callback_match.group(2).strip()
                logger.info(f"✅ Callback scheduled: {parsed_info['callback_date']} at {parsed_info['callback_time']}")

                # Compute highlight expiry timestamp from callback date/time
                try:
                    from datetime import datetime
                    # Parse callback date: 01/27/2026
                    callback_date_str = parsed_info['callback_date']
                    callback_time_str = parsed_info['callback_time']

                    # Convert time format: 10:00AM -> 10:00 AM
                    callback_time_str = re.sub(r'(\d+:\d+)([AP]M)', r'\1 \2', callback_time_str.upper())

                    # Combine date and time: "01/27/2026 10:00 AM"
                    callback_datetime_str = f"{callback_date_str} {callback_time_str}"

                    # Parse the combined datetime string
                    callback_datetime = datetime.strptime(callback_datetime_str, "%m/%d/%Y %I:%M %p")

                    # Convert to ISO format for storage (local time, not UTC)
                    parsed_info['callback_datetime_iso'] = callback_datetime.isoformat()
                    parsed_info['has_callback'] = True

                    logger.info(f"✅ Callback datetime computed: {parsed_info['callback_datetime_iso']}")

                except Exception as e:
                    logger.warning(f"⚠️ Error parsing callback datetime '{callback_date_str} {callback_time_str}': {e}")
                    parsed_info['has_callback'] = False
            else:
                parsed_info['has_callback'] = False

        except Exception as e:
            logger.warning(f"⚠️ Error parsing enhanced comments: {e}")

        return parsed_info

    def create_callback_record(self, lead_id, enhanced_info, lead_name):
        """Create a callback record in the database for ViciDial scheduled callbacks"""
        try:
            callback_datetime = enhanced_info.get('callback_datetime_iso')
            callback_date = enhanced_info.get('callback_date')
            callback_time = enhanced_info.get('callback_time')

            if not callback_datetime:
                logger.warning(f"⚠️ Cannot create callback record for {lead_name}: missing callback datetime")
                return False

            # Generate unique callback ID
            import time, random
            callback_id = str(int(time.time() * 1000) + random.randint(1, 999))

            # Create callback data
            callback_data = {
                'id': callback_id,
                'dateTime': callback_datetime,
                'notes': f'Scheduled callback imported from ViciDial - {lead_name} (Original: {callback_date} at {callback_time})',
                'completed': False,
                'importedFromVicidial': True,
                'originalComments': f'Date: {callback_date} Time: {callback_time}',
                'leadId': lead_id,
                'leadName': lead_name,
                'createdAt': datetime.now().isoformat() + 'Z'
            }

            # Insert callback into database
            cursor = self.db.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO scheduled_callbacks (
                    callback_id, lead_id, date_time, notes, completed, created_at
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (
                callback_id,
                lead_id,
                callback_datetime,
                callback_data['notes'],
                0,  # completed = False
                callback_data['createdAt']
            ))

            self.db.commit()
            logger.info(f"📅 VICIDIAL CALLBACK: Created callback record {callback_id} for {lead_name} at {callback_datetime}")
            return True

        except Exception as e:
            logger.error(f"❌ Error creating callback record for {lead_name}: {e}")
            return False

    def format_phone(self, phone):
        """Format phone number consistently"""
        if not phone:
            return ""

        # Remove all non-numeric characters
        digits = re.sub(r'\D', '', phone)

        # Format as (XXX) XXX-XXXX if we have 10 digits
        if len(digits) == 10:
            return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
        elif len(digits) == 11 and digits[0] == '1':
            # Remove leading 1
            return f"({digits[1:4]}) {digits[4:7]}-{digits[7:]}"
        else:
            return phone

    def format_renewal_date(self, raw_date):
        """Format renewal date to M/D/YYYY format"""
        if not raw_date:
            return ""

        # Handle YYYY-MM-DD format (common in ViciDial)
        yyyy_mm_dd = re.match(r'(\d{4})-(\d{1,2})-(\d{1,2})', raw_date)
        if yyyy_mm_dd:
            year, month, day = yyyy_mm_dd.groups()
            formatted = f"{int(month)}/{int(day)}/{year}"
            logger.info(f"YYYY-MM-DD format detected: '{raw_date}' -> '{formatted}'")
            return formatted

        # Handle MM/DD/YYYY format (already correct)
        mm_dd_yyyy = re.match(r'(\d{1,2})/(\d{1,2})/(\d{4})', raw_date)
        if mm_dd_yyyy:
            return raw_date

        # Try to handle other formats with month names
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

    def get_assigned_agent_from_list(self, list_id):
        """Get assigned agent based on list ID"""
        list_agent_mapping = {
            '998': 'Hunter',    # OH Hunter
            '999': 'Hunter',    # TX Hunter
            '1000': 'Hunter',   # IN Hunter
            '1001': 'Grant',    # OH Grant
            '1005': 'Grant',    # TX Grant
            '1006': 'Grant',    # IN Grant
            '1007': 'Carson',   # OH Carson
            '1008': 'Carson',   # TX Carson
            '1009': 'Carson'    # IN Carson
        }
        return list_agent_mapping.get(list_id, 'Unassigned')

    def save_lead(self, lead_data):
        """Save lead to database, merging with existing data to preserve user-managed fields"""
        cursor = self.db.cursor()

        # Validate lead ID before saving
        lead_id = lead_data.get('id')
        if not lead_id or str(lead_id).strip() == '' or str(lead_id) == 'undefined':
            logger.error(f"🚫 Cannot save lead with invalid ID: {lead_id} (name: {lead_data.get('name', 'Unknown')})")
            return False

        try:
            # Skip permanently deleted leads
            cursor.execute('SELECT id FROM deleted_leads WHERE id = ?', (str(lead_id),))
            if cursor.fetchone():
                logger.info(f"🚫 Skipping permanently deleted lead: {lead_data.get('name', 'Unknown')} (ID: {lead_id})")
                return False

            # Merge with existing data to preserve user-managed fields
            cursor.execute('SELECT data FROM leads WHERE id = ?', (str(lead_id),))
            existing_row = cursor.fetchone()
            if existing_row:
                try:
                    existing = json.loads(existing_row[0])
                    # Preserve premium if new data has none but existing has a value
                    if not lead_data.get('premium') and existing.get('premium'):
                        lead_data['premium'] = existing['premium']
                        logger.info(f"💰 Preserving existing premium: {existing['premium']}")
                    # Preserve user-managed fields that should never be reset by sync
                    for field in ['stage', 'stageUpdatedAt', 'confirmedPremium', 'priority',
                                  'notes', 'appStage', 'brokerTracking']:
                        if existing.get(field) and not lead_data.get(field):
                            lead_data[field] = existing[field]
                    # Preserve DOT-lookup-populated fields (treat "Unknown" as missing)
                    for dot_field in ['yearsInBusiness', 'commodityHauled', 'vehicles', 'trailers', 'drivers']:
                        existing_val = existing.get(dot_field)
                        if existing_val and existing_val != 'Unknown' and not lead_data.get(dot_field):
                            lead_data[dot_field] = existing_val
                    # Merge reachOut callLogs — keep existing logs, add new ones
                    existing_reach = existing.get('reachOut', {})
                    new_reach = lead_data.get('reachOut', {})
                    existing_logs = existing_reach.get('callLogs', [])
                    new_logs = new_reach.get('callLogs', [])
                    if existing_logs:
                        merged_logs = list(existing_logs)
                        for new_log in new_logs:
                            is_dup = any(
                                l.get('timestamp') == new_log.get('timestamp') or
                                (l.get('notes') == new_log.get('notes') and l.get('notes'))
                                for l in existing_logs
                            )
                            if not is_dup:
                                merged_logs.append(new_log)
                        lead_data['reachOut']['callLogs'] = merged_logs
                        lead_data['reachOut']['callAttempts'] = max(
                            new_reach.get('callAttempts', 0),
                            existing_reach.get('callAttempts', 0),
                            len(merged_logs)
                        )
                        lead_data['reachOut']['callsConnected'] = max(
                            new_reach.get('callsConnected', 0),
                            existing_reach.get('callsConnected', 0),
                            len([l for l in merged_logs if l.get('connected')])
                        )
                        logger.info(f"📞 Merged call logs: {len(existing_logs)} existing + {len(new_logs)} new = {len(merged_logs)} total")
                except Exception as merge_err:
                    logger.warning(f"⚠️ Could not merge existing data: {merge_err}")

            cursor.execute('''
                INSERT OR REPLACE INTO leads (id, data, created_at, updated_at)
                VALUES (?, ?, ?, ?)
            ''', (
                lead_data['id'],
                json.dumps(lead_data),
                datetime.now().isoformat(),
                datetime.now().isoformat()
            ))
            self.db.commit()
            logger.info(f"✅ Saved lead to database: {lead_data['name']} (ID: {lead_data['id']})")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to save lead {lead_data['id']}: {e}")

    def sync_specific_leads(self, lead_ids_with_info):
        """Sync specific leads by ID with full extraction"""
        logger.info(f"🎯 Starting selective sync for {len(lead_ids_with_info)} specific leads...")

        total_imported = 0

        for lead_info in lead_ids_with_info:
            lead_id_raw = lead_info['id']

            # Validate lead ID - skip if invalid
            if lead_id_raw is None or str(lead_id_raw).strip() == '' or str(lead_id_raw) == 'undefined':
                logger.warning(f"🚫 Skipping lead with invalid ID: {lead_id_raw} (name: {lead_info.get('name', 'Unknown')})")
                continue

            # Strip the "8" prefix that the frontend adds to ViciDial IDs
            if str(lead_id_raw).startswith('8') and len(str(lead_id_raw)) > 6:
                lead_id = str(lead_id_raw)[1:]  # Remove first character
                logger.info(f"📋 Processing lead {lead_id_raw} -> {lead_id}: {lead_info.get('name', 'Unknown')}")
            else:
                lead_id = str(lead_id_raw)
                logger.info(f"📋 Processing lead {lead_id}: {lead_info.get('name', 'Unknown')}")

            try:
                # Get detailed information from ViciDial
                lead_details = self.get_lead_details(lead_id)
                if not lead_details:
                    logger.warning(f"⚠️ Could not fetch details for lead {lead_id}")
                    continue

                # Extract policy information from comments
                comments = lead_details.get('comments', '')
                policy_info = self.extract_policy_from_comments(comments)

                # Parse enhanced comments for owner name, stage, and callback info
                enhanced_info = self.parse_enhanced_comments(comments)

                # Extract insurance company from address fields
                insurance_company = ""
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
                for address_field in [address2, address1]:  # Check address2 first as it usually has insurance
                    if address_field:
                        for pattern in insurance_patterns:
                            match = re.search(pattern, address_field, re.I)
                            if match:
                                insurance_company = match.group(1).title()
                                logger.info(f"✓ Insurance company extracted: '{insurance_company}' from address field")
                                break
                        if insurance_company:
                            break

                # Extract renewal date from address3 field
                renewal_date = ""
                if 'address3' in lead_details:
                    raw_renewal = lead_details['address3'].strip()
                    if raw_renewal:
                        renewal_date = self.format_renewal_date(raw_renewal)
                        logger.info(f"Processing renewal date: '{raw_renewal}'")

                # Download recording if available
                recording_path = None
                if 'recording_url' in lead_details:
                    recording_url = lead_details['recording_url']
                    logger.info(f"🎵 Downloading recording from: {recording_url}")
                    recording_path = self.download_recording(recording_url, lead_id_raw)
                    if recording_path:
                        logger.info(f"✅ Recording saved: {recording_path}")
                        # Get actual duration from the downloaded file using ffprobe
                        # (extract_call_info runs before download so Strategy 4 doesn't work first time)
                        if not lead_details.get('call_duration'):
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
                                    lead_details['call_duration'] = self.format_duration(_secs)
                                    lead_details['talk_time'] = self.format_talk_time(_secs)
                                    # Extract timestamp from recording filename (e.g. 20260226-210307_...)
                                    _ts_m = re.search(r'(\d{8})-(\d{6})', recording_url)
                                    if _ts_m and not lead_details.get('call_timestamp'):
                                        try:
                                            _ts = datetime.strptime(
                                                f"{_ts_m.group(1)} {_ts_m.group(2)}", "%Y%m%d %H%M%S"
                                            )
                                            lead_details['call_timestamp'] = _ts.isoformat()
                                        except Exception:
                                            pass
                                    logger.info(f"✅ Got duration from recording file: {lead_details['talk_time']} ({_secs}s)")
                            except Exception as _e:
                                logger.warning(f"⚠️ ffprobe duration extraction failed: {_e}")
                    else:
                        logger.warning(f"⚠️ Failed to download recording")

                # Get assigned agent based on list ID (prefer ViciDial-extracted, fallback to lead_info)
                list_id = lead_details.get('list_id', lead_info.get('listId', ''))
                assigned_agent = self.get_assigned_agent_from_list(list_id)

                # Create lead record
                lead_data = {
                    "id": lead_id_raw,  # Use original ID with prefix for database
                    "name": lead_info.get('name', 'Unknown Company'),
                    "contact": lead_info.get('contact', 'Agent'),
                    "phone": self.format_phone(lead_info.get('phone', '')),
                    "email": lead_info.get('email', ''),
                    "product": "Commercial Auto",
                    "stage": enhanced_info['lead_stage'],  # Use parsed stage from comments
                    "status": "hot_lead",
                    "assignedTo": assigned_agent,
                    "created": datetime.now().strftime("%-m/%-d/%Y"),
                    "lastActivity": datetime.now().isoformat(),
                    "priority": "Mid",
                    "notes": f"Imported from ViciDial (List {list_id}) - Quick Import",
                    "source": "ViciDial",
                    "city": lead_info.get('city', ''),
                    "state": lead_info.get('state', ''),
                    "dotNumber": address1,  # DOT number is in address1
                    "mcNumber": "",
                    "fleetSize": str(policy_info['fleet_size']) if policy_info['fleet_size'] > 0 else '',
                    "premium": str(policy_info['calculated_premium']) if policy_info['calculated_premium'] > 0 else '',
                    "insuranceCompany": insurance_company,
                    "currentCarrier": insurance_company,
                    "renewalDate": renewal_date,
                    "lastCallDate": lead_info.get('lastCallDate', datetime.now().isoformat()),
                    "listId": list_id,
                    "leadStatus": lead_info.get('status', 'SALE'),
                    "recordingPath": recording_path or "",
                    "hasRecording": bool(recording_path),
                    "ownerName": enhanced_info['owner_name'] if enhanced_info['owner_name'] else '',  # Owner name from comments
                }

                # Initialize reachOut structure if it doesn't exist
                if 'reachOut' not in lead_data:
                    lead_data['reachOut'] = {
                        'callAttempts': 0,
                        'callsConnected': 0,
                        'emailCount': 0,
                        'textCount': 0,
                        'voicemailCount': 0,
                        'emailSent': False,
                        'textSent': False,
                        'callMade': False,
                        'contacted': False,
                        'emailConfirmed': False,
                        'reachOutCompletedAt': None,
                        'callLogs': []
                    }

                # Handle callback scheduling for highlight duration and completion
                if enhanced_info.get('has_callback', False):
                    logger.info(f"🎯 Setting up callback-based highlight and completion for lead {lead_id}")

                    # Set highlight duration until callback time
                    lead_data['reachOut']['greenHighlightUntil'] = enhanced_info['callback_datetime_iso']

                    # Mark reach-out as completed since callback is scheduled
                    lead_data['reachOut']['reachOutCompletedAt'] = datetime.now().isoformat() + 'Z'
                    lead_data['reachOut']['completedAt'] = datetime.now().isoformat() + 'Z'
                    lead_data['reachOut']['emailConfirmed'] = True  # Mark as email confirmed since callback was scheduled
                    lead_data['reachOut']['contacted'] = True

                    # CREATE ACTUAL CALLBACK RECORD for the CRM system
                    self.create_callback_record(lead_id, enhanced_info, lead_data['name'])

                    logger.info(f"✅ Callback-based setup complete: highlight until {enhanced_info['callback_datetime_iso']}, marked as completed")
                else:
                    logger.info(f"📅 No callback scheduled for lead {lead_id}, using standard reach-out setup")

                # Create automatic call log from ViciDial call information
                if 'call_duration' in lead_details or 'call_timestamp' in lead_details:
                    call_info = {
                        'call_duration': lead_details.get('call_duration'),
                        'call_timestamp': lead_details.get('call_timestamp'),
                        'talk_time': lead_details.get('talk_time')
                    }
                    lead_data = self.create_auto_call_log(lead_data, call_info)
                else:
                    # SALE leads always had a call — create a call log even without exact duration
                    # (recording_path or no recording_path — doesn't matter, it was a SALE)
                    talk_time_str = lead_details.get('talk_time') or ('Recording available' if recording_path else '< 1 min')
                    call_ts = lead_details.get('call_timestamp') or datetime.now().isoformat()
                    logger.info(f"📞 SALE lead — creating call log (duration not extracted, using '{talk_time_str}')")
                    sale_call_log = {
                        'timestamp': call_ts,
                        'connected': True,
                        'duration': talk_time_str,
                        'leftVoicemail': False,
                        'notes': f'ViciDial SALE call{" — recording available" if recording_path else ""}'
                    }
                    lead_data['reachOut']['callLogs'].append(sale_call_log)
                    lead_data['reachOut']['callAttempts'] = max(lead_data['reachOut'].get('callAttempts', 0), 1)
                    lead_data['reachOut']['callsConnected'] = max(lead_data['reachOut'].get('callsConnected', 0), 1)
                    lead_data['reachOut']['contacted'] = True

                logger.info(f"📋 Final lead data for {lead_data['name']}:")
                logger.info(f"  Fleet Size: {policy_info['fleet_size']}")
                logger.info(f"  Premium: ${policy_info['calculated_premium']:,}")
                logger.info(f"  Insurance: {insurance_company}")
                logger.info(f"  DOT: {address1}")
                if lead_data.get('reachOut', {}).get('callLogs'):
                    logger.info(f"  📞 Call Log: {len(lead_data['reachOut']['callLogs'])} entries")

                # Save to database
                self.save_lead(lead_data)
                total_imported += 1

            except Exception as e:
                logger.error(f"❌ Error processing lead {lead_id}: {e}")

        logger.info(f"✅ Selective sync complete! Imported {total_imported} leads")

        return {
            "success": True,
            "imported": total_imported,
            "message": f"Successfully quick imported {total_imported} leads with premium and insurance data"
        }

def main():
    """Run selective sync with lead IDs from command line"""
    if len(sys.argv) < 2:
        logger.error("Usage: python3 vanguard_vicidial_sync_selective.py '[{\"id\":\"123\", \"name\":\"...\", ...}]'")
        sys.exit(1)

    try:
        selected_leads = json.loads(sys.argv[1])
        sync = VanguardViciDialSelectiveSync()
        result = sync.sync_specific_leads(selected_leads)
        print(json.dumps(result))
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON input: {e}")
        print(json.dumps({"success": False, "error": "Invalid JSON input"}))
    except Exception as e:
        logger.error(f"Sync failed: {e}")
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()