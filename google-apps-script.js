// Google Apps Script Code for CRM Backend
// This code should be deployed as a Web App in Google Apps Script

// Configuration - Replace with your Google Sheet ID
const SHEET_ID = '1iIgtHQGAik8M1YpSPKYZrWf0FB2zPojj0a90CxiNoio';
const SHEET_NAME = 'Feb26'; // Change if your sheet has a different name
const CONTESTS_SHEET_NAME = 'Contests';

// Column indices (0-based)
const COLUMNS = {
  TIMESTAMP: 0,
  LOAN_CODE: 1,
  APPLICATION_ID: 2,
  NAME: 3,
  MOBILE_NUMBER: 4,
  STATUS: 5,
  SUB_STATUS: 6,
  REMARKS: 7
};

// Handle GET requests
function doGet(e) {
  const action = e.parameter.action;
  
  try {
    switch (action) {
      case 'getTodayStatusCount':
        return getTodayStatusCount();
      case 'getTotalStatusCount':
        return getTotalStatusCount();
      case 'getTodaysData':
        return getTodaysData();
      case 'getRecord':
        return getRecord(e.parameter.loanCode);
      case 'searchRecords':
        return searchRecords(e.parameter.searchType, e.parameter.searchValue);
      case 'getContestData':
        return getContestData(e.parameter.startDate, e.parameter.endDate);
      case 'getContests':
        return getContests();
      default:
        return createResponse(true, 'CRM API is running');
    }
  } catch (error) {
    return createResponse(false, 'Error: ' + error.message);
  }
}

// Handle POST requests
function doPost(e) {
  try {
    const action = e.parameter.action;
    
    switch (action) {
      case 'addRecord':
        const addData = JSON.parse(e.parameter.data);
        return addRecord(addData);
      case 'updateRecord':
        const updateData = JSON.parse(e.parameter.data);
        return updateRecord(updateData, parseInt(e.parameter.rowIndex));
      case 'deleteRecord':
        return deleteRecord(e.parameter.loanCode, parseInt(e.parameter.rowIndex));
      case 'saveContest':
        const contestData = JSON.parse(e.parameter.data);
        return saveContest(contestData);
      case 'deleteContest':
        return deleteContest(e.parameter.contestId);
      default:
        return createResponse(false, 'Invalid action');
    }
  } catch (error) {
    return createResponse(false, 'Error: ' + error.message);
  }
}

// Helper function to create response
function createResponse(success, message, data = null) {
  const response = {
    success: success,
    message: message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// Get the sheet object
function getSheet() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  return spreadsheet.getSheetByName(SHEET_NAME);
}

// Get contests sheet
function getContestsSheet() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  return spreadsheet.getSheetByName(CONTESTS_SHEET_NAME);
}

// Add new record
function addRecord(data) {
  try {
    const sheet = getSheet();
    
    // Check for duplicates
    const duplicateCheck = checkForDuplicates(data);
    if (!duplicateCheck.isUnique) {
      return createResponse(false, duplicateCheck.message);
    }
    
    // Create new row data with timestamp
    const timestamp = new Date();
    const newRow = [
      timestamp,
      data.loanCode,
      data.applicationId,
      data.name,
      data.mobileNumber,
      data.status,
      data.subStatus,
      data.remarks
    ];
    
    // Add the row
    sheet.appendRow(newRow);
    
    return createResponse(true, 'Record added successfully');
  } catch (error) {
    return createResponse(false, 'Error adding record: ' + error.message);
  }
}

// Update existing record
function updateRecord(data, rowIndex) {
  try {
    const sheet = getSheet();
    
    // Check for duplicates (excluding current record)
    const duplicateCheck = checkForDuplicates(data, rowIndex);
    if (!duplicateCheck.isUnique) {
      return createResponse(false, duplicateCheck.message);
    }
    
    // Update the row (keeping original timestamp)
    const range = sheet.getRange(rowIndex, 1, 1, 8);
    const currentValues = range.getValues()[0];
    
    const updatedRow = [
      currentValues[COLUMNS.TIMESTAMP], // Keep original timestamp
      data.loanCode,
      data.applicationId,
      data.name,
      data.mobileNumber,
      data.status,
      data.subStatus,
      data.remarks
    ];
    
    range.setValues([updatedRow]);
    
    return createResponse(true, 'Record updated successfully');
  } catch (error) {
    return createResponse(false, 'Error updating record: ' + error.message);
  }
}

// Get record by loan code
function getRecord(loanCode) {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      if (data[i][COLUMNS.LOAN_CODE] === loanCode) {
        const record = {
          rowIndex: i + 1, // 1-based for sheet operations
          timestamp: formatDate(data[i][COLUMNS.TIMESTAMP]),
          loanCode: data[i][COLUMNS.LOAN_CODE],
          applicationId: data[i][COLUMNS.APPLICATION_ID],
          name: data[i][COLUMNS.NAME],
          mobileNumber: data[i][COLUMNS.MOBILE_NUMBER],
          status: data[i][COLUMNS.STATUS],
          subStatus: data[i][COLUMNS.SUB_STATUS],
          remarks: data[i][COLUMNS.REMARKS]
        };
        
        return createResponse(true, 'Record found', record);
      }
    }
    
    return createResponse(false, 'Record not found');
  } catch (error) {
    return createResponse(false, 'Error getting record: ' + error.message);
  }
}

// Search records
function searchRecords(searchType, searchValue) {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    const results = [];
    
    let columnIndex;
    switch (searchType) {
      case 'loanCode':
        columnIndex = COLUMNS.LOAN_CODE;
        break;
      case 'applicationId':
        columnIndex = COLUMNS.APPLICATION_ID;
        break;
      case 'mobileNumber':
        columnIndex = COLUMNS.MOBILE_NUMBER;
        break;
      default:
        return createResponse(false, 'Invalid search type');
    }
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const cellValue = data[i][columnIndex].toString();
      if (cellValue.toLowerCase().includes(searchValue.toLowerCase())) {
        results.push({
          timestamp: formatDate(data[i][COLUMNS.TIMESTAMP]),
          loanCode: data[i][COLUMNS.LOAN_CODE],
          applicationId: data[i][COLUMNS.APPLICATION_ID],
          name: data[i][COLUMNS.NAME],
          mobileNumber: data[i][COLUMNS.MOBILE_NUMBER],
          status: data[i][COLUMNS.STATUS],
          subStatus: data[i][COLUMNS.SUB_STATUS],
          remarks: data[i][COLUMNS.REMARKS]
        });
      }
    }
    
    return createResponse(true, 'Search completed', results);
  } catch (error) {
    return createResponse(false, 'Error searching records: ' + error.message);
  }
}

// Delete record
function deleteRecord(loanCode, rowIndex) {
  try {
    const sheet = getSheet();
    
    // Verify the record exists at the specified row
    const range = sheet.getRange(rowIndex, 1, 1, 8);
    const rowData = range.getValues()[0];
    
    if (rowData[COLUMNS.LOAN_CODE] !== loanCode) {
      return createResponse(false, 'Record verification failed');
    }
    
    // Delete the row
    sheet.deleteRow(rowIndex);
    
    return createResponse(true, 'Record deleted successfully');
  } catch (error) {
    return createResponse(false, 'Error deleting record: ' + error.message);
  }
}

// Get today's data
function getTodaysData() {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return createResponse(true, 'No data found', []);
    }
    
    const today = new Date();
    const todayStr = formatDateForComparison(today);
    const todaysRecords = [];
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const recordDate = new Date(data[i][COLUMNS.TIMESTAMP]);
      const recordDateStr = formatDateForComparison(recordDate);
      
      if (recordDateStr === todayStr) {
        todaysRecords.push({
          timestamp: data[i][COLUMNS.TIMESTAMP],
          loanCode: data[i][COLUMNS.LOAN_CODE],
          applicationId: data[i][COLUMNS.APPLICATION_ID],
          name: data[i][COLUMNS.NAME],
          mobileNumber: data[i][COLUMNS.MOBILE_NUMBER],
          status: data[i][COLUMNS.STATUS],
          subStatus: data[i][COLUMNS.SUB_STATUS],
          remarks: data[i][COLUMNS.REMARKS]
        });
      }
    }
    
    return createResponse(true, 'Today\'s data retrieved', todaysRecords);
  } catch (error) {
    return createResponse(false, 'Error getting today\'s data: ' + error.message);
  }
}

// Get today's status count
function getTodayStatusCount() {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    
    // If no data or only headers, return zero counts
    if (data.length <= 1) {
      const statusCounts = {
        'Doc Pending': 0,
        'Hot Lead': 0,
        'Recheck': 0,
        'Pending': 0,
        'AWH': 0
      };
      return createResponse(true, 'Status counts retrieved', statusCounts);
    }
    
    const today = new Date();
    const todayStr = formatDateForComparison(today);
    
    const statusCounts = {
      'Doc Pending': 0,
      'Hot Lead': 0,
      'Recheck': 0,
      'Pending': 0,
      'AWH': 0
    };
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const recordDate = new Date(data[i][COLUMNS.TIMESTAMP]);
      const recordDateStr = formatDateForComparison(recordDate);
      
      if (recordDateStr === todayStr) {
        const status = data[i][COLUMNS.STATUS];
        if (statusCounts.hasOwnProperty(status)) {
          statusCounts[status]++;
        }
      }
    }
    
    return createResponse(true, 'Status counts retrieved', statusCounts);
  } catch (error) {
    return createResponse(false, 'Error getting status counts: ' + error.message);
  }
}

// Get total status count (all records)
function getTotalStatusCount() {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    
    const statusCounts = {
      'Doc Pending': 0,
      'Hot Lead': 0,
      'Recheck': 0,
      'Pending': 0,
      'AWH': 0
    };
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const status = data[i][COLUMNS.STATUS];
      if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status]++;
      }
    }
    
    return createResponse(true, 'Total status counts retrieved', statusCounts);
  } catch (error) {
    return createResponse(false, 'Error getting total status counts: ' + error.message);
  }
}

// Get contest data for date range
function getContestData(startDate, endDate) {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    
    const dailyData = {};
    let weeklyTotal = 0;
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const recordDate = new Date(data[i][COLUMNS.TIMESTAMP]);
      const dateStr = formatDateForComparison(recordDate);
      const status = data[i][COLUMNS.STATUS];
      
      // Check if date is within range
      if (dateStr >= startDate && dateStr <= endDate) {
        if (!dailyData[dateStr]) {
          dailyData[dateStr] = 0;
        }
        
        if (status === 'Hot Lead') {
          dailyData[dateStr]++;
          weeklyTotal++;
        }
      }
    }
    
    // Convert to array format
    const daily = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = formatDateForComparison(d);
      daily.push({
        date: dateStr,
        hotLeads: dailyData[dateStr] || 0
      });
    }
    
    return createResponse(true, 'Contest data retrieved', {
      daily: daily,
      weeklyTotal: weeklyTotal
    });
  } catch (error) {
    return createResponse(false, 'Error getting contest data: ' + error.message);
  }
}

// Get all contests
function getContests() {
  try {
    const sheet = getContestsSheet();
    const data = sheet.getDataRange().getValues();
    const contests = [];
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) { // Check if ID exists
        contests.push({
          id: data[i][0],
          name: data[i][1],
          startDate: data[i][2],
          endDate: data[i][3],
          slabs: JSON.parse(data[i][4])
        });
      }
    }
    
    return createResponse(true, 'Contests retrieved', contests);
  } catch (error) {
    return createResponse(false, 'Error getting contests: ' + error.message);
  }
}

// Save contest
function saveContest(contest) {
  try {
    const sheet = getContestsSheet();
    
    // Add header if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['ID', 'Name', 'Start Date', 'End Date', 'Slabs']);
    }
    
    const newRow = [
      contest.id,
      contest.name,
      contest.startDate,
      contest.endDate,
      JSON.stringify(contest.slabs)
    ];
    
    sheet.appendRow(newRow);
    
    return createResponse(true, 'Contest saved successfully');
  } catch (error) {
    return createResponse(false, 'Error saving contest: ' + error.message);
  }
}

// Delete contest
function deleteContest(contestId) {
  try {
    const sheet = getContestsSheet();
    const data = sheet.getDataRange().getValues();
    
    // Find and delete the contest row
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString() === contestId.toString()) {
        sheet.deleteRow(i + 1);
        return createResponse(true, 'Contest deleted successfully');
      }
    }
    
    return createResponse(false, 'Contest not found');
  } catch (error) {
    return createResponse(false, 'Error deleting contest: ' + error.message);
  }
}

// Check for duplicates
function checkForDuplicates(data, excludeRowIndex = null) {
  const sheet = getSheet();
  const allData = sheet.getDataRange().getValues();
  
  // Skip header row
  for (let i = 1; i < allData.length; i++) {
    const rowIndex = i + 1; // 1-based
    
    // Skip the row we're updating
    if (excludeRowIndex && rowIndex === excludeRowIndex) {
      continue;
    }
    
    // Check for duplicate Loan Code
    if (allData[i][COLUMNS.LOAN_CODE] === data.loanCode) {
      return {
        isUnique: false,
        message: 'Loan Code already exists'
      };
    }
    
    // Check for duplicate Application ID
    if (allData[i][COLUMNS.APPLICATION_ID] === data.applicationId) {
      return {
        isUnique: false,
        message: 'Application ID already exists'
      };
    }
    
    // Check for duplicate Mobile Number
    if (allData[i][COLUMNS.MOBILE_NUMBER].toString() === data.mobileNumber.toString()) {
      return {
        isUnique: false,
        message: 'Mobile Number already exists'
      };
    }
  }
  
  return {
    isUnique: true,
    message: 'No duplicates found'
  };
}

// Format date for display
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString();
}

// Format date for comparison (YYYY-MM-DD)
function formatDateForComparison(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}