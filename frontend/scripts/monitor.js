const ECG_PATTERN = [
  287.2, 312.3, 293.5, 362.4, 323.4, 301.7, 534.1,
  317.2, 309.3, 286.5, 375.4, 329.4, 311.7, 581.1
];

// S1Q3T3 pattern
const ECG_SIMULATION_PATTERN_S1Q3T3 = [
  304.2, 312.3, 293.5, 362.4, 323.4, 301.7, -122.1,
  317.2, 309.3, 286.5, 375.4, 329.4, 311.7, -83.1
];
// Sinus Tachycardia and Inverted T Wave pattern
const ECG_SIMULATION_PATTERN_OTHER = [
  304.2, 203.3, 293.5, 362.4, 323.4, 301.7, 534.1,
  317.2, 246.3, 286.5, 375.4, 329.4, 311.7, 581.1
];

let ecgIndex = 0;
let statusElement = document.getElementById('caseStatus');
let ecgShowZeros = false; // Flag to control ECG display (zeros vs normal)
let isUpdating = false; // Flag to control main updates
let updateInterval = null; // Main update interval
let isSimulationActive = false; // Flag to control simulation
let simulationTimer = null; // Timer for simulation sequence
let selectedSimulationType = null;
let selectedSimulationPattern = ECG_SIMULATION_PATTERN_S1Q3T3;

// Chart color scheme
const chartColors = {
  background: 'rgba(255, 255, 255, 0.9)',
  gridLines: 'rgba(0, 0, 0, 0.1)',
  spo2: '#000000',
  hr: '#000000',
  temp: '#000000',
  ecg: '#000000'
};

// Retrieve or initialize chart data
let chartData = JSON.parse(localStorage.getItem('chartData')) || {
  time: 0,
  spo2: [],
  hr: [],
  temp: [],
  ecg: []
};

function createChart(ctx, label, color) {
  let min, max;
  if (label === 'BPM') {
    min = 55;
    max = 90;
  } else if (label === 'SpO₂ (%)') {
    min = 92;
    max = 100;
  } else if (label === 'Temperature (°C)') {
    min = 36;
    max = 39;
  } else if (label === 'ECG Signal') {
    min = -200;
    max = 600;
  }

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label,
        data: [],
        borderColor: color,
        backgroundColor: color + '33',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 0
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Time (s)',
            color: '#666',
            font: { weight: 'bold' }
          },
          ticks: {
            color: '#666',
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 10
          },
          grid: {
            color: chartColors.gridLines,
            drawBorder: false
          }
        },
        y: {
          beginAtZero: false,
             min: label === 'BPM' ? 50 : label === 'SpO₂ (%)' ? 90 : label === 'Temperature (°C)' ? 30 : undefined,
             max: label === 'BPM' ? 130 : label === 'SpO₂ (%)' ? 100 : label === 'Temperature (°C)' ? 45 : undefined,
          ticks: {
            color: '#666',
            padding: 10
          },
          grid: {
            color: chartColors.gridLines,
            drawBorder: false
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 12 },
          padding: 10,
          cornerRadius: 8
        }
      },
      elements: {
        line: {
          cubicInterpolationMode: 'monotone'
        }
      }
    }
  });
}

// Create all charts
const spo2Chart = createChart(
  document.getElementById('spo2Chart').getContext('2d'),
  'SpO₂ (%)',
  chartColors.spo2
);
const bpmChart = createChart(
  document.getElementById('bpmChart').getContext('2d'),
  'BPM',
  chartColors.hr
);
const tempChart = createChart(
  document.getElementById('tempChart').getContext('2d'),
  'Temperature (°C)',
  chartColors.temp
);
const ecgChart = createChart(
  document.getElementById('ecgChart').getContext('2d'),
  'ECG Signal',
  chartColors.ecg
);

// Restore chart data if exists
['spo2', 'hr', 'temp', 'ecg'].forEach((key, i) => {
  chartData[key].forEach((v, idx) => {
    const chart = [spo2Chart, bpmChart, tempChart, ecgChart][i];
    chart.data.labels.push(idx);
    chart.data.datasets[0].data.push(v);
  });
});
[spo2Chart, bpmChart, tempChart, ecgChart].forEach(c => c.update());

// Update status based on state
function updateStatus(state = 'normal') {
  if (state === 'blood-clot') {
    statusElement.textContent = 'Case: Blood Clot Detected';
    statusElement.className = 'blood-clot';
  } else {
    statusElement.textContent = 'Case: Normal';
    statusElement.className = 'normal';
  }
}

function updateCharts() {
  fetch(CONFIG.API_BASE_URL + CONFIG.ENDPOINTS.LIVE_DATA)
    .then(response => response.json())
    .then(data => {
      chartData.time += 1;

      const spo2 = parseFloat(data.spo2);
      const hr = parseInt(data.hr);
      const temp = parseFloat(data.temp);
      // Use simulation pattern if simulation is active, otherwise use normal pattern
      const ecg = isSimulationActive ? selectedSimulationPattern[ecgIndex] : (ecgShowZeros ? 0 : ECG_PATTERN[ecgIndex]);
      ecgIndex = (ecgIndex + 1) % (isSimulationActive ? selectedSimulationPattern.length : ECG_PATTERN.length);

      // Update status based on simulation state
      if (!isSimulationActive) {
        updateStatus('normal');
      }
      // During simulation, status is controlled manually in startSimulationSequence

      // Update all charts including ECG
      ['spo2', 'hr', 'temp', 'ecg'].forEach((key, i) => {
        const val = [spo2, hr, temp, ecg][i];
        chartData[key].push(val);
        const chart = [spo2Chart, bpmChart, tempChart, ecgChart][i];

        chart.data.labels.push(chartData.time);
        chart.data.datasets[0].data.push(val);

        if (chartData[key].length > 30) chartData[key].shift();
        if (chart.data.labels.length > 30) chart.data.labels.shift();
        if (chart.data.datasets[0].data.length > 30) chart.data.datasets[0].data.shift();

        chart.update();
      });

      localStorage.setItem('chartData', JSON.stringify(chartData));
    })
    .catch(error => {
      console.error('Error fetching live data:', error);
    });
}

// Start real-time update loop
// --- Toggle Updates Button Logic ---
const toggleBtn = document.getElementById('toggleUpdates');
toggleBtn.addEventListener('click', () => {
  isUpdating = !isUpdating;
  ecgShowZeros = false; // Set ECG to show normal data
  if (isUpdating) {
    updateInterval = setInterval(updateCharts, 1500);
    toggleBtn.textContent = 'Pause Updates';
  } else {
    clearInterval(updateInterval);
    toggleBtn.textContent = 'Resume Updates';
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'h' || e.key === 'H') {
    toggleBtn.style.display = toggleBtn.style.display === 'none' ? 'block' : 'none';
  }
  if (e.key === 'e' || e.key === 'E') {
    ecgControlBtn.style.display = ecgControlBtn.style.display === 'none' ? 'block' : 'none';
  }
});

// ECG Control Button Logic
const ecgControlBtn = document.getElementById('ecgControl');
ecgControlBtn.addEventListener('click', () => {
  isUpdating = !isUpdating;
  ecgShowZeros = true; // Set ECG to show zeros
  if (isUpdating) {
    updateInterval = setInterval(updateCharts, 1500);
    ecgControlBtn.textContent = 'Pause Updates (ECG: Zeros)';
  } else {
    clearInterval(updateInterval);
    ecgControlBtn.textContent = 'Resume Updates (ECG: Zeros)';
  }
});

// Set initial button text
if (toggleBtn) toggleBtn.textContent = 'Resume Updates';
if (ecgControlBtn) ecgControlBtn.textContent = 'Resume Updates (ECG: Zeros)';

// Simulation functionality
const simulationToggle = document.getElementById('simulationToggle');
const simulationMenu = document.getElementById('simulationMenu');
const startSimulationBtn = document.getElementById('startSimulation');
const simulationError = document.getElementById('simulationError');

// Toggle simulation menu
simulationToggle.addEventListener('click', () => {
  simulationMenu.style.display = simulationMenu.style.display === 'block' ? 'none' : 'block';
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
  if (!simulationToggle.contains(e.target) && !simulationMenu.contains(e.target)) {
    simulationMenu.style.display = 'none';
  }
});

// Start simulation
startSimulationBtn.addEventListener('click', () => {
  const selectedType = document.querySelector('input[name="simulationType"]:checked');
  
  if (!selectedType) {
    simulationError.textContent = 'Please choose your simulation type!';
    return;
  }
  
  simulationError.textContent = '';
  simulationMenu.style.display = 'none';
  
  // Store the selected simulation type
  selectedSimulationType = selectedType.value;
  // Choose the pattern based on type
  if (selectedSimulationType === 's1q3t3') {
    selectedSimulationPattern = ECG_SIMULATION_PATTERN_S1Q3T3;
  } else {
    selectedSimulationPattern = ECG_SIMULATION_PATTERN_OTHER;
  }
  // Start simulation sequence
  startSimulationSequence();
});

function startSimulationSequence() {
  // Stop any existing updates
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  
  // Reset ECG index for simulation pattern
  ecgIndex = 0;
  
  // Start simulation mode
  isSimulationActive = true;
  isUpdating = true;
  
  // Start updates with simulation ECG pattern
  updateInterval = setInterval(updateCharts, 1500);
  
  // First 17 seconds: Keep status as Normal
  updateStatus('normal');
  
  // After 17 seconds, change status to blood clot detected
  setTimeout(() => {
    updateStatus('blood-clot');
  }, 17000);
  
  // After 23 seconds total (6 more seconds after blood clot detection), navigate to curing page
  setTimeout(() => {
    window.location.href = '/frontend/curing.html';
  }, 23000);
}

// Initial dummy status
updateStatus();

// --- LOGIN CHECK ---
if (!(localStorage.getItem('clotcare_logged_in') === '1' || sessionStorage.getItem('clotcare_logged_in') === '1')) {
  window.location.href = 'login.html';
}
// --- END LOGIN CHECK ---
// Add logout link below the navbar
window.addEventListener('DOMContentLoaded', function() {
  // Find the navbar
  var navbar = document.querySelector('.navbar');
  if (navbar) {
    var logoutDiv = document.createElement('div');
    logoutDiv.innerHTML = '<a id="logoutLink" style="color:#ff6b6b; font-weight:600; text-decoration:none; font-size:1rem; margin:18px 32px 0 0; display:block; text-align:right;">Logout</a>';
    navbar.insertAdjacentElement('afterend', logoutDiv);
    document.getElementById('logoutLink').addEventListener('click', function() {
      localStorage.removeItem('clotcare_logged_in');
      sessionStorage.removeItem('clotcare_logged_in');
      window.location.href = 'login.html';
    });
  }
});
