// Configuration - Keep your existing flow ID and endpoint
const CONFIG = {
  API_ENDPOINT: "http://localhost:3000/api/v1/prediction/7603f220-efd5-4245-afb9-d385a5c86735",
  TIMEOUT: 30000, // 30 seconds timeout
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 second delay between retries
};

// DOM elements
const questionInput = document.getElementById("question");
const responseBox = document.getElementById("response");
const submitButton = document.getElementById("submitButton"); // Add this button to your HTML

// Utility functions
function showLoading() {
  responseBox.innerHTML = `
    <div class="loading-indicator">
      <div class="spinner"></div>
      <span>🤖 Thinking...</span>
    </div>
  `;
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Processing...";
  }
}

function hideLoading() {
  if (submitButton) {
    submitButton.disabled = false;
    submitButton.textContent = "Ask Question";
  }
}

function displayResponse(message, isError = false) {
  const timestamp = new Date().toLocaleTimeString();
  const icon = isError ? "❌" : "✅";
  const cssClass = isError ? "error-response" : "success-response";
  
  responseBox.innerHTML = `
    <div class="${cssClass}">
      <div class="response-header">
        <span class="response-icon">${icon}</span>
        <span class="response-time">${timestamp}</span>
      </div>
      <div class="response-content">${message}</div>
    </div>
  `;
}

function validateInput(question) {
  if (!question) {
    displayResponse("Please enter a question.", true);
    return false;
  }
  
  if (question.length < 3) {
    displayResponse("Please enter a more detailed question (at least 3 characters).", true);
    return false;
  }
  
  if (question.length > 500) {
    displayResponse("Question is too long. Please keep it under 500 characters.", true);
    return false;
  }
  
  return true;
}

// Enhanced retry mechanism
async function fetchWithRetry(url, options, attempts = CONFIG.RETRY_ATTEMPTS) {
  for (let i = 0; i < attempts; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed:`, error.message);
      
      if (i === attempts - 1) throw error;
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY * (i + 1)));
    }
  }
}

// Main function with your preserved logic
async function askQuestion() {
  const question = questionInput.value.trim();
  
  // Input validation
  if (!validateInput(question)) {
    return;
  }
  
  showLoading();
  
  try {
    // Your original API call structure preserved
    const res = await fetchWithRetry(CONFIG.API_ENDPOINT, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ 
        question,
        overrideConfig: {} // Added this as it's commonly used with Flowise
      }),
    });
    
    const data = await res.json();
    
    // Your original response handling preserved
    if (data && data.text) {
      displayResponse(data.text);
      
      // Log successful interaction for analytics
      console.log(`Question processed: "${question.substring(0, 50)}..."`);
    } else {
      displayResponse("⚠️ No response from model. Please try again.", true);
    }
    
  } catch (error) {
    console.error("Error details:", error);
    
    // Enhanced error messages
    let errorMessage = "❌ ";
    if (error.name === 'AbortError') {
      errorMessage += "Request timed out. Please try again.";
    } else if (error.message.includes('Failed to fetch')) {
      errorMessage += "Connection failed. Please check if the server is running.";
    } else if (error.message.includes('API Error: 500')) {
      errorMessage += "Server error. Please try again in a moment.";
    } else if (error.message.includes('API Error: 404')) {
      errorMessage += "API endpoint not found. Please check the configuration.";
    } else {
      errorMessage += `Error: ${error.message}`;
    }
    
    displayResponse(errorMessage, true);
    
  } finally {
    hideLoading();
  }
}

// Enhanced event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Enter key support
  if (questionInput) {
    questionInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        askQuestion();
      }
    });
    
    // Auto-resize textarea if it's a textarea
    if (questionInput.tagName === 'TEXTAREA') {
      questionInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
      });
    }
  }
  
  // Submit button event
  if (submitButton) {
    submitButton.addEventListener('click', askQuestion);
  }
  
  // Focus on input when page loads
  if (questionInput) {
    questionInput.focus();
  }
});

// Add CSS for loading and response styling (add this to your CSS file)
const additionalStyles = `
  .loading-indicator {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 15px;
    background: #f0f9ff;
    border-radius: 8px;
    border-left: 4px solid #3b82f6;
  }
  
  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .success-response {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    padding: 15px;
  }
  
  .error-response {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 15px;
  }
  
  .response-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    font-size: 0.9em;
    color: #6b7280;
  }
  
  .response-content {
    line-height: 1.6;
    color: #374151;
  }
`;

// Inject additional styles
const styleElement = document.createElement('style');
styleElement.textContent = additionalStyles;
document.head.appendChild(styleElement);

// Export for testing or external use
window.ChatBot = {
  askQuestion,
  CONFIG
};