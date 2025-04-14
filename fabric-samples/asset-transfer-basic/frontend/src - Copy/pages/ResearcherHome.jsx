import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Pie, Scatter, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend);

function ResearcherHome() {
  const [metadata, setMetadata] = useState(null);
  const [filters, setFilters] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [dataCount, setDataCount] = useState(0);

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
        limit: 300,
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

  // New Graph Function: Medication Starts by Month
  const getMedicationStartsByMonth = () => {
    // Define the date range: last 12 months from today
    const today = new Date(); // April 7, 2025
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1); // April 7, 2024
  
    // Filter data for the last 12 months with medication
    const validData = previewData.filter(d => {
      if (!d.Visit_Date || !d.Medication || d.Medication === 'None') return false;
      const visitDate = new Date(d.Visit_Date);
      return visitDate >= oneYearAgo && visitDate <= today;
    });
  
    if (validData.length === 0) {
      return {
        data: null,
        options: null,
      };
    }
  
    // Define months
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
  
    // Count medication starts per month
    const counts = months.map((_, index) => {
      const monthIndex = index; // 0-based index (Jan = 0, Dec = 11)
      return validData.filter(d => new Date(d.Visit_Date).getMonth() === monthIndex).length;
    });
  
    const total = counts.reduce((sum, count) => sum + count, 0);
    const percentages = counts.map(count => total > 0 ? ((count / total) * 100).toFixed(1) : 0);
  
    return {
      data: {
        labels: months,
        datasets: [{
          label: 'Patients Starting Medication',
          data: counts,
          backgroundColor: '#28a745', // Green for medication starts
          borderColor: '#218838',
          borderWidth: 1,
        }],
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: { 
            display: true, 
            text: `Medication Starts by Month (Last 12 Months: ${oneYearAgo.toLocaleDateString()} - ${today.toLocaleDateString()})`
          },
          tooltip: { 
            callbacks: { 
              label: (context) => `${context.raw} patients (${percentages[context.dataIndex]}%)` 
            } 
          },
        },
        scales: {
          x: { title: { display: true, text: 'Month' } },
          y: { 
            title: { display: true, text: 'Number of Patients' }, 
            beginAtZero: true 
          },
        },
      },
    };
  };

  // Existing Graph Functions (unchanged, included for completeness)
  const getAgeDistribution = () => {
    const ageBins = Array.from({ length: 10 }, (_, i) => `${i*10 + 1}-${(i+1)*10}`);
    const counts = ageBins.map(bin => {
      const [min, max] = bin.split('-').map(Number);
      return previewData.filter(d => d.Age >= min && d.Age <= max).length;
    });
    const total = counts.reduce((sum, count) => sum + count, 0);
    const percentages = counts.map(count => ((count / total) * 100).toFixed(1));
    const tooltips = counts.map((count, index) => `${count} patients (${percentages[index]}%)`);
    const colors = ageBins.map((_, index) => `hsl(270, 60%, ${30 + (index * 4)}%)`);
    return {
      data: {
        labels: ageBins,
        datasets: [{
          label: 'Patient Count',
          data: counts,
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace('60%', '70%')),
          borderWidth: 1,
        }],
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Patient Age Distribution' },
          tooltip: { callbacks: { label: (context) => tooltips[context.dataIndex] } },
        },
        scales: {
          x: { title: { display: true, text: 'Age Range (years)' } },
          y: { title: { display: true, text: 'Number of Patients' }, beginAtZero: true },
        },
      },
      legendItems: ageBins.map((bin, index) => ({
        name: bin,
        count: counts[index],
        percentage: percentages[index],
        color: colors[index],
      })),
    };
  };

  const getDiagnosisByAgeGroup = () => {
    const ageGroups = [...new Set(previewData.map(d => d.Age_Group))].sort();
    const diagnoses = [...new Set(previewData.flatMap(d => d.Diagnosis.split(', ')))];
    const totalDiagnoses = previewData.flatMap(d => d.Diagnosis.split(', ')).length;
    const colors = diagnoses.map(() => '#' + Math.floor(Math.random() * 16777215).toString(16));
    const data = {
      labels: ageGroups,
      datasets: diagnoses.map((diag, index) => {
        const counts = ageGroups.map(age => previewData.filter(d => d.Age_Group === age && d.Diagnosis.includes(diag)).length);
        const percentages = counts.map(count => (count / totalDiagnoses * 100).toFixed(1));
        return { label: diag, data: percentages, backgroundColor: colors[index] };
      }),
    };
    const legendItems = diagnoses.map((diag, index) => ({
      name: diag,
      percentage: (previewData.filter(d => d.Diagnosis.includes(diag)).length / totalDiagnoses * 100).toFixed(1),
      color: colors[index],
    }));
    return {
      data,
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Diagnosis Frequency by Age Group (%)' },
          tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${context.raw}%` } },
        },
        scales: { y: { ticks: { callback: value => `${value}%` } } },
      },
      legendItems,
    };
  };

  const getMedicationDistribution = () => {
    const medications = [...new Set(previewData.flatMap(d => d.Medication.split(', ')))];
    const totalMedications = previewData.flatMap(d => d.Medication.split(', ')).length;
    const counts = medications.map(med => previewData.filter(d => d.Medication.includes(med)).length);
    const percentages = counts.map(count => (count / totalMedications * 100).toFixed(1));
    const colors = medications.map(() => '#' + Math.floor(Math.random() * 16777215).toString(16));
    const data = {
      labels: medications,
      datasets: [{ data: percentages, backgroundColor: colors }],
    };
    const legendItems = medications.map((med, index) => ({
      name: med,
      percentage: percentages[index],
      color: colors[index],
    }));
    return {
      data,
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Medication Distribution (%)' },
          tooltip: { callbacks: { label: (context) => `${context.label}: ${context.raw}%` } },
        },
        cutout: '50%',
      },
      legendItems,
    };
  };

  const getBloodPressureVsCholesterol = () => {
    const validData = previewData.filter(d => {
      const bpMatch = d.Blood_Pressure.match(/^(\d+)\/(\d+)$/);
      const cholMatch = d.Cholesterol.match(/^(\d+) mg\/dL$/);
      return bpMatch && cholMatch;
    });
    const data = {
      datasets: [{
        label: 'Systolic BP vs Cholesterol',
        data: validData.map(d => {
          const [systolic] = d.Blood_Pressure.split('/').map(Number);
          const cholesterol = Number(d.Cholesterol.replace(' mg/dL', ''));
          return { x: cholesterol, y: systolic };
        }),
        backgroundColor: '#6f42c1',
      }],
    };
    return {
      data,
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' }, title: { display: true, text: 'Systolic BP vs. Cholesterol' } },
        scales: {
          x: { title: { display: true, text: 'Cholesterol (mg/dL)' } },
          y: { title: { display: true, text: 'Systolic BP (mmHg)' } },
        },
      },
    };
  };

  const getAverageMetricsByAge = () => {
    const ageGroups = ['0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61-70', '71+'];
    const bpAverages = ageGroups.map(group => {
      const [min, max] = group.includes('+') ? [parseInt(group), 150] : group.split('-').map(Number);
      const filteredData = previewData.filter(d => {
        const bpMatch = d.Blood_Pressure && d.Blood_Pressure.match(/^(\d+)\/(\d+)$/);
        return d.Age >= min && d.Age <= max && bpMatch;
      });
      if (filteredData.length === 0) return null;
      const systolicValues = filteredData.map(d => parseInt(d.Blood_Pressure.split('/')[0]));
      return (systolicValues.reduce((sum, val) => sum + val, 0) / systolicValues.length).toFixed(1);
    });
    const cholAverages = ageGroups.map(group => {
      const [min, max] = group.includes('+') ? [parseInt(group), 150] : group.split('-').map(Number);
      const filteredData = previewData.filter(d => {
        const cholMatch = d.Cholesterol && d.Cholesterol.match(/^(\d+) mg\/dL$/);
        return d.Age >= min && d.Age <= max && cholMatch;
      });
      if (filteredData.length === 0) return null;
      const cholValues = filteredData.map(d => parseInt(d.Cholesterol.replace(' mg/dL', '')));
      return (cholValues.reduce((sum, val) => sum + val, 0) / cholValues.length).toFixed(1);
    });
    return {
      data: {
        labels: ageGroups,
        datasets: [
          { label: 'Avg. Systolic BP', data: bpAverages, borderColor: '#6f42c1', backgroundColor: 'rgba(111, 66, 193, 0.1)', fill: true, tension: 0.4, yAxisID: 'y' },
          { label: 'Avg. Cholesterol', data: cholAverages, borderColor: '#dc3545', backgroundColor: 'rgba(220, 53, 69, 0.1)', fill: true, tension: 0.4, yAxisID: 'y1' },
        ],
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: { title: { display: true, text: 'Average Systolic BP and Cholesterol by Age Group' } },
        scales: {
          x: { title: { display: true, text: 'Age Group' } },
          y: { position: 'left', title: { display: true, text: 'Systolic BP (mmHg)' } },
          y1: { position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Cholesterol (mg/dL)' } },
        },
      },
    };
  };

  const getAverageMetricsByExactAge = () => {
    const allAges = [...new Set(previewData.map(d => d.Age))].filter(age => age !== undefined && age !== null).sort((a, b) => a - b);
    if (allAges.length === 0) return null;
    const bpAverages = allAges.map(age => {
      const filteredData = previewData.filter(d => {
        const bpMatch = d.Blood_Pressure && d.Blood_Pressure.match(/^(\d+)\/(\d+)$/);
        return d.Age === age && bpMatch;
      });
      if (filteredData.length === 0) return null;
      const systolicValues = filteredData.map(d => parseInt(d.Blood_Pressure.split('/')[0]));
      return (systolicValues.reduce((sum, val) => sum + val, 0) / systolicValues.length).toFixed(1);
    });
    const cholAverages = allAges.map(age => {
      const filteredData = previewData.filter(d => {
        const cholMatch = d.Cholesterol && d.Cholesterol.match(/^(\d+) mg\/dL$/);
        return d.Age === age && cholMatch;
      });
      if (filteredData.length === 0) return null;
      const cholValues = filteredData.map(d => parseInt(d.Cholesterol.replace(' mg/dL', '')));
      return (cholValues.reduce((sum, val) => sum + val, 0) / cholValues.length).toFixed(1);
    });
    return {
      data: {
        labels: allAges,
        datasets: [
          { label: 'Avg. Systolic BP', data: bpAverages, borderColor: '#6f42c1', backgroundColor: 'rgba(111, 66, 193, 0.1)', fill: true, tension: 0.2, yAxisID: 'y', pointRadius: 3 },
          { label: 'Avg. Cholesterol', data: cholAverages, borderColor: '#dc3545', backgroundColor: 'rgba(220, 53, 69, 0.1)', fill: true, tension: 0.2, yAxisID: 'y1', pointRadius: 3 },
        ],
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          title: { display: true, text: 'Average Systolic BP and Cholesterol by Exact Age' },
          tooltip: {
            callbacks: {
              title: (context) => `Age: ${context[0].label} years`,
              label: (context) => context.datasetIndex === 0 ? `Avg. Systolic BP: ${context.raw || 'No data'} mmHg` : `Avg. Cholesterol: ${context.raw || 'No data'} mg/dL`,
            },
          },
        },
        scales: {
          x: { title: { display: true, text: 'Age (years)' }, ticks: { callback: function(value, index) { return index % Math.ceil(allAges.length / 15) === 0 ? this.getLabelForValue(value) : ''; } } },
          y: { position: 'left', title: { display: true, text: 'Systolic BP (mmHg)' }, min: 90, max: 180 },
          y1: { position: 'right', title: { display: true, text: 'Cholesterol (mg/dL)' }, min: 150, max: 300, grid: { display: false } },
        },
      },
    };
  };

  const getGenderHealthComparison = () => {
    const ageGroups = ['0-20', '21-35', '36-50', '51-65', '65+'];
    const maleAvgBP = ageGroups.map(group => {
      const [minAge, maxAge] = group.includes('+') ? [parseInt(group), 150] : group.split('-').map(Number);
      const maleDataBP = previewData.filter(d => d.Gender === 'Male' && d.Age >= minAge && d.Age <= maxAge && d.Blood_Pressure.match(/^(\d+)\/(\d+)$/));
      return maleDataBP.length ? (maleDataBP.map(d => parseInt(d.Blood_Pressure.split('/')[0])).reduce((sum, val) => sum + val, 0) / maleDataBP.length).toFixed(1) : null;
    });
    const femaleAvgBP = ageGroups.map(group => {
      const [minAge, maxAge] = group.includes('+') ? [parseInt(group), 150] : group.split('-').map(Number);
      const femaleDataBP = previewData.filter(d => d.Gender === 'Female' && d.Age >= minAge && d.Age <= maxAge && d.Blood_Pressure.match(/^(\d+)\/(\d+)$/));
      return femaleDataBP.length ? (femaleDataBP.map(d => parseInt(d.Blood_Pressure.split('/')[0])).reduce((sum, val) => sum + val, 0) / femaleDataBP.length).toFixed(1) : null;
    });
    return {
      data: {
        labels: ageGroups,
        datasets: [
          { label: 'Male - Avg. Systolic BP', data: maleAvgBP, borderColor: '#4e73df', backgroundColor: 'rgba(78, 115, 223, 0.1)', borderWidth: 2, fill: false, tension: 0.4 },
          { label: 'Female - Avg. Systolic BP', data: femaleAvgBP, borderColor: '#e83e8c', backgroundColor: 'rgba(232, 62, 140, 0.1)', borderWidth: 2, fill: false, tension: 0.4 },
        ],
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          title: { display: true, text: 'Gender Comparison: Systolic BP by Age Group' },
          tooltip: { mode: 'index', intersect: false },
          legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 10 } },
        },
        scales: {
          x: { title: { display: true, text: 'Age Group' } },
          y: { title: { display: true, text: 'Systolic BP (mmHg)' }, suggestedMin: 100, suggestedMax: 160, ticks: { stepSize: 10 } },
        },
      },
    };
  };

  const getBloodGroupCorrelation = () => {
    const bloodGroups = [...new Set(previewData.map(d => d.Blood_Group))];
    const allDiagnoses = previewData.flatMap(d => d.Diagnosis.split(', '));
    const diagnosisCounts = {};
    allDiagnoses.forEach(diag => { diagnosisCounts[diag] = (diagnosisCounts[diag] || 0) + 1; });
    const topDiagnoses = Object.entries(diagnosisCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(entry => entry[0]);
    const datasets = topDiagnoses.map((diagnosis, index) => {
      const hue = (index * 60) % 360;
      const color = `hsl(${hue}, 70%, 50%)`;
      const data = bloodGroups.map(bloodGroup => {
        const patientsWithBloodGroup = previewData.filter(d => d.Blood_Group === bloodGroup);
        const patientsWithDiagnosis = patientsWithBloodGroup.filter(d => d.Diagnosis.includes(diagnosis));
        return patientsWithBloodGroup.length > 0 ? ((patientsWithDiagnosis.length / patientsWithBloodGroup.length) * 100).toFixed(1) : 0;
      });
      return { label: diagnosis, data, backgroundColor: `hsla(${hue}, 70%, 50%, 0.7)`, borderColor: `hsl(${hue}, 70%, 40%)`, borderWidth: 1 };
    });
    return {
      data: { labels: bloodGroups, datasets },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          title: { display: true, text: 'Disease Prevalence by Blood Group (%)' },
          tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${context.raw}%` } },
          legend: { position: 'top', labels: { boxWidth: 12 } },
        },
        scales: {
          x: { title: { display: true, text: 'Blood Group' } },
          y: { title: { display: true, text: 'Prevalence (%)' }, suggestedMin: 0, suggestedMax: 100, ticks: { callback: value => `${value}%` } },
        },
      },
    };
  };

  const getDiagnosisOverTime = () => {
    if (!previewData.some(d => d.Diagnosis_Year)) return null;
    const years = [...new Set(previewData.map(d => d.Diagnosis_Year))].sort();
    const diagnoses = [...new Set(previewData.flatMap(d => d.Diagnosis.split(', ')))].slice(0, 5);
    const colors = ['#6f42c1', '#dc3545', '#28a745', '#ffc107', '#17a2b8'];
    const datasets = diagnoses.map((diag, index) => {
      const counts = years.map(year => previewData.filter(d => d.Diagnosis_Year === year && d.Diagnosis.includes(diag)).length);
      return { label: diag, data: counts, borderColor: colors[index], backgroundColor: `${colors[index]}33`, fill: true, tension: 0.3 };
    });
    return {
      data: { labels: years, datasets },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: { title: { display: true, text: 'Diagnosis Prevalence Over Time' }, legend: { position: 'top' } },
        scales: {
          x: { title: { display: true, text: 'Year' } },
          y: { title: { display: true, text: 'Number of Cases' }, beginAtZero: true },
        },
      },
    };
  };

  const getMedicationByGender = () => {
    const genders = [...new Set(previewData.map(d => d.Gender))];
    const medications = [...new Set(previewData.flatMap(d => d.Medication.split(', ')))].slice(0, 5);
    const colors = ['#6f42c1', '#dc3545', '#28a745', '#ffc107', '#17a2b8'];
    const datasets = medications.map((med, index) => {
      const counts = genders.map(gender => previewData.filter(d => d.Gender === gender && d.Medication.includes(med)).length);
      return { label: med, data: counts, backgroundColor: colors[index] };
    });
    return {
      data: { labels: genders, datasets },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: { title: { display: true, text: 'Medication Usage by Gender' }, legend: { position: 'top' } },
        scales: {
          x: { stacked: true, title: { display: true, text: 'Gender' } },
          y: { stacked: true, title: { display: true, text: 'Number of Patients' }, beginAtZero: true },
        },
      },
    };
  };

  const getAllergyByBloodGroup = () => {
    const bloodGroups = [...new Set(previewData.map(d => d.Blood_Group))];
    const totalAllergies = previewData.filter(d => d.Allergy !== 'None').length;
    const colors = bloodGroups.map(() => '#' + Math.floor(Math.random() * 16777215).toString(16));
    const counts = bloodGroups.map(bg => previewData.filter(d => d.Blood_Group === bg && d.Allergy !== 'None').length);
    const percentages = counts.map(count => ((count / totalAllergies) * 100).toFixed(1));
    return {
      data: {
        labels: bloodGroups,
        datasets: [{ data: percentages, backgroundColor: colors }],
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          title: { display: true, text: 'Allergy Distribution by Blood Group (%)' },
          tooltip: { callbacks: { label: (context) => `${context.label}: ${context.raw}%` } },
        },
      },
      legendItems: bloodGroups.map((bg, index) => ({
        name: bg,
        percentage: percentages[index],
        color: colors[index],
      })),
    };
  };

  const getBPByDiagnosis = () => {
    const diagnoses = [...new Set(previewData.flatMap(d => d.Diagnosis.split(', ')))].slice(0, 5);
    const colors = diagnoses.map(() => '#' + Math.floor(Math.random() * 16777215).toString(16));
    const datasets = [{
      label: 'Avg Systolic BP',
      data: diagnoses.map(diag => {
        const bps = previewData.filter(d => d.Diagnosis.includes(diag) && d.Blood_Pressure.match(/^(\d+)\/(\d+)$/)).map(d => parseInt(d.Blood_Pressure.split('/')[0]));
        return bps.length ? bps.reduce((sum, val) => sum + val, 0) / bps.length : 0;
      }),
      backgroundColor: colors,
    }];
    return {
      data: { labels: diagnoses, datasets },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: { title: { display: true, text: 'Average Systolic BP by Diagnosis' } },
        scales: { y: { title: { display: true, text: 'Systolic BP (mmHg)' }, beginAtZero: true } },
      },
    };
  };

  const getCholesterolVsAge = () => {
    const validData = previewData.filter(d => d.Cholesterol.match(/^(\d+) mg\/dL$/));
    const dataPoints = validData.map(d => ({
      x: d.Age,
      y: parseInt(d.Cholesterol.replace(' mg/dL', '')),
    }));
    const xMean = dataPoints.reduce((sum, p) => sum + p.x, 0) / dataPoints.length;
    const yMean = dataPoints.reduce((sum, p) => sum + p.y, 0) / dataPoints.length;
    const numerator = dataPoints.reduce((sum, p) => sum + (p.x - xMean) * (p.y - yMean), 0);
    const denominator = dataPoints.reduce((sum, p) => sum + (p.x - xMean) ** 2, 0);
    const slope = numerator / denominator;
    const intercept = yMean - slope * xMean;
    const trendLine = [
      { x: Math.min(...dataPoints.map(p => p.x)), y: slope * Math.min(...dataPoints.map(p => p.x)) + intercept },
      { x: Math.max(...dataPoints.map(p => p.x)), y: slope * Math.max(...dataPoints.map(p => p.x)) + intercept },
    ];
    return {
      data: {
        datasets: [
          { label: 'Cholesterol Levels', data: dataPoints, backgroundColor: '#6f42c1', pointRadius: 4 },
          { label: 'Trend Line', data: trendLine, type: 'line', borderColor: '#dc3545', borderWidth: 2, fill: false, pointRadius: 0 },
        ],
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: { title: { display: true, text: 'Cholesterol vs. Age with Trend Line' } },
        scales: {
          x: { title: { display: true, text: 'Age (years)' } },
          y: { title: { display: true, text: 'Cholesterol (mg/dL)' } },
        },
      },
    };
  };

  if (loading && (!metadata || !filters)) {
    return <div className="min-vh-100 d-flex align-items-center justify-content-center text-purple fs-3" style={{ color: '#6f42c1' }}>Loading metadata and filters...</div>;
  }

  return (
    <div className="min-vh-100 bg-light py-5" style={{ background: 'linear-gradient(135deg, #e9ecef, #e2d9f3)' }}>
      <div className="container">
        <h2 className="display-5 text-purple fw-bold text-center mb-5" style={{ color: '#6f42c1', textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
          Research Dashboard
        </h2>
        {loading && <div className="alert alert-info shadow-sm mb-4">Processing request...</div>}
        {error && <div className="alert alert-danger shadow-sm mb-4">{error}</div>}
        <div className="card border-0 shadow mb-4">
          <div className="card-header bg-purple text-white fw-semibold" style={{ backgroundColor: '#6f42c1' }}>
            <h5 className="mb-0">Data Filters</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-4">
                <h6 className="fw-medium text-muted">Age Groups</h6>
                <div className="d-flex flex-wrap gap-3">
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
              <div className="col-md-6 mb-4">
                <h6 className="fw-medium text-muted">Gender</h6>
                <div className="d-flex flex-wrap gap-3">
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
              <div className="col-md-6 mb-4">
                <h6 className="fw-medium text-muted">Blood Groups</h6>
                <div className="d-flex flex-wrap gap-3">
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
              <div className="col-md-6 mb-4">
                <h6 className="fw-medium text-muted">Diagnosis</h6>
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
              <button
                className="btn btn-outline-secondary fw-medium px-4 py-2 rounded-pill"
                onClick={clearFilters}
                style={{ transition: 'all 0.3s' }}
                onMouseEnter={e => e.target.style.backgroundColor = '#e9ecef'}
                onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
              >
                Clear Filters
              </button>
              <div>
                <button
                  className="btn fw-medium px-4 py-2 rounded-pill me-2"
                  onClick={handleExportFiltered}
                  disabled={loading}
                  style={{ backgroundColor: '#6f42c1', borderColor: '#6f42c1', color: '#fff', transition: 'all 0.3s' }}
                  onMouseEnter={e => !loading && (e.target.style.backgroundColor = '#5a32a3')}
                  onMouseLeave={e => !loading && (e.target.style.backgroundColor = '#6f42c1')}
                >
                  {loading ? 'Exporting...' : 'Export Filtered Data (CSV)'}
                </button>
                <button
                  className="btn fw-medium px-4 py-2 rounded-pill"
                  onClick={handleExportAll}
                  disabled={loading}
                  style={{ backgroundColor: '#6f42c1', borderColor: '#6f42c1', color: '#fff', transition: 'all 0.3s' }}
                  onMouseEnter={e => !loading && (e.target.style.backgroundColor = '#5a32a3')}
                  onMouseLeave={e => !loading && (e.target.style.backgroundColor = '#6f42c1')}
                >
                  {loading ? 'Exporting...' : 'Export All Data (CSV)'}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="card border-0 shadow mb-4">
          <div className="card-header bg-purple text-white fw-semibold" style={{ backgroundColor: '#6f42c1' }}>
            <h5 className="mb-0">Selected Filters</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-3 mb-3">
                <h6 className="fw-medium text-muted">Age Groups</h6>
                {selectedAgeGroups.length > 0 ? (
                  <ul className="list-unstyled ps-3">
                    {selectedAgeGroups.map(age => <li key={age}>{age}</li>)}
                  </ul>
                ) : <p className="text-muted">All age groups</p>}
              </div>
              <div className="col-md-3 mb-3">
                <h6 className="fw-medium text-muted">Genders</h6>
                {selectedGenders.length > 0 ? (
                  <ul className="list-unstyled ps-3">
                    {selectedGenders.map(gender => <li key={gender}>{gender}</li>)}
                  </ul>
                ) : <p className="text-muted">All genders</p>}
              </div>
              <div className="col-md-3 mb-3">
                <h6 className="fw-medium text-muted">Blood Groups</h6>
                {selectedBloodGroups.length > 0 ? (
                  <ul className="list-unstyled ps-3">
                    {selectedBloodGroups.map(blood => <li key={blood}>{blood}</li>)}
                  </ul>
                ) : <p className="text-muted">All blood groups</p>}
              </div>
              <div className="col-md-3 mb-3">
                <h6 className="fw-medium text-muted">Diagnoses</h6>
                {selectedDiagnoses.length > 0 ? (
                  <ul className="list-unstyled ps-3" style={{ maxHeight: '100px', overflowY: 'auto' }}>
                    {selectedDiagnoses.map(diag => <li key={diag}>{diag}</li>)}
                  </ul>
                ) : <p className="text-muted">All diagnoses</p>}
              </div>
            </div>
          </div>
        </div>
        <div className="card border-0 shadow mb-4">
          <div className="card-header bg-purple text-white fw-semibold" style={{ backgroundColor: '#6f42c1' }}>
            <h5 className="mb-0">Data Visualizations</h5>
          </div>
          <div className="card-body">
            {previewLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-purple" role="status" style={{ color: '#6f42c1' }}></div>
                <p className="mt-2 text-muted">Loading visualizations...</p>
              </div>
            ) : previewData.length > 0 ? (
              <div className="row">
                <div className="col-12 mb-4">
                  <div className="bg-white p-3 rounded shadow-sm" style={{ height: '400px' }}>
                    {getMedicationStartsByMonth().data ? (
                      <Bar {...getMedicationStartsByMonth()} />
                    ) : (
                      <p className="text-center text-muted py-4">No medication data available for {new Date().getFullYear()}.</p>
                    )}
                  </div>
                </div>
                <div className="col-12 mb-4">
                  <div className="bg-white p-3 rounded shadow-sm" style={{ height: '450px' }}>
                    <Line {...getGenderHealthComparison()} />
                  </div>
                </div>
                <div className="col-12 mb-4">
                  <div className="bg-white p-3 rounded shadow-sm" style={{ height: '450px' }}>
                    <Bar {...getBloodGroupCorrelation()} />
                  </div>
                </div>
                <div className="col-12 mb-4">
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="row">
                      <div className="col-md-9" style={{ height: '400px' }}>
                        <Bar {...getAgeDistribution()} />
                      </div>
                      <div className="col-md-3" style={{ height: '400px', overflowY: 'auto' }}>
                        <h6 className="fw-medium text-muted mb-3">Legend</h6>
                        <ul className="list-unstyled">
                          {getAgeDistribution().legendItems.map((item, index) => (
                            <li key={index} className="d-flex align-items-center mb-3">
                              <span style={{ width: '16px', height: '16px', backgroundColor: item.color, marginRight: '10px', borderRadius: '3px' }}></span>
                              <span>{item.name}: {item.count} ({item.percentage}%)</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-12 mb-4">
                  <div className="bg-white p-3 rounded shadow-sm" style={{ height: '400px' }}>
                    <Line {...getAverageMetricsByAge()} />
                  </div>
                </div>
                <div className="col-12 mb-4">
                  <div className="bg-white p-3 rounded shadow-sm" style={{ height: '400px' }}>
                    <Line {...getAverageMetricsByExactAge()} />
                  </div>
                </div>
                <div className="col-12 mb-4">
                  <div className="bg-white p-3 rounded shadow-sm d-flex" style={{ height: '400px' }}>
                    <div style={{ flex: '1' }}>
                      <Bar {...getDiagnosisByAgeGroup()} />
                    </div>
                    <div style={{ width: '300px', overflowY: 'auto', marginLeft: '20px' }}>
                      <h6 className="fw-medium text-muted mb-2">Legend</h6>
                      <ul className="list-unstyled">
                        {getDiagnosisByAgeGroup().legendItems.map((item, index) => (
                          <li key={index} className="d-flex align-items-center mb-2">
                            <span style={{ width: '12px', height: '12px', backgroundColor: item.color, marginRight: '8px' }}></span>
                            <span className="text-truncate">{item.name} ({item.percentage}%)</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="col-12 mb-4">
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="row">
                      <div className="col-md-9" style={{ height: '500px' }}>
                        <Pie {...getMedicationDistribution()} />
                      </div>
                      <div className="col-md-3" style={{ height: '500px', overflowY: 'auto' }}>
                        <h6 className="fw-medium text-muted mb-3">Legend</h6>
                        <ul className="list-unstyled">
                          {getMedicationDistribution().legendItems.map((item, index) => (
                            <li key={index} className="d-flex align-items-center mb-3">
                              <span style={{ width: '16px', height: '16px', backgroundColor: item.color, marginRight: '10px', borderRadius: '3px' }}></span>
                              <span>{item.name} ({item.percentage}%)</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-12 mb-4">
                  <div className="bg-white p-3 rounded shadow-sm" style={{ height: '800px' }}>
                    <Scatter {...getBloodPressureVsCholesterol()} />
                  </div>
                </div>
                {getDiagnosisOverTime() && (
                  <div className="col-12 mb-4">
                    <div className="bg-white p-3 rounded shadow-sm" style={{ height: '400px' }}>
                      <Line {...getDiagnosisOverTime()} />
                    </div>
                  </div>
                )}
                <div className="col-12 mb-4">
                  <div className="bg-white p-3 rounded shadow-sm" style={{ height: '400px' }}>
                    <Bar {...getMedicationByGender()} />
                  </div>
                </div>
                <div className="col-12 mb-4">
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="row">
                      <div className="col-md-9" style={{ height: '400px' }}>
                        <Pie {...getAllergyByBloodGroup()} />
                      </div>
                      <div className="col-md-3" style={{ height: '400px', overflowY: 'auto' }}>
                        <h6 className="fw-medium text-muted mb-3">Legend</h6>
                        <ul className="list-unstyled">
                          {getAllergyByBloodGroup().legendItems.map((item, index) => (
                            <li key={index} className="d-flex align-items-center mb-3">
                              <span style={{ width: '16px', height: '16px', backgroundColor: item.color, marginRight: '10px', borderRadius: '3px' }}></span>
                              <span>{item.name} ({item.percentage}%)</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-12 mb-4">
                  <div className="bg-white p-3 rounded shadow-sm" style={{ height: '400px' }}>
                    <Bar {...getBPByDiagnosis()} />
                  </div>
                </div>
                <div className="col-12 mb-4">
                  <div className="bg-white p-3 rounded shadow-sm" style={{ height: '400px' }}>
                    <Scatter {...getCholesterolVsAge()} />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted py-4">No data available for visualization.</p>
            )}
          </div>
        </div>
        <div className="card border-0 shadow mb-4">
          <div className="card-header bg-purple text-white d-flex justify-content-between align-items-center fw-semibold" style={{ backgroundColor: '#6f42c1' }}>
            <h5 className="mb-0">Data Preview {dataCount > 0 ? `(${dataCount} records, showing top 20)` : ''}</h5>
            <button
              className="btn btn-light btn-sm fw-medium"
              onClick={fetchPreviewData}
              disabled={previewLoading}
              style={{ transition: 'all 0.3s' }}
              onMouseEnter={e => !previewLoading && (e.target.style.backgroundColor = '#e9ecef')}
              onMouseLeave={e => !previewLoading && (e.target.style.backgroundColor = '#fff')}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              {previewLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <div className="card-body">
            {previewLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-purple" role="status" style={{ color: '#6f42c1' }}></div>
                <p className="mt-2 text-muted">Loading preview data...</p>
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
                    {previewData.slice(0, 20).map((row, index) => (
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
              <p className="text-center text-muted py-4">No data matches the selected filters.</p>
            )}
          </div>
        </div>
        <div className="card border-0 shadow">
          <div className="card-header bg-secondary text-white fw-semibold">
            <h5 className="mb-0">Research Data Explanation</h5>
          </div>
          <div className="card-body">
            <p className="text-muted">This dashboard allows you to export anonymized healthcare data for research purposes. The exported CSV file contains:</p>
            <ul className="list-unstyled ps-3">
              <li><strong>Age_Group:</strong> Patient age range (e.g., 0-20, 21-35)</li>
              <li><strong>Age:</strong> Exact age in years</li>
              <li><strong>Gender:</strong> Patient gender</li>
              <li><strong>Diagnosis:</strong> Medical diagnosis</li>
              <li><strong>Medication:</strong> Prescribed medications</li>
              <li><strong>Blood_Pressure:</strong> Blood pressure readings</li>
              <li><strong>Cholesterol:</strong> Cholesterol levels</li>
              <li><strong>Allergy:</strong> Known allergies</li>
              <li><strong>Blood_Group:</strong> Blood type</li>
              <li><strong>Visit_Date:</strong> Date of the EHR record (e.g., YYYY-MM-DD)</li>
              <li><strong>notes:</strong> Additional clinical notes</li>
            </ul>
            <p className="text-muted small mt-2">All data is anonymized to protect patient privacy.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResearcherHome;