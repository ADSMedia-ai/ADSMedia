/**
 * ADSMedia Email API for Google Sheets
 * Send emails directly from your spreadsheets
 * 
 * Setup:
 * 1. Go to Extensions > Apps Script
 * 2. Paste this code
 * 3. Set your API key in Project Settings > Script Properties
 *    Key: ADSMEDIA_API_KEY, Value: your-api-key
 * 
 * @author ADSMedia
 * @version 1.0.0
 */

const API_BASE_URL = 'https://api.adsmedia.live/v1';

/**
 * Get API key from script properties
 */
function getApiKey() {
  const key = PropertiesService.getScriptProperties().getProperty('ADSMEDIA_API_KEY');
  if (!key) {
    throw new Error('API key not set. Go to Project Settings > Script Properties and add ADSMEDIA_API_KEY');
  }
  return key;
}

/**
 * Make API request
 */
function apiRequest(endpoint, method, payload) {
  const options = {
    method: method || 'GET',
    headers: {
      'Authorization': 'Bearer ' + getApiKey(),
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };
  
  if (payload && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
    options.payload = JSON.stringify(payload);
  }
  
  const response = UrlFetchApp.fetch(API_BASE_URL + endpoint, options);
  const data = JSON.parse(response.getContentText());
  
  if (!data.success) {
    throw new Error(data.error?.message || 'API Error');
  }
  
  return data.data;
}

/**
 * Test API connection
 * @return {string} Connection status
 * @customfunction
 */
function ADSMEDIA_PING() {
  try {
    const result = apiRequest('/ping', 'GET');
    return 'Connected! User: ' + result.userId;
  } catch (e) {
    return 'Error: ' + e.message;
  }
}

/**
 * Send a single email
 * @param {string} to Recipient email
 * @param {string} subject Email subject
 * @param {string} html HTML content
 * @param {string} fromName Sender name (optional)
 * @return {string} Message ID or error
 * @customfunction
 */
function ADSMEDIA_SEND(to, subject, html, fromName) {
  try {
    const payload = {
      to: to,
      subject: subject,
      html: html
    };
    
    if (fromName) payload.from_name = fromName;
    
    const result = apiRequest('/send', 'POST', payload);
    return 'Sent! ID: ' + result.message_id;
  } catch (e) {
    return 'Error: ' + e.message;
  }
}

/**
 * Check if email is suppressed
 * @param {string} email Email to check
 * @return {string} Suppression status
 * @customfunction
 */
function ADSMEDIA_CHECK_SUPPRESSION(email) {
  try {
    const result = apiRequest('/suppressions/check?email=' + encodeURIComponent(email), 'GET');
    if (result.suppressed) {
      return 'Suppressed: ' + result.reason;
    }
    return 'Not suppressed';
  } catch (e) {
    return 'Error: ' + e.message;
  }
}

/**
 * Send bulk emails from selected rows
 * Uses columns: A=Email, B=Name, C=Subject, D=HTML
 */
function sendBulkEmails() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const selection = sheet.getActiveRange();
  const values = selection.getValues();
  
  let sent = 0;
  let errors = 0;
  
  for (let i = 0; i < values.length; i++) {
    const [email, name, subject, html] = values[i];
    
    if (!email || !subject || !html) {
      errors++;
      continue;
    }
    
    try {
      const payload = {
        to: email,
        to_name: name,
        subject: subject,
        html: html
      };
      
      apiRequest('/send', 'POST', payload);
      sent++;
      
      // Add small delay to avoid rate limiting
      Utilities.sleep(100);
    } catch (e) {
      errors++;
      Logger.log('Error sending to ' + email + ': ' + e.message);
    }
  }
  
  SpreadsheetApp.getUi().alert(
    'Bulk Send Complete',
    'Sent: ' + sent + '\nErrors: ' + errors,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Send batch emails (up to 1000) with personalization
 * Uses columns: A=Email, B=Name
 * Prompts for subject and HTML template
 */
function sendBatchEmails() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSheet();
  const selection = sheet.getActiveRange();
  const values = selection.getValues();
  
  // Get subject
  const subjectResponse = ui.prompt(
    'Email Subject',
    'Enter subject (use %%First Name%% for personalization):',
    ui.ButtonSet.OK_CANCEL
  );
  if (subjectResponse.getSelectedButton() !== ui.Button.OK) return;
  const subject = subjectResponse.getResponseText();
  
  // Get HTML
  const htmlResponse = ui.prompt(
    'HTML Content',
    'Enter HTML (use %%First Name%% for personalization):',
    ui.ButtonSet.OK_CANCEL
  );
  if (htmlResponse.getSelectedButton() !== ui.Button.OK) return;
  const html = htmlResponse.getResponseText();
  
  // Build recipients
  const recipients = [];
  for (let i = 0; i < values.length; i++) {
    const [email, name] = values[i];
    if (email) {
      recipients.push({ email: email, name: name || '' });
    }
  }
  
  if (recipients.length === 0) {
    ui.alert('No recipients found');
    return;
  }
  
  if (recipients.length > 1000) {
    ui.alert('Maximum 1000 recipients per batch');
    return;
  }
  
  try {
    const result = apiRequest('/send/batch', 'POST', {
      recipients: recipients,
      subject: subject,
      html: html
    });
    
    ui.alert(
      'Batch Sent!',
      'Task ID: ' + result.task_id + '\n' +
      'Recipients: ' + result.recipients_count,
      ui.ButtonSet.OK
    );
  } catch (e) {
    ui.alert('Error: ' + e.message);
  }
}

/**
 * Get account usage stats
 */
function getUsageStats() {
  try {
    const result = apiRequest('/account/usage', 'GET');
    const ui = SpreadsheetApp.getUi();
    
    ui.alert(
      'ADSMedia Usage',
      'Servers: ' + (result.servers || 0) + '\n' +
      'Lists: ' + (result.lists || 0) + '\n' +
      'Schedules: ' + (result.schedules || 0) + '\n' +
      'Sent this month: ' + (result.sent_this_month || 0),
      ui.ButtonSet.OK
    );
  } catch (e) {
    SpreadsheetApp.getUi().alert('Error: ' + e.message);
  }
}

/**
 * Add custom menu
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📧 ADSMedia')
    .addItem('Send Bulk Emails (row by row)', 'sendBulkEmails')
    .addItem('Send Batch Emails (personalized)', 'sendBatchEmails')
    .addSeparator()
    .addItem('View Usage Stats', 'getUsageStats')
    .addItem('Test Connection', 'testConnection')
    .addToUi();
}

/**
 * Test API connection from menu
 */
function testConnection() {
  const result = ADSMEDIA_PING();
  SpreadsheetApp.getUi().alert('Connection Test', result, SpreadsheetApp.getUi().ButtonSet.OK);
}

