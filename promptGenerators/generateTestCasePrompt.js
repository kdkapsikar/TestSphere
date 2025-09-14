/**
 * Prompt generator for creating test cases from test scenarios
 * Generates AI prompts to produce detailed test cases with comprehensive steps
 */

/**
 * Generate a comprehensive prompt for AI to create test cases based on a test scenario
 * @param {Object} scenario - The test scenario object
 * @param {string} scenario.scenario_id - Unique scenario identifier
 * @param {string} scenario.title - Scenario title
 * @param {string} scenario.description - Detailed scenario description
 * @param {string} scenario.test_type - Type of testing (Functional, Integration, etc.)
 * @param {string} scenario.priority - Priority level (High, Medium, Low)
 * @returns {string} - Formatted prompt for AI to generate test cases
 */
export function generateTestCasePrompt(scenario) {
  if (!scenario || !scenario.scenario_id || !scenario.title) {
    throw new Error('Invalid scenario: must have scenario_id and title properties');
  }

  const { 
    scenario_id, 
    title, 
    description = '', 
    test_type = 'Functional', 
    priority = 'Medium' 
  } = scenario;
  
  const prompt = `TASK: Analyze the following test scenario and generate detailed, executable test cases that thoroughly cover the scenario requirements.

SCENARIO DETAILS:
- Scenario ID: ${scenario_id}
- Title: ${title}
- Description: ${description || 'No detailed description provided'}
- Test Type: ${test_type}
- Priority: ${priority}

INSTRUCTIONS:
1. Act as a senior QA analyst and design comprehensive test cases
2. Generate detailed test cases that cover different aspects of this scenario
3. Each test case must be executable by a QA tester with clear, step-by-step instructions
4. Include both positive flow and edge case/negative testing where applicable
5. Consider boundary conditions, error handling, and user experience aspects
6. Make test case titles descriptive and specific to the testing objective
7. Ensure test steps are atomic, clear, and include expected outcomes for each step

CRITICAL OUTPUT REQUIREMENTS:
- Return ONLY valid JSON - no code fences, no comments, no additional text
- No text before or after the JSON object
- Do not wrap the JSON in markdown code blocks (\`\`\`)
- Output must be a single JSON object with exactly the structure shown below
- Do not include any extra keys beyond those specified

REQUIRED JSON FORMAT:
{
  "test_cases": [
    {
      "title": "Clear, specific test case title describing what is being tested",
      "preconditions": "Detailed setup requirements and initial state before test execution",
      "steps": [
        "1. First action step with specific details",
        "2. Second action step with expected immediate result",
        "3. Continue with numbered steps that are atomic and clear"
      ],
      "test_data": "Specific data values, inputs, or parameters needed for the test step as applicable",
      "expected_result": "Clear description of the final expected outcome and success criteria per step"
    }
  ]
}

QUALITY REQUIREMENTS FOR EACH TEST CASE:
- Title: Be specific about what aspect is being tested (max 100 characters)
- Preconditions: Include system state, user permissions, data setup, environment conditions
- Steps: Number each step, be specific about actions, include verification points
- Test Data: Provide actual values, formats, or examples (not just placeholders)
- Expected Result: Define clear success criteria and observable outcomes

TESTING BEST PRACTICES:
- Each step should be actionable and verifiable
- Include both functional verification and UI/UX validation where applicable
- Consider different user roles, permissions, and access levels if relevant
- Test both successful flows and failure scenarios
- Ensure steps can be executed independently by different testers
- Include timing expectations for performance-related scenarios

Generate the detailed test cases now:`;

  return prompt;
}