import os
import google.generativeai as genai
from decouple import config

genai.configure(api_key=config('GEMINI_API_KEY'))

print("Available models:")
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)
