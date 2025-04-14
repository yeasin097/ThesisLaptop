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

  if (!patient) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <h3 className="text-teal fw-semibold">No patient selected</h3>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light py-5" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <div className="container">
        <div className="card shadow-lg rounded-4 mx-auto" style={{ maxWidth: '600px', border: 'none' }}>
          <div className="card-header bg-teal text-white rounded-top-4 p-4">
            <h2 className="mb-0 fw-bold text-center">Create EHR for {patient.name}</h2>
          </div>
          <div className="card-body p-5">
            <form onSubmit={handleSubmit}>
              <div className="mb-4 position-relative">
                <input
                  type="text"
                  className="form-control border-0 border-bottom py-2"
                  id="doctorId"
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  required
                  style={{ fontSize: '1.1rem', transition: 'all 0.3s' }}
                />
                <label
                  htmlFor="doctorId"
                  className="form-label position-absolute top-0 start-0 text-muted"
                  style={{ transition: 'all 0.3s', transform: doctorId ? 'translateY(-20px)' : 'translateY(0)', fontSize: doctorId ? '0.9rem' : '1.1rem' }}
                >
                  Doctor ID
                </label>
              </div>
              <div className="mb-4 position-relative">
                <input
                  type="text"
                  className="form-control border-0 border-bottom py-2"
                  id="hospitalId"
                  value={hospitalId}
                  onChange={(e) => setHospitalId(e.target.value)}
                  required
                  style={{ fontSize: '1.1rem', transition: 'all 0.3s' }}
                />
                <label
                  htmlFor="hospitalId"
                  className="form-label position-absolute top-0 start-0 text-muted"
                  style={{ transition: 'all 0.3s', transform: hospitalId ? 'translateY(-20px)' : 'translateY(0)', fontSize: hospitalId ? '0.9rem' : '1.1rem' }}
                >
                  Hospital ID
                </label>
              </div>
              <div className="mb-4 position-relative">
                <input
                  type="text"
                  className="form-control border-0 border-bottom py-2"
                  id="diagnosis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  required
                  style={{ fontSize: '1.1rem', transition: 'all 0.3s' }}
                />
                <label
                  htmlFor="diagnosis"
                  className="form-label position-absolute top-0 start-0 text-muted"
                  style={{ transition: 'all 0.3s', transform: diagnosis ? 'translateY(-20px)' : 'translateY(0)', fontSize: diagnosis ? '0.9rem' : '1.1rem' }}
                >
                  Diagnosis
                </label>
              </div>
              <button
                type="submit"
                className="btn w-100 py-3 fw-semibold text-white"
                style={{
                  background: 'linear-gradient(90deg, #00c4cc, #007bff)',
                  borderRadius: '8px',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.03)';
                  e.target.style.boxShadow = '0 8px 20px rgba(0, 196, 204, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Create EHR
              </button>
            </form>
            {formSuccess && (
              <div className="alert alert-success mt-4 d-flex align-items-center rounded-3" style={{ backgroundColor: '#e6f7f8', border: '1px solid #00c4cc' }}>
                <i className="bi bi-check-circle-fill me-2 text-teal"></i>
                <span>{formSuccess}</span>
              </div>
            )}
            {formError && (
              <div className="alert alert-danger mt-4 d-flex align-items-center rounded-3" style={{ backgroundColor: '#fce8e6', border: '1px solid #dc3545' }}>
                <i className="bi bi-x-circle-fill me-2 text-danger"></i>
                <span>{formError}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EhrDetails;