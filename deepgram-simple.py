#!/usr/bin/env python3
"""
Simple Deepgram transcription for Vanguard
"""

import requests
import json
import time
import os

DEEPGRAM_API_KEY = os.environ.get("DEEPGRAM_API_KEY", "")

def transcribe_with_deepgram(audio_file_path):
    """Transcribe audio using Deepgram REST API"""

    print(f"Transcribing: {audio_file_path}")
    start_time = time.time()

    # Deepgram API endpoint
    url = "https://api.deepgram.com/v1/listen"

    # Headers
    headers = {
        "Authorization": f"Token {DEEPGRAM_API_KEY}",
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
        with open(audio_file_path, 'rb') as audio_file:
            audio_data = audio_file.read()

        # Make request to Deepgram
        response = requests.post(url, headers=headers, params=params, data=audio_data)

        if response.status_code == 200:
            result = response.json()

            # Extract transcript
            transcript = result['results']['channels'][0]['alternatives'][0]['transcript']

            # Extract speaker-labeled text if available
            words = result['results']['channels'][0]['alternatives'][0].get('words', [])

            # Format with speaker labels
            formatted_transcript = format_with_speakers(words, transcript)

            elapsed = time.time() - start_time

            # Get metadata
            metadata = result.get('metadata', {})
            duration = metadata.get('duration', 0)

            print(f"✓ Transcribed in {elapsed:.1f} seconds")
            print(f"  Audio duration: {duration:.1f} seconds")
            print(f"  Speed: {duration/elapsed:.1f}x realtime")

            return {
                "transcript": formatted_transcript if formatted_transcript else transcript,
                "raw_transcript": transcript,
                "duration": duration,
                "processing_time": elapsed,
                "confidence": result['results']['channels'][0]['alternatives'][0].get('confidence', 0)
            }
        else:
            print(f"✗ Deepgram error: {response.status_code}")
            print(response.text)
            return None

    except Exception as e:
        print(f"✗ Error: {e}")
        return None

def format_with_speakers(words, fallback_transcript):
    """Format transcript with speaker labels"""
    if not words:
        return fallback_transcript

    try:
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

    except Exception as e:
        print(f"Format error: {e}")
        return fallback_transcript

if __name__ == "__main__":
    # Test with sample file
    test_file = "/var/www/vanguard/recordings/lead_88546.mp3"

    if os.path.exists(test_file):
        print(f"\nTesting Deepgram API with: {test_file}")
        print("-" * 60)

        result = transcribe_with_deepgram(test_file)

        if result:
            print("\n📝 Transcript Preview (first 500 chars):")
            print("-" * 60)
            print(result["transcript"][:500] + "...")
            print("\n✅ Deepgram is working!")
            print(f"Full transcript length: {len(result['transcript'])} characters")
    else:
        print(f"Test file not found: {test_file}")