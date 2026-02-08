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
    refreshAllData();
});

// Event Listeners
function initializeEventListeners() {
    // Action buttons
    document.getElementById('addNewBtn').addEventListener('click', openAddModal);
    
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Search
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    
    // Quick Add Form
    document.getElementById('quickAddForm').addEventListener('submit', handleQuickAdd);
    
    // Modal controls
    document.querySelector('.close').addEventListener('click', closeModal);
    document.querySelector('.close-status').addEventListener('click', closeStatusModal);
    document.querySelector('.close-contest').addEventListener('click', closeContestModal);
    document.querySelector('.close-delete').addEventListener('click', closeDeleteModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.getElementById('cancelStatusBtn').addEventListener('click', closeStatusModal);
    document.getElementById('cancelContestBtn').addEventListener('click', closeContestModal);
    document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);
    
    // Form submission
    recordForm.addEventListener('submit', handleFormSubmit);
    document.getElementById('statusForm').addEventListener('submit', handleStatusUpdate);
    document.getElementById('contestForm').addEventListener('submit', saveContest);
    
    // Contest functionality
    document.getElementById('addContestBtn').addEventListener('click', openContestModal);
    document.getElementById('addSlabBtn').addEventListener('click', addSlab);
    
    // Delete functionality
    document.getElementById('deleteRecordBtn').addEventListener('click', handleDeleteFromStatusModal);
    document.getElementById('fetchDeleteBtn').addEventListener('click', fetchRecordForDelete);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
    
    // Close modals when clicking outside
    const statusModal = document.getElementById('updateStatusModal');
    const contestModal = document.getElementById('contestModal');
    window.addEventListener('click', function(event) {
        if (event.target === modal) closeModal();
        if (event.target === statusModal) closeStatusModal();
        if (event.target === contestModal) closeContestModal();
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

function closeStatusModal() {
    document.getElementById('updateStatusModal').style.display = 'none';
}

function openStatusModal(loanCode, currentStatus, currentSubStatus, rowIndex) {
    document.getElementById('statusLoanCode').value = loanCode;
    document.getElementById('statusStatus').value = currentStatus;
    document.getElementById('statusSubStatus').value = currentSubStatus;
    window.currentStatusRowIndex = rowIndex;
    document.getElementById('updateStatusModal').style.display = 'block';
}

function openStatusModalFromSearch(loanCode, currentStatus, currentSubStatus) {
    showLoading();
    fetchRecordByLoanCode(loanCode)
        .then(record => {
            if (record) {
                openStatusModal(loanCode, currentStatus, currentSubStatus, record.rowIndex);
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

function handleStatusUpdate(e) {
    e.preventDefault();
    
    const loanCode = document.getElementById('statusLoanCode').value;
    const status = document.getElementById('statusStatus').value;
    const subStatus = document.getElementById('statusSubStatus').value;
    
    showLoading();
    
    const formData = new FormData();
    formData.append('action', 'updateStatus');
    formData.append('loanCode', loanCode);
    formData.append('status', status);
    formData.append('subStatus', subStatus);
    formData.append('rowIndex', window.currentStatusRowIndex);
    
    fetch(SCRIPT_URL, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showMessage('Status updated successfully', 'success');
            closeStatusModal();
            refreshAllData();
            hideSearchResults();
            performSearch();
        } else {
            showMessage(result.message, 'error');
        }
    })
    .catch(error => {
        showMessage('Error updating status: ' + error.message, 'error');
    })
    .finally(() => {
        hideLoading();
    });
}

function handleDeleteFromStatusModal() {
    const loanCode = document.getElementById('statusLoanCode').value;
    
    if (confirm(`Are you sure you want to delete record with Loan Code: ${loanCode}?`)) {
        showLoading();
        
        const formData = new FormData();
        formData.append('action', 'deleteRecord');
        formData.append('loanCode', loanCode);
        formData.append('rowIndex', window.currentStatusRowIndex);
        
        fetch(SCRIPT_URL, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showMessage('Record deleted successfully', 'success');
                closeStatusModal();
                refreshAllData();
                hideSearchResults();
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
function handleQuickAdd(e) {
    e.preventDefault();
    
    const formData = {
        loanCode: document.getElementById('quickLoanCode').value.trim(),
        applicationId: document.getElementById('quickApplicationId').value.trim(),
        name: document.getElementById('quickName').value.trim(),
        mobileNumber: document.getElementById('quickMobileNumber').value.trim(),
        status: document.getElementById('quickStatus').value,
        subStatus: document.getElementById('quickSubStatus').value,
        remarks: document.getElementById('quickRemarks').value.trim()
    };
    
    addRecord(formData);
    document.getElementById('quickAddForm').reset();
}

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
            refreshAllData();
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
            refreshAllData();
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
                        <th>Edit</th>
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
                    <td><button class="btn-edit" onclick="openStatusModalFromSearch('${record.loanCode}', '${record.status}', '${record.subStatus}')" title="Edit Status">✏️</button></td>
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
            refreshAllData();
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
function loadTodayStatusCount() {
    const todayUrl = `${SCRIPT_URL}?action=getTodayStatusCount`;
    const totalUrl = `${SCRIPT_URL}?action=getTotalStatusCount`;
    
    return Promise.all([
        fetch(todayUrl, { method: 'GET' }).then(r => r.json()),
        fetch(totalUrl, { method: 'GET' }).then(r => r.json())
    ])
    .then(([todayResult, totalResult]) => {
        if (todayResult.success && totalResult.success) {
            updateStatusCounts(todayResult.data, totalResult.data);
        }
    })
    .catch(error => console.error('Error loading status counts:', error));
}

function loadTodaysData() {
    const url = `${SCRIPT_URL}?action=getTodaysData`;
    
    return fetch(url, { method: 'GET' })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            displayTodaysData(result.data);
        }
    })
    .catch(error => console.error('Error loading today\'s data:', error));
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
                    <th>Application ID</th>
                    <th>Mobile Number</th>
                    <th>Status</th>
                    <th>Sub-Status</th>
                    <th>Edit</th>
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
                <td>${record.applicationId}</td>
                <td>${record.mobileNumber}</td>
                <td><span class="status-badge ${record.status.toLowerCase().replace(' ', '-')}">${record.status}</span></td>
                <td>${record.subStatus}</td>
                <td><button class="btn-edit" onclick="openStatusModal('${record.loanCode}', '${record.status}', '${record.subStatus}', ${record.rowIndex})" title="Edit Status">✏️</button></td>
            </tr>
        `;
    });
    
    tableHTML += '</tbody></table>';
    tableDiv.innerHTML = tableHTML;
}

function loadNonHotLeadData() {
    const url = `${SCRIPT_URL}?action=getNonHotLeadData`;
    
    return fetch(url, { method: 'GET' })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            displayNonHotLeadData(result.data);
        }
    })
    .catch(error => console.error('Error loading non-Hot Lead data:', error));
}

function displayNonHotLeadData(records) {
    const tableDiv = document.getElementById('nonHotLeadTable');
    
    if (!tableDiv) {
        console.error('nonHotLeadTable element not found');
        return;
    }
    
    if (records.length === 0) {
        tableDiv.innerHTML = '<div class="empty-state"><p>📅 No non-Hot Lead records found.</p></div>';
        return;
    }
    
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
                    <th>Edit</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    records.forEach(record => {
        const dateTime = new Date(record.timestamp).toLocaleString();
        tableHTML += `
            <tr>
                <td><span class="time-badge">${dateTime}</span></td>
                <td>${record.loanCode}</td>
                <td>${record.applicationId}</td>
                <td>${record.mobileNumber}</td>
                <td><span class="status-badge ${record.status.toLowerCase().replace(' ', '-')}">${record.status}</span></td>
                <td>${record.subStatus}</td>
                <td><button class="btn-edit" onclick="openStatusModal('${record.loanCode}', '${record.status}', '${record.subStatus}', ${record.rowIndex})" title="Edit Status">✏️</button></td>
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
function refreshAllData() {
    Promise.all([
        loadTodayStatusCount(),
        loadTodaysData(),
        loadNonHotLeadData(),
        loadContests()
    ]);
}

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

// Contest Management
let contests = [];
let slabCount = 0;

function loadContests() {
    return fetch(`${SCRIPT_URL}?action=getContests`)
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                contests = result.data;
                const today = new Date().toISOString().split('T')[0];
                const expiredContests = contests.filter(c => c.endDate < today);
                expiredContests.forEach(contest => deleteContestFromSheet(contest.id));
                contests = contests.filter(c => c.endDate >= today);
                displayContests();
            }
        })
        .catch(error => console.error('Error loading contests:', error));
}

function openContestModal() {
    document.getElementById('contestModal').style.display = 'block';
    document.getElementById('contestForm').reset();
    document.getElementById('slabsContainer').innerHTML = '';
    slabCount = 0;
    addSlab();
}

function closeContestModal() {
    document.getElementById('contestModal').style.display = 'none';
}

function addSlab() {
    slabCount++;
    const container = document.getElementById('slabsContainer');
    const slabDiv = document.createElement('div');
    slabDiv.className = 'slab-section';
    slabDiv.id = `slab${slabCount}`;
    slabDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <h4>Slab ${slabCount}</h4>
            <button type="button" class="btn-icon btn-delete" onclick="removeSlab(${slabCount})" title="Remove Slab">➖</button>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Daily Target:</label>
                <input type="number" id="slab${slabCount}Daily" placeholder="e.g., ${slabCount * 2 + 2}">
            </div>
            <div class="form-group">
                <label>Weekly Target:</label>
                <input type="number" id="slab${slabCount}Weekly" placeholder="e.g., ${(slabCount * 2 + 2) * 6}">
            </div>
            <div class="form-group">
                <label>Incentive (₹):</label>
                <input type="number" id="slab${slabCount}Incentive" placeholder="e.g., ${1000 + slabCount * 1000}">
            </div>
        </div>
    `;
    container.appendChild(slabDiv);
}

function removeSlab(id) {
    const slab = document.getElementById(`slab${id}`);
    if (slab) slab.remove();
}

function saveContest(e) {
    e.preventDefault();
    const slabs = [];
    document.querySelectorAll('.slab-section').forEach((slabEl, index) => {
        const id = slabEl.id.replace('slab', '');
        const daily = document.getElementById(`slab${id}Daily`).value;
        const weekly = document.getElementById(`slab${id}Weekly`).value;
        const incentive = document.getElementById(`slab${id}Incentive`).value;
        if (daily && weekly && incentive) {
            slabs.push({ name: `Slab ${index + 1}`, daily: parseInt(daily), weekly: parseInt(weekly), incentive: parseInt(incentive) });
        }
    });
    if (slabs.length === 0) {
        showMessage('Please add at least one slab with all fields filled!', 'error');
        return;
    }
    const contest = {
        id: Date.now(),
        name: document.getElementById('contestName').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        slabs: slabs
    };
    showLoading();
    const formData = new FormData();
    formData.append('action', 'saveContest');
    formData.append('data', JSON.stringify(contest));
    fetch(SCRIPT_URL, { method: 'POST', body: formData })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                closeContestModal();
                loadContests();
                showMessage('Contest added successfully!', 'success');
            } else {
                showMessage(result.message, 'error');
            }
        })
        .catch(error => showMessage('Error saving contest: ' + error.message, 'error'))
        .finally(() => hideLoading());
}

function deleteContest(id) {
    if (confirm('Are you sure you want to delete this contest?')) {
        showLoading();
        const formData = new FormData();
        formData.append('action', 'deleteContest');
        formData.append('contestId', id);
        fetch(SCRIPT_URL, { method: 'POST', body: formData })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    loadContests();
                    showMessage('Contest deleted successfully!', 'success');
                } else {
                    showMessage(result.message, 'error');
                }
            })
            .catch(error => showMessage('Error deleting contest: ' + error.message, 'error'))
            .finally(() => hideLoading());
    }
}

function deleteContestFromSheet(id) {
    const formData = new FormData();
    formData.append('action', 'deleteContest');
    formData.append('contestId', id);
    fetch(SCRIPT_URL, { method: 'POST', body: formData }).catch(() => {});
}

async function displayContests() {
    const container = document.getElementById('activeContests');
    if (contests.length === 0) {
        container.innerHTML = '<div class="empty-state" style="padding: 40px;"><p>🏆 No active contests. Click "Add Contest" to create one!</p></div>';
        return;
    }
    container.innerHTML = '';
    for (const contest of contests) {
        const card = await createContestCard(contest);
        container.appendChild(card);
    }
}

async function createContestCard(contest) {
    const card = document.createElement('div');
    card.className = 'contest-card';
    const data = await fetchContestData(contest.startDate, contest.endDate);
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todayData = data.daily.find(d => d.date === todayStr);
    const todayCount = todayData ? todayData.hotLeads : 0;
    const weeklyTotal = data.weeklyTotal;
    const startDate = new Date(contest.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endDate = new Date(contest.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    card.innerHTML = `
        <div class="contest-header">
            <div>
                <div class="contest-title">${contest.name}</div>
                <div class="contest-dates">📅 ${startDate} - ${endDate}</div>
            </div>
            <div class="contest-actions">
                <button class="btn-icon btn-delete" onclick="deleteContest(${contest.id})" title="Delete Contest">🗑️</button>
                <button class="btn-icon" onclick="loadContests()" title="Refresh Data" style="background: linear-gradient(135deg, #4facfe, #00f2fe); color: white;">🔄</button>
            </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
                <h4 style="margin: 0 0 10px 0; font-size: 1rem;">📅 Today: ${todayCount} HL</h4>
                ${generateCompactSlabCards(todayCount, contest.slabs, 'daily')}
            </div>
            <div>
                <h4 style="margin: 0 0 10px 0; font-size: 1rem;">📈 Weekly: ${weeklyTotal} HL</h4>
                ${generateCompactSlabCards(weeklyTotal, contest.slabs, 'weekly')}
            </div>
        </div>
    `;
    return card;
}

function generateCompactSlabCards(count, slabs, type) {
    let html = '<div style="display: flex; flex-direction: column; gap: 10px;">';
    slabs.forEach(slab => {
        const target = type === 'daily' ? slab.daily : slab.weekly;
        const achieved = count >= target;
        const percentage = Math.min((count / target) * 100, 100);
        const remaining = Math.max(0, target - count);
        html += `
            <div style="background: var(--card-bg); border: 2px solid ${achieved ? '#38ef7d' : 'var(--border-color)'}; border-radius: 10px; padding: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 1rem; font-weight: 700; color: var(--text-color);">${slab.name}</span>
                    ${type === 'weekly' ? `<span style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.9rem; font-weight: 600;">₹${slab.incentive}</span>` : ''}
                </div>
                <div style="background: rgba(102, 126, 234, 0.1); border-radius: 8px; height: 28px; overflow: hidden; margin-bottom: 10px;">
                    <div style="background: ${achieved ? 'linear-gradient(90deg, #11998e, #38ef7d)' : 'linear-gradient(90deg, #4facfe, #00f2fe)'}; height: 100%; width: ${percentage}%; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 700; color: white; transition: width 0.5s ease;">${count}/${target}</div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; font-size: 0.85rem;">
                    <div style="text-align: center; padding: 6px; background: linear-gradient(135deg, rgba(56, 239, 125, 0.1), rgba(17, 153, 142, 0.1)); border-radius: 6px;">
                        <div style="font-weight: 600; color: #38ef7d;">${count}</div>
                        <div style="color: var(--text-light); font-size: 0.75rem;">Achieved</div>
                    </div>
                    <div style="text-align: center; padding: 6px; background: linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 152, 0, 0.1)); border-radius: 6px;">
                        <div style="font-weight: 600; color: #ff9800;">${remaining}</div>
                        <div style="color: var(--text-light); font-size: 0.75rem;">Remaining</div>
                    </div>
                    <div style="text-align: center; padding: 6px; background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1)); border-radius: 6px;">
                        <div style="font-weight: 600; color: var(--primary-color);">${target}</div>
                        <div style="color: var(--text-light); font-size: 0.75rem;">Target</div>
                    </div>
                </div>
                ${achieved ? '<div style="text-align: center; color: #38ef7d; font-size: 0.85rem; margin-top: 8px; font-weight: 700; background: linear-gradient(135deg, rgba(56, 239, 125, 0.1), rgba(17, 153, 142, 0.1)); padding: 6px; border-radius: 6px;">✅ Target Achieved!</div>' : ''}
            </div>
        `;
    });
    html += '</div>';
    return html;
}

function generateSlabCards(count, slabs, type) {
    let html = '<div class="slab-container">';
    slabs.forEach(slab => {
        const target = type === 'daily' ? slab.daily : slab.weekly;
        const achieved = count >= target;
        const percentage = Math.min((count / target) * 100, 100);
        html += `
            <div class="slab-card ${achieved ? 'achieved' : ''}">
                <div class="slab-header">
                    <span class="slab-title">${slab.name}</span>
                    <span class="slab-incentive">₹${slab.incentive}</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar ${achieved ? 'complete' : ''}" style="width: ${percentage}%">${count}/${target}</div>
                </div>
                <div class="slab-stats">
                    <div class="stat-row"><span class="stat-label">Target:</span><span class="stat-value">${target} HL</span></div>
                    <div class="stat-row"><span class="stat-label">Achieved:</span><span class="stat-value ${achieved ? 'achieved' : ''}">${count} HL</span></div>
                    <div class="stat-row"><span class="stat-label">Remaining:</span><span class="stat-value">${Math.max(0, target - count)} HL</span></div>
                </div>
                ${achieved ? '<div class="achievement-badge">🎉 Target Achieved!</div>' : ''}
            </div>
        `;
    });
    html += '</div>';
    return html;
}

function generateDailyTable(dailyData, slabs) {
    let html = '<table class="daily-table"><thead><tr><th>Date</th><th>Day</th><th>Hot Leads</th>';
    slabs.forEach((slab, index) => { html += `<th>Slab ${index + 1} (${slab.daily})</th>`; });
    html += '</tr></thead><tbody>';
    dailyData.forEach(day => {
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const cellClass = day.hotLeads > 0 ? 'achieved-cell' : 'pending-cell';
        html += `<tr><td>${dateStr}</td><td>${dayName}</td><td class="${cellClass}">${day.hotLeads}</td>`;
        slabs.forEach(slab => { html += `<td>${day.hotLeads >= slab.daily ? '✅' : '❌'}</td>`; });
        html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
}

async function fetchContestData(startDate, endDate) {
    try {
        const url = `${SCRIPT_URL}?action=getContestData&startDate=${startDate}&endDate=${endDate}`;
        const response = await fetch(url);
        const result = await response.json();
        if (result.success) return result.data;
        throw new Error(result.message);
    } catch (error) {
        return { daily: [], weeklyTotal: 0 };
    }
}
