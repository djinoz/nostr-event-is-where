/**
 * Event Finder Module
 * Handles connecting to relays and finding a specific event
 */

/**
 * Normalize event ID (convert note1, nevent1, or naddr1 to hex format if needed)
 * @param {string} eventId - The event ID (note1, nevent1, naddr1, or hex)
 * @returns {string} The event ID in hex format
 */
function normalizeEventId(eventId) {
  if (!eventId) {
    throw new Error('Event ID is required');
  }
  
  // If it's already a hex key (64 chars)
  if (/^[0-9a-f]{64}$/i.test(eventId)) {
    return eventId.toLowerCase();
  }
  
  // If it's a note1 format
  if (eventId.startsWith('note1')) {
    try {
      const { data } = window.NostrTools.nip19.decode(eventId);
      return data;
    } catch (error) {
      throw new Error('Invalid note1 format');
    }
  }
  
  // If it's a nevent1 format
  if (eventId.startsWith('nevent1')) {
    try {
      const decoded = window.NostrTools.nip19.decode(eventId);
      return decoded.data.id;
    } catch (error) {
      throw new Error('Invalid nevent1 format');
    }
  }
  
  // If it's a naddr1 format
  if (eventId.startsWith('naddr1')) {
    try {
      const decoded = window.NostrTools.nip19.decode(eventId);
      
      // Ensure we have the required data for naddr1
      if (!decoded.data || !decoded.data.kind || !decoded.data.pubkey || decoded.data.identifier === undefined) {
        throw new Error('Missing required naddr1 data (kind, pubkey, or identifier)');
      }
      
      // For naddr lookups, we'll use a different approach
      // but to keep the API consistent, we'll return a special marker
      // that will be recognized in the checkRelay function
      return {
        type: 'naddr',
        data: decoded.data
      };
    } catch (error) {
      throw new Error(`Invalid naddr1 format: ${error.message}`);
    }
  }
  
  throw new Error('Invalid event ID format');
}

/**
 * Submit an event to a specific relay
 * @param {string} relay - The relay URL to submit to
 * @param {Object} event - The event object to publish
 * @returns {Promise<Object>} A promise that resolves to the result object
 */
function submitEventToRelay(relay, event) {
  return new Promise((resolve) => {
    let timeout;
    let hasResolved = false;
    
    // Create result object
    const result = {
      relay,
      submitted: false,
      error: null,
      duration: 0
    };
    
    try {
      const startTime = Date.now();
      
      // Set timeout (10 seconds)
      timeout = setTimeout(() => {
        if (!hasResolved) {
          result.error = 'Timeout connecting to relay';
          hasResolved = true;
          resolve(result);
        }
      }, 10000);
      
      // Connect to relay
      const relayInstance = window.NostrTools.relayInit(relay);
      
      relayInstance.on('error', (error) => {
        if (!hasResolved) {
          result.error = `Connection error: ${error.message || 'Unknown error'}`;
          result.duration = Date.now() - startTime;
          clearTimeout(timeout);
          hasResolved = true;
          resolve(result);
        }
      });
      
      // Connect to the relay
      relayInstance.connect().then(() => {
        // Publish the event
        relayInstance.publish(event).then(() => {
          if (!hasResolved) {
            result.submitted = true;
            result.duration = Date.now() - startTime;
            clearTimeout(timeout);
            hasResolved = true;
            
            // Close the relay connection
            relayInstance.close();
            
            resolve(result);
          }
        }).catch((err) => {
          if (!hasResolved) {
            result.error = `Publish failed: ${err.message || 'Unknown error'}`;
            result.duration = Date.now() - startTime;
            clearTimeout(timeout);
            hasResolved = true;
            
            // Close the relay connection
            relayInstance.close();
            
            resolve(result);
          }
        });
      }).catch((err) => {
        if (!hasResolved) {
          result.error = `Connection failed: ${err.message || 'Unknown error'}`;
          result.duration = Date.now() - startTime;
          clearTimeout(timeout);
          hasResolved = true;
          resolve(result);
        }
      });
    } catch (error) {
      if (!hasResolved) {
        result.error = `Error: ${error.message || 'Unknown error'}`;
        result.duration = Date.now() - startTime || 0;
        clearTimeout(timeout);
        hasResolved = true;
        resolve(result);
      }
    }
  });
}

/**
 * Check a single relay for an event
 * @param {string} relay - The relay URL
 * @param {string|Object} eventId - The event ID in hex format or a naddr object
 * @returns {Promise<Object>} A promise that resolves to the result object
 */
function checkRelay(relay, eventId) {
  return new Promise((resolve) => {
    let timeout;
    let hasResolved = false;
    
    // Create result object
    const result = {
      relay,
      found: false,
      error: null,
      event: null,
      duration: 0
    };
    
    try {
      const startTime = Date.now();
      
      // Set timeout (10 seconds)
      timeout = setTimeout(() => {
        if (!hasResolved) {
          result.error = 'Timeout connecting to relay';
          hasResolved = true;
          resolve(result);
        }
      }, 10000);
      
      // Connect to relay
      const relayInstance = window.NostrTools.relayInit(relay);
      
      relayInstance.on('error', (error) => {
        if (!hasResolved) {
          result.error = `Connection error: ${error.message || 'Unknown error'}`;
          result.duration = Date.now() - startTime;
          clearTimeout(timeout);
          hasResolved = true;
          resolve(result);
        }
      });
      
      // Connect to the relay
      relayInstance.connect().then(() => {
        let filter;
        
        // Check if this is a naddr or regular event ID
        if (typeof eventId === 'object' && eventId.type === 'naddr') {
          // Handle naddr lookups using the appropriate filter
          const { kind, pubkey, identifier } = eventId.data;
          filter = [{
            kinds: [kind],
            authors: [pubkey],
            '#d': [identifier || ''] // Use empty string if identifier is empty
          }];
        } else {
          // Regular event ID lookup
          filter = [{
            ids: [eventId]
          }];
        }
        
        // Create a subscription for the specific event
        const sub = relayInstance.sub(filter);
        
        // Handle events
        sub.on('event', (event) => {
          if (!hasResolved) {
            result.found = true;
            result.event = event;
            result.duration = Date.now() - startTime;
            clearTimeout(timeout);
            hasResolved = true;
            
            // Close the relay connection
            relayInstance.close();
            
            resolve(result);
          }
        });
        
        // Handle end of subscription
        sub.on('eose', () => {
          if (!hasResolved) {
            result.duration = Date.now() - startTime;
            clearTimeout(timeout);
            hasResolved = true;
            
            // Close the relay connection
            relayInstance.close();
            
            resolve(result);
          }
        });
      }).catch((err) => {
        if (!hasResolved) {
          result.error = `Connection failed: ${err.message || 'Unknown error'}`;
          result.duration = Date.now() - startTime;
          clearTimeout(timeout);
          hasResolved = true;
          resolve(result);
        }
      });
    } catch (error) {
      if (!hasResolved) {
        result.error = `Error: ${error.message || 'Unknown error'}`;
        result.duration = Date.now() - startTime || 0;
        clearTimeout(timeout);
        hasResolved = true;
        resolve(result);
      }
    }
  });
}

/**
 * Find an event across multiple relays
 * @param {Object} options - Options for finding the event
 * @param {string} options.eventId - The event ID (note1 or hex)
 * @param {string[]} options.relays - Array of relay URLs
 * @param {Function} options.onProgress - Callback for progress updates
 * @returns {Promise<Object[]>} A promise that resolves to an array of results
 */
async function findEvent(options) {
  try {
    // Normalize the event ID
    const hexEventId = normalizeEventId(options.eventId);
    
    // Initialize stats
    const stats = {
      totalRelays: options.relays.length,
      completedRelays: 0,
      foundCount: 0
    };
    
    // Create an array to store all results
    const allResults = [];
    
    // Function to update progress
    const updateProgress = (result) => {
      stats.completedRelays++;
      
      if (result.found) {
        stats.foundCount++;
      }
      
      allResults.push(result);
      
      // Call progress callback if provided
      if (options.onProgress) {
        options.onProgress({
          stats,
          results: allResults,
          latestResult: result
        });
      }
    };
    
    // Check all relays
    const promises = options.relays.map(relay => 
      checkRelay(relay, hexEventId).then(result => {
        updateProgress(result);
        return result;
      })
    );
    
    // Wait for all relays to complete
    await Promise.allSettled(promises);
    
    // Sort results: found first, then errors, then not found
    allResults.sort((a, b) => {
      if (a.found && !b.found) return -1;
      if (!a.found && b.found) return 1;
      if (a.error && !b.error) return 1;
      if (!a.error && b.error) return -1;
      return a.duration - b.duration; // Sort by response time
    });
    
    return allResults;
  } catch (error) {
    console.error('Error finding event:', error);
    throw error;
  }
}