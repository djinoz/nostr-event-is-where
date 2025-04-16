/**
 * Event Display Module
 * Handles displaying event results in the UI
 */

/**
 * Format relay results for display
 * @param {Object[]} results - Array of relay check results
 * @param {string} containerId - ID of the container element
 */
function displayRelayResults(results, containerId = 'relay-results') {
  // Store results in window for access during relay submission checks
  window.relayResults = results;
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Clear previous results
  container.innerHTML = '';
  
  // Create a card for each result
  results.forEach(result => {
    const card = document.createElement('div');
    
    // Set the card class based on the result
    if (result.found) {
      card.className = 'relay-card found';
    } else if (result.error) {
      card.className = 'relay-card error';
    } else {
      card.className = 'relay-card not-found';
    }
    
    // Create and add the relay URL
    const relayUrl = document.createElement('div');
    relayUrl.className = 'relay-url';
    relayUrl.textContent = result.relay;
    card.appendChild(relayUrl);
    
    // Create and add the status
    const status = document.createElement('div');
    status.className = 'relay-status';
    
    if (result.found) {
      status.textContent = `Found (${result.duration}ms)`;
    } else if (result.error) {
      status.textContent = result.error;
    } else {
      status.textContent = `Not found (${result.duration}ms)`;
    }
    
    card.appendChild(status);
    
    // Add submit button for 'Not found' relays only - append after the status
    if (!result.found && !result.error && window.foundEvent) {
      const submitButton = document.createElement('button');
      submitButton.className = 'submit-button';
      submitButton.textContent = 'Submit to Relay';
      submitButton.dataset.relay = result.relay;
      submitButton.addEventListener('click', handleSubmitToRelay);
      card.appendChild(submitButton);
    }
    
    // Add the card to the container
    container.appendChild(card);
  });
}

/**
 * Handle the submission of an event to a specific relay
 * @param {Event} event - The click event
 */
async function handleSubmitToRelay(event) {
  const button = event.target;
  const relay = button.dataset.relay;
  
  // Disable the button and show 'Submitting...'
  button.disabled = true;
  button.textContent = 'Submitting...';
  
  try {
    // Submit the event to the relay
    const result = await submitEventToRelay(relay, window.foundEvent);
    
    // Update the button and status text based on the result
    if (result.submitted) {
      button.textContent = 'Submitted!';
      button.classList.add('success');
      
      // Wait a moment and then recheck the relay
      setTimeout(async () => {
        button.textContent = 'Verifying...';
        
        // Find the current event ID
        const eventId = window.foundEvent.id;
        
        // Check if the event is now on the relay
        const checkResult = await checkRelay(relay, eventId);
        
        // Update the relay card based on check result
        const relayCard = button.closest('.relay-card');
        const statusElement = relayCard.querySelector('.relay-status');
        
        if (checkResult.found) {
          // Update the card to show the event was found
          relayCard.className = 'relay-card found';
          statusElement.textContent = `Found (${checkResult.duration}ms)`;
          button.remove(); // Remove the button
          
          // Update the result in the stored array
          if (window.relayResults) {
            const relayIndex = window.relayResults.findIndex(r => r.relay === relay);
            if (relayIndex >= 0) {
              window.relayResults[relayIndex] = checkResult;
            }
          }
        } else {
          // Still not found, reset the button
          button.textContent = 'Submit to Relay';
          button.disabled = false;
          button.classList.remove('success');
          statusElement.textContent = `Not found (${checkResult.duration}ms)`;
        }
      }, 2000); // Wait 2 seconds before verifying
    } else {
      // Failed to submit
      button.textContent = 'Failed - Try Again';
      button.disabled = false;
      button.classList.add('error');
      
      // Add error info if available
      if (result.error) {
        const errorInfo = document.createElement('div');
        errorInfo.className = 'error-info';
        errorInfo.textContent = result.error;
        button.parentNode.insertBefore(errorInfo, button.nextSibling);
      }
    }
  } catch (error) {
    console.error('Error submitting event:', error);
    button.textContent = 'Error - Try Again';
    button.disabled = false;
    button.classList.add('error');
  }
}

/**
 * Display event details in the UI
 * @param {Object} event - The Nostr event object
 */
function displayEventDetails(event) {
  if (!event) {
    document.getElementById('event-details').style.display = 'none';
    return;
  }
  
  const eventDetailsSection = document.getElementById('event-details');
  const eventJson = document.getElementById('event-json');
  
  if (!eventDetailsSection || !eventJson) return;
  
  // Format the event as formatted JSON
  const formattedJson = JSON.stringify(event, null, 2);
  eventJson.textContent = formattedJson;
  
  // Show the event details section
  eventDetailsSection.style.display = 'block';
}

/**
 * Update the statistics display in the UI
 * @param {Object} stats - The statistics object
 */
function updateStatusDisplay(stats) {
  // Update connected relays count
  const connectedRelaysElement = document.getElementById('connected-relays');
  if (connectedRelaysElement) {
    connectedRelaysElement.textContent = `Connected relays: ${stats.completedRelays}/${stats.totalRelays}`;
  }
  
  // Update event found status
  const eventFoundElement = document.getElementById('event-found');
  if (eventFoundElement) {
    eventFoundElement.textContent = `Event found: ${stats.foundCount > 0 ? 'Yes' : 'No'}`;
  }
  
  // Update progress bar
  const progressElement = document.getElementById('fetch-progress');
  if (progressElement) {
    const progress = (stats.completedRelays / stats.totalRelays) * 100;
    progressElement.value = progress;
  }
}

/**
 * Show the loading status section
 */
function showLoadingStatus() {
  document.getElementById('status-section').style.display = 'block';
  document.getElementById('results-section').style.display = 'none';
  document.getElementById('error-section').style.display = 'none';
}

/**
 * Show the results section
 */
function showResults() {
  document.getElementById('status-section').style.display = 'none';
  document.getElementById('results-section').style.display = 'block';
  document.getElementById('error-section').style.display = 'none';
}

/**
 * Show an error message
 * @param {string} message - The error message to display
 */
function showError(message) {
  document.getElementById('status-section').style.display = 'none';
  document.getElementById('results-section').style.display = 'none';
  
  const errorSection = document.getElementById('error-section');
  const errorMessage = document.getElementById('error-message');
  
  if (errorSection && errorMessage) {
    errorMessage.textContent = message;
    errorSection.style.display = 'block';
  }
}

/**
 * Reset the UI to its initial state
 */
function resetUI() {
  document.getElementById('status-section').style.display = 'none';
  document.getElementById('results-section').style.display = 'none';
  document.getElementById('error-section').style.display = 'none';
  document.getElementById('fetch-progress').value = 0;
}