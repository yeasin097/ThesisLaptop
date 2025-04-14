import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

function EhrDetails() {
  const location = useLocation();
  const patient = location.state?.patient;
  const [doctorId, setDoctorId] = useState('');
  const [hospitalId, setHospitalId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        doctor_id: doctorId,
        hospital_id: hospitalId,
        ehr_details: { diagnosis },
        nid_no: patient.nid_no,
      };
      const response = await axios.post('http://localhost:8000/ehr/create', payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      setFormSuccess('EHR created successfully!');
      setFormError(null);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create EHR.');
      setFormSuccess(null);
    }
  };

  if (!patient) return <div className="min-vh-100 d-flex align-items-center justify-content-center text-success fs-3">No patient selected</div>;

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5" style={{ background: 'linear-gradient(135deg, #e9ecef, #d4edda)' }}>
      <div className="container">
        <div className="card border-0 shadow mx-auto" style={{ maxWidth: '500px' }}>
          <div className="card-body p-4">
            <h2 className="card-title text-success fw-bold text-center mb-4">Create EHR for {patient.name}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="doctorId" className="form-label fw-medium text-muted">Doctor ID</label>
                <input
                  type="text"
                  className="form-control form-control-lg rounded-pill"
                  id="doctorId"
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="hospitalId" className="form-label fw-medium text-muted">Hospital ID</label>
                <input
                  type="text"
                  className="form-control form-control-lg rounded-pill"
                  id="hospitalId"
                  value={hospitalId}
                  onChange={(e) => setHospitalId(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="diagnosis" className="form-label fw-medium text-muted">Diagnosis</label>
                <input
                  type="text"
                  className="form-control form-control-lg rounded-pill"
                  id="diagnosis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-success w-100 py-2 fw-medium rounded-pill"
                style={{ transition: 'all 0.3s' }}
                onMouseEnter={e => e.target.style.backgroundColor = '#218838'}
                onMouseLeave={e => e.target.style.backgroundColor = '#28a745'}
              >
                Create EHR
              </button>
            </form>
            {formSuccess && <div className="alert alert-success shadow-sm mt-4">{formSuccess}</div>}
            {formError && <div className="alert alert-danger shadow-sm mt-4">{formError}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EhrDetails;