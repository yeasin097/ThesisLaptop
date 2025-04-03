import { useState, useEffect } from 'react';
import axios from 'axios';

function ResearcherHome() {
  const [metadata, setMetadata] = useState(null);
  const [filters, setFilters] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [dataCount, setDataCount] = useState(0);

  // Filter states
  const [selectedAgeGroups, setSelectedAgeGroups] = useState([]);
  const [selectedBloodGroups, setSelectedBloodGroups] = useState([]);
  const [selectedGenders, setSelectedGenders] = useState([]);
  const [selectedDiagnoses, setSelectedDiagnoses] = useState([]);

  useEffect(() => {
    const fetchMetadata = async () => {
      setLoading(true);
      try {
        const [metaRes, filtersRes] = await Promise.all([
          axios.get('http://localhost:8000/researcher/metadata'),
          axios.get('http://localhost:8000/researcher/filters')
        ]);
        setMetadata(metaRes.data);
        setFilters(filtersRes.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch metadata or filters: ' + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetadata();
  }, []);

  // Function to fetch preview data based on current filters
  const fetchPreviewData = async () => {
    setPreviewLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:8000/researcher/preview',
        {
          ageGroups: selectedAgeGroups,
          genders: selectedGenders,
          diagnoses: selectedDiagnoses,
          bloodGroups: selectedBloodGroups,
          limit: 10 // Get top 10 records
        }
      );
      setPreviewData(response.data);
      setDataCount(response.data.length);
      setError(null);
    } catch (err) {
      setError('Failed to fetch preview data: ' + err.message);
      console.error(err);
      setPreviewData([]);
      setDataCount(0);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Fetch preview data whenever filters change
  useEffect(() => {
    // Only fetch if filters are loaded
    if (filters) {
      fetchPreviewData();
    }
  }, [selectedAgeGroups, selectedGenders, selectedDiagnoses, selectedBloodGroups, filters]);

  const handleExportAll = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/researcher/export/csv', {
        responseType: 'blob' // For file download
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ehr_research_data.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      setError(null);
    } catch (err) {
      setError('Failed to export all EHR data: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportFiltered = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        'http://localhost:8000/researcher/export/filtered-csv',
        {
          ageGroups: selectedAgeGroups,
          genders: selectedGenders,
          diagnoses: selectedDiagnoses,
          bloodGroups: selectedBloodGroups
        },
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ehr_research_data_filtered.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      setError(null);
    } catch (err) {
      setError('Failed to export filtered EHR data: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle selection in a multi-select list
  const toggleSelection = (item, selectedItems, setSelectedItems) => {
    if (selectedItems.includes(item)) {
      setSelectedItems(selectedItems.filter(i => i !== item));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedAgeGroups([]);
    setSelectedBloodGroups([]);
    setSelectedGenders([]);
    setSelectedDiagnoses([]);
  };

  // Generate table headers based on available data
  const getTableHeaders = () => {
    if (previewData.length === 0) return [];
    return Object.keys(previewData[0]);
  };

  // Format cell data for better display
  const formatCellData = (value) => {
    if (!value) return '—';
    if (value === 'None' || value === 'N/A' || value === 'Unknown') return value;
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '...';
    }
    return value;
  };

  if (loading && (!metadata || !filters)) {
    return <div className="text-center mt-5">Loading metadata and filters...</div>;
  }
  
  return (
    <div className="container py-5">
      <h2 className="text-center mb-4">Healthcare Research Dashboard</h2>
      
      {loading && <div className="alert alert-info">Processing request...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filter Section */}
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">Data Filters</h5>
        </div>
        <div className="card-body">
          <div className="row">
            {/* Age Groups Filter */}
            <div className="col-md-6 mb-4">
              <h6>Age Groups</h6>
              <div className="d-flex flex-wrap gap-2">
                {filters?.ageGroups?.map((group) => (
                  <div key={group} className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`age-${group}`}
                      checked={selectedAgeGroups.includes(group)}
                      onChange={() => toggleSelection(group, selectedAgeGroups, setSelectedAgeGroups)}
                    />
                    <label className="form-check-label" htmlFor={`age-${group}`}>{group}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Gender Filter */}
            <div className="col-md-6 mb-4">
              <h6>Gender</h6>
              <div className="d-flex flex-wrap gap-2">
                {filters?.genders?.map((gender) => (
                  <div key={gender} className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`gender-${gender}`}
                      checked={selectedGenders.includes(gender)}
                      onChange={() => toggleSelection(gender, selectedGenders, setSelectedGenders)}
                    />
                    <label className="form-check-label" htmlFor={`gender-${gender}`}>{gender}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Blood Group Filter */}
            <div className="col-md-6 mb-4">
              <h6>Blood Groups</h6>
              <div className="d-flex flex-wrap gap-2">
                {filters?.bloodGroups?.map((group) => (
                  <div key={group} className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`blood-${group}`}
                      checked={selectedBloodGroups.includes(group)}
                      onChange={() => toggleSelection(group, selectedBloodGroups, setSelectedBloodGroups)}
                    />
                    <label className="form-check-label" htmlFor={`blood-${group}`}>{group}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Diagnosis Filter */}
            <div className="col-md-6 mb-4">
              <h6>Diagnosis</h6>
              <div style={{maxHeight: '150px', overflowY: 'auto'}}>
                {filters?.diagnoses?.map((diagnosis) => (
                  <div key={diagnosis} className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`diagnosis-${diagnosis}`}
                      checked={selectedDiagnoses.includes(diagnosis)}
                      onChange={() => toggleSelection(diagnosis, selectedDiagnoses, setSelectedDiagnoses)}
                    />
                    <label className="form-check-label" htmlFor={`diagnosis-${diagnosis}`}>{diagnosis}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="d-flex justify-content-between mt-3">
            <button 
              className="btn btn-outline-secondary" 
              onClick={clearFilters}
            >
              Clear Filters
            </button>
            <div>
              <button 
                className="btn btn-success me-2" 
                onClick={handleExportFiltered}
                disabled={loading}
              >
                {loading ? 'Exporting...' : 'Export Filtered Data (CSV)'}
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleExportAll}
                disabled={loading}
              >
                {loading ? 'Exporting...' : 'Export All Data (CSV)'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Summary */}
      <div className="card mb-4">
        <div className="card-header bg-info text-white">
          <h5 className="mb-0">Selected Filters</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <h6>Age Groups</h6>
              {selectedAgeGroups.length > 0 ? (
                <ul className="list-unstyled">
                  {selectedAgeGroups.map(age => (
                    <li key={age}>{age}</li>
                  ))}
                </ul>
              ) : <p className="text-muted">All age groups</p>}
            </div>
            <div className="col-md-3">
              <h6>Genders</h6>
              {selectedGenders.length > 0 ? (
                <ul className="list-unstyled">
                  {selectedGenders.map(gender => (
                    <li key={gender}>{gender}</li>
                  ))}
                </ul>
              ) : <p className="text-muted">All genders</p>}
            </div>
            <div className="col-md-3">
              <h6>Blood Groups</h6>
              {selectedBloodGroups.length > 0 ? (
                <ul className="list-unstyled">
                  {selectedBloodGroups.map(blood => (
                    <li key={blood}>{blood}</li>
                  ))}
                </ul>
              ) : <p className="text-muted">All blood groups</p>}
            </div>
            <div className="col-md-3">
              <h6>Diagnoses</h6>
              {selectedDiagnoses.length > 0 ? (
                <ul className="list-unstyled" style={{maxHeight: '100px', overflowY: 'auto'}}>
                  {selectedDiagnoses.map(diagnosis => (
                    <li key={diagnosis}>{diagnosis}</li>
                  ))}
                </ul>
              ) : <p className="text-muted">All diagnoses</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Data Preview Section */}
      <div className="card mb-4">
        <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Data Preview {dataCount > 0 ? `(${dataCount} records)` : ''}</h5>
          <button 
            className="btn btn-sm btn-light" 
            onClick={fetchPreviewData}
            disabled={previewLoading}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            {previewLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div className="card-body">
          {previewLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading preview data...</p>
            </div>
          ) : previewData.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-striped table-hover table-sm">
                <thead className="table-light">
                  <tr>
                    {getTableHeaders().map((header) => (
                      <th key={header} className="text-nowrap">{header.replace('_', ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, i) => (
                        <td key={i} className="text-nowrap">{formatCellData(value)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted">No data matches the selected filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Help Information */}
      <div className="card">
        <div className="card-header bg-secondary text-white">
          <h5 className="mb-0">Research Data Explanation</h5>
        </div>
        <div className="card-body">
          <p>This dashboard allows you to export anonymized healthcare data for research purposes. The exported CSV file contains the following fields:</p>
          <ul>
            <li><strong>Age_Group:</strong> Patient age range (0-20, 21-35, 36-50, 51-65, 65+)</li>
            <li><strong>Gender:</strong> Patient gender</li>
            <li><strong>Diagnosis:</strong> Medical diagnosis</li>
            <li><strong>Medication:</strong> Prescribed medications</li>
            <li><strong>Blood_Pressure:</strong> Patient blood pressure readings</li>
            <li><strong>Cholesterol:</strong> Cholesterol level measurements</li>
            <li><strong>Allergy:</strong> Known allergies</li>
            <li><strong>Blood_Group:</strong> Patient blood type</li>
            <li><strong>notes:</strong> Additional clinical notes</li>
          </ul>
          <p className="text-muted"><small>All data is anonymized to protect patient privacy while enabling valuable medical research.</small></p>
        </div>
      </div>
    </div>
  );
}

export default ResearcherHome;