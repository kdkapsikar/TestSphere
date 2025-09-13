/**
 * Prompt generator for creating test scenarios from requirements
 * Generates AI prompts to produce structured test scenarios
 */

/**
 * Generate a comprehensive prompt for AI to create test scenarios based on a requirement
 * @param {Object} requirement - The requirement object
 * @param {string} requirement.id - Unique requirement identifier
 * @param {string} requirement.title - Requirement title
 * @param {string} requirement.description - Detailed requirement description
 * @returns {string} - Formatted prompt for AI to generate test scenarios
 */
function generateScenarioPrompt(requirement) {
  if (!requirement || !requirement.id || !requirement.title) {
    throw new Error('Invalid requirement: must have id and title properties');
  }

  const { id, title, description = '' } = requirement;
  
  // Normalize ID for scenario naming (uppercase and remove non-alphanumeric)
  const normalizedId = String(id).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!normalizedId) {
    throw new Error('Requirement ID must contain at least one alphanumeric character');
  }
  
  const prompt = `You are a senior QA analyst with 10+ years of experience in software testing and test case design. Your expertise includes functional testing, integration testing, regression testing, and boundary testing.

TASK: Analyze the following requirement and generate between 3 and 5 comprehensive test scenarios that thoroughly cover the requirement from different testing perspectives.

REQUIREMENT DETAILS:
- Requirement ID: ${id}
- Title: ${title}
- Description: ${description || 'No detailed description provided'}

INSTRUCTIONS:
1. Act as a senior QA analyst and think critically about all possible testing angles
2. Generate between 3 and 5 test scenarios that cover different aspects of this requirement
3. Each scenario should test a specific behavior or edge case
4. Include both positive and negative test scenarios where applicable
5. Consider functional, boundary, error handling, and integration testing aspects
6. Make scenario IDs follow the pattern: SC_${normalizedId}_01, SC_${normalizedId}_02, etc.

CRITICAL OUTPUT REQUIREMENTS:
- Return ONLY valid JSON - no code fences, no comments, no additional text
- No text before or after the JSON object
- Do not wrap the JSON in markdown code blocks (\`\`\`)
- Output must be a single JSON object with exactly the structure shown below
- Do not include any extra keys beyond those specified

REQUIRED OUTPUT FORMAT:
{
  "scenarios": [
    {
      "scenario_id": "SC_${normalizedId}_01",
      "title": "Clear, specific scenario title",
      "description": "Detailed description of what this scenario tests, including preconditions, actions, and expected outcomes",
      "test_type": "Functional|Integration|Regression|Security|Performance|Usability",
      "priority": "High|Medium|Low"
    }
  ]
}

QUALITY CRITERIA:
- Each scenario must be unique and test different aspects
- Titles should be clear and descriptive (max 80 characters)
- Descriptions should be detailed enough for a tester to understand what to test
- Test types should accurately reflect the nature of the test
- Priorities should be based on business impact and risk
- Cover both happy path and edge cases
- Consider user experience and system behavior

Generate the test scenarios now:`;

  return prompt;
}

module.exports = {
  generateScenarioPrompt
};