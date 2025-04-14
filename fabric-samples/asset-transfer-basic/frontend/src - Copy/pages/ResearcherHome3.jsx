import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Pie, Scatter, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function ResearcherHome() {
  const [metadata, setMetadata] = useState(null);
  const [filters, setFilters] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [dataCount, setDataCount] = useState(0);
  const [activeTab, setActiveTab] = useState('demographics');

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
          axios.get('http://localhost:8000/researcher/filters'),
        ]);
        setMetadata(metaRes.data);
        setFilters(filtersRes.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch metadata or filters: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMetadata();
  }, []);

  const fetchPreviewData = async () => {
    setPreviewLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/researcher/preview', {
        ageGroups: selectedAgeGroups,
        genders: selectedGenders,
        diagnoses: selectedDiagnoses,
        bloodGroups: selectedBloodGroups,
        limit: 500,
      });
      setPreviewData(response.data);
      setDataCount(response.data.length);
      setError(null);
    } catch (err) {
      setError('Failed to fetch preview data: ' + err.message);
      setPreviewData([]);
      setDataCount(0);
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (filters) fetchPreviewData();
  }, [selectedAgeGroups, selectedGenders, selectedDiagnoses, selectedBloodGroups, filters]);

  const handleExportAll = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/researcher/export/csv', { responseType: 'blob' });
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
          bloodGroups: selectedBloodGroups,
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
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (item, selectedItems, setSelectedItems) => {
    if (selectedItems.includes(item)) {
      setSelectedItems(selectedItems.filter(i => i !== item));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const clearFilters = () => {
    setSelectedAgeGroups([]);
    setSelectedBloodGroups([]);
    setSelectedGenders([]);
    setSelectedDiagnoses([]);
  };

  const getTableHeaders = () => (previewData.length === 0 ? [] : Object.keys(previewData[0]));

  const formatCellData = (value) => {
    if (!value) return '—';
    if (value === 'None' || value === 'N/A' || value === 'Unknown') return value;
    if (typeof value === 'string' && value.length > 50) return value.substring(0, 50) + '...';
    return value;
  };

  // 1. Demographics: Age Distribution by Gender
  const getAgeDistributionByGender = () => {
    if (previewData.length === 0) return null;
    
    const ageGroups = ['0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61-70', '71+'];
    const genders = [...new Set(previewData.map(d => d.Gender))].filter(g => g);
    
    const datasets = genders.map((gender, index) => {
      const colors = [
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 99, 132, 0.7)',
        'rgba(75, 192, 192, 0.7)'
      ];
      
      const counts = ageGroups.map(group => {
        const [min, max] = group.includes('+') 
          ? [parseInt(group), 150] 
          : group.split('-').map(Number);
        
        return previewData.filter(d => 
          d.Gender === gender && 
          d.Age >= min && 
          d.Age <= max
        ).length;
      });
      
      return {
        label: gender,
        data: counts,
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length].replace('0.7', '1'),
        borderWidth: 1
      };
    });
    
    return {
      data: {
        labels: ageGroups,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Age Distribution by Gender',
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            callbacks: {
              title: (tooltipItems) => `Age Group: ${tooltipItems[0].label}`,
              label: (context) => `${context.dataset.label}: ${context.raw} patients`
            }
          },
          legend: {
            position: 'top'
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Age Range (years)',
              font: { size: 14 }
            }
          },
          y: {
            title: {
              display: true,
              text: 'Number of Patients',
              font: { size: 14 }
            },
            beginAtZero: true
          }
        }
      }
    };
  };

  // 2. Medication Starts by Month (Improved with trends)
  const getMedicationStartsByMonth = () => {
    // Define the date range: last 12 months
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
  
    // Filter data for the last 12 months with medication
    const validData = previewData.filter(d => {
      if (!d.Visit_Date || !d.Medication || d.Medication === 'None') return false;
      const visitDate = new Date(d.Visit_Date);
      return visitDate >= oneYearAgo && visitDate <= today;
    });
  
    if (validData.length === 0) {
      return null;
    }
  
    // Define months
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    // Create array of monthly counts
    const monthlyCounts = [];
    const monthLabels = [];
    
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(today);
      monthDate.setMonth(today.getMonth() - (11 - i));
      
      const monthIndex = monthDate.getMonth();
      const year = monthDate.getFullYear();
      const monthLabel = `${months[monthIndex]} ${year}`;
      
      const count = validData.filter(d => {
        const visitDate = new Date(d.Visit_Date);
        return visitDate.getMonth() === monthIndex && 
               visitDate.getFullYear() === year;
      }).length;
      
      monthlyCounts.push(count);
      monthLabels.push(monthLabel);
    }
    
    // Calculate 3-month moving average for trend analysis
    const movingAverage = [];
    for (let i = 0; i < monthlyCounts.length; i++) {
      if (i < 2) {
        movingAverage.push(null);
      } else {
        const avg = (monthlyCounts[i] + monthlyCounts[i-1] + monthlyCounts[i-2]) / 3;
        movingAverage.push(avg.toFixed(1));
      }
    }
  
    return {
      data: {
        labels: monthLabels,
        datasets: [
          {
            type: 'bar',
            label: 'Medication Starts',
            data: monthlyCounts,
            backgroundColor: 'rgba(40, 167, 69, 0.7)',
            borderColor: 'rgba(33, 136, 56, 1)',
            borderWidth: 1,
            order: 2
          },
          {
            type: 'line',
            label: '3-Month Moving Average',
            data: movingAverage,
            borderColor: 'rgba(220, 53, 69, 1)',
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: 'rgba(220, 53, 69, 1)',
            fill: false,
            tension: 0.4,
            order: 1
          }
        ],
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: { 
            display: true, 
            text: `Medication Starts by Month (Last 12 Months)`,
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          x: { 
            title: { display: true, text: 'Month', font: { size: 14 } }
          },
          y: { 
            title: { display: true, text: 'Number of Patients', font: { size: 14 } }, 
            beginAtZero: true 
          }
        }
      }
    };
  };

  // 3. Blood Pressure vs Cholesterol with Correlation Analysis
  const getBPCholesterolCorrelation = () => {
    // Filter for valid data points
    const validData = previewData.filter(d => {
      const bpMatch = d.Blood_Pressure && d.Blood_Pressure.match(/^(\d+)\/(\d+)$/);
      const cholMatch = d.Cholesterol && d.Cholesterol.match(/^(\d+) mg\/dL$/);
      return bpMatch && cholMatch;
    });
    
    if (validData.length < 10) {
      return null; // Not enough data for meaningful correlation
    }
    
    // Extract values
    const dataPoints = validData.map(d => {
      const systolic = parseInt(d.Blood_Pressure.split('/')[0]);
      const cholesterol = parseInt(d.Cholesterol.replace(' mg/dL', ''));
      return { x: cholesterol, y: systolic };
    });
    
    // Calculate linear regression
    const n = dataPoints.length;
    const sumX = dataPoints.reduce((sum, p) => sum + p.x, 0);
    const sumY = dataPoints.reduce((sum, p) => sum + p.y, 0);
    const sumXY = dataPoints.reduce((sum, p) => sum + (p.x * p.y), 0);
    const sumXX = dataPoints.reduce((sum, p) => sum + (p.x * p.x), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate correlation coefficient (r)
    const sumYY = dataPoints.reduce((sum, p) => sum + (p.y * p.y), 0);
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    const r = numerator / denominator;
    const rSquared = r * r;
    
    // Generate regression line points
    const minX = Math.min(...dataPoints.map(p => p.x));
    const maxX = Math.max(...dataPoints.map(p => p.x));
    
    const regressionLine = [
      { x: minX, y: slope * minX + intercept },
      { x: maxX, y: slope * maxX + intercept }
    ];
    
    // Color points by age group for additional insights
    const colorByAge = dataPoints.map((_, i) => {
      const age = validData[i].Age;
      if (age < 30) return 'rgba(54, 162, 235, 0.7)'; // Young
      if (age < 60) return 'rgba(255, 159, 64, 0.7)'; // Middle-aged
      return 'rgba(255, 99, 132, 0.7)'; // Elderly
    });
    
    return {
      data: {
        datasets: [
          {
            label: 'Patient Data',
            data: dataPoints,
            backgroundColor: colorByAge,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
          {
            label: 'Regression Line',
            data: regressionLine,
            type: 'line',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Systolic Blood Pressure vs. Cholesterol Correlation',
            font: { size: 16, weight: 'bold' }
          },
          subtitle: {
            display: true,
            text: `Correlation: r = ${r.toFixed(3)}, r² = ${rSquared.toFixed(3)}`,
            font: { size: 14 }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                if (context.datasetIndex === 0) {
                  const dataIndex = context.dataIndex;
                  const age = validData[dataIndex].Age;
                  const gender = validData[dataIndex].Gender;
                  return [
                    `Cholesterol: ${context.parsed.x} mg/dL`,
                    `Systolic BP: ${context.parsed.y} mmHg`,
                    `Age: ${age}, Gender: ${gender}`
                  ];
                } else {
                  return `Predicted BP: ${context.parsed.y.toFixed(1)} mmHg`;
                }
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Cholesterol (mg/dL)',
              font: { size: 14 }
            },
            min: Math.max(100, minX - 20),
            max: Math.min(300, maxX + 20)
          },
          y: {
            title: {
              display: true,
              text: 'Systolic BP (mmHg)',
              font: { size: 14 }
            },
            min: Math.max(80, Math.min(...dataPoints.map(p => p.y)) - 10),
            max: Math.min(200, Math.max(...dataPoints.map(p => p.y)) + 10)
          }
        }
      },
      stats: {
        n: n,
        r: r.toFixed(3),
        rSquared: rSquared.toFixed(3),
        equation: `BP = ${slope.toFixed(2)} × Cholesterol + ${intercept.toFixed(2)}`
      }
    };
  };
  // 4. Diagnosis Prevalence by Age Group
  const getDiagnosisPrevalenceByAge = () => {
    if (previewData.length === 0) return null;

    const ageGroups = ['0-20', '21-40', '41-60', '61+'];
    
    // Get top diagnoses
    const allDiagnoses = previewData.flatMap(d => d.Diagnosis?.split(', ') || []);
    const diagnosisCounts = {};
    allDiagnoses.forEach(diag => {
      if (diag) diagnosisCounts[diag] = (diagnosisCounts[diag] || 0) + 1;
    });
    
    const topDiagnoses = Object.entries(diagnosisCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
    
    const colors = [
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 99, 132, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(255, 159, 64, 0.7)',
      'rgba(153, 102, 255, 0.7)'
    ];
    
    const datasets = topDiagnoses.map((diagnosis, index) => {
      // Calculate prevalence rate within each age group
      const data = ageGroups.map(group => {
        const [min, max] = group.includes('+') 
          ? [parseInt(group), 150] 
          : group.split('-').map(Number);
        
        const patientsInAgeGroup = previewData.filter(d => 
          d.Age >= min && 
          d.Age <= max
        );
        
        const patientsWithDiagnosis = patientsInAgeGroup.filter(d => 
          d.Diagnosis?.includes(diagnosis)
        );
        
        return patientsInAgeGroup.length > 0 
          ? (patientsWithDiagnosis.length / patientsInAgeGroup.length * 100).toFixed(1)
          : 0;
      });
      
      return {
        label: diagnosis,
        data,
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length].replace('0.7', '1'),
        borderWidth: 1
      };
    });
    
    return {
      data: {
        labels: ageGroups,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Diagnosis Prevalence by Age Group',
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.raw}% prevalence`
            }
          },
          legend: {
            position: 'top'
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Age Group (years)',
              font: { size: 14 }
            }
          },
          y: {
            title: {
              display: true,
              text: 'Prevalence (%)',
              font: { size: 14 }
            },
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: (value) => `${value}%`
            }
          }
        }
      }
    };
  };

  // 5. Blood Pressure and Cholesterol by Age
  const getClinicalMetricsByAge = () => {
    if (previewData.length === 0) return null;
    
    // Create age groups for analysis
    const ageGroups = ['0-20', '21-35', '36-50', '51-65', '66+'];
    
    // Calculate average BP for each age group
    const bpData = ageGroups.map(group => {
      const [min, max] = group.includes('+') 
        ? [parseInt(group), 150] 
        : group.split('-').map(Number);
      
      const patients = previewData.filter(d => 
        d.Age >= min && 
        d.Age <= max &&
        d.Blood_Pressure?.match(/^(\d+)\/(\d+)$/)
      );
      
      if (patients.length === 0) return null;
      
      const systolicValues = patients.map(d => parseInt(d.Blood_Pressure.split('/')[0]));
      return systolicValues.reduce((sum, val) => sum + val, 0) / systolicValues.length;
    });
    
    // Calculate average cholesterol for each age group
    const cholData = ageGroups.map(group => {
      const [min, max] = group.includes('+') 
        ? [parseInt(group), 150] 
        : group.split('-').map(Number);
      
      const patients = previewData.filter(d => 
        d.Age >= min && 
        d.Age <= max &&
        d.Cholesterol?.match(/^(\d+) mg\/dL$/)
      );
      
      if (patients.length === 0) return null;
      
      const cholValues = patients.map(d => parseInt(d.Cholesterol.replace(' mg/dL', '')));
      return cholValues.reduce((sum, val) => sum + val, 0) / cholValues.length;
    });
    
    return {
      data: {
        labels: ageGroups,
        datasets: [
          {
            label: 'Avg. Systolic BP',
            data: bpData,
            borderColor: 'rgba(111, 66, 193, 1)',
            backgroundColor: 'rgba(111, 66, 193, 0.1)',
            fill: true,
            tension: 0.3,
            yAxisID: 'y'
          },
          {
            label: 'Avg. Cholesterol',
            data: cholData,
            borderColor: 'rgba(220, 53, 69, 1)',
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            fill: true,
            tension: 0.3,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Blood Pressure and Cholesterol by Age Group',
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Age Group',
              font: { size: 14 }
            }
          },
          y: {
            type: 'linear',
            position: 'left',
            title: {
              display: true,
              text: 'Systolic BP (mmHg)',
              font: { size: 14 }
            }
          },
          y1: {
            type: 'linear',
            position: 'right',
            title: {
              display: true,
              text: 'Cholesterol (mg/dL)',
              font: { size: 14 }
            },
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    };
  };

  // 6. Helper component to display correlation statistics
  const CorrelationStats = ({ stats }) => {
    if (!stats) return null;
    
    return (
      <div className="bg-light p-3 rounded mt-3">
        <h6 className="fw-bold mb-2">Statistical Analysis</h6>
        <div className="row">
          <div className="col-md-6">
            <p className="mb-1"><strong>Sample Size:</strong> {stats.n} patients</p>
            <p className="mb-1"><strong>Correlation (r):</strong> {stats.r}</p>
            <p className="mb-1"><strong>Determination (r²):</strong> {stats.rSquared}</p>
          </div>
          <div className="col-md-6">
            <p className="mb-1"><strong>Regression Equation:</strong> {stats.equation}</p>
            <p className="mb-1"><strong>Interpretation:</strong> {
              parseFloat(stats.r) > 0.7 ? "Strong positive correlation" : 
              parseFloat(stats.r) > 0.3 ? "Moderate positive correlation" :
              parseFloat(stats.r) > 0 ? "Weak positive correlation" :
              parseFloat(stats.r) > -0.3 ? "Weak negative correlation" :
              parseFloat(stats.r) > -0.7 ? "Moderate negative correlation" :
              "Strong negative correlation"
            }</p>
          </div>
        </div>
      </div>
    );
  };

  // Main component render
  return (
    <div className="min-vh-100 bg-light py-4">
      <div className="container">
        <h2 className="display-5 fw-bold text-center mb-4" style={{ color: '#6f42c1' }}>
          Research Dashboard
        </h2>
        
        {error && <div className="alert alert-danger mb-4">{error}</div>}
        
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Data Filters</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
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
              <div className="col-md-6 mb-3">
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
              <div className="col-md-6 mb-3">
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
              <div className="col-md-6 mb-3">
                <h6>Diagnosis</h6>
                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
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
            <div className="d-flex justify-content-between mt-3">
              <button className="btn btn-outline-secondary" onClick={clearFilters}>
                Clear Filters
              </button>
              <div>
                <button className="btn btn-primary me-2" onClick={handleExportFiltered} disabled={loading}>
                  {loading ? 'Exporting...' : 'Export Filtered Data (CSV)'}
                </button>
                <button className="btn btn-primary" onClick={handleExportAll} disabled={loading}>
                  {loading ? 'Exporting...' : 'Export All Data (CSV)'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {previewData.length > 0 ? (
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <ul className="nav nav-tabs card-header-tabs">
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'demographics' ? 'active' : 'text-white'}`}
                    onClick={() => setActiveTab('demographics')}
                  >
                    Demographics
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'clinical' ? 'active' : 'text-white'}`}
                    onClick={() => setActiveTab('clinical')}
                  >
                    Clinical Metrics
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'temporal' ? 'active' : 'text-white'}`}
                    onClick={() => setActiveTab('temporal')}
                  >
                    Temporal Trends
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'correlations' ? 'active' : 'text-white'}`}
                    onClick={() => setActiveTab('correlations')}
                  >
                    Correlations
                  </button>
                </li>
              </ul>
            </div>
            <div className="card-body">
              {previewLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border" role="status"></div>
                  <p className="mt-3 text-muted">Processing data...</p>
                </div>
              ) : (
                <>
                  {/* Demographics Tab */}
                  {activeTab === 'demographics' && (
                    <div>
                      <h4>Patient Demographics</h4>
                      <p className="text-muted">
                        Demographic analysis of the patient population by age and gender.
                      </p>
                      <div className="mt-4 mb-4" style={{ height: '400px' }}>
                        {getAgeDistributionByGender() ? (
                          <Bar {...getAgeDistributionByGender()} />
                        ) : (
                          <div className="d-flex justify-content-center align-items-center h-100">
                            <p className="text-muted">Insufficient demographic data for visualization.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Clinical Metrics Tab */}
                  {activeTab === 'clinical' && (
                    <div>
                      <h4>Clinical Analysis</h4>
                      <p className="text-muted">
                        Analysis of key clinical metrics including diagnosis prevalence and health indicators across different age groups.
                      </p>
                      <div className="mt-4 mb-4" style={{ height: '400px' }}>
                        {getDiagnosisPrevalenceByAge() ? (
                          <Bar {...getDiagnosisPrevalenceByAge()} />
                        ) : (
                          <div className="d-flex justify-content-center align-items-center h-100">
                            <p className="text-muted">Insufficient diagnosis data for visualization.</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-5 mb-4" style={{ height: '400px' }}>
                        {getClinicalMetricsByAge() ? (
                          <Line {...getClinicalMetricsByAge()} />
                        ) : (
                          <div className="d-flex justify-content-center align-items-center h-100">
                            <p className="text-muted">Insufficient clinical data for age trend analysis.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Temporal Trends Tab */}
                  {activeTab === 'temporal' && (
                    <div>
                      <h4>Temporal Trends</h4>
                      <p className="text-muted">
                        Analysis of changes over time, including medication starts by month.
                      </p>
                      <div className="mt-4 mb-4" style={{ height: '400px' }}>
                        {getMedicationStartsByMonth() ? (
                          <Bar {...getMedicationStartsByMonth()} />
                        ) : (
                          <div className="d-flex justify-content-center align-items-center h-100">
                            <p className="text-muted">Insufficient medication data for temporal analysis.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Correlations Tab */}
                  {activeTab === 'correlations' && (
                    <div>
                      <h4>Statistical Correlations</h4>
                      <p className="text-muted">
                        Statistical analysis of relationships between different health metrics, with regression analysis and correlation coefficients.
                      </p>
                      <div className="mt-4 mb-4" style={{ height: '400px' }}>
                        {getBPCholesterolCorrelation() ? (
                          <Scatter {...getBPCholesterolCorrelation()} />
                        ) : (
                          <div className="d-flex justify-content-center align-items-center h-100">
                            <p className="text-muted">Insufficient data for correlation analysis. Try broadening your filters.</p>
                          </div>
                        )}
                      </div>
                      
                      {getBPCholesterolCorrelation() && (
                        <CorrelationStats stats={getBPCholesterolCorrelation().stats} />
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="alert alert-info my-4">
            <p className="mb-0">No data available. Please adjust your filters or load more data.</p>
          </div>
        )}
        
        <div className="card mb-4">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Data Preview {dataCount > 0 ? `(${dataCount} records, showing top 20)` : ''}</h5>
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
                <div className="spinner-border" role="status"></div>
                <p className="mt-2 text-muted">Loading preview data...</p>
              </div>
            ) : previewData.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-striped table-hover table-sm">
                  <thead className="table-light">
                    <tr>
                      {getTableHeaders().map((header) => (
                        <th key={header}>{header.replace('_', ' ')}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 20).map((row, index) => (
                      <tr key={index}>
                        {Object.values(row).map((value, i) => (
                          <td key={i}>{formatCellData(value)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted py-4">No data matches the selected filters.</p>
            )}
          </div>
        </div>
        
        <div className="card">
          <div className="card-header bg-secondary text-white">
            <h5 className="mb-0">Research Data Guide</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <h6 className="fw-bold">Data Dictionary</h6>
                <ul>
                  <li><strong>Age_Group:</strong> Patient age range</li>
                  <li><strong>Age:</strong> Exact age in years</li>
                  <li><strong>Gender:</strong> Patient gender</li>
                  <li><strong>Diagnosis:</strong> Medical diagnosis</li>
                  <li><strong>Medication:</strong> Prescribed medications</li>
                  <li><strong>Blood_Pressure:</strong> Blood pressure readings (Systolic/Diastolic)</li>
                  <li><strong>Cholesterol:</strong> Cholesterol levels in mg/dL</li>
                  <li><strong>Allergy:</strong> Known allergies</li>
                  <li><strong>Blood_Group:</strong> Blood type</li>
                  <li><strong>Visit_Date:</strong> Date of the EHR record</li>
                </ul>
              </div>
              <div className="col-md-6">
                <h6 className="fw-bold">Research Tips</h6>
                <ul>
                  <li>Use the <strong>Demographics</strong> tab to understand your research population</li>
                  <li>The <strong>Correlations</strong> tab shows relationships between measurements with statistical significance</li>
                  <li>Examine clinical patterns in the <strong>Clinical Metrics</strong> tab</li>
                  <li>All data is anonymized to protect patient privacy</li>
                  <li>Export the CSV for more detailed analysis in statistical software</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResearcherHome;