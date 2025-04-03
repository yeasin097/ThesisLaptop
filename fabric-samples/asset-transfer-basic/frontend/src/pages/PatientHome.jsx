import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios';

function PatientHome() {
  const location = useLocation();
  const patient = location.state?.patient;
  const [ehrData, setEhrData] = useState([]);
  const [loadingEhrs, setLoadingEhrs] = useState(false);
  const [errorEhrs, setErrorEhrs] = useState(null);

  useEffect(() => {
    if (patient) {
      const fetchEhrs = async () => {
        setLoadingEhrs(true);
        console.log('Fetching EHRs for NID:', patient.nid_no);
        try {
          const response = await axios.post('http://localhost:8000/patient/ehrs', { nid_no: patient.nid_no }, {
            headers: { 'Content-Type': 'application/json' },
          });
          console.log('Response:', response.data);
          const ehrs = Array.isArray(response.data.ehrs) ? response.data.ehrs : [];
          // Normalize details: parse if string, keep as object if already parsed
          const normalizedEhrs = ehrs.map(ehr => ({
            ...ehr,
            details: typeof ehr.details === 'string' ? JSON.parse(ehr.details) : ehr.details
          }));
          setEhrData(normalizedEhrs);
          setErrorEhrs(null);
        } catch (err) {
          console.error('Fetch error:', err.response?.status, err.response?.data);
          setErrorEhrs(err.response?.data?.error || 'Failed to fetch EHRs.');
          setEhrData([]);
        } finally {
          setLoadingEhrs(false);
        }
      };
      fetchEhrs();
    }
  }, [patient]);

  if (!patient) {
    return (
      <div className="container py-5 text-center">
        <h2>No Patient Data</h2>
        <p>Please log in again.</p>
        <Link to="/patient/login" className="btn btn-primary">Back to Login</Link>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h2 className="text-center mb-4">Welcome, {patient.name}</h2>
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Patient Information</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <p><strong>Name:</strong> {patient.name}</p>
                  <p><strong>NID Number:</strong> {patient.nid_no}</p>
                  <p><strong>Gender:</strong> {patient.gender}</p>
                  <p><strong>Date of Birth:</strong> {patient.date_of_birth}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <p><strong>Address:</strong> {patient.address}</p>
                  <p><strong>Blood Group:</strong> {patient.blood_group}</p>
                  <p><strong>Email:</strong> {patient.email}</p>
                  <p><strong>Phone:</strong> {patient.phone}</p>
                </div>
              </div>
              <p><strong>Father's Name:</strong> {patient.father_name}</p>
            </div>
            <div className="card-footer text-center">
              <Link to="/patient/login" className="btn btn-outline-primary">Logout</Link>
            </div>
          </div>

          {/* EHR Section */}
          <div className="mt-4">
            <h5 className="mb-3">Your Electronic Health Records (EHRs)</h5>
            {loadingEhrs && <div className="text-center">Loading EHRs...</div>}
            {errorEhrs && <div className="alert alert-danger">{errorEhrs}</div>}
            {!loadingEhrs && !errorEhrs && ehrData.length === 0 && (
              <p className="text-muted">No EHR records found.</p>
            )}
            {!loadingEhrs && !errorEhrs && ehrData.length > 0 && ehrData.map((ehr, index) => (
              <div key={index} className="card mb-3 shadow-sm">
                <div className="card-header bg-info text-white">
                  <strong>EHR ID:</strong> {ehr.ehr_id}
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <p><strong>Patient ID:</strong> {ehr.patient_id || 'N/A'}</p>
                      <p><strong>Doctor ID:</strong> {ehr.doctor_id || 'N/A'}</p>
                      <p><strong>Hospital ID:</strong> {ehr.hospital_id || 'N/A'}</p>
                    </div>
                    <div className="col-md-6">
                      <p><strong>Diagnosis:</strong> {ehr.details?.diagnosis || 'N/A'}</p>
                      <p><strong>Medications:</strong></p>
                      <ul>
                        {ehr.details?.medications?.length > 0 ? (
                          ehr.details.medications.map((med, i) => (
                            <li key={i}>{med[0] || 'Unknown'}</li>
                          ))
                        ) : (
                          <li>No medications listed</li>
                        )}
                      </ul>
                    </div>
                  </div>
                  <p><strong>Test Results:</strong></p>
                  <ul>
                    <li>Blood Pressure: {ehr.details?.test_results?.blood_pressure || 'N/A'}</li>
                    <li>Allergy: {ehr.details?.test_results?.allergy || 'N/A'}</li>
                    <li>Cholesterol: {ehr.details?.test_results?.cholesterol || 'N/A'}</li>
                  </ul>
                  <p><strong>Notes:</strong> {ehr.details?.notes || 'N/A'}</p>
                  <p><strong>CID:</strong> {ehr.cid || 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientHome;