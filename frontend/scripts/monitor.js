const ECG_PATTERN = [
  304.2, 312.3, 293.5, 362.4, 323.4, 301.7, 534.1,
  317.2, 309.3, 286.5, 375.4, 329.4, 311.7, 581.1
];

let ecgIndex = 0;
let statusElement = document.getElementById('caseStatus');

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

// Always start with fresh chart data
localStorage.removeItem('chartData');

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

// Always normal
function updateStatus() {
  statusElement.textContent = 'Case: Normal';
  statusElement.className = 'normal';
}

function updateCharts() {
  fetch('https://web-production-5936c.up.railway.app/live-data')
    .then(response => response.json())
    .then(data => {
      chartData.time += 1;

      const spo2 = parseFloat(data.spo2);
      const hr = parseInt(data.hr);
      const temp = parseFloat(data.temp);
      const ecg = parseFloat(data.ecg);

      updateStatus(); // Always normal

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
setInterval(updateCharts, 1500);

// Initial dummy status
updateStatus();
