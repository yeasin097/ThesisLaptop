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
      const response = await axios.post(
        'http://localhost:8000/patient/find',
        { nid_no: nidNo },
        { headers: { 'Content-Type': 'application/json' } }
      );
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
      const response = await axios.post(
        'http://localhost:8000/patient/find',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
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
      const response = await axios.post(
        'http://localhost:8000/patient/register',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setSuccess('Registration successful. You can now log in with your fingerprint.');
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register');
    }
  };

  return (
    <div className="container py-5">
      <h2 className="text-center mb-4">Patient Login</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <div className="row justify-content-center">
        {/* NID Login */}
        <div className="col-md-4">
          <form onSubmit={handleNidLogin} className="card p-4 mb-4">
            <div className="mb-3">
              <label htmlFor="nidNo" className="form-label">NID Number</label>
              <input
                type="text"
                className="form-control"
                id="nidNo"
                value={nidNo}
                onChange={(e) => setNidNo(e.target.value)}
                placeholder="e.g., 5000000001"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Login with NID</button>
          </form>
        </div>

        {/* Biometric Login */}
        <div className="col-md-4">
          <form onSubmit={handleBiometricLogin} className="card p-4 mb-4">
            <div className="mb-3">
              <label htmlFor="fingerprintLogin" className="form-label">Fingerprint Image</label>
              <input
                type="file"
                className="form-control"
                id="fingerprintLogin"
                accept="image/*"
                onChange={(e) => setFingerprint(e.target.files[0])}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Login with Biometric</button>
          </form>
        </div>

        {/* Biometric Register */}
        <div className="col-md-4">
          <form onSubmit={handleBiometricRegister} className="card p-4">
            <div className="mb-3">
              <label htmlFor="fingerprintRegister" className="form-label">Fingerprint Image</label>
              <input
                type="file"
                className="form-control"
                id="fingerprintRegister"
                accept="image/*"
                onChange={(e) => setFingerprint(e.target.files[0])}
                required
              />
            </div>
            <button type="submit" className="btn btn-success">Register with Biometric</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PatientLogin;
