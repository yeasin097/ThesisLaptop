import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

function DoctorEhrView() {
  const location = useLocation();
  const navigate = useNavigate();
  const patient = location.state?.patient;
  const [ehrData, setEhrData] = useState([]);
  const [patientInfo, setPatientInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (patient) {
      const fetchEhrs = async () => {
        setLoading(true);
        try {
          const response = await axios.post('http://localhost:8000/patient/ehrs', { nid_no: patient.nid_no }, {
            headers: { 'Content-Type': 'application/json' },
          });
          const ehrs = Array.isArray(response.data.ehrs) ? response.data.ehrs : [];
          const normalizedEhrs = ehrs.map(ehr => ({
            ...ehr,
            details: typeof ehr.details === 'string' ? JSON.parse(ehr.details) : ehr.details,
          }));
          setEhrData(normalizedEhrs);
          if (normalizedEhrs.length > 0) {
            const firstEhrDetails = normalizedEhrs[0].details;
            setPatientInfo({
              bloodGroup: firstEhrDetails.blood_group || 'Unknown',
              dateOfBirth: firstEhrDetails.date_of_birth || 'Unknown',
              address: firstEhrDetails.address || 'Unknown',
              previousDiagnoses: extractPreviousDiagnoses(normalizedEhrs),
            });
          }
          setError(null);
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to fetch EHRs.');
          setEhrData([]);
        } finally {
          setLoading(false);
        }
      };
      fetchEhrs();
    }
  }, [patient]);

  const extractPreviousDiagnoses = (ehrs) => {
    const diagnoses = ehrs.filter(ehr => ehr.details?.diagnosis).map(ehr => ehr.details.diagnosis);
    return [...new Set(diagnoses)];
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'Unknown';
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const handleCreateEhr = () => navigate('/doctor/create-ehr', { state: { patient } });

  if (!patient) return <div className="min-vh-100 d-flex align-items-center justify-content-center text-success fs-3">No patient selected</div>;

  return (
    <div className="min-vh-100 bg-light py-5" style={{ background: 'linear-gradient(135deg, #e9ecef, #d4edda)' }}>
      <div className="container">
        <h2 className="display-5 text-success fw-bold text-center mb-5" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
          Patient Electronic Health Records
        </h2>
        {patientInfo && (
          <div className="card border-0 shadow mb-5">
            <div className="card-header bg-success text-white fw-semibold">
              <h4 className="mb-0">Patient Information (NID: {patient.nid_no})</h4>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <p><strong>Name:</strong> {patient.name || 'N/A'}</p>
                  <p><strong>Blood Group:</strong> {patientInfo.bloodGroup}</p>
                  <p><strong>Age:</strong> {calculateAge(patientInfo.dateOfBirth)} years</p>
                  <p><strong>Date of Birth:</strong> {patientInfo.dateOfBirth}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <p><strong>Address:</strong> {patientInfo.address}</p>
                  <p><strong>Previous Diagnoses:</strong></p>
                  {patientInfo.previousDiagnoses.length > 0 ? (
                    <ul className="list-unstyled ps-3">
                      {patientInfo.previousDiagnoses.map((diagnosis, idx) => (
                        <li key={idx}>• {diagnosis}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted">No previous diagnoses</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        <h3 className="h4 text-success fw-semibold mb-4">EHR Records</h3>
        {loading && <div className="text-center text-muted mb-4">Loading EHRs...</div>}
        {error && <div className="alert alert-danger shadow-sm mb-4">{error}</div>}
        {!loading && !error && ehrData.length === 0 && (
          <div className="text-center">
            <p className="text-muted mb-3">No EHR records found for this patient.</p>
            <button
              className="btn btn-success fw-medium px-4 py-2"
              onClick={handleCreateEhr}
              style={{ transition: 'all 0.3s' }}
              onMouseEnter={e => e.target.style.backgroundColor = '#218838'}
              onMouseLeave={e => e.target.style.backgroundColor = '#28a745'}
            >
              Create New EHR
            </button>
          </div>
        )}
        {!loading && !error && ehrData.length > 0 && (
          <div>
            {ehrData.map((ehr, index) => (
              <div key={index} className="card border-0 shadow mb-4 transition-all" style={{ transition: 'all 0.3s' }}>
                <div className="card-header bg-success text-white d-flex justify-content-between align-items-center fw-semibold">
                  <span>EHR ID: {ehr.ehr_id.substring(0, 12)}...</span>
                  <span className="badge bg-light text-dark">
                    {new Date(ehr.details.created_at || Date.now()).toLocaleDateString()}
                  </span>
                </div>
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <p><strong>Doctor ID:</strong> {ehr.doctor_id || 'N/A'}</p>
                      <p><strong>Hospital ID:</strong> {ehr.hospital_id || 'N/A'}</p>
                    </div>
                    <div className="col-md-6">
                      <p><strong>Diagnosis:</strong> {ehr.details?.diagnosis || 'N/A'}</p>
                      <p><strong>Medications:</strong></p>
                      <ul className="list-unstyled ps-3">
                        {ehr.details?.medications?.length > 0 ? (
                          ehr.details.medications.map((med, i) => (
                            <li key={i}>{med || 'Unknown'}</li>
                          ))
                        ) : (
                          <li>No medications listed</li>
                        )}
                      </ul>
                    </div>
                  </div>
                  <div className="card mb-3 border-light shadow-sm">
                    <div className="card-header bg-light fw-semibold">Test Results</div>
                    <div className="card-body">
                      <ul className="list-group list-group-flush">
                        <li className="list-group-item"><strong>Blood Pressure:</strong> {ehr.details?.test_results?.blood_pressure || 'N/A'}</li>
                        <li className="list-group-item"><strong>Allergy:</strong> {ehr.details?.test_results?.allergy || 'N/A'}</li>
                        <li className="list-group-item"><strong>Cholesterol:</strong> {ehr.details?.test_results?.cholesterol || 'N/A'}</li>
                      </ul>
                    </div>
                  </div>
                  <p><strong>Notes:</strong> {ehr.details?.notes || 'N/A'}</p>
                </div>
              </div>
            ))}
            <div className="text-center mt-4">
              <button
                className="btn btn-success fw-medium px-4 py-2"
                onClick={handleCreateEhr}
                style={{ transition: 'all 0.3s' }}
                onMouseEnter={e => e.target.style.backgroundColor = '#218838'}
                onMouseLeave={e => e.target.style.backgroundColor = '#28a745'}
              >
                Create New EHR
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DoctorEhrView;