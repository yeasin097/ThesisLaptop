import requests
import random
from faker import Faker
import json
import time

# Initialize Faker for realistic data
fake = Faker()

# Base URL for the EHR creation endpoint
BASE_URL = "http://localhost:8000/ehr/create/nid"

# Predefined options for randomization (from your EhrForm.jsx)
DIAGNOSIS_OPTIONS = [
    'Tuberculosis', 'Influenza (Flu)', 'Diabetes Mellitus', 'Hypertension', 'Asthma',
    'Chronic Obstructive Pulmonary Disease (COPD)', 'Pneumonia', 'Bronchitis', 'Malaria', 'Dengue Fever',
    'Hepatitis A', 'Hepatitis B', 'Hepatitis C', 'Cirrhosis', 'Gastritis',
    'Peptic Ulcer Disease', 'Appendicitis', 'Cholecystitis', 'Pancreatitis', 'Irritable Bowel Syndrome (IBS)',
    'Crohn’s Disease', 'Ulcerative Colitis', 'Arthritis', 'Osteoporosis', 'Rheumatoid Arthritis',
    'Gout', 'Migraine', 'Epilepsy', 'Stroke', 'Parkinson’s Disease',
    'Alzheimer’s Disease', 'Depression', 'Anxiety Disorder', 'Bipolar Disorder', 'Schizophrenia',
    'Coronary Artery Disease', 'Heart Failure', 'Arrhythmia', 'Myocardial Infarction', 'Anemia',
    'Leukemia', 'Lymphoma', 'Thyroiditis', 'Hyperthyroidism', 'Hypothyroidism',
    'Kidney Stones', 'Chronic Kidney Disease', 'Urinary Tract Infection (UTI)', 'Prostatitis', 'Erectile Dysfunction',
    'Cataract', 'Glaucoma', 'Conjunctivitis'
]

MEDICATION_OPTIONS = [
    'Ranitidine 150mg', 'Chloroquine 250mg', 'Metformin 500mg', 'Amlodipine 5mg', 'Paracetamol 500mg',
    'Ibuprofen 400mg', 'Aspirin 75mg', 'Losartan 50mg', 'Atorvastatin 20mg', 'Simvastatin 40mg',
    'Omeprazole 20mg', 'Pantoprazole 40mg', 'Esomeprazole 40mg', 'Levothyroxine 100mcg', 'Methotrexate 2.5mg',
    'Prednisolone 5mg', 'Hydrocortisone 10mg', 'Salbutamol 100mcg Inhaler', 'Budesonide 200mcg Inhaler', 'Montelukast 10mg',
    'Cetirizine 10mg', 'Loratadine 10mg', 'Fexofenadine 180mg', 'Amoxicillin 500mg', 'Azithromycin 250mg',
    'Ciprofloxacin 500mg', 'Doxycycline 100mg', 'Clarithromycin 500mg', 'Metronidazole 400mg', 'Fluconazole 150mg',
    'Acyclovir 400mg', 'Valacyclovir 500mg', 'Gabapentin 300mg', 'Pregabalin 75mg', 'Amitriptyline 25mg',
    'Sertraline 50mg', 'Fluoxetine 20mg', 'Citalopram 20mg', 'Escitalopram 10mg', 'Diazepam 5mg',
    'Alprazolam 0.5mg', 'Clonazepam 0.5mg', 'Insulin Glargine 100U/mL', 'Metoprolol 50mg', 'Carvedilol 6.25mg',
    'Bisoprolol 5mg', 'Enalapril 10mg', 'Lisinopril 20mg', 'Warfarin 5mg', 'Clopidogrel 75mg',
    'Heparin 5000U', 'Furosemide 40mg', 'Spironolactone 25mg'
]

BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
ALLERGIES = ['Dust', 'Pollen', 'Peanuts', 'Shellfish', 'Penicillin', 'Latex', 'Sun', 'None']

# Fixed doctor and hospital IDs (you can randomize these too if needed)
DOCTOR_IDS = ['d0001', 'd0002', 'd0003']
HOSPITAL_IDS = ['h001', 'h002', 'h003']

def generate_random_ehr(nid_no):
    # Randomly select 1-3 diagnoses
    num_diagnoses = random.randint(1, 3)
    diagnoses = random.sample(DIAGNOSIS_OPTIONS, num_diagnoses)
    
    # Randomly select 1-4 medications
    num_medications = random.randint(1, 4)
    medications = random.sample(MEDICATION_OPTIONS, num_medications)
    
    # Generate random test results
    systolic_bp = random.randint(90, 180)
    diastolic_bp = random.randint(60, 120)
    blood_pressure = f"{systolic_bp}/{diastolic_bp}"
    cholesterol = f"{random.randint(150, 300)} mg/dL"
    allergy = random.choice(ALLERGIES)
    
    # Generate random patient details
    ehr_details = {
        "address": fake.address().replace('\n', ', '),
        "blood_group": random.choice(BLOOD_GROUPS),
        "date_of_birth": fake.date_of_birth(minimum_age=18, maximum_age=90).strftime('%Y-%m-%d'),
        "gender": random.choice(['Male', 'Female']),
        "diagnosis": ', '.join(diagnoses),
        "medications": medications,  # List format as per your EhrForm
        "test_results": {
            "blood_pressure": blood_pressure,
            "allergy": allergy,
            "cholesterol": cholesterol,
        },
        "notes": fake.sentence(nb_words=10) if random.random() > 0.3 else 'None'
    }
    
    # Payload for the API
    payload = {
        "doctor_id": random.choice(DOCTOR_IDS),
        "hospital_id": random.choice(HOSPITAL_IDS),
        "nid_no": str(nid_no),
        "ehr_details": json.dumps(ehr_details)  # Stringify as per your API expectation
    }
    
    return payload

def create_ehr(nid_no):
    payload = generate_random_ehr(nid_no)
    try:
        response = requests.post(BASE_URL, json=payload)
        if response.status_code == 200 or response.status_code == 201:
            print(f"Successfully created EHR for NID {nid_no}: {response.json()}")
        else:
            print(f"Failed to create EHR for NID {nid_no}: {response.status_code} - {response.text}")
    except requests.RequestException as e:
        print(f"Error creating EHR for NID {nid_no}: {e}")

def main():
    start_nid = 5000000001
    end_nid = 5000000150
    
    print(f"Generating EHRs for NIDs {start_nid} to {end_nid}...")
    
    for nid in range(start_nid, end_nid + 1):
        create_ehr(nid)
        # Add a small delay to avoid overwhelming the server
        time.sleep(0.5)  # 0.5 seconds delay between requests
    
    print("EHR generation complete!")

if __name__ == "__main__":
    main()