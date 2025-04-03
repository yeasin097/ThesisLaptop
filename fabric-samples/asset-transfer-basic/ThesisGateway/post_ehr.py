import json
import os
import requests

# Load EHR JSON data
with open("ehr_records.json", "r") as file:
    ehr_data = json.load(file)

# API endpoint
url = "http://localhost:8000/ehr/create"  # Replace with actual API URL

# Path to fingerprint images
fingerprint_folder = "fingerprints_raw"

counter = 5
# Process and send each EHR record
for ehr in ehr_data:
    nid_no = ehr.get("nid_no", "")
    fingerprint_path = os.path.join(fingerprint_folder, f"{nid_no}.bmp")

    if not os.path.exists(fingerprint_path):
        print(f"⚠️ No fingerprint file found for NID: {nid_no}, skipping...")
        continue

    # Debugging: Check ehr_details format before sending
    # print(f"📄 EHR Details for {nid_no}: {json.dumps(ehr['ehr_details'], indent=2, ensure_ascii=False)}")

    with open(fingerprint_path, "rb") as fingerprint_file:
        files = {"fingerprint": fingerprint_file}
        data = {
            "nid_no": nid_no,
            "doctor_id": ehr["doctor_id"],
            "hospital_id": ehr["hospital_id"],
            "ehr_details": json.dumps(ehr["ehr_details"], ensure_ascii=False)  # Proper JSON format
        }

        response = requests.post(url, data=data, files=files)

        # Print API response
        print(f"📤 Sent EHR for NID: {nid_no} | Status: {response.status_code}")
        try:
            print(f"✅ Response: {response.json()}")
        except Exception:
            print(f"❌ Error in response: {response.text}")


    
