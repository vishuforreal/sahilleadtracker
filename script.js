// Configuration - Replace with your Google Apps Script Web App URL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzW_qbadLs9WpuGNnaf4OE65BvicmBFv9eE7hVwwaukt_5txoNLPlkmuEsg9sTA9RGbeg/exec';

// DOM Elements
const modal = document.getElementById('modal');
const deleteModal = document.getElementById('deleteModal');
const loading = document.getElementById('loading');
const message = document.getElementById('message');
const recordForm = document.getElementById('recordForm');

// Global variables
let currentMode = 'add'; // 'add' or 'update'
let currentRowIndex = -1;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeTheme();
    loadTodayStatusCount();
    loadTodaysData();
    
    // Auto-refresh every 30 seconds
    setInterval(function() {
        loadTodayStatusCount();
        loadTodaysData();
    }, 30000); // 30 seconds
});

// Event Listeners
function initializeEventListeners() {
    // Action buttons
    document.getElementById('addNewBtn').addEventListener('click', openAddModal);
    document.getElementById('updateBtn').addEventListener('click', openUpdateModal);
    document.getElementById('deleteBtn').addEventListener('click', openDeleteModal);
    
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Search
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    
    // Modal controls
    document.querySelector('.close').addEventListener('click', closeModal);
    document.querySelector('.close-update').addEventListener('click', closeUpdateModal);
    document.querySelector('.close-delete').addEventListener('click', closeDeleteModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);
    
    // Form submission
    recordForm.addEventListener('submit', handleFormSubmit);
    
    // Update functionality
    document.getElementById('fetchUpdateBtn').addEventListener('click', fetchRecordForUpdate);
    
    // Delete functionality
    document.getElementById('fetchDeleteBtn').addEventListener('click', fetchRecordForDelete);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
    
    // Close modals when clicking outside
    const updateModal = document.getElementById('updateModal');
    window.addEventListener('click', function(event) {
        if (event.target === modal) closeModal();
        if (event.target === updateModal) closeUpdateModal();
        if (event.target === deleteModal) closeDeleteModal();
    });
}

// Modal Functions
function openAddModal() {
    currentMode = 'add';
    document.getElementById('modalTitle').textContent = 'Add New Record';
    recordForm.reset();
    modal.style.display = 'block';
}

function openUpdateModal() {
    document.getElementById('updateModal').style.display = 'block';
    document.getElementById('updateLoanCode').value = '';
    document.getElementById('updateRecordDisplay').style.display = 'none';
}

function closeUpdateModal() {
    document.getElementById('updateModal').style.display = 'none';
}

function fetchRecordForUpdate() {
    const loanCode = document.getElementById('updateLoanCode').value.trim();
    
    if (!loanCode) {
        showMessage('Please enter a Loan Code', 'error');
        return;
    }
    
    showLoading();
    
    fetchRecordByLoanCode(loanCode)
        .then(record => {
            if (record) {
                displayRecordForUpdate(record);
            } else {
                showMessage('Record not found', 'error');
            }
        })
        .catch(error => {
            showMessage('Error fetching record: ' + error.message, 'error');
        })
        .finally(() => {
            hideLoading();
        });
}

function displayRecordForUpdate(record) {
    const displayDiv = document.getElementById('updateRecordDisplay');
    
    displayDiv.innerHTML = `
        <h4>Record Found - Click Edit to Update:</h4>
        <div class="record-info">
            <span class="record-label">Loan Code:</span>
            <span>${record.loanCode}</span>
        </div>
        <div class="record-info">
            <span class="record-label">Application ID:</span>
            <span>${record.applicationId}</span>
        </div>
        <div class="record-info">
            <span class="record-label">Name:</span>
            <span>${record.name}</span>
        </div>
        <div class="record-info">
            <span class="record-label">Mobile Number:</span>
            <span>${record.mobileNumber}</span>
        </div>
        <div class="record-info">
            <span class="record-label">Status:</span>
            <span>${record.status}</span>
        </div>
        <div class="record-info">
            <span class="record-label">Sub-Status:</span>
            <span>${record.subStatus}</span>
        </div>
        <div class="record-info">
            <span class="record-label">Remarks:</span>
            <span>${record.remarks}</span>
        </div>
        <div class="form-actions" style="margin-top: 1rem;">
            <button onclick="editRecord()" class="btn btn-primary">
                <i class="fas fa-edit"></i> Edit Record
            </button>
        </div>
    `;
    
    displayDiv.style.display = 'block';
    window.currentUpdateRecord = record;
}

function editRecord() {
    if (!window.currentUpdateRecord) return;
    
    currentMode = 'update';
    currentRowIndex = window.currentUpdateRecord.rowIndex;
    document.getElementById('modalTitle').textContent = 'Update Record';
    populateForm(window.currentUpdateRecord);
    
    closeUpdateModal();
    modal.style.display = 'block';
}

function openDeleteModal() {
    deleteModal.style.display = 'block';
    document.getElementById('deleteLoanCode').value = '';
    document.getElementById('deleteRecordDisplay').style.display = 'none';
    document.getElementById('deleteActions').style.display = 'none';
}

function closeModal() {
    modal.style.display = 'none';
    recordForm.reset();
}

function closeDeleteModal() {
    deleteModal.style.display = 'none';
}

// Form Functions
function populateForm(record) {
    document.getElementById('loanCode').value = record.loanCode;
    document.getElementById('applicationId').value = record.applicationId;
    document.getElementById('name').value = record.name;
    document.getElementById('mobileNumber').value = record.mobileNumber;
    document.getElementById('status').value = record.status;
    document.getElementById('subStatus').value = record.subStatus;
    document.getElementById('remarks').value = record.remarks;
}

function getFormData() {
    return {
        loanCode: document.getElementById('loanCode').value.trim(),
        applicationId: document.getElementById('applicationId').value.trim(),
        name: document.getElementById('name').value.trim(),
        mobileNumber: document.getElementById('mobileNumber').value.trim(),
        status: document.getElementById('status').value,
        subStatus: document.getElementById('subStatus').value,
        remarks: document.getElementById('remarks').value.trim()
    };
}

function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = getFormData();
    
    if (currentMode === 'add') {
        addRecord(formData);
    } else {
        updateRecord(formData);
    }
}

// CRUD Operations
function addRecord(data) {
    showLoading();
    
    const formData = new FormData();
    formData.append('action', 'addRecord');
    formData.append('data', JSON.stringify(data));
    
    fetch(SCRIPT_URL, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showMessage('Record added successfully', 'success');
            closeModal();
            loadTodayStatusCount();
            loadTodaysData();
        } else {
            showMessage(result.message, 'error');
        }
    })
    .catch(error => {
        showMessage('Error adding record: ' + error.message, 'error');
    })
    .finally(() => {
        hideLoading();
    });
}

function updateRecord(data) {
    showLoading();
    
    const formData = new FormData();
    formData.append('action', 'updateRecord');
    formData.append('data', JSON.stringify(data));
    formData.append('rowIndex', currentRowIndex);
    
    fetch(SCRIPT_URL, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showMessage('Record updated successfully', 'success');
            closeModal();
            loadTodayStatusCount();
            loadTodaysData();
        } else {
            showMessage(result.message, 'error');
        }
    })
    .catch(error => {
        showMessage('Error updating record: ' + error.message, 'error');
    })
    .finally(() => {
        hideLoading();
    });
}

function fetchRecordByLoanCode(loanCode) {
    const url = `${SCRIPT_URL}?action=getRecord&loanCode=${encodeURIComponent(loanCode)}`;
    
    return fetch(url, {
        method: 'GET'
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            return result.data;
        } else {
            throw new Error(result.message);
        }
    });
}

// Search Functions
function performSearch() {
    const searchType = document.getElementById('searchType').value;
    const searchValue = document.getElementById('searchValue').value.trim();
    
    if (!searchValue) {
        showMessage('Please enter a search value', 'error');
        return;
    }
    
    showLoading();
    
    const url = `${SCRIPT_URL}?action=searchRecords&searchType=${encodeURIComponent(searchType)}&searchValue=${encodeURIComponent(searchValue)}`;
    
    fetch(url, {
        method: 'GET'
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            displaySearchResults(result.data);
            // Keep the search value in the input for reference
        } else {
            showMessage(result.message, 'error');
        }
    })
    .catch(error => {
        showMessage('Error searching records: ' + error.message, 'error');
    })
    .finally(() => {
        hideLoading();
    });
}

function hideSearchResults() {
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('searchValue').value = '';
}

function displaySearchResults(records) {
    const resultsDiv = document.getElementById('resultsTable');
    const searchResults = document.getElementById('searchResults');
    
    if (records.length === 0) {
        resultsDiv.innerHTML = '<div class="empty-state"><p>No records found.</p></div>';
    } else {
        let tableHTML = `
            <table class="results-table">
                <thead>
                    <tr>
                        <th>Date & Time</th>
                        <th>Loan Code</th>
                        <th>Application ID</th>
                        <th>Mobile Number</th>
                        <th>Status</th>
                        <th>Sub-Status</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        records.forEach(record => {
            const dateTime = new Date(record.timestamp).toLocaleString();
            tableHTML += `
                <tr>
                    <td>${dateTime}</td>
                    <td>${record.loanCode}</td>
                    <td>${record.applicationId}</td>
                    <td>${record.mobileNumber}</td>
                    <td><span class="status-badge ${record.status.toLowerCase().replace(' ', '-')}">${record.status}</span></td>
                    <td>${record.subStatus}</td>
                </tr>
            `;
        });
        
        tableHTML += '</tbody></table>';
        resultsDiv.innerHTML = tableHTML;
    }
    
    searchResults.style.display = 'block';
}

// Delete Functions
function fetchRecordForDelete() {
    const loanCode = document.getElementById('deleteLoanCode').value.trim();
    
    if (!loanCode) {
        showMessage('Please enter a Loan Code', 'error');
        return;
    }
    
    showLoading();
    
    fetchRecordByLoanCode(loanCode)
        .then(record => {
            if (record) {
                displayRecordForDelete(record);
            } else {
                showMessage('Record not found', 'error');
            }
        })
        .catch(error => {
            showMessage('Error fetching record: ' + error.message, 'error');
        })
        .finally(() => {
            hideLoading();
        });
}

function displayRecordForDelete(record) {
    const displayDiv = document.getElementById('deleteRecordDisplay');
    
    displayDiv.innerHTML = `
        <h4>Record to Delete:</h4>
        <div class="record-info">
            <span class="record-label">Timestamp:</span>
            <span>${record.timestamp}</span>
        </div>
        <div class="record-info">
            <span class="record-label">Loan Code:</span>
            <span>${record.loanCode}</span>
        </div>
        <div class="record-info">
            <span class="record-label">Application ID:</span>
            <span>${record.applicationId}</span>
        </div>
        <div class="record-info">
            <span class="record-label">Name:</span>
            <span>${record.name}</span>
        </div>
        <div class="record-info">
            <span class="record-label">Mobile Number:</span>
            <span>${record.mobileNumber}</span>
        </div>
        <div class="record-info">
            <span class="record-label">Status:</span>
            <span>${record.status}</span>
        </div>
        <div class="record-info">
            <span class="record-label">Sub-Status:</span>
            <span>${record.subStatus}</span>
        </div>
        <div class="record-info">
            <span class="record-label">Remarks:</span>
            <span>${record.remarks}</span>
        </div>
    `;
    
    displayDiv.style.display = 'block';
    document.getElementById('deleteActions').style.display = 'block';
    currentRowIndex = record.rowIndex;
}

function confirmDelete() {
    const loanCode = document.getElementById('deleteLoanCode').value.trim();
    
    showLoading();
    
    const formData = new FormData();
    formData.append('action', 'deleteRecord');
    formData.append('loanCode', loanCode);
    formData.append('rowIndex', currentRowIndex);
    
    fetch(SCRIPT_URL, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showMessage('Record deleted successfully', 'success');
            closeDeleteModal();
            loadTodayStatusCount();
            loadTodaysData();
        } else {
            showMessage(result.message, 'error');
        }
    })
    .catch(error => {
        showMessage('Error deleting record: ' + error.message, 'error');
    })
    .finally(() => {
        hideLoading();
    });
}

// Status Count Functions
function loadTodayStatusCount(silent = false) {
    const todayUrl = `${SCRIPT_URL}?action=getTodayStatusCount`;
    const totalUrl = `${SCRIPT_URL}?action=getTotalStatusCount`;
    
    Promise.all([
        fetch(todayUrl, { method: 'GET' }).then(r => r.json()),
        fetch(totalUrl, { method: 'GET' }).then(r => r.json())
    ])
    .then(([todayResult, totalResult]) => {
        if (todayResult.success && totalResult.success) {
            updateStatusCounts(todayResult.data, totalResult.data);
        }
    })
    .catch(error => {
        if (!silent) {
            console.error('Error loading status counts:', error);
        }
    });
}

function loadTodaysData(silent = false) {
    console.log('Loading today\'s data...');
    const url = `${SCRIPT_URL}?action=getTodaysData`;
    
    fetch(url, {
        method: 'GET'
    })
    .then(response => {
        console.log('Response received:', response.status);
        return response.json();
    })
    .then(result => {
        console.log('Result:', result);
        if (result.success) {
            displayTodaysData(result.data);
        } else {
            if (!silent) {
                console.error('Error from server:', result.message);
            }
        }
    })
    .catch(error => {
        if (!silent) {
            console.error('Error loading today\'s data:', error);
        }
    });
}

function displayTodaysData(records) {
    const tableDiv = document.getElementById('todaysDataTable');
    
    if (!tableDiv) {
        console.error('todaysDataTable element not found');
        return;
    }
    
    if (records.length === 0) {
        tableDiv.innerHTML = '<div class="empty-state"><p>📅 No records found for today.</p></div>';
        return;
    }
    
    let tableHTML = `
        <table class="results-table">
            <thead>
                <tr>
                    <th>Time</th>
                    <th>Loan Code</th>
                    <th>Mobile Number</th>
                    <th>Status</th>
                    <th>Sub-Status</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    records.forEach(record => {
        const time = new Date(record.timestamp).toLocaleTimeString();
        tableHTML += `
            <tr>
                <td><span class="time-badge">${time}</span></td>
                <td>${record.loanCode}</td>
                <td>${record.mobileNumber}</td>
                <td><span class="status-badge ${record.status.toLowerCase().replace(' ', '-')}">${record.status}</span></td>
                <td>${record.subStatus}</td>
            </tr>
        `;
    });
    
    tableHTML += '</tbody></table>';
    tableDiv.innerHTML = tableHTML;
}

// Theme Functions
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const themeButton = document.getElementById('themeToggle');
    if (!themeButton) return;
    
    const sun = themeButton.querySelector('.sun');
    const moon = themeButton.querySelector('.moon');
    
    if (theme === 'dark') {
        if (sun) sun.style.display = 'none';
        if (moon) moon.style.display = 'inline-block';
    } else {
        if (sun) sun.style.display = 'inline-block';
        if (moon) moon.style.display = 'none';
    }
}

function updateStatusCounts(todayCounts, totalCounts) {
    document.getElementById('todayDocPending').textContent = (todayCounts && todayCounts['Doc Pending']) || 0;
    document.getElementById('todayHotLead').textContent = (todayCounts && todayCounts['Hot Lead']) || 0;
    document.getElementById('todayRecheck').textContent = (todayCounts && todayCounts['Recheck']) || 0;
    document.getElementById('todayPending').textContent = (todayCounts && todayCounts['Pending']) || 0;
    document.getElementById('todayAwh').textContent = (todayCounts && todayCounts['AWH']) || 0;
    
    document.getElementById('totalDocPending').textContent = (totalCounts && totalCounts['Doc Pending']) || 0;
    document.getElementById('totalHotLead').textContent = (totalCounts && totalCounts['Hot Lead']) || 0;
    document.getElementById('totalRecheck').textContent = (totalCounts && totalCounts['Recheck']) || 0;
    document.getElementById('totalPending').textContent = (totalCounts && totalCounts['Pending']) || 0;
    document.getElementById('totalAwh').textContent = (totalCounts && totalCounts['AWH']) || 0;
}

// Utility Functions
function showLoading() {
    loading.style.display = 'flex';
}

function hideLoading() {
    loading.style.display = 'none';
}

function showMessage(text, type) {
    message.textContent = text;
    message.className = `message ${type}`;
    message.style.display = 'block';
    
    setTimeout(() => {
        message.style.display = 'none';
    }, 5000);
}