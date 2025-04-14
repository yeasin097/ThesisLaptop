import { useState, useEffect } from 'react';
import axios from 'axios';
import PatientCard from './PatientCard';

function PatientList() {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await axios.get('http://localhost:8000/patient/all');
        const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        const patientList = data.map(item => JSON.parse(item));
        setPatients(patientList);
        setFilteredPatients([]); // Initialize with empty array to show no patients initially
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch patient data.');
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPatients([]); // Show no patients if search term is empty
    } else {
      const filtered = patients.filter(
        patient =>
          patient.name.toLowerCase() === searchTerm.toLowerCase() ||
          patient.nid_no === searchTerm
      );
      setFilteredPatients(filtered);
    }
  }, [searchTerm, patients]);

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}></div>
        <span className="ms-3 text-success fs-3">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center text-danger fs-3">
        {error}
      </div>
    );
  }

  return (
    <div
      className="min-vh-100 py-5"
      style={{ background: 'linear-gradient(135deg, #f8f9fa, #d4edda)', paddingTop: '80px' }}
    >
      <div className="container">
        <h2
          className="display-4 text-success fw-bold text-center mb-5"
          style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}
        >
          Patient List
        </h2>
        <div className="mb-5 position-relative w-75 mx-auto">
          <input
            type="text"
            className="form-control form-control-lg rounded-pill ps-5 shadow-sm"
            placeholder="Search by name or NID (exact match)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: '2px solid #28a745', fontSize: '1.1rem' }}
          />
          <i
            className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-4 text-success"
            style={{ fontSize: '1.2rem' }}
          ></i>
        </div>
        {filteredPatients.length === 0 && searchTerm.trim() !== '' && (
          <div className="text-center text-muted fs-4">
            No patients found for "{searchTerm}".
          </div>
        )}
        {filteredPatients.length === 0 && searchTerm.trim() === '' && (
          <div className="text-center text-muted fs-4">
            Please enter a name or NID to search.
          </div>
        )}
        <div className="row g-3">
          {filteredPatients.map((patient, index) => (
            <PatientCard key={index} patient={patient} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default PatientList;