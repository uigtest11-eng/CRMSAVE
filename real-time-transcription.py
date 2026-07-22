#!/usr/bin/env python3
"""
Real-time transcription pipeline for ViciDial recordings
Downloads audio -> Transcribes with Deepgram -> Processes with OpenAI
"""

import requests
from bs4 import BeautifulSoup
import urllib3
import os
import json
import sys
import time

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Import OpenAI processor
sys.path.insert(0, '/var/www/vanguard')
try:
    exec(open('/var/www/vanguard/openai-processor.py').read())
except Exception as e:
    print(f"Warning: Could not load OpenAI processor: {e}")
    OpenAIProcessor = None

class RealTimeTranscriber:
    def __init__(self):
        """Initialize transcriber with Deepgram"""
        print("Initializing real-time transcriber with Deepgram...")

        # Deepgram API key from environment
        self.deepgram_api_key = os.environ.get("DEEPGRAM_API_KEY", "")

        # Initialize OpenAI processor for data extraction
        self.openai = OpenAIProcessor() if OpenAIProcessor else None

        # ViciDial credentials from environment
        self.vicidial_host = os.environ.get("VICIDIAL_HOST", "204.13.233.29")
        self.vicidial_username = os.environ.get("VICIDIAL_USER", "")
        self.vicidial_password = os.environ.get("VICIDIAL_PASS", "")

        # Setup session
        self.session = requests.Session()
        self.session.auth = requests.auth.HTTPBasicAuth(self.vicidial_username, self.vicidial_password)
        self.session.verify = False

        # Create directories
        os.makedirs('/var/www/vanguard/recordings', exist_ok=True)
        os.makedirs('/var/www/vanguard/transcriptions', exist_ok=True)

    def get_recording_url(self, lead_id, list_id='1000'):
        """Get recording URL for a lead from ViciDial"""
        print(f"  Finding recording for lead {lead_id}...")

        url = f"https://{self.vicidial_host}/vicidial/admin_modify_lead.php"
        params = {
            'lead_id': lead_id,
            'list_id': list_id,
            'DB': ''
        }

        try:
            response = self.session.get(url, params=params, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')

                # Look for recording links
                for link in soup.find_all('a'):
                    href = link.get('href', '')
                    if '/RECORDINGS/' in href and '.mp3' in href:
                        if href.startswith('http'):
                            return href
                        else:
                            return f"http://{self.vicidial_host}{href}"

                # Search in page text
                import re
                matches = re.findall(r'(https?://[^"\s]+/RECORDINGS/[^"\s]+\.mp3)', response.text)
                if matches:
                    return matches[0]
        except Exception as e:
            print(f"    Error: {e}")

        return None

    def download_audio(self, recording_url, lead_id):
        """Download MP3 recording"""
        print(f"  Downloading audio...")

        try:
            response = self.session.get(recording_url, stream=True, timeout=30)

            if response.status_code == 200:
                filename = f'/var/www/vanguard/recordings/lead_{lead_id}.mp3'

                with open(filename, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)

                file_size = os.path.getsize(filename)
                print(f"    Downloaded: {file_size:,} bytes")
                return filename
        except Exception as e:
            print(f"    Download error: {e}")

        return None

    def transcribe_audio(self, audio_file):
        """Transcribe audio using Deepgram API"""
        print(f"  Transcribing with Deepgram API...")

        start_time = time.time()

        # Deepgram API endpoint
        url = "https://api.deepgram.com/v1/listen"

        # Headers
        headers = {
            "Authorization": f"Token {self.deepgram_api_key}",
            "Content-Type": "audio/mpeg"
        }

        # Parameters for transcription
        params = {
            "model": "nova-2",
            "language": "en-US",
            "smart_format": "true",
            "diarize": "true",  # Speaker identification
            "punctuate": "true",
            "numerals": "true",
            "utterances": "true"
        }

        try:
            # Read audio file
            with open(audio_file, 'rb') as audio:
                audio_data = audio.read()

            # Make request to Deepgram
            response = requests.post(url, headers=headers, params=params, data=audio_data)

            if response.status_code == 200:
                result = response.json()

                # Extract transcript with speaker labels
                words = result['results']['channels'][0]['alternatives'][0].get('words', [])
                transcript = result['results']['channels'][0]['alternatives'][0]['transcript']

                # Format with speaker labels if available
                if words:
                    transcription_text = self.format_with_speakers(words)
                else:
                    transcription_text = transcript

                # Save raw transcription
                lead_id = os.path.basename(audio_file).replace('lead_', '').replace('.mp3', '')
                transcription_file = f'/var/www/vanguard/transcriptions/lead_{lead_id}_raw.txt'

                with open(transcription_file, 'w') as f:
                    f.write(transcription_text)

                elapsed = time.time() - start_time
                duration = result.get('metadata', {}).get('duration', 0)
                print(f"    Transcribed: {len(transcription_text)} characters in {elapsed:.1f} seconds (Deepgram)")
                print(f"    Speed: {duration/elapsed:.1f}x realtime")
                return transcription_text
            else:
                print(f"    Deepgram error: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            print(f"    Transcription error: {e}")
            return None

    def format_with_speakers(self, words):
        """Format transcript with speaker labels"""
        lines = []
        current_speaker = None
        current_text = []

        for word in words:
            speaker = word.get('speaker', 0)

            if speaker != current_speaker:
                # Save previous speaker's text
                if current_text:
                    speaker_label = "Agent" if current_speaker == 0 else "Customer"
                    lines.append(f"{speaker_label}: {' '.join(current_text)}")

                # Start new speaker
                current_speaker = speaker
                current_text = [word.get('punctuated_word', word.get('word', ''))]
            else:
                current_text.append(word.get('punctuated_word', word.get('word', '')))

        # Add last speaker's text
        if current_text:
            speaker_label = "Agent" if current_speaker == 0 else "Customer"
            lines.append(f"{speaker_label}: {' '.join(current_text)}")

        return '\n'.join(lines)

    def process_with_openai(self, transcription, lead_info):
        """Process transcription with OpenAI"""
        if not self.openai:
            print(f"  OpenAI not available")
            return None

        print(f"  Processing with OpenAI...")

        try:
            result = self.openai.process_transcription(transcription, lead_info)

            if result['success']:
                print(f"    Extracted: {len(result['data'])} fields")

                # Save processed data
                lead_id = lead_info.get('lead_id', 'unknown')
                processed_file = f'/var/www/vanguard/transcriptions/lead_{lead_id}_processed.json'

                with open(processed_file, 'w') as f:
                    json.dump(result['data'], f, indent=2)

                return result['data']
            else:
                print(f"    OpenAI error: {result.get('error', 'Unknown')}")

        except Exception as e:
            print(f"    Processing error: {e}")

        return None

    def format_transcription(self, raw_text, openai_data=None):
        """Format transcription for display"""

        # Use OpenAI formatted version if available
        if openai_data and openai_data.get('formatted_conversation'):
            formatted = openai_data['formatted_conversation']

            # Clean up formatting
            lines = formatted.split('\n')
            cleaned = []

            for line in lines:
                line = line.strip()
                if line:
                    # Ensure proper Agent:/Customer: format
                    if line.lower().startswith('agent:'):
                        line = 'Agent: ' + line[6:].strip()
                    elif line.lower().startswith('customer:'):
                        line = 'Customer: ' + line[9:].strip()
                    cleaned.append(line)

            return '\n'.join(cleaned)

        # Fallback: Simple formatting
        sentences = raw_text.replace('. ', '.|').split('|')
        formatted = []
        is_agent = True

        for sentence in sentences:
            sentence = sentence.strip()
            if sentence:
                speaker = "Agent" if is_agent else "Customer"
                formatted.append(f"{speaker}: {sentence}")

                # Switch speaker on questions
                if '?' in sentence:
                    is_agent = not is_agent

        return '\n'.join(formatted)

    def process_lead(self, lead_id, lead_info=None):
        """Complete pipeline for a single lead"""
        print(f"\n=== Processing Lead {lead_id} ===")

        # Step 1: Get recording URL
        recording_url = self.get_recording_url(lead_id, lead_info.get('list_id', '1000') if lead_info else '1000')

        if not recording_url:
            print("  No recording found")
            return None

        print(f"  Recording URL: {recording_url}")

        # Step 2: Download audio
        audio_file = self.download_audio(recording_url, lead_id)

        if not audio_file:
            print("  Failed to download audio")
            return None

        # Step 3: Transcribe audio
        raw_transcription = self.transcribe_audio(audio_file)

        if not raw_transcription:
            print("  Failed to transcribe")
            return None

        # Step 4: Process with OpenAI
        openai_data = self.process_with_openai(raw_transcription, lead_info)

        # Step 5: Format transcription
        formatted_transcription = self.format_transcription(raw_transcription, openai_data)

        # Prepare result
        result = {
            'lead_id': lead_id,
            'recording_url': recording_url,
            'audio_file': audio_file,
            'raw_transcription': raw_transcription,
            'formatted_transcription': formatted_transcription,
            'openai_data': openai_data,
            'timestamp': time.time()
        }

        # Save complete result
        result_file = f'/var/www/vanguard/transcriptions/lead_{lead_id}_complete.json'
        with open(result_file, 'w') as f:
            json.dump(result, f, indent=2)

        print(f"  ✅ Complete! Saved to {result_file}")

        return result


def test_single_lead():
    """Test with a single lead"""

    transcriber = RealTimeTranscriber()

    # Test with lead 88546
    lead_info = {
        'lead_id': '88546',
        'list_id': '1000',
        'phone': '4195600189',
        'full_name': 'CHRISTOPHER STEVENS',
        'city': 'TOLEDO',
        'vendor_code': '3481784'
    }

    result = transcriber.process_lead('88546', lead_info)

    if result:
        print("\n=== TRANSCRIPTION RESULT ===")
        print(result['formatted_transcription'][:500] + "...")

        if result['openai_data']:
            print("\n=== EXTRACTED DATA ===")
            data = result['openai_data']
            print(f"Customer: {data.get('customer_name')}")
            print(f"Business: {data.get('business_name')}")
            print(f"Current Premium: ${data.get('current_premium')}")
            print(f"Quoted Premium: ${data.get('quoted_premium')}")
            print(f"Savings: ${data.get('savings')}")


if __name__ == "__main__":
    test_single_lead()