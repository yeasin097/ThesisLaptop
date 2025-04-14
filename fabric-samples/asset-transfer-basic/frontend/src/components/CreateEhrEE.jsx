import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

function CreateEhr() {
  const location = useLocation();
  const navigate = useNavigate();
  const patient = location.state?.patient;
  const [formData, setFormData] = useState({
    diagnosis: '',
    medications: '',
    test_results: {
      blood_pressure: '',
      allergy: '',
      cholesterol: ''
    },
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('test_')) {
      const testName = name.split('_')[1];
      setFormData(prev => ({
        ...prev,
        test_results: {
          ...prev.test_results,
          [testName]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:8000/patient/create-ehr', {
        nid_no: patient.nid_no,
        ...formData
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.success) {
        navigate('/doctor/patient-ehrs', { state: { patient } });
      } else {
        setError(response.data.error || 'Failed to create EHR');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create EHR');
    } finally {
      setLoading(false);
    }
  };

  if (!patient) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center text-success fs-3">
        No patient selected
      </div>
    );
  }

  return (
    <div className="min-vh-100 py-5" style={{ background: 'linear-gradient(135deg, #f8f9fa, #d4edda)', paddingTop: '80px' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card border-0 shadow rounded-3">
              <div className="card-header bg-success text-white">
                <h4 className="mb-0">Create New EHR for {patient.name}</h4>
              </div>
              <div className="card-body">
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="diagnosis" className="form-label">Diagnosis</label>
                    <textarea
                      className="form-control"
                      id="diagnosis"
                      name="diagnosis"
                      rows="3"
                      value={formData.diagnosis}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="medications" className="form-label">Medications</label>
                    <textarea
                      className="form-control"
                      id="medications"
                      name="medications"
                      rows="3"
                      value={formData.medications}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="card mb-3 border-light shadow-sm">
                    <div className="card-header bg-light fw-semibold">Test Results</div>
                    <div className="card-body">
                      <div className="mb-3">
                        <label htmlFor="test_blood_pressure" className="form-label">Blood Pressure</label>
                        <input
                          type="text"
                          className="form-control"
                          id="test_blood_pressure"
                          name="test_blood_pressure"
                          value={formData.test_results.blood_pressure}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="test_allergy" className="form-label">Allergy</label>
                        <input
                          type="text"
                          className="form-control"
                          id="test_allergy"
                          name="test_allergy"
                          value={formData.test_results.allergy}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="test_cholesterol" className="form-label">Cholesterol</label>
                        <input
                          type="text"
                          className="form-control"
                          id="test_cholesterol"
                          name="test_cholesterol"
                          value={formData.test_results.cholesterol}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="notes" className="form-label">Notes</label>
                    <textarea
                      className="form-control"
                      id="notes"
                      name="notes"
                      rows="3"
                      value={formData.notes}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="d-flex justify-content-between">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => navigate('/doctor')}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-success"
                      disabled={loading}
                    >
                      {loading ? 'Creating...' : 'Create EHR'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateEhr; 