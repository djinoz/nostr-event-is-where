/**
 * Main Application Module
 * Handles the application's main logic and event listeners
 */

// Global state in window object for cross-file access
window.foundEvent = null;

/**
 * Initialize the application
 */
function initApp() {
  // Set up event listeners
  setupEventListeners();
  
  // Initialize the UI
  resetUI();
  
  // Set default relays in the textarea
  const relaysTextarea = document.getElementById('relays');
  if (relaysTextarea) {
    relaysTextarea.value = DEFAULT_RELAYS.join(', ');
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Form submission
  const form = document.getElementById('locator-form');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }
}

/**
 * Handle form submission
 * @param {Event} event - The form submission event
 */
async function handleFormSubmit(event) {
  event.preventDefault();
  
  try {
    // Reset the UI
    resetUI();
    
    // Show loading status
    showLoadingStatus();
    
    // Get form values
    const eventId = document.getElementById('event-id').value.trim();
    const relaysStr = document.getElementById('relays').value;
    
    // Validate event ID
    if (!eventId) {
      throw new Error('Event ID is required');
    }
    
    // Parse relays
    const relays = parseRelayList(relaysStr);
    
    if (relays.length === 0) {
      throw new Error('At least one valid relay is required');
    }
    
    // Reset global state
    window.foundEvent = null;
    
    // Find the event across relays
    const results = await findEvent({
      eventId,
      relays,
      onProgress: handleProgressUpdate
    });
    
    // Display the final results
    displayRelayResults(results);
    
    // Display event details if found
    const firstFoundResult = results.find(result => result.found);
    if (firstFoundResult) {
      window.foundEvent = firstFoundResult.event;
      displayEventDetails(window.foundEvent);
    } else {
      displayEventDetails(null);
      
      // Add message explaining why "Submit to Relay" buttons aren't shown
      const resultsContainer = document.getElementById('relay-results');
      if (resultsContainer) {
        const infoMessage = document.createElement('div');
        infoMessage.className = 'info-message';
        infoMessage.innerHTML = '<strong>Note:</strong> This event was not found on any relay. The "Submit to Relay" button only appears when the event is found on at least one relay.';
        resultsContainer.appendChild(infoMessage);
      }
    }
    
    // Show results
    showResults();
  } catch (error) {
    console.error('Error:', error);
    showError(error.message || 'An error occurred');
  }
}

/**
 * Handle progress updates during the search
 * @param {Object} data - Progress data
 */
function handleProgressUpdate(data) {
  // Update the status display
  updateStatusDisplay(data.stats);
  
  // Update relay results as they come in
  displayRelayResults(data.results);
  
  // Display event details when first found
  if (data.latestResult.found && window.foundEvent === null) {
    window.foundEvent = data.latestResult.event;
    displayEventDetails(window.foundEvent);
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);