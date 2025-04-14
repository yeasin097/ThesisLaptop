import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function PatientLogin() {
  const [nidNo, setNidNo] = useState('');
  const [fingerprint, setFingerprint] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleNidLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/patient/find', { nid_no: nidNo }, {
        headers: { 'Content-Type': 'application/json' },
      });
      const patientInfo = JSON.parse(response.data.patient_info);
      navigate('/patient/home', { state: { patient: patientInfo } });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login with NID');
    }
  };

  const handleBiometricLogin = async (e) => {
    e.preventDefault();
    if (!fingerprint) {
      setError('Please upload a fingerprint image');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('fingerprint', fingerprint);
      const response = await axios.post('http://localhost:8000/patient/find', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const patientInfo = JSON.parse(response.data.patient_info);
      navigate('/patient/home', { state: { patient: patientInfo } });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login with biometric');
    }
  };

  const handleBiometricRegister = async (e) => {
    e.preventDefault();
    if (!fingerprint) {
      setError('Please upload a fingerprint image');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('fingerprint', fingerprint);
      const response = await axios.post('http://localhost:8000/patient/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('Registration successful. You can now log in with your fingerprint.');
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register');
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5" style={{ background: 'linear-gradient(135deg, #e9ecef, #cce5ff)' }}>
      <div className="container">
        <h2 className="display-5 text-center text-primary fw-bold mb-5" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
          Patient Access
        </h2>
        {error && <div className="alert alert-danger shadow-sm mb-4">{error}</div>}
        {success && <div className="alert alert-success shadow-sm mb-4">{success}</div>}
        <div className="row g-4 justify-content-center">
          <div className="col-md-4">
            <form onSubmit={handleNidLogin} className="card border-0 shadow h-100 p-4 transition-all" style={{ transition: 'all 0.3s' }}>
              <h3 className="card-title text-primary fw-semibold mb-4 text-center">NID Login</h3>
              <div className="mb-3">
                <label htmlFor="nidNo" className="form-label fw-medium text-muted">NID Number</label>
                <input
                  type="text"
                  className="form-control form-control-lg rounded-pill"
                  id="nidNo"
                  value={nidNo}
                  onChange={(e) => setNidNo(e.target.value)}
                  placeholder="e.g., 5000000001"
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100 py-2 fw-medium rounded-pill"
                style={{ backgroundColor: '#007bff', borderColor: '#007bff', transition: 'all 0.3s' }}
                onMouseEnter={e => e.target.style.backgroundColor = '#0056b3'}
                onMouseLeave={e => e.target.style.backgroundColor = '#007bff'}
              >
                Login with NID
              </button>
            </form>
          </div>
          <div className="col-md-4">
            <form onSubmit={handleBiometricLogin} className="card border-0 shadow h-100 p-4 transition-all" style={{ transition: 'all 0.3s' }}>
              <h3 className="card-title text-primary fw-semibold mb-4 text-center">Biometric Login</h3>
              <div className="mb-3">
                <label htmlFor="fingerprintLogin" className="form-label fw-medium text-muted">Fingerprint Image</label>
                <input
                  type="file"
                  className="form-control"
                  id="fingerprintLogin"
                  accept="image/*"
                  onChange={(e) => setFingerprint(e.target.files[0])}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100 py-2 fw-medium rounded-pill"
                style={{ backgroundColor: '#007bff', borderColor: '#007bff', transition: 'all 0.3s' }}
                onMouseEnter={e => e.target.style.backgroundColor = '#0056b3'}
                onMouseLeave={e => e.target.style.backgroundColor = '#007bff'}
              >
                Login with Biometric
              </button>
            </form>
          </div>
          <div className="col-md-4">
            <form onSubmit={handleBiometricRegister} className="card border-0 shadow h-100 p-4 transition-all" style={{ transition: 'all 0.3s' }}>
              <h3 className="card-title text-primary fw-semibold mb-4 text-center">Biometric Registration</h3>
              <div className="mb-3">
                <label htmlFor="fingerprintRegister" className="form-label fw-medium text-muted">Fingerprint Image</label>
                <input
                  type="file"
                  className="form-control"
                  id="fingerprintRegister"
                  accept="image/*"
                  onChange={(e) => setFingerprint(e.target.files[0])}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-success w-100 py-2 fw-medium rounded-pill"
                style={{ backgroundColor: '#28a745', borderColor: '#28a745', transition: 'all 0.3s' }}
                onMouseEnter={e => e.target.style.backgroundColor = '#218838'}
                onMouseLeave={e => e.target.style.backgroundColor = '#28a745'}
              >
                Register with Biometric
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientLogin;