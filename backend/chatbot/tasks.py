from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import os
import sys
import time
import random
import threading
import queue
import wave
import tempfile
from core.models import ConsultationRequest, MeetingTranscript
from ai.sarvam_service import SarvamService
from django.core.files.base import ContentFile

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.common.keys import Keys
    from selenium.webdriver.common.action_chains import ActionChains
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
except ImportError:
    pass # In environments where celery runs without UI, this might fail or be mocked

try:
    import sounddevice as sd
except ImportError:
    pass

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
                wf.setsampwidth(2)  # 2 bytes for int16
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

    def stop(self):
        if self.recording:
            self.recording = False
            if self.thread:
                self.thread.join()

# Human-like helpers
def human_pause(a=0.4, b=1.3):
    time.sleep(random.uniform(a, b))

def human_type(element, text):
    for ch in text:
        element.send_keys(ch)
        time.sleep(random.uniform(0.08, 0.22))

def human_move_to(driver, element):
    actions = ActionChains(driver)
    actions.move_to_element(element)
    actions.pause(random.uniform(0.3, 0.7))
    actions.perform()

def turnOffMicCam(driver):
    human_pause(2, 3)
    driver.switch_to.default_content()
    body = driver.find_element(By.TAG_NAME, "body")
    body.click()
    human_pause()
    actions = ActionChains(driver)
    actions.key_down(Keys.COMMAND).send_keys('d').key_up(Keys.COMMAND).perform()
    human_pause(0.6, 1.2)
    actions.key_down(Keys.COMMAND).send_keys('e').key_up(Keys.COMMAND).perform()
    human_pause(0.8, 1.5)

@shared_task
def join_meeting_and_record(consultation_id):
    try:
        consultation = ConsultationRequest.objects.get(id=consultation_id)
        if not consultation.meet_link:
            print(f"Consultation {consultation_id} has no meet link.")
            return

        print(f"Starting bot for Consultation: {consultation_id}")
        
        mail_address = os.environ.get('BOT_EMAIL')
        password = os.environ.get('BOT_PASSWORD')

        opt = Options()
        opt.add_argument("--profile-directory=Default")
        opt.add_argument("--start-maximized")
        opt.add_argument("--disable-blink-features=AutomationControlled")
        opt.add_argument("--disable-infobars")
        opt.add_argument("--no-first-run")
        opt.add_argument("--no-default-browser-check")
        opt.add_experimental_option(
            "prefs",
            {
                "profile.default_content_setting_values.media_stream_mic": 1,
                "profile.default_content_setting_values.media_stream_camera": 1,
                "profile.default_content_setting_values.notifications": 1,
            }
        )

        driver = webdriver.Chrome(options=opt)
        
        # 1. Login
        driver.get("https://accounts.google.com/v3/signin/identifier?amp%3Bcontinue=https%3A%2F%2Fwww.google.com%2F&%3Bec=GAZAAQ&%3Bpassive=true&hl=en&ifkv=AdBytiNzMMSVMISwPVG6rsx71PGx7dJrV87hLBDeaVDtzaM8UnuaBPDk18ggEViZVUfGOU3njoBF&flowName=WebLiteSignIn&flowEntry=ServiceLogin")
        human_pause(1.5, 2.5)

        email_input = driver.find_element(By.ID, "identifierId")
        human_move_to(driver, email_input)
        email_input.click()
        human_type(email_input, mail_address)
        human_pause()
        driver.find_element(By.ID, "identifierNext").click()
        human_pause(3, 4.5)

        pwd_input = driver.find_element(By.XPATH, '//*[@id="password"]')
        human_move_to(driver, pwd_input)
        pwd_input.click()
        human_type(pwd_input, password)
        human_pause()
        driver.find_element(By.ID, "passwordNext").click()
        human_pause(5, 7)

        # 2. Join Meet
        driver.get(consultation.meet_link)
        human_pause(4, 6)
        turnOffMicCam(driver)

        # 3. Audio Recording
        temp_audio_file = tempfile.mktemp(suffix=".wav")
        recorder = AudioRecorder(filename=temp_audio_file, device_index=0) # ensure BlackHole/virtual device is 0
        recorder.start()

        # 4. Ask to Join
        wait = WebDriverWait(driver, 30)
        xpath = (
            "//span[contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'ask to join') or contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'join now')]/ancestor::button"
        )
        try:
            btn = wait.until(EC.presence_of_element_located((By.XPATH, xpath)))
            human_move_to(driver, btn)
            try:
                btn.click()
            except:
                driver.execute_script("arguments[0].click();", btn)
        except Exception as e:
            print(f"Join failed: {e}")

        # 5. Monitor Meeting (Wait until 'Only one here' or timeout of 60 mins)
        start_time = time.time()
        timeout_seconds = 3600 
        
        while time.time() - start_time < timeout_seconds:
            try:
                pagesource = driver.page_source
                if "You're the only one here" in pagesource or "No one else is here" in pagesource:
                    print("Meeting ended/empty. Bot leaving.")
                    break
            except:
                pass
            time.sleep(5)
            
        recorder.stop()
        driver.quit()
        
        # 6. Transcribe using Sarvam and Save to MeetingTranscript
        print("Transcribing recorded audio with Sarvam AI...")
        sarvam = SarvamService()
        transcript_text = sarvam.speech_to_text(temp_audio_file)
        
        if transcript_text:
            transcript, created = MeetingTranscript.objects.get_or_create(consultation=consultation)
            transcript.transcript_text = transcript_text
            
            with open(temp_audio_file, "rb") as f:
                transcript.audio_file.save(f"consultation_{consultation_id}.wav", ContentFile(f.read()), save=True)
            
            print(f"Saved transcript for Consultation {consultation_id}")
            
        if os.path.exists(temp_audio_file):
            os.remove(temp_audio_file)

    except Exception as e:
        print(f"Error in bot task: {e}")


@shared_task
def check_upcoming_meetings():
    """
    Periodic task to check for upcoming SCHEDULED meetings in the next 2 minutes.
    """
    now = timezone.now()
    two_minutes_from_now = now + timedelta(minutes=2)
    
    upcoming = ConsultationRequest.objects.filter(
        status='SCHEDULED',
        scheduled_time__gte=now,
        scheduled_time__lte=two_minutes_from_now
    )
    
    for consultation in upcoming:
        print(f"Found upcoming meeting for Consultation {consultation.id}. Launching Bot...")
        join_meeting_and_record.delay(consultation.id)
