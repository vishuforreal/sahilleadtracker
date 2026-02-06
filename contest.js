// Configuration
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwr16V4ytpsBzO0X1ZFGUGkgtitQBhhCOPxhtDJyM0pGNoPRDyFWiqeG7HxS5iKONtDnA/exec';

let contests = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    loadContests();
    
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('addContestBtn').addEventListener('click', openContestModal);
    document.getElementById('addSlabBtn').addEventListener('click', addSlab);
    document.querySelector('.close-contest').addEventListener('click', closeContestModal);
    document.getElementById('cancelContestBtn').addEventListener('click', closeContestModal);
    document.getElementById('contestForm').addEventListener('submit', saveContest);
});

let slabCount = 0;

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
    const sun = themeButton.querySelector('.sun');
    const moon = themeButton.querySelector('.moon');
    
    if (theme === 'dark') {
        sun.style.display = 'none';
        moon.style.display = 'inline-block';
    } else {
        sun.style.display = 'inline-block';
        moon.style.display = 'none';
    }
}

// Contest Management
function loadContests() {
    showLoading();
    
    fetch(`${SCRIPT_URL}?action=getContests`)
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                contests = result.data;
                
                // Remove expired contests
                const today = new Date().toISOString().split('T')[0];
                const expiredContests = contests.filter(c => c.endDate < today);
                
                // Delete expired contests from sheet
                expiredContests.forEach(contest => {
                    deleteContestFromSheet(contest.id);
                });
                
                contests = contests.filter(c => c.endDate >= today);
                displayContests();
            }
        })
        .catch(error => {
            showMessage('Error loading contests: ' + error.message, 'error');
        })
        .finally(() => {
            hideLoading();
        });
}

function saveContestsToStorage() {
    // No longer needed - contests are saved to Google Sheets
}

function openContestModal() {
    document.getElementById('contestModal').style.display = 'block';
    document.getElementById('contestForm').reset();
    document.getElementById('slabsContainer').innerHTML = '';
    slabCount = 0;
    addSlab(); // Add first slab by default
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
            <button type="button" class="btn-icon btn-delete" onclick="removeSlab(${slabCount})" title="Remove Slab">
                ➖
            </button>
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
    if (slab) {
        slab.remove();
    }
}

function closeContestModal() {
    document.getElementById('contestModal').style.display = 'none';
}

function saveContest(e) {
    e.preventDefault();
    
    const slabs = [];
    const slabElements = document.querySelectorAll('.slab-section');
    
    slabElements.forEach((slabEl, index) => {
        const id = slabEl.id.replace('slab', '');
        const daily = document.getElementById(`slab${id}Daily`).value;
        const weekly = document.getElementById(`slab${id}Weekly`).value;
        const incentive = document.getElementById(`slab${id}Incentive`).value;
        
        if (daily && weekly && incentive) {
            slabs.push({
                name: `Slab ${index + 1}`,
                daily: parseInt(daily),
                weekly: parseInt(weekly),
                incentive: parseInt(incentive)
            });
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
    
    fetch(SCRIPT_URL, {
        method: 'POST',
        body: formData
    })
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
    .catch(error => {
        showMessage('Error saving contest: ' + error.message, 'error');
    })
    .finally(() => {
        hideLoading();
    });
}

function deleteContest(id) {
    if (confirm('Are you sure you want to delete this contest?')) {
        showLoading();
        
        const formData = new FormData();
        formData.append('action', 'deleteContest');
        formData.append('contestId', id);
        
        fetch(SCRIPT_URL, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                loadContests();
                showMessage('Contest deleted successfully!', 'success');
            } else {
                showMessage(result.message, 'error');
            }
        })
        .catch(error => {
            showMessage('Error deleting contest: ' + error.message, 'error');
        })
        .finally(() => {
            hideLoading();
        });
    }
}

function deleteContestFromSheet(id) {
    const formData = new FormData();
    formData.append('action', 'deleteContest');
    formData.append('contestId', id);
    
    fetch(SCRIPT_URL, {
        method: 'POST',
        body: formData
    }).catch(() => {});
}

async function displayContests() {
    const container = document.getElementById('activeContests');
    
    if (contests.length === 0) {
        container.innerHTML = `
            <div class="empty-contests">
                <div class="icon">🏆</div>
                <h3>No Active Contests</h3>
                <p>Click "Add New Contest" to create your first contest!</p>
            </div>
        `;
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
    
    // Fetch contest data
    showLoading();
    const data = await fetchContestData(contest.startDate, contest.endDate);
    hideLoading();
    
    // Get today's date in YYYY-MM-DD format (local timezone)
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const todayData = data.daily.find(d => d.date === todayStr);
    const todayCount = todayData ? todayData.hotLeads : 0;
    const weeklyTotal = data.weeklyTotal;
    
    const startDate = new Date(contest.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const endDate = new Date(contest.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    card.innerHTML = `
        <div class="contest-header">
            <div>
                <div class="contest-title">${contest.name}</div>
                <div class="contest-dates">📅 ${startDate} - ${endDate}</div>
            </div>
            <div class="contest-actions">
                <button class="btn-icon btn-delete" onclick="deleteContest(${contest.id})" title="Delete Contest">
                    🗑️
                </button>
                <button class="btn-icon" onclick="location.reload()" title="Refresh Data" style="background: linear-gradient(135deg, #4facfe, #00f2fe); color: white;">
                    🔄
                </button>
            </div>
        </div>
        
        <h3><i class="icon">📅</i> Today's Progress (${todayCount} Hot Leads)</h3>
        ${generateSlabCards(todayCount, contest.slabs, 'daily')}
        
        <h3 style="margin-top: 30px;"><i class="icon">📈</i> Weekly Progress (${weeklyTotal} Hot Leads)</h3>
        ${generateSlabCards(weeklyTotal, contest.slabs, 'weekly')}
        
        <h3 style="margin-top: 30px;"><i class="icon">📋</i> Daily Breakdown</h3>
        ${generateDailyTable(data.daily, contest.slabs)}
    `;
    
    return card;
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
                    <div class="progress-bar ${achieved ? 'complete' : ''}" style="width: ${percentage}%">
                        ${count}/${target}
                    </div>
                </div>
                <div class="slab-stats">
                    <div class="stat-row">
                        <span class="stat-label">Target:</span>
                        <span class="stat-value">${target} HL</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Achieved:</span>
                        <span class="stat-value ${achieved ? 'achieved' : ''}">${count} HL</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Remaining:</span>
                        <span class="stat-value">${Math.max(0, target - count)} HL</span>
                    </div>
                </div>
                ${achieved ? '<div class="achievement-badge">🎉 Target Achieved!</div>' : ''}
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

function generateDailyTable(dailyData, slabs) {
    let html = `
        <table class="daily-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Day</th>
                    <th>Hot Leads</th>
    `;
    
    slabs.forEach((slab, index) => {
        html += `<th>Slab ${index + 1} (${slab.daily})</th>`;
    });
    
    html += `
                </tr>
            </thead>
            <tbody>
    `;
    
    dailyData.forEach(day => {
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const cellClass = day.hotLeads > 0 ? 'achieved-cell' : 'pending-cell';
        
        html += `
            <tr>
                <td>${dateStr}</td>
                <td>${dayName}</td>
                <td class="${cellClass}">${day.hotLeads}</td>
        `;
        
        slabs.forEach(slab => {
            const achieved = day.hotLeads >= slab.daily ? '✅' : '❌';
            html += `<td>${achieved}</td>`;
        });
        
        html += `</tr>`;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    return html;
}

async function fetchContestData(startDate, endDate) {
    try {
        const url = `${SCRIPT_URL}?action=getContestData&startDate=${startDate}&endDate=${endDate}`;
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
            return result.data;
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        showMessage('Error loading contest data: ' + error.message, 'error');
        return { daily: [], weeklyTotal: 0 };
    }
}

// Utility Functions
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showMessage(text, type) {
    const message = document.getElementById('message');
    message.textContent = text;
    message.className = `message ${type}`;
    message.style.display = 'block';
    
    setTimeout(() => {
        message.style.display = 'none';
    }, 5000);
}
