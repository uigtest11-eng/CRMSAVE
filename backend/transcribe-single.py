#!/usr/bin/env python3
"""Transcribe a single audio file using Deepgram REST API and print JSON result."""
import sys
import json
import os
import requests

DEEPGRAM_API_KEY = os.environ.get("DEEPGRAM_API_KEY", "")

def transcribe(audio_path):
    with open(audio_path, 'rb') as f:
        audio_data = f.read()

    url = "https://api.deepgram.com/v1/listen"
    params = {
        "model": "nova-2",
        "language": "en-US",
        "smart_format": "true",
        "diarize": "true",
        "punctuate": "true",
        "utterances": "true",
        "numerals": "true",
    }
    headers = {
        "Authorization": f"Token {DEEPGRAM_API_KEY}",
        "Content-Type": "audio/mpeg",
    }

    resp = requests.post(url, params=params, headers=headers, data=audio_data, timeout=120)
    resp.raise_for_status()
    return resp.json()

def format_transcript(data):
    try:
        words = data["results"]["channels"][0]["alternatives"][0].get("words", [])
        if not words:
            return data["results"]["channels"][0]["alternatives"][0].get("transcript", "")

        lines = []
        current_speaker = None
        current_words = []

        for w in words:
            speaker = w.get("speaker", 0)
            word = w.get("punctuated_word") or w.get("word", "")
            if speaker != current_speaker:
                if current_words:
                    label = "Agent" if current_speaker == 0 else "Customer"
                    lines.append(f"{label}: {' '.join(current_words)}")
                current_speaker = speaker
                current_words = [word]
            else:
                current_words.append(word)

        if current_words:
            label = "Agent" if current_speaker == 0 else "Customer"
            lines.append(f"{label}: {' '.join(current_words)}")

        return "\n".join(lines)
    except (KeyError, IndexError):
        return ""

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No audio file path provided"}))
        sys.exit(1)

    audio_path = sys.argv[1]
    if not os.path.exists(audio_path):
        print(json.dumps({"error": f"File not found: {audio_path}"}))
        sys.exit(1)

    try:
        data = transcribe(audio_path)
        transcript = format_transcript(data)
        # Extract word-level timestamps for frontend sync
        try:
            raw_words = data["results"]["channels"][0]["alternatives"][0].get("words", [])
            words = [{"word": w.get("punctuated_word") or w.get("word", ""),
                      "start": w.get("start", 0),
                      "end": w.get("end", 0),
                      "speaker": w.get("speaker", 0)} for w in raw_words]
        except (KeyError, IndexError):
            words = []
        print(json.dumps({"transcript": transcript, "words": words}))
    except requests.HTTPError as e:
        if e.response is not None and e.response.status_code == 402:
            print(json.dumps({"error": "Deepgram account requires payment. Please add credits at console.deepgram.com."}))
        else:
            print(json.dumps({"error": str(e)}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
