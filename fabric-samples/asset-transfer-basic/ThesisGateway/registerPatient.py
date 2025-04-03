import os
import requests

# API endpoint for patient registration
url = "http://localhost:8000/patient/register"  # Replace with actual API URL

# Path to fingerprint images
fingerprint_folder = "fingerprints_raw"  # Update if needed

counter = 5
# Process and send each fingerprint image
for filename in os.listdir(fingerprint_folder):
    if filename.endswith(".bmp"):  # Ensure only BMP files are processed
        fingerprint_path = os.path.join(fingerprint_folder, filename)

        print(f"📄 Processing: {filename}")

        with open(fingerprint_path, "rb") as fingerprint_file:
            files = {"fingerprint": fingerprint_file}

            response = requests.post(url, files=files)

            # Print API response
            print(f"📤 Sent {filename} | Status: {response.status_code}")
            try:
                print(f"✅ Response: {response.json()}")
            except Exception:
                print(f"❌ Error in response: {response.text}")
    
