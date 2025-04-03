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
  const fileInputRef = useRef(null); // For resetting file input

  const diagnosisOptions = ['Tuberculosis', 'Flu', 'Diabetes', 'Hypertension'];
  const medicationOptions = ['Ranitidine 150mg', 'Chloroquine 250mg', 'Metformin 500mg', 'Amlodipine 5mg'];

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

    const ehrDetails = {
      address: patient?.address || 'Unknown',
      blood_group: patient?.blood_group || 'Unknown',
      date_of_birth: patient?.date_of_birth || 'Unknown',
      diagnosis: formData.diagnoses.join(', ') || 'None',
      medications: formData.medications.length > 0 ? formData.medications : [],
      test_results: formData.test_results,
      notes: formData.notes || '',
    };

    if (nidNo) {
      // NID-based EHR creation
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
      // Fingerprint-based EHR creation
      if (!fingerprint) {
        setStatusMessage('⚠️ Please upload a fingerprint image.');
        setLoading(false);
        return;
      }

      let finalPatient = patient || {};
      if (!patient) {
        // Fetch patient data from /patient/find if patient is null
        const findData = new FormData();
        findData.append('fingerprint', fingerprint);

        try {
          const findResponse = await axios.post('http://localhost:8000/patient/find', findData, {
            timeout: 30000,
          });
          const patientInfo = JSON.parse(findResponse.data.patient_info); // Parse the stringified patient_info
          finalPatient = {
            address: patientInfo.address,
            blood_group: patientInfo.blood_group,
            date_of_birth: patientInfo.date_of_birth,
          };
          ehrDetails.address = finalPatient.address;
          ehrDetails.blood_group = finalPatient.blood_group;
          ehrDetails.date_of_birth = finalPatient.date_of_birth;
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
        fileInputRef.current.value = ''; // Reset file input
        setTimeout(() => navigate('/doctor'), 2000);
      } catch (error) {
        setStatusMessage(`❌ Error creating EHR | ${error.response?.data?.error || error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  // Validate required props
  if (!doctorId || !hospitalId) {
    return (
      <div className="text-center py-5">
        <h2>Missing Required Data</h2>
        <p>Doctor ID and Hospital ID are required to create an EHR.</p>
      </div>
    );
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Doctor ID</label>
                <input type="text" className="form-control" value={doctorId} disabled />
              </div>
              <div className="mb-3">
                <label className="form-label">Hospital ID</label>
                <input type="text" className="form-control" value={hospitalId} disabled />
              </div>
              {nidNo && (
                <div className="mb-3">
                  <label className="form-label">NID Number</label>
                  <input type="text" className="form-control" value={nidNo} disabled />
                </div>
              )}
              <div className="mb-3">
                <label className="form-label">Diagnoses</label>
                <div className="input-group mb-2">
                  <select
                    className="form-select"
                    onChange={(e) => handleAddDiagnosis(e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>Select a diagnosis</option>
                    {diagnosisOptions.map((option, index) => (
                      <option key={index} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                {formData.diagnoses.length > 0 && (
                  <ul className="list-group">
                    {formData.diagnoses.map((diag, index) => (
                      <li key={index} className="list-group-item">{diag}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label">Medications</label>
                <div className="input-group mb-2">
                  <select
                    className="form-select"
                    onChange={(e) => handleAddMedication(e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>Select a medication</option>
                    {medicationOptions.map((option, index) => (
                      <option key={index} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                {formData.medications.length > 0 && (
                  <ul className="list-group">
                    {formData.medications.map((med, index) => (
                      <li key={index} className="list-group-item">{med[0]}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label">Test Results</label>
                <input
                  type="text"
                  className="form-control mb-2"
                  name="test_results.blood_pressure"
                  value={formData.test_results.blood_pressure}
                  onChange={handleInputChange}
                  placeholder="Blood Pressure (e.g., 135/90)"
                />
                <input
                  type="text"
                  className="form-control mb-2"
                  name="test_results.allergy"
                  value={formData.test_results.allergy}
                  onChange={handleInputChange}
                  placeholder="Allergy (e.g., Shellfish)"
                />
                <input
                  type="text"
                  className="form-control"
                  name="test_results.cholesterol"
                  value={formData.test_results.cholesterol}
                  onChange={handleInputChange}
                  placeholder="Cholesterol (e.g., 250 mg/dL)"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="notes" className="form-label">Comments</label>
                <textarea
                  className="form-control"
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="e.g., Advised to quit smoking and avoid alcohol."
                />
              </div>
              {!nidNo && (
                <div className="mb-3">
                  <label htmlFor="fingerprint" className="form-label">Fingerprint Image</label>
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
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Submitting...' : 'Create EHR'}
              </button>
            </form>
            {statusMessage && (
              <div className={`mt-3 alert ${statusMessage.includes('❌') ? 'alert-danger' : 'alert-success'}`}>
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