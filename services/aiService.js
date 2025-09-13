const fetch = require('node-fetch');

/**
 * AI Service for DeepSeek API integration
 * Provides text generation capabilities using DeepSeek's AI models
 */

const DEEPSEEK_API_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';

/**
 * Generate AI response using DeepSeek API
 * @param {string} prompt - The input prompt for AI generation
 * @returns {Promise<string>} - The generated text response
 * @throws {Error} - If API request fails or response is invalid
 */
async function generateWithAI(prompt) {
  try {
    console.log('🤖 Starting AI generation request...');
    console.log('📝 Prompt length:', prompt.length);

    // Validate input
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Invalid prompt: must be a non-empty string');
    }

    // Check for API key
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY environment variable is not set');
    }

    // Prepare request payload
    const requestBody = {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2048,
      temperature: 0.7,
      stream: false
    };

    console.log('🌐 Making request to DeepSeek API...');

    // Make API request
    const response = await fetch(DEEPSEEK_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'TestFlow-AI-Service/1.0'
      },
      body: JSON.stringify(requestBody),
      timeout: 30000 // 30 second timeout
    });

    console.log('📡 Response status:', response.status);

    // Check response status
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      
      switch (response.status) {
        case 401:
          throw new Error('Invalid API key or authentication failed');
        case 429:
          throw new Error('Rate limit exceeded. Please try again later');
        case 500:
          throw new Error('DeepSeek API server error. Please try again later');
        default:
          throw new Error(`DeepSeek API error (${response.status}): ${errorText}`);
      }
    }

    // Parse response
    const data = await response.json();
    console.log('✅ API response received');

    // Validate response structure
    if (!data || !data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error('❌ Invalid response structure:', data);
      throw new Error('Invalid response format from DeepSeek API');
    }

    const choice = data.choices[0];
    if (!choice.message || !choice.message.content) {
      console.error('❌ Missing content in response:', choice);
      throw new Error('No content found in API response');
    }

    const generatedText = choice.message.content.trim();
    
    console.log('🎉 AI generation completed successfully');
    console.log('📊 Generated text length:', generatedText.length);
    console.log('💰 Token usage:', data.usage || 'Not available');

    return generatedText;

  } catch (error) {
    console.error('🚨 AI Service Error:', error.message);
    console.error('📍 Error stack:', error.stack);

    // Re-throw with more context
    if (error.code === 'ENOTFOUND') {
      throw new Error('Network error: Unable to connect to DeepSeek API. Please check your internet connection.');
    } else if (error.code === 'ECONNRESET') {
      throw new Error('Connection reset: DeepSeek API connection was interrupted. Please try again.');
    } else if (error.name === 'AbortError' || error.code === 'TIMEOUT') {
      throw new Error('Request timeout: DeepSeek API did not respond within 30 seconds. Please try again.');
    } else {
      // Re-throw the original error if it's already formatted
      throw error;
    }
  }
}

/**
 * Health check for the AI service
 * @returns {Promise<boolean>} - True if service is healthy
 */
async function healthCheck() {
  try {
    const testPrompt = "Hello, this is a health check.";
    await generateWithAI(testPrompt);
    return true;
  } catch (error) {
    console.error('🏥 AI Service health check failed:', error.message);
    return false;
  }
}

/**
 * Get service status and configuration
 * @returns {object} - Service status information
 */
function getServiceInfo() {
  return {
    service: 'DeepSeek AI Service',
    endpoint: DEEPSEEK_API_ENDPOINT,
    apiKeyConfigured: !!process.env.DEEPSEEK_API_KEY,
    version: '1.0.0'
  };
}

module.exports = {
  generateWithAI,
  healthCheck,
  getServiceInfo
};