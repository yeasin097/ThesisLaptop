import random
import json
import time
from datetime import datetime, timedelta

def generate_ehr(patient_nid, doctor_id, hospital_id, ehr_id):
    conditions = [
        "Diabetes", "Hypertension", "Asthma", "Cardiac Arrest", "COVID-19", "Malaria", "Dengue", "Flu", 
        "Pneumonia", "Bronchitis", "Tuberculosis", "Hepatitis B", "Hepatitis C", "Stroke", "Kidney Disease", 
        "Liver Cirrhosis", "Anemia", "Migraine", "Epilepsy", "Arthritis", "Cancer", "Thyroid Disorder", 
        "Depression", "Anxiety", "Gastric Ulcer", "Pancreatitis", "HIV/AIDS", "Skin Infection", "Ear Infection",
    ]
    
    medications = [
        ["Insulin 30mg", "Metformin 500mg"],
        ["Amlodipine 60mg", "Losartan 55mg"],
        ["Ventolin 2mg"],
        ["Aspirin 75mg"],
        ["Remdesivir 100mg"],
        ["Chloroquine 250mg"],
        ["Paracetamol 500mg"],
        ["Tamiflu 75mg"],
        ["Omeprazole 20mg"],
        ["Ranitidine 150mg"],
        ["Atorvastatin 40mg"],
        ["Captopril 25mg"],
        ["Dexamethasone 4mg"],
        ["Ibuprofen 400mg"],
        ["Ciprofloxacin 500mg"],
        ["Amoxicillin 500mg"],
        ["Erythromycin 250mg"],
        ["Azithromycin 500mg"],
        ["Prednisone 10mg"],
        ["Loratadine 10mg"],
        ["Montelukast 10mg"],
        ["Fluconazole 150mg"],
        ["Furosemide 40mg"],
        ["Warfarin 5mg"],
        ["Methotrexate 10mg"],
        ["Hydroxychloroquine 200mg"],
        ["Carbamazepine 200mg"],
        ["Levodopa 250mg"],
        ["Metoprolol 50mg"],
        ["Sertraline 50mg"],
        ["Clopidogrel 75mg"],
        ["Levothyroxine 50mcg"],
        ["Budesonide 200mcg"],
        ["Ciprofloxacin 250mg"],
        ["Naproxen 500mg"],
        ["Salbutamol 100mcg"]
    ]
    
    test_results = [
        {"blood_pressure": "120/80", "allergy": "None", "cholesterol": "180 mg/dL"},
        {"blood_pressure": "190/90", "allergy": "from dust and water", "cholesterol": "260 mg/dL"},
        {"blood_pressure": "140/85", "allergy": "Pollen", "cholesterol": "210 mg/dL"},
        {"blood_pressure": "135/90", "allergy": "Shellfish", "cholesterol": "250 mg/dL"},
        {"blood_pressure": "145/95", "allergy": "Peanuts", "cholesterol": "230 mg/dL"},
        {"blood_pressure": "130/85", "allergy": "None", "cholesterol": "200 mg/dL"},
        {"blood_pressure": "125/82", "allergy": "Latex", "cholesterol": "190 mg/dL"},
        {"blood_pressure": "155/92", "allergy": "Mold", "cholesterol": "220 mg/dL"},
    ]
    
    notes = [
        "Patient advised to reduce salt intake and monitor BP daily.",
        "Continue prescribed medication and follow-up in 2 weeks.",
        "Suggested lifestyle changes for better health.",
        "Recommended dietary adjustments to improve health.",
        "Encouraged to engage in regular physical activity.",
        "Monitor blood glucose levels daily.",
        "Regular checkups advised to track disease progression.",
        "Maintain hydration and avoid excessive stress.",
        "Counseling recommended for mental well-being.",
        "Follow-up required in one month for reassessment.",
        "Prescribed pain management for chronic pain relief.",
        "Advised to quit smoking and avoid alcohol.",
        "Recommended physical therapy for recovery.",
        "Ensure regular screening for potential complications.",
        "Patient's mental health needs attention, counseling advised."
    ]
    
    index = random.randint(0, len(conditions) - 1)
    ehr_data = {
        "nid_no": patient_nid,
        "doctor_id": doctor_id,
        "hospital_id": hospital_id,
        "ehr_details": {
            "diagnosis": conditions[index],
            "medications": random.sample(medications, 2),
            "test_results": random.choice(test_results),
            "notes": random.choice(notes),
        },
    }
    return ehr_data

# Provided NID numbers from 5000000001 to 5000000150
patients = [f"{i:010d}" for i in range(5000000001, 5000000151)]
doctors = [f"d{str(i).zfill(4)}" for i in range(1, 6)]
hospitals = [f"hosp{str(i).zfill(3)}" for i in range(1, 6)]

def generate_patient_ehrs():
    ehr_records = []
    for patient in patients:
        for _ in range(5):  # Each patient gets 5 EHRs
            ehr_id = f"ehr{random.randint(1000, 9999)}"
            ehr_records.append(generate_ehr(patient, random.choice(doctors), random.choice(hospitals), ehr_id))
    return ehr_records

def invoke_smart_contract(ehr_data):
    print(f"Invoking contract with NID: {ehr_data['nid_no']} at {ehr_data['hospital_id']}")
    time.sleep(0.1)

if __name__ == "__main__":
    ehr_list = generate_patient_ehrs()
    with open("ehr_records.json", "w") as file:
        json.dump(ehr_list, file, indent=4)
    print("EHR data generation complete. Records saved to ehr_records.json.")
