import { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function EhrForm({ doctorId, hospitalId, nidNo, patient }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    diagnoses: [],
    medications: [],
    test_results: {
      blood_pressure: '',
      allergy: '',
      cholesterol: '',
    },
    notes: '',
  });
  const [fingerprint, setFingerprint] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Expanded diagnosis options (50+)
  const diagnosisOptions = [
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
  ];

  // Expanded medication options (50+)
  const medicationOptions = [
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
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('test_results.')) {
      const key = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        test_results: { ...prev.test_results, [key]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddDiagnosis = (diagnosis) => {
    if (diagnosis && !formData.diagnoses.includes(diagnosis)) {
      setFormData((prev) => ({ ...prev, diagnoses: [...prev.diagnoses, diagnosis] }));
    }
  };

  const handleAddMedication = (medication) => {
    if (medication && !formData.medications.some(med => med[0] === medication)) {
      setFormData((prev) => ({ ...prev, medications: [...prev.medications, [medication]] }));
    }
  };

  const handleFingerprintChange = (e) => {
    setFingerprint(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage('');
    setLoading(true);

    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    const ehrDetails = {
      visit_date: currentDate, // Automatically set to current date
      address: patient?.address || 'Unknown',
      blood_group: patient?.blood_group || 'Unknown***',
      date_of_birth: patient?.date_of_birth || 'Unknown',
      gender: patient?.gender || 'Unknown',
      diagnosis: formData.diagnoses.join(', ') || 'None',
      medications: formData.medications.length > 0 ? formData.medications : [],
      test_results: formData.test_results,
      notes: formData.notes || '',
    };

    if (nidNo) {
      const payload = {
        doctor_id: doctorId,
        hospital_id: hospitalId,
        ehr_details: JSON.stringify(ehrDetails),
        nid_no: nidNo,
      };

      try {
        const response = await axios.post('http://localhost:8000/ehr/create/nid', payload);
        setStatusMessage(`✅ EHR created successfully | Response: ${JSON.stringify(response.data)}`);
      } catch (error) {
        setStatusMessage(`❌ Error creating EHR | ${error.response?.data?.error || error.message}`);
      } finally {
        setLoading(false);
      }
    } else {
      if (!fingerprint) {
        setStatusMessage('⚠️ Please upload a fingerprint image.');
        setLoading(false);
        return;
      }

      if (!patient) {
        const findData = new FormData();
        findData.append('fingerprint', fingerprint);

        try {
          const findResponse = await axios.post('http://localhost:8000/patient/find', findData, {
            timeout: 30000,
          });
          const patientInfo = JSON.parse(findResponse.data.patient_info);
          ehrDetails.address = patientInfo.address;
          ehrDetails.blood_group = patientInfo.blood_group;
          ehrDetails.date_of_birth = patientInfo.date_of_birth;
          ehrDetails.gender = patientInfo.gender;
        } catch (error) {
          setStatusMessage(`❌ Error finding patient | ${error.response?.data?.error || error.message}`);
          setLoading(false);
          return;
        }
      }

      const data = new FormData();
      data.append('fingerprint', fingerprint);
      data.append('doctor_id', doctorId);
      data.append('hospital_id', hospitalId);
      data.append('ehr_details', JSON.stringify(ehrDetails));

      try {
        const response = await axios.post('http://localhost:8000/ehr/create', data, {
          timeout: 30000,
        });
        setStatusMessage(`✅ EHR created successfully | Response: ${JSON.stringify(response.data)}`);
        setFormData({
          diagnoses: [],
          medications: [],
          test_results: { blood_pressure: '', allergy: '', cholesterol: '' },
          notes: '',
        });
        setFingerprint(null);
        fileInputRef.current.value = '';
      } catch (error) {
        setStatusMessage(`❌ Error creating EHR | ${error.response?.data?.error || error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  if (!doctorId || !hospitalId) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <h2 className="text-danger fw-bold">Missing Required Data</h2>
          <p className="text-muted">Doctor ID and Hospital ID are required to create an EHR.</p>
        </div>
      </div>
    );
  }

  const currentDate = new Date().toISOString().split('T')[0]; // For display purposes

  return (
    <div className="min-vh-100 bg-light py-5" style={{ background: 'linear-gradient(135deg, #e9ecef, #d4edda)' }}>
      <div className="container">
        <div className="card border-0 shadow mx-auto" style={{ maxWidth: '700px' }}>
          <div className="card-body p-4">
            <h2 className="card-title text-success fw-bold text-center mb-4">Create Electronic Health Record</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-medium text-muted">Doctor ID</label>
                <input type="text" className="form-control form-control-lg rounded-pill bg-light" value={doctorId} disabled />
              </div>
              <div className="mb-3">
                <label className="form-label fw-medium text-muted">Hospital ID</label>
                <input type="text" className="form-control form-control-lg rounded-pill bg-light" value={hospitalId} disabled />
              </div>
              {nidNo && (
                <div className="mb-3">
                  <label className="form-label fw-medium text-muted">NID Number</label>
                  <input type="text" className="form-control form-control-lg rounded-pill bg-light" value={nidNo} disabled />
                </div>
              )}
              <div className="mb-3">
                <label className="form-label fw-medium text-muted">Visit Date</label>
                <input
                  type="text"
                  className="form-control form-control-lg rounded-pill bg-light"
                  value={currentDate}
                  disabled
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-medium text-muted">Diagnoses</label>
                <select
                  className="form-select form-select-lg rounded-pill mb-2"
                  onChange={(e) => handleAddDiagnosis(e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>Select a diagnosis</option>
                  {diagnosisOptions.map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                  ))}
                </select>
                {formData.diagnoses.length > 0 && (
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {formData.diagnoses.map((diag, index) => (
                      <span
                        key={index}
                        className="badge bg-primary text-white fw-normal py-2 px-3 rounded-pill"
                        style={{ fontSize: '0.9rem', backgroundColor: '#007bff' }}
                      >
                        {diag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label fw-medium text-muted">Medications</label>
                <select
                  className="form-select form-select-lg rounded-pill mb-2"
                  onChange={(e) => handleAddMedication(e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>Select a medication</option>
                  {medicationOptions.map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                  ))}
                </select>
                {formData.medications.length > 0 && (
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {formData.medications.map((med, index) => (
                      <span
                        key={index}
                        className="badge bg-success text-white fw-normal py-2 px-3 rounded-pill"
                        style={{ fontSize: '0.9rem', backgroundColor: '#28a745' }}
                      >
                        {med[0]}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label fw-medium text-muted">Test Results</label>
                <input
                  type="text"
                  className="form-control form-control-lg rounded-pill mb-2"
                  name="test_results.blood_pressure"
                  value={formData.test_results.blood_pressure}
                  onChange={handleInputChange}
                  placeholder="Blood Pressure (e.g., 135/90)"
                />
                <input
                  type="text"
                  className="form-control form-control-lg rounded-pill mb-2"
                  name="test_results.allergy"
                  value={formData.test_results.allergy}
                  onChange={handleInputChange}
                  placeholder="Allergy (e.g., Shellfish)"
                />
                <input
                  type="text"
                  className="form-control form-control-lg rounded-pill"
                  name="test_results.cholesterol"
                  value={formData.test_results.cholesterol}
                  onChange={handleInputChange}
                  placeholder="Cholesterol (e.g., 250 mg/dL)"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="notes" className="form-label fw-medium text-muted">Comments</label>
                <textarea
                  className="form-control rounded-3"
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="e.g., Advised to quit smoking and avoid alcohol."
                />
              </div>
              {!nidNo && (
                <div className="mb-4">
                  <label htmlFor="fingerprint" className="form-label fw-medium text-muted">Fingerprint Image</label>
                  <input
                    type="file"
                    className="form-control"
                    id="fingerprint"
                    accept=".bmp"
                    onChange={handleFingerprintChange}
                    ref={fileInputRef}
                  />
                </div>
              )}
              <button
                type="submit"
                className="btn btn-success w-100 py-2 fw-medium rounded-pill"
                disabled={loading}
                style={{ transition: 'all 0.3s' }}
                onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#218838')}
                onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#28a745')}
              >
                {loading ? 'Submitting...' : 'Create EHR'}
              </button>
            </form>
            {statusMessage && (
              <div className={`alert mt-4 shadow-sm ${statusMessage.includes('❌') ? 'alert-danger' : 'alert-success'}`}>
                {statusMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EhrForm;