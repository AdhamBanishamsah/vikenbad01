// Main JavaScript file
document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    initializeDataTables();
    initializeFormValidation();
    initializeCharts();
});

function initializeDataTables() {
    const tables = document.querySelectorAll('.data-table');
    tables.forEach(table => {
        new DataTable(table, {
            pageLength: 10,
            responsive: true
        });
    });
}

function initializeFormValidation() {
    const forms = document.querySelectorAll('form[data-validate]');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!validateForm(this)) {
                e.preventDefault();
            }
        });
    });
}

function initializeCharts() {
    const charts = document.querySelectorAll('[data-chart]');
    charts.forEach(chart => {
        const type = chart.dataset.chart;
        const data = JSON.parse(chart.dataset.chartData);
        createChart(chart, type, data);
    });
}

function validateForm(form) {
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('is-invalid');
        } else {
            field.classList.remove('is-invalid');
        }
    });
    
    return isValid;
}

function createChart(element, type, data) {
    // Implement chart creation using your preferred library
    // Example using Chart.js
    if (typeof Chart !== 'undefined') {
        new Chart(element, {
            type: type,
            data: data,
            options: {
                responsive: true
            }
        });
    }
}

// AJAX helper function
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
} 