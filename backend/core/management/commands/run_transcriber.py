import time
import queue
import wave
import sys
import threading
import sounddevice as sd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import random
from django.core.management.base import BaseCommand
from core.models import ConsultationRequest, MeetingTranscript
from ai.sarvam_client import process_meeting_audio
import uuid
import os

class AudioRecorder:
    def __init__(self, filename="meeting_audio.wav", device_index=0, samplerate=48000, channels=2):
        self.filename = filename
        self.device_index = device_index
        self.samplerate = samplerate
        self.channels = channels
        self.q = queue.Queue()
        self.recording = False
        self.thread = None

    def _callback(self, indata, frames, time, status):
        if status:
            pass # print(status, file=sys.stderr)
        self.q.put(indata.copy())

    def _record(self):
        try:
            with wave.open(self.filename, 'wb') as wf:
                wf.setnchannels(self.channels)
                wf.setsampwidth(2)
                wf.setframerate(self.samplerate)
                
                with sd.InputStream(samplerate=self.samplerate, device=self.device_index,
                                    channels=self.channels, callback=self._callback, dtype='int16'):
                    while self.recording:
                        try:
                            data = self.q.get(timeout=1)
                            wf.writeframes(data.tobytes())
                        except queue.Empty:
                            continue
        except Exception as e:
            print(f"Error in recording thread: {e}")

    def start(self):
        if not self.recording:
            self.recording = True
            self.thread = threading.Thread(target=self._record)
            self.thread.start()
            print("Audio recording started.")

    def stop(self):
        if self.recording:
            self.recording = False
            if self.thread:
                self.thread.join()
            print("Audio recording stopped.")

def human_pause(a=0.4, b=1.3):
    time.sleep(random.uniform(a, b))

class Command(BaseCommand):
    help = 'Runs the meeting transcriber bot for a given ConsultationRequest ID'

    def add_arguments(self, parser):
        parser.add_argument('consultation_id', type=int, help='ID of the ConsultationRequest')
        parser.add_argument('--email', type=str, help='Google account email', required=True)
        parser.add_argument('--password', type=str, help='Google account password', required=True)

    def handle(self, *args, **kwargs):
        consultation_id = kwargs['consultation_id']
        email = kwargs['email']
        password = kwargs['password']

        try:
            consultation = ConsultationRequest.objects.get(id=consultation_id)
        except ConsultationRequest.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'ConsultationRequest {consultation_id} not found.'))
            return

        meet_link = consultation.meet_link
        if not meet_link:
            self.stdout.write(self.style.ERROR('No meet link available for this consultation.'))
            return

        self.stdout.write(self.style.SUCCESS(f'Starting transcriber for meet: {meet_link}'))

        opt = Options()
        opt.add_argument("--profile-directory=Default")
        opt.add_argument("--start-maximized")
        opt.add_argument("--disable-blink-features=AutomationControlled")
        opt.add_argument("--disable-infobars")
        opt.add_argument("--no-first-run")
        opt.add_argument("--no-default-browser-check")
        opt.add_experimental_option("prefs", {
            "profile.default_content_setting_values.media_stream_mic": 1,
            "profile.default_content_setting_values.media_stream_camera": 1,
            "profile.default_content_setting_values.notifications": 1,
        })

        driver = webdriver.Chrome(options=opt)

        def Glogin():
            driver.get("https://accounts.google.com/v3/signin/identifier?amp%3Bcontinue=https%3A%2F%2Fwww.google.com%2F&%3Bec=GAZAAQ&%3Bpassive=true&hl=en&ifkv=AdBytiNzMMSVMISwPVG6rsx71PGx7dJrV87hLBDeaVDtzaM8UnuaBPDk18ggEViZVUfGOU3njoBF&flowName=WebLiteSignIn&flowEntry=ServiceLogin&dsh=S117544077%3A1753258186211462")
            human_pause(1.5, 2.5)
            email_input = driver.find_element(By.ID, "identifierId")
            email_input.send_keys(email)
            human_pause()
            driver.find_element(By.ID, "identifierNext").click()
            human_pause(3, 4.5)
            pwd_input = driver.find_element(By.XPATH, '//*[@id="password"]')
            pwd_input.click()
            for ch in password:
                pwd_input.send_keys(ch)
                time.sleep(random.uniform(0.08, 0.22))
            human_pause()
            driver.find_element(By.ID, "passwordNext").click()
            human_pause(5, 7)

        def turnOffMicCam():
            human_pause(2, 3)
            driver.switch_to.default_content()
            body = driver.find_element(By.TAG_NAME, "body")
            body.click()
            actions = ActionChains(driver)
            actions.key_down(Keys.COMMAND).send_keys('d').key_up(Keys.COMMAND).perform()
            human_pause(0.6, 1.2)
            actions.key_down(Keys.COMMAND).send_keys('e').key_up(Keys.COMMAND).perform()
            human_pause(0.8, 1.5)

        def AskToJoin():
            try:
                wait = WebDriverWait(driver, 30)
                xpath = "//span[contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'ask to join') or contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'join now')]/ancestor::button"
                btn = wait.until(EC.presence_of_element_located((By.XPATH, xpath)))
                try:
                    btn.click()
                except:
                    driver.execute_script("arguments[0].click();", btn)
            except Exception as e:
                print("Join button interaction failed:", e)

        Glogin()
        driver.get(meet_link)
        human_pause(4, 6)
        turnOffMicCam()

        audio_filename = f"media/meeting_audios/{uuid.uuid4().hex}.wav"
        os.makedirs(os.path.dirname(audio_filename), exist_ok=True)
        recorder = AudioRecorder(filename=audio_filename, device_index=0)
        recorder.start()

        AskToJoin()

        print("Monitoring meeting... (Waiting for everyone to leave)")
        try:
            while True:
                try:
                    pagesource = driver.page_source
                    if "You're the only one here" in pagesource or "No one else is here" in pagesource:
                        print("Detected 'only one here' message. Ending recording.")
                        break
                except:
                    pass
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nManual interruption.")
        finally:
            recorder.stop()
            driver.quit()

        self.stdout.write(self.style.SUCCESS(f'Meeting ended. Audio saved to {audio_filename}'))
        
        # Process with Sarvam AI
        self.stdout.write("Sending audio to Sarvam AI for transcription and diarization...")
        transcript_result = process_meeting_audio(audio_filename)
        
        if transcript_result:
            transcript = MeetingTranscript.objects.create(
                consultation=consultation,
                transcript_data=transcript_result,
                transcript_text=str(transcript_result), # Convert JSON to string or extract text
                audio_file=audio_filename.replace('media/', '')
            )
            self.stdout.write(self.style.SUCCESS(f'Transcript saved with ID {transcript.id}'))
            
            # Trigger Pinecone embedding (will be implemented in RAG setup)
            from ai.rag import index_transcript
            index_transcript(transcript.id)
        else:
            self.stdout.write(self.style.ERROR('Sarvam AI processing failed.'))
