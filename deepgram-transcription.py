#!/usr/bin/env python3
"""
Deepgram integration for ViciDial recordings
Fast, accurate transcription with speaker diarization
"""

import os
import json
import asyncio
import aiohttp
from deepgram import DeepgramClient, PrerecordedOptions, FileSource
import time

# Deepgram configuration from environment
import os
DEEPGRAM_API_KEY = os.environ.get("DEEPGRAM_API_KEY", "")

class DeepgramTranscriber:
    def __init__(self):
        """Initialize Deepgram client"""
        self.client = DeepgramClient(DEEPGRAM_API_KEY)

    async def transcribe_audio_async(self, audio_file_path):
        """Transcribe audio file using Deepgram async"""
        try:
            with open(audio_file_path, 'rb') as audio_file:
                buffer_data = audio_file.read()

            payload = {
                "buffer": buffer_data,
            }

            options = PrerecordedOptions(
                model="nova-2",  # Most accurate model
                language="en-US",
                smart_format=True,  # Adds punctuation and capitalization
                diarize=True,  # Speaker identification
                punctuate=True,
                utterances=True,  # Break into utterances
                numerals=True,  # Convert numbers to numerals
                profanity_filter=False
            )

            response = self.client.listen.prerecorded.v("1").transcribe_file(
                payload,
                options
            )

            return response

        except Exception as e:
            print(f"Deepgram transcription error: {e}")
            return None

    def transcribe_audio(self, audio_file_path):
        """Synchronous wrapper for transcription"""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(self.transcribe_audio_async(audio_file_path))
        finally:
            loop.close()

    def format_diarized_transcript(self, response):
        """Format transcript with speaker labels"""
        if not response:
            return None

        try:
            # Get the transcript with speaker labels
            result = response.results

            if not result or not result.channels or not result.channels[0].alternatives:
                return None

            channel = result.channels[0]
            alternative = channel.alternatives[0]

            # If we have words with speaker info, use that
            if hasattr(alternative, 'words') and alternative.words:
                formatted_lines = []
                current_speaker = None
                current_text = []

                for word in alternative.words:
                    speaker = getattr(word, 'speaker', None)

                    if speaker != current_speaker:
                        # Save previous speaker's text
                        if current_text:
                            speaker_label = "Agent" if current_speaker == 0 else f"Customer"
                            formatted_lines.append(f"{speaker_label}: {' '.join(current_text)}")

                        # Start new speaker
                        current_speaker = speaker
                        current_text = [word.punctuated_word or word.word]
                    else:
                        current_text.append(word.punctuated_word or word.word)

                # Add last speaker's text
                if current_text:
                    speaker_label = "Agent" if current_speaker == 0 else f"Customer"
                    formatted_lines.append(f"{speaker_label}: {' '.join(current_text)}")

                return "\n".join(formatted_lines)

            # Fallback to basic transcript
            return alternative.transcript

        except Exception as e:
            print(f"Error formatting transcript: {e}")
            return None

    def get_metadata(self, response):
        """Extract metadata from Deepgram response"""
        if not response:
            return {}

        try:
            metadata = response.metadata
            result = response.results

            info = {
                "duration": metadata.duration if metadata else 0,
                "channels": metadata.channels if metadata else 0,
                "models": metadata.models if metadata else [],
                "confidence": 0
            }

            # Get average confidence
            if result and result.channels and result.channels[0].alternatives:
                info["confidence"] = result.channels[0].alternatives[0].confidence

            return info

        except Exception as e:
            print(f"Error extracting metadata: {e}")
            return {}


def transcribe_file(audio_path):
    """Simple function to transcribe a file"""
    transcriber = DeepgramTranscriber()

    print(f"Transcribing with Deepgram: {audio_path}")
    start_time = time.time()

    response = transcriber.transcribe_audio(audio_path)

    if response:
        # Get formatted transcript
        transcript = transcriber.format_diarized_transcript(response)

        # Get metadata
        metadata = transcriber.get_metadata(response)

        elapsed = time.time() - start_time

        result = {
            "transcript": transcript,
            "metadata": metadata,
            "processing_time": elapsed
        }

        print(f"✓ Transcribed in {elapsed:.1f} seconds")
        print(f"  Duration: {metadata.get('duration', 0):.1f}s")
        print(f"  Confidence: {metadata.get('confidence', 0):.2%}")

        return result
    else:
        print("✗ Transcription failed")
        return None


if __name__ == "__main__":
    # Test with a sample file
    test_file = "/var/www/vanguard/recordings/lead_88546.mp3"

    if os.path.exists(test_file):
        print(f"Testing Deepgram with: {test_file}")
        print("-" * 50)

        result = transcribe_file(test_file)

        if result:
            print("\nTranscript Preview:")
            print("-" * 50)
            print(result["transcript"][:500] + "...")

            print(f"\nProcessing time: {result['processing_time']:.1f} seconds")
            print(f"Audio duration: {result['metadata']['duration']:.1f} seconds")
            print(f"Speed ratio: {result['metadata']['duration'] / result['processing_time']:.1f}x realtime")
    else:
        print(f"Test file not found: {test_file}")