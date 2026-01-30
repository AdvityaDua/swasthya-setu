import requests
import json
import logging
import os
from django.conf import settings

logger = logging.getLogger(__name__)

class BhashiniService:
    """
    Service for integrating Bhashini (MeitY) Machine Translation.
    Uses the ULCA Pipeline API for translating report content into Indian languages.
    """
    
    BASE_URL = "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline"
    COMPUTE_URL = "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"
    
    PIPELINE_ID = "64392f96daac500b55c543cd" # Initial Pipeline Model

    def __init__(self):
        self.api_key = os.getenv("BHASHINI_UDYAT_KEY")
        self.inference_key = os.getenv("BHASHINI_INFERENCE_API_KEY")
        # userId is often required for the config call. If not in env, we might hit issues.
        self.user_id = os.getenv("BHASHINI_USER_ID") 

    def translate_batch(self, text_list, target_lang, source_lang="en"):
        """
        Translates a list of strings into the target language.
        """
        if not self.api_key or not self.inference_key:
            logger.warning("Bhashini keys not configured. Skipping translation.")
            return text_list

        try:
            headers = {
                "ulcaApiKey": self.api_key,
                "Content-Type": "application/json"
            }
            if self.user_id:
                headers["userID"] = self.user_id
            
            payload = {
                "pipelineTasks": [
                    {
                        "taskType": "translation",
                        "config": {
                            "language": {
                                "sourceLanguage": source_lang,
                                "targetLanguage": target_lang
                            }
                        }
                    }
                ],
                "pipelineRequestConfig": {
                    "pipelineId": self.PIPELINE_ID
                }
            }
            
            config_response = requests.post(self.BASE_URL, headers=headers, json=payload, timeout=10)
            try:
                config_response.raise_for_status()
            except requests.exceptions.HTTPError as e:
                logger.error(f"Bhashini Config Error: {e}")
                logger.error(f"Response: {config_response.text}")
                return text_list
            config_data = config_response.json()
            
            # Extract service details
            pipeline_response_config = config_data.get("pipelineResponseConfig", [])
            if not pipeline_response_config:
                logger.error("No pipeline response config found.")
                return text_list
            
            service_id = pipeline_response_config[0].get("config", [])[0].get("serviceId")
            
            # 2. Compute Translation
            compute_headers = {
                "Accept": "*/*",
                "User-Agent": "SwasthyaSetu-Backend",
                "Authorization": self.inference_key,
                "Content-Type": "application/json"
            }
            
            compute_payload = {
                "pipelineTasks": [
                    {
                        "taskType": "translation",
                        "config": {
                            "language": {
                                "sourceLanguage": source_lang,
                                "targetLanguage": target_lang
                            },
                            "serviceId": service_id
                        }
                    }
                ],
                "inputData": {
                    "input": [{"source": text} for text in text_list]
                }
            }
            
            compute_response = requests.post(self.COMPUTE_URL, headers=compute_headers, json=compute_payload, timeout=30)
            compute_response.raise_for_status()
            result_data = compute_response.json()
            
            translations = result_data.get("pipelineResponse", [])[0].get("output", [])
            return [res.get("target", "") for res in translations]

        except Exception as e:
            logger.error(f"Bhashini translation failed: {e}")
            return text_list

    def translate_report_sections(self, sections, target_lang):
        """
        Translates report sections while preserving structure.
        sections: dict of {key: text}
        """
        keys = list(sections.keys())
        values = list(sections.values())
        
        translated_values = self.translate_batch(values, target_lang)
        
        return dict(zip(keys, translated_values))
