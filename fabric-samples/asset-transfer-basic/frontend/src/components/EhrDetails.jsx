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

  if (!patient) return <div>No patient selected</div>;

  return (
    <div className="container py-5">
      <h2>Create EHR for {patient.name}</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="doctorId" className="form-label">Doctor ID</label>
          <input
            type="text"
            className="form-control"
            id="doctorId"
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="hospitalId" className="form-label">Hospital ID</label>
          <input
            type="text"
            className="form-control"
            id="hospitalId"
            value={hospitalId}
            onChange={(e) => setHospitalId(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="diagnosis" className="form-label">Diagnosis</label>
          <input
            type="text"
            className="form-control"
            id="diagnosis"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">Create EHR</button>
      </form>
      {formSuccess && <div className="alert alert-success mt-3">{formSuccess}</div>}
      {formError && <div className="alert alert-danger mt-3">{formError}</div>}
    </div>
  );
}

export default EhrDetails;