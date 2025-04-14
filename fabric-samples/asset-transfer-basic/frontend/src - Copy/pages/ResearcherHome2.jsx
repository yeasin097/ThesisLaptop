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
      const colors = ['rgba(54, 162, 235, 0.7)', 'rgba(255, 99, 132, 0.7)', 'rgba(75, 192, 192, 0.7)'];
      const counts = ageGroups.map(group => {
        const [min, max] = group.includes('+') ? [parseInt(group), 150] : group.split('-').map(Number);
        return previewData.filter(d => d.Gender === gender && d.Age >= min && d.Age <= max).length;
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
      data: { labels: ageGroups, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { title: { display: true, text: 'Age Distribution by Gender', font: { size: 16, weight: 'bold' } }, legend: { position: 'top' } },
        scales: { x: { title: { display: true, text: 'Age Range (years)' } }, y: { title: { display: true, text: 'Number of Patients' }, beginAtZero: true } }
      }
    };
  };

  // 2. Medication Starts by Month
  const getMedicationStartsByMonth = () => {
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
  
    const validData = previewData.filter(d => {
      if (!d.Visit_Date || !d.Medication || d.Medication === 'None') return false;
      const visitDate = new Date(d.Visit_Date);
      return visitDate >= oneYearAgo && visitDate <= today;
    });
  
    if (validData.length === 0) return null;
  
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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
        return visitDate.getMonth() === monthIndex && visitDate.getFullYear() === year;
      }).length;
      monthlyCounts.push(count);
      monthLabels.push(monthLabel);
    }
    
    const movingAverage = monthlyCounts.map((_, i) => i < 2 ? null : ((monthlyCounts[i] + monthlyCounts[i-1] + monthlyCounts[i-2]) / 3).toFixed(1));
  
    return {
      data: {
        labels: monthLabels,
        datasets: [
          { type: 'bar', label: 'Medication Starts', data: monthlyCounts, backgroundColor: 'rgba(40, 167, 69, 0.7)', borderColor: 'rgba(33, 136, 56, 1)', borderWidth: 1, order: 2 },
          { type: 'line', label: '3-Month Moving Average', data: movingAverage, borderColor: 'rgba(220, 53, 69, 1)', backgroundColor: 'rgba(220, 53, 69, 0.1)', borderWidth: 2, pointRadius: 3, fill: false, tension: 0.4, order: 1 }
        ],
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: { legend: { position: 'top' }, title: { display: true, text: 'Medication Starts by Month (Last 12 Months)', font: { size: 16, weight: 'bold' } } },
        scales: { x: { title: { display: true, text: 'Month' } }, y: { title: { display: true, text: 'Number of Patients' }, beginAtZero: true } }
      }
    };
  };

  // 3. Blood Pressure vs Cholesterol with Correlation Analysis
  const getBPCholesterolCorrelation = () => {
    const validData = previewData.filter(d => {
      const bpMatch = d.Blood_Pressure && d.Blood_Pressure.match(/^(\d+)\/(\d+)$/);
      const cholMatch = d.Cholesterol && d.Cholesterol.match(/^(\d+) mg\/dL$/);
      return bpMatch && cholMatch;
    });
    
    if (validData.length < 10) return null;
    
    const dataPoints = validData.map(d => ({
      x: parseInt(d.Cholesterol.replace(' mg/dL', '')),
      y: parseInt(d.Blood_Pressure.split('/')[0])
    }));
    
    const n = dataPoints.length;
    const sumX = dataPoints.reduce((sum, p) => sum + p.x, 0);
    const sumY = dataPoints.reduce((sum, p) => sum + p.y, 0);
    const sumXY = dataPoints.reduce((sum, p) => sum + (p.x * p.y), 0);
    const sumXX = dataPoints.reduce((sum, p) => sum + (p.x * p.x), 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const sumYY = dataPoints.reduce((sum, p) => sum + (p.y * p.y), 0);
    const r = (n * sumXY - sumX * sumY) / Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    const rSquared = r * r;
    
    const minX = Math.min(...dataPoints.map(p => p.x));
    const maxX = Math.max(...dataPoints.map(p => p.x));
    const regressionLine = [{ x: minX, y: slope * minX + intercept }, { x: maxX, y: slope * maxX + intercept }];
    
    const colorByAge = dataPoints.map((_, i) => {
      const age = validData[i].Age;
      return age < 30 ? 'rgba(54, 162, 235, 0.7)' : age < 60 ? 'rgba(255, 159, 64, 0.7)' : 'rgba(255, 99, 132, 0.7)';
    });
    
    return {
      data: {
        datasets: [
          { label: 'Patient Data', data: dataPoints, backgroundColor: colorByAge, pointRadius: 5, pointHoverRadius: 7 },
          { label: 'Regression Line', data: regressionLine, type: 'line', borderColor: 'rgba(75, 192, 192, 1)', borderWidth: 2, pointRadius: 0, fill: false }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: 'Systolic BP vs. Cholesterol Correlation', font: { size: 16, weight: 'bold' } },
          subtitle: { display: true, text: `Correlation: r = ${r.toFixed(3)}, r² = ${rSquared.toFixed(3)}`, font: { size: 14 } },
          tooltip: { callbacks: { label: (context) => context.datasetIndex === 0 ? [`Chol: ${context.parsed.x} mg/dL`, `BP: ${context.parsed.y} mmHg`] : `Pred BP: ${context.parsed.y.toFixed(1)} mmHg` } }
        },
        scales: { x: { title: { display: true, text: 'Cholesterol (mg/dL)' }, min: Math.max(100, minX - 20), max: Math.min(300, maxX + 20) }, y: { title: { display: true, text: 'Systolic BP (mmHg)' }, min: 80, max: 200 } }
      },
      stats: { n, r: r.toFixed(3), rSquared: rSquared.toFixed(3), equation: `BP = ${slope.toFixed(2)} × Chol + ${intercept.toFixed(2)}` }
    };
  };

  // 4. Diagnosis Prevalence by Age Group
  const getDiagnosisPrevalenceByAge = () => {
    if (previewData.length === 0) return null;
    const ageGroups = ['0-20', '21-40', '41-60', '61+'];
    const diagnosisCounts = previewData.flatMap(d => d.Diagnosis?.split(', ') || []).reduce((acc, diag) => { if (diag) acc[diag] = (acc[diag] || 0) + 1; return acc; }, {});
    const topDiagnoses = Object.entries(diagnosisCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);
    const colors = ['rgba(54, 162, 235, 0.7)', 'rgba(255, 99, 132, 0.7)', 'rgba(75, 192, 192, 0.7)', 'rgba(255, 159, 64, 0.7)', 'rgba(153, 102, 255, 0.7)'];
    
    const datasets = topDiagnoses.map((diagnosis, index) => {
      const data = ageGroups.map(group => {
        const [min, max] = group.includes('+') ? [parseInt(group), 150] : group.split('-').map(Number);
        const groupData = previewData.filter(d => d.Age >= min && d.Age <= max);
        const diagData = groupData.filter(d => d.Diagnosis?.includes(diagnosis));
        return groupData.length > 0 ? (diagData.length / groupData.length * 100).toFixed(1) : 0;
      });
      return { label: diagnosis, data, backgroundColor: colors[index], borderColor: colors[index].replace('0.7', '1'), borderWidth: 1 };
    });
    
    return {
      data: { labels: ageGroups, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { title: { display: true, text: 'Diagnosis Prevalence by Age Group', font: { size: 16, weight: 'bold' } }, legend: { position: 'top' }, tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${context.raw}%` } } },
        scales: { x: { title: { display: true, text: 'Age Group (years)' } }, y: { title: { display: true, text: 'Prevalence (%)' }, beginAtZero: true, max: 100 } }
      }
    };
  };

  // 5. Blood Pressure and Cholesterol by Age
  const getClinicalMetricsByAge = () => {
    if (previewData.length === 0) return null;
    const ageGroups = ['0-20', '21-35', '36-50', '51-65', '66+'];
    const bpData = ageGroups.map(group => {
      const [min, max] = group.includes('+') ? [parseInt(group), 150] : group.split('-').map(Number);
      const patients = previewData.filter(d => d.Age >= min && d.Age <= max && d.Blood_Pressure?.match(/^(\d+)\/(\d+)$/));
      return patients.length ? (patients.map(d => parseInt(d.Blood_Pressure.split('/')[0])).reduce((sum, val) => sum + val, 0) / patients.length).toFixed(1) : null;
    });
    const cholData = ageGroups.map(group => {
      const [min, max] = group.includes('+') ? [parseInt(group), 150] : group.split('-').map(Number);
      const patients = previewData.filter(d => d.Age >= min && d.Age <= max && d.Cholesterol?.match(/^(\d+) mg\/dL$/));
      return patients.length ? (patients.map(d => parseInt(d.Cholesterol.replace(' mg/dL', ''))).reduce((sum, val) => sum + val, 0) / patients.length).toFixed(1) : null;
    });
    
    return {
      data: {
        labels: ageGroups,
        datasets: [
          { label: 'Avg. Systolic BP', data: bpData, borderColor: 'rgba(111, 66, 193, 1)', backgroundColor: 'rgba(111, 66, 193, 0.1)', fill: true, tension: 0.3, yAxisID: 'y' },
          { label: 'Avg. Cholesterol', data: cholData, borderColor: 'rgba(220, 53, 69, 1)', backgroundColor: 'rgba(220, 53, 69, 0.1)', fill: true, tension: 0.3, yAxisID: 'y1' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { title: { display: true, text: 'Blood Pressure and Cholesterol by Age', font: { size: 16, weight: 'bold' } } },
        scales: { x: { title: { display: true, text: 'Age Group' } }, y: { position: 'left', title: { display: true, text: 'Systolic BP (mmHg)' } }, y1: { position: 'right', title: { display: true, text: 'Cholesterol (mg/dL)' }, grid: { drawOnChartArea: false } } }
      }
    };
  };

  // 6. NEW: Diagnosis Trends Over Time
  const getDiagnosisTrendsOverTime = () => {
    if (previewData.length === 0) return null;
    const years = [...new Set(previewData.map(d => d.Visit_Date?.substring(0, 4)))].sort();
    const diagnosisCounts = previewData.flatMap(d => d.Diagnosis?.split(', ') || []).reduce((acc, diag) => { if (diag) acc[diag] = (acc[diag] || 0) + 1; return acc; }, {});
    const topDiagnoses = Object.entries(diagnosisCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);
    const colors = ['rgba(54, 162, 235, 0.7)', 'rgba(255, 99, 132, 0.7)', 'rgba(75, 192, 192, 0.7)', 'rgba(255, 159, 64, 0.7)', 'rgba(153, 102, 255, 0.7)'];
    
    const datasets = topDiagnoses.map((diag, i) => ({
      label: diag,
      data: years.map(year => previewData.filter(d => d.Visit_Date?.startsWith(year) && d.Diagnosis?.includes(diag)).length),
      backgroundColor: colors[i],
      borderColor: colors[i].replace('0.7', '1'),
      borderWidth: 1
    }));
    
    return {
      data: { labels: years, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { title: { display: true, text: 'Diagnosis Trends Over Time', font: { size: 16, weight: 'bold' } }, legend: { position: 'top' } },
        scales: { x: { title: { display: true, text: 'Year' } }, y: { title: { display: true, text: 'Cases' }, stacked: true, beginAtZero: true } }
      }
    };
  };

  // 7. NEW: Medication Distribution by Age Group
  const getMedicationByAgeGroup = () => {
    if (previewData.length === 0) return null;
    const ageGroups = ['0-20', '21-40', '41-60', '61+'];
    const medCounts = previewData.flatMap(d => d.Medication?.split(', ') || []).reduce((acc, med) => { if (med && med !== 'None') acc[med] = (acc[med] || 0) + 1; return acc; }, {});
    const topMeds = Object.entries(medCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);
    const colors = ['rgba(54, 162, 235, 0.7)', 'rgba(255, 99, 132, 0.7)', 'rgba(75, 192, 192, 0.7)', 'rgba(255, 159, 64, 0.7)', 'rgba(153, 102, 255, 0.7)'];
    
    const datasets = topMeds.map((med, i) => ({
      label: med,
      data: ageGroups.map(group => {
        const [min, max] = group.includes('+') ? [parseInt(group), 150] : group.split('-').map(Number);
        return previewData.filter(d => d.Age >= min && d.Age <= max && d.Medication?.includes(med)).length;
      }),
      backgroundColor: colors[i],
      borderColor: colors[i].replace('0.7', '1'),
      borderWidth: 1
    }));
    
    return {
      data: { labels: ageGroups, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { title: { display: true, text: 'Medication Distribution by Age Group', font: { size: 16, weight: 'bold' } }, legend: { position: 'top' } },
        scales: { x: { title: { display: true, text: 'Age Group' } }, y: { title: { display: true, text: 'Patients' }, stacked: true, beginAtZero: true } }
      }
    };
  };

  // 8. NEW: Blood Pressure Distribution by Diagnosis
  const getBPDistributionByDiagnosis = () => {
    if (previewData.length === 0) return null;
    const diagnosisCounts = previewData.flatMap(d => d.Diagnosis?.split(', ') || []).reduce((acc, diag) => { if (diag) acc[diag] = (acc[diag] || 0) + 1; return acc; }, {});
    const topDiagnoses = Object.entries(diagnosisCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);
    
    const datasets = [{
      label: 'Avg Systolic BP',
      data: topDiagnoses.map(diag => {
        const bps = previewData.filter(d => d.Diagnosis?.includes(diag) && d.Blood_Pressure?.match(/^(\d+)\/(\d+)$/)).map(d => parseInt(d.Blood_Pressure.split('/')[0]));
        return bps.length ? (bps.reduce((s, v) => s + v, 0) / bps.length).toFixed(1) : 0;
      }),
      backgroundColor: 'rgba(111, 66, 193, 0.7)',
      borderColor: 'rgba(111, 66, 193, 1)',
      borderWidth: 1
    }];
    
    return {
      data: { labels: topDiagnoses, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { title: { display: true, text: 'Avg Systolic BP by Diagnosis', font: { size: 16, weight: 'bold' } }, tooltip: { callbacks: { label: (context) => `${context.raw} mmHg` } } },
        scales: { x: { title: { display: true, text: 'Diagnosis' } }, y: { title: { display: true, text: 'Systolic BP (mmHg)' }, beginAtZero: true } }
      }
    };
  };

  // 9. NEW: Allergy Prevalence by Blood Group
  const getAllergyByBloodGroup = () => {
    if (previewData.length === 0) return null;
    const bloodGroups = [...new Set(previewData.map(d => d.Blood_Group))].filter(g => g && g !== 'Unknown');
    const allergyData = previewData.filter(d => d.Allergy && d.Allergy !== 'None' && d.Allergy !== 'N/A');
    
    const datasets = [{
      label: 'Allergy Prevalence',
      data: bloodGroups.map(bg => {
        const groupData = previewData.filter(d => d.Blood_Group === bg);
        const allergyCount = groupData.filter(d => d.Allergy && d.Allergy !== 'None' && d.Allergy !== 'N/A').length;
        return groupData.length ? (allergyCount / groupData.length * 100).toFixed(1) : 0;
      }),
      backgroundColor: 'rgba(255, 159, 64, 0.7)',
      borderColor: 'rgba(255, 159, 64, 1)',
      borderWidth: 1
    }];
    
    return {
      data: { labels: bloodGroups, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { title: { display: true, text: 'Allergy Prevalence by Blood Group', font: { size: 16, weight: 'bold' } }, tooltip: { callbacks: { label: (context) => `${context.raw}%` } } },
        scales: { x: { title: { display: true, text: 'Blood Group' } }, y: { title: { display: true, text: 'Prevalence (%)' }, beginAtZero: true, max: 100 } }
      }
    };
  };

  // 10. NEW: Gender-Based Diagnosis Prevalence
  const getGenderDiagnosisPrevalence = () => {
    if (previewData.length === 0) return null;
    const ageGroups = ['0-20', '21-40', '41-60', '61+'];
    const genders = ['Male', 'Female'];
    const topDiagnosis = Object.entries(previewData.flatMap(d => d.Diagnosis?.split(', ') || []).reduce((acc, diag) => { if (diag) acc[diag] = (acc[diag] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!topDiagnosis) return null;
    
    const datasets = genders.map((gender, i) => ({
      label: `${gender} - ${topDiagnosis}`,
      data: ageGroups.map(group => {
        const [min, max] = group.includes('+') ? [parseInt(group), 150] : group.split('-').map(Number);
        const groupData = previewData.filter(d => d.Gender === gender && d.Age >= min && d.Age <= max);
        const diagData = groupData.filter(d => d.Diagnosis?.includes(topDiagnosis));
        return groupData.length ? (diagData.length / groupData.length * 100).toFixed(1) : 0;
      }),
      backgroundColor: i === 0 ? 'rgba(54, 162, 235, 0.7)' : 'rgba(255, 99, 132, 0.7)',
      borderColor: i === 0 ? 'rgba(54, 162, 235, 1)' : 'rgba(255, 99, 132, 1)',
      borderWidth: 1
    }));
    
    return {
      data: { labels: ageGroups, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { title: { display: true, text: `Prevalence of ${topDiagnosis} by Gender and Age`, font: { size: 16, weight: 'bold' } }, legend: { position: 'top' }, tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${context.raw}%` } } },
        scales: { x: { title: { display: true, text: 'Age Group' } }, y: { title: { display: true, text: 'Prevalence (%)' }, beginAtZero: true, max: 100 } }
      }
    };
  };

  // Helper component for correlation stats
  const CorrelationStats = ({ stats }) => {
    if (!stats) return null;
    return (
      <div className="bg-light p-3 rounded mt-3">
        <h6 className="fw-bold mb-2">Statistical Analysis</h6>
        <div className="row">
          <div className="col-md-6">
            <p><strong>Sample Size:</strong> {stats.n} patients</p>
            <p><strong>Correlation (r):</strong> {stats.r}</p>
            <p><strong>Determination (r²):</strong> {stats.rSquared}</p>
          </div>
          <div className="col-md-6">
            <p><strong>Regression Equation:</strong> {stats.equation}</p>
            <p><strong>Interpretation:</strong> {parseFloat(stats.r) > 0.7 ? "Strong positive" : parseFloat(stats.r) > 0.3 ? "Moderate positive" : "Weak"}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-vh-100 bg-light py-4">
      <div className="container">
        <h2 className="display-5 fw-bold text-center mb-4" style={{ color: '#6f42c1' }}>Research Dashboard</h2>
        
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
                      <input className="form-check-input" type="checkbox" id={`age-${group}`} checked={selectedAgeGroups.includes(group)} onChange={() => toggleSelection(group, selectedAgeGroups, setSelectedAgeGroups)} />
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
                      <input className="form-check-input" type="checkbox" id={`gender-${gender}`} checked={selectedGenders.includes(gender)} onChange={() => toggleSelection(gender, selectedGenders, setSelectedGenders)} />
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
                      <input className="form-check-input" type="checkbox" id={`blood-${group}`} checked={selectedBloodGroups.includes(group)} onChange={() => toggleSelection(group, selectedBloodGroups, setSelectedBloodGroups)} />
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
                      <input className="form-check-input" type="checkbox" id={`diagnosis-${diagnosis}`} checked={selectedDiagnoses.includes(diagnosis)} onChange={() => toggleSelection(diagnosis, selectedDiagnoses, setSelectedDiagnoses)} />
                      <label className="form-check-label" htmlFor={`diagnosis-${diagnosis}`}>{diagnosis}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="d-flex justify-content-between mt-3">
              <button className="btn btn-outline-secondary" onClick={clearFilters}>Clear Filters</button>
              <div>
                <button className="btn btn-primary me-2" onClick={handleExportFiltered} disabled={loading}>{loading ? 'Exporting...' : 'Export Filtered Data (CSV)'}</button>
                <button className="btn btn-primary" onClick={handleExportAll} disabled={loading}>{loading ? 'Exporting...' : 'Export All Data (CSV)'}</button>
              </div>
            </div>
          </div>
        </div>

        {previewData.length > 0 ? (
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <ul className="nav nav-tabs card-header-tabs">
                <li className="nav-item"><button className={`nav-link ${activeTab === 'demographics' ? 'active' : 'text-white'}`} onClick={() => setActiveTab('demographics')}>Demographics</button></li>
                <li className="nav-item"><button className={`nav-link ${activeTab === 'clinical' ? 'active' : 'text-white'}`} onClick={() => setActiveTab('clinical')}>Clinical Metrics</button></li>
                <li className="nav-item"><button className={`nav-link ${activeTab === 'temporal' ? 'active' : 'text-white'}`} onClick={() => setActiveTab('temporal')}>Temporal Trends</button></li>
                <li className="nav-item"><button className={`nav-link ${activeTab === 'correlations' ? 'active' : 'text-white'}`} onClick={() => setActiveTab('correlations')}>Correlations</button></li>
              </ul>
            </div>
            <div className="card-body">
              {previewLoading ? (
                <div className="text-center py-5"><div className="spinner-border" role="status"></div><p className="mt-3 text-muted">Processing data...</p></div>
              ) : (
                <>
                  {activeTab === 'demographics' && (
                    <div>
                      <h4>Patient Demographics</h4>
                      <p className="text-muted">Analysis of population distribution and gender-specific disease prevalence.</p>
                      <div className="row">
                        <div className="col-md-6 mb-4"><div style={{ height: '400px' }}>{getAgeDistributionByGender() ? <Bar {...getAgeDistributionByGender()} /> : <p className="text-muted">No data</p>}</div></div>
                        <div className="col-md-6 mb-4"><div style={{ height: '400px' }}>{getGenderDiagnosisPrevalence() ? <Bar {...getGenderDiagnosisPrevalence()} /> : <p className="text-muted">No data</p>}</div></div>
                      </div>
                    </div>
                  )}
                  {activeTab === 'clinical' && (
                    <div>
                      <h4>Clinical Analysis</h4>
                      <p className="text-muted">Key health metrics and their distribution across diagnoses and age groups.</p>
                      <div className="row">
                        <div className="col-md-6 mb-4"><div style={{ height: '400px' }}>{getDiagnosisPrevalenceByAge() ? <Bar {...getDiagnosisPrevalenceByAge()} /> : <p className="text-muted">No data</p>}</div></div>
                        <div className="col-md-6 mb-4"><div style={{ height: '400px' }}>{getClinicalMetricsByAge() ? <Line {...getClinicalMetricsByAge()} /> : <p className="text-muted">No data</p>}</div></div>
                        <div className="col-md-6 mb-4"><div style={{ height: '400px' }}>{getBPDistributionByDiagnosis() ? <Bar {...getBPDistributionByDiagnosis()} /> : <p className="text-muted">No data</p>}</div></div>
                        <div className="col-md-6 mb-4"><div style={{ height: '400px' }}>{getMedicationByAgeGroup() ? <Bar {...getMedicationByAgeGroup()} /> : <p className="text-muted">No data</p>}</div></div>
                      </div>
                    </div>
                  )}
                  {activeTab === 'temporal' && (
                    <div>
                      <h4>Temporal Trends</h4>
                      <p className="text-muted">Longitudinal analysis of medication and diagnosis patterns.</p>
                      <div className="row">
                        <div className="col-md-6 mb-4"><div style={{ height: '400px' }}>{getMedicationStartsByMonth() ? <Bar {...getMedicationStartsByMonth()} /> : <p className="text-muted">No data</p>}</div></div>
                        <div className="col-md-6 mb-4"><div style={{ height: '400px' }}>{getDiagnosisTrendsOverTime() ? <Bar {...getDiagnosisTrendsOverTime()} /> : <p className="text-muted">No data</p>}</div></div>
                      </div>
                    </div>
                  )}
                  {activeTab === 'correlations' && (
                    <div>
                      <h4>Statistical Correlations</h4>
                      <p className="text-muted">Relationships between health metrics and biological factors.</p>
                      <div className="row">
                        <div className="col-md-6 mb-4"><div style={{ height: '400px' }}>{getBPCholesterolCorrelation() ? <Scatter {...getBPCholesterolCorrelation()} /> : <p className="text-muted">No data</p>}</div>
                          {getBPCholesterolCorrelation() && <CorrelationStats stats={getBPCholesterolCorrelation().stats} />}
                        </div>
                        <div className="col-md-6 mb-4"><div style={{ height: '400px' }}>{getAllergyByBloodGroup() ? <Bar {...getAllergyByBloodGroup()} /> : <p className="text-muted">No data</p>}</div></div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="alert alert-info my-4"><p className="mb-0">No data available. Please adjust your filters or load more data.</p></div>
        )}
        
        <div className="card mb-4">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Data Preview {dataCount > 0 ? `(${dataCount} records, showing top 20)` : ''}</h5>
            <button className="btn btn-sm btn-light" onClick={fetchPreviewData} disabled={previewLoading}>
              <i className="bi bi-arrow-clockwise me-1"></i>{previewLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <div className="card-body">
            {previewLoading ? (
              <div className="text-center py-4"><div className="spinner-border" role="status"></div><p className="mt-2 text-muted">Loading preview data...</p></div>
            ) : previewData.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-striped table-hover table-sm">
                  <thead className="table-light"><tr>{getTableHeaders().map((header) => <th key={header}>{header.replace('_', ' ')}</th>)}</tr></thead>
                  <tbody>{previewData.slice(0, 20).map((row, index) => <tr key={index}>{Object.values(row).map((value, i) => <td key={i}>{formatCellData(value)}</td>)}</tr>)}</tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted py-4">No data matches the selected filters.</p>
            )}
          </div>
        </div>
        
        <div className="card">
          <div className="card-header bg-secondary text-white"><h5 className="mb-0">Research Data Guide</h5></div>
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
                  <li><strong>Blood_Pressure:</strong> BP readings (Systolic/Diastolic)</li>
                  <li><strong>Cholesterol:</strong> Cholesterol levels (mg/dL)</li>
                  <li><strong>Allergy:</strong> Known allergies</li>
                  <li><strong>Blood_Group:</strong> Blood type</li>
                  <li><strong>Visit_Date:</strong> Date of EHR record</li>
                </ul>
              </div>
              <div className="col-md-6">
                <h6 className="fw-bold">Research Tips</h6>
                <ul>
                  <li>Use <strong>Temporal Trends</strong> for longitudinal studies</li>
                  <li>Explore <strong>Clinical Metrics</strong> for treatment patterns</li>
                  <li>Check <strong>Correlations</strong> for hypothesis generation</li>
                  <li>Data is anonymized for privacy</li>
                  <li>Export CSV for advanced analysis</li>
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