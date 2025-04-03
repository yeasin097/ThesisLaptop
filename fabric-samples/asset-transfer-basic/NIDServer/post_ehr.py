import json
import requests

# Load JSON data
with open("citizens.json", "r") as file:
    ehr_data = json.load(file)

# Define API endpoint
url = "http://localhost:3000/create_ehr"  # Replace with actual API

# Send EHR records one by one
for ehr in ehr_data:
    # response = requests.post(url, json=ehr, headers={"Content-Type": "application/json"})
    
    # Print response status
    # print(f"Sent EHR for NID: {ehr['nid_no']} | Status: {response.status_code}")
    # print(f"Response: {response.json()}")
    print(ehr["nid_no"])
