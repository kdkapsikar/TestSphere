import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTestSuiteSchema, insertTestCaseSchema, insertTestRunSchema, insertTestExecutionSchema, insertDefectSchema, insertRequirementSchema } from "@shared/schema";
import { z } from "zod";

// AI Response Validation Schemas
const aiScenarioSchema = z.object({
  scenario_id: z.string().min(1, "Scenario ID is required").max(50, "Scenario ID too long"),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  test_type: z.enum(["Functional", "Integration", "Regression", "Security", "Performance", "Usability", "API", "UI", "Database"], {
    errorMap: () => ({ message: "Invalid test type" })
  }),
  priority: z.enum(["High", "Medium", "Low"], {
    errorMap: () => ({ message: "Priority must be High, Medium, or Low" })
  })
});

const aiResponseSchema = z.object({
  scenarios: z.array(aiScenarioSchema).min(1, "At least one scenario is required").max(10, "Too many scenarios")
});

// AI Test Case Response Validation Schema
const aiTestCaseSchema = z.object({
  title: z.string().min(1, "Test case title is required").max(200, "Title too long"),
  preconditions: z.string().optional(),
  steps: z.array(z.string()).min(1, "At least one test step is required"),
  test_data: z.string().optional(),
  expected_result: z.string().min(1, "Expected result is required")
});

const aiTestCaseResponseSchema = z.object({
  test_cases: z.array(aiTestCaseSchema).min(1, "At least one test case is required").max(20, "Too many test cases")
});
// Import ES modules with proper TypeScript handling
import { generateWithAI } from "../services/aiService.js";
import { generateScenarioPrompt } from "../promptGenerators/generateScenarioPrompt.js";
import { generateTestCasePrompt } from "../promptGenerators/generateTestCasePrompt.js";

// Map to track running test execution timers for cancellation
const runningTestTimers = new Map<string, NodeJS.Timeout>();

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Dashboard Stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Recent Activity
  app.get("/api/dashboard/activity", async (req, res) => {
    try {
      const activity = await storage.getRecentActivity();
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // Test Suites Routes
  app.get("/api/test-suites", async (req, res) => {
    try {
      const suites = await storage.getTestSuites();
      res.json(suites);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch test suites" });
    }
  });

  app.get("/api/test-suites/with-stats", async (req, res) => {
    try {
      const suites = await storage.getTestSuitesWithStats();
      res.json(suites);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch test suites with stats" });
    }
  });

  app.get("/api/test-suites/:id", async (req, res) => {
    try {
      const suite = await storage.getTestSuite(req.params.id);
      if (!suite) {
        return res.status(404).json({ message: "Test suite not found" });
      }
      res.json(suite);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch test suite" });
    }
  });

  app.post("/api/test-suites", async (req, res) => {
    try {
      const validatedData = insertTestSuiteSchema.parse(req.body);
      const suite = await storage.createTestSuite(validatedData);
      res.status(201).json(suite);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid test suite data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create test suite" });
    }
  });

  app.put("/api/test-suites/:id", async (req, res) => {
    try {
      const validatedData = insertTestSuiteSchema.partial().parse(req.body);
      const suite = await storage.updateTestSuite(req.params.id, validatedData);
      if (!suite) {
        return res.status(404).json({ message: "Test suite not found" });
      }
      res.json(suite);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid test suite data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update test suite" });
    }
  });

  app.delete("/api/test-suites/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTestSuite(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Test suite not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete test suite" });
    }
  });

  // Test Cases Routes
  app.get("/api/test-cases", async (req, res) => {
    try {
      const testCases = await storage.getTestCasesWithSuite();
      res.json(testCases);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch test cases" });
    }
  });

  app.get("/api/test-cases/:id", async (req, res) => {
    try {
      const testCase = await storage.getTestCase(req.params.id);
      if (!testCase) {
        return res.status(404).json({ message: "Test case not found" });
      }
      res.json(testCase);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch test case" });
    }
  });

  app.get("/api/test-suites/:suiteId/test-cases", async (req, res) => {
    try {
      const testCases = await storage.getTestCasesBySuite(req.params.suiteId);
      res.json(testCases);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch test cases for suite" });
    }
  });

  app.post("/api/test-cases", async (req, res) => {
    try {
      const validatedData = insertTestCaseSchema.parse(req.body);
      const testCase = await storage.createTestCase(validatedData);
      res.status(201).json(testCase);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid test case data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create test case" });
    }
  });

  app.put("/api/test-cases/:id", async (req, res) => {
    try {
      const validatedData = insertTestCaseSchema.partial().parse(req.body);
      const testCase = await storage.updateTestCase(req.params.id, validatedData);
      if (!testCase) {
        return res.status(404).json({ message: "Test case not found" });
      }
      res.json(testCase);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid test case data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update test case" });
    }
  });

  app.delete("/api/test-cases/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTestCase(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Test case not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete test case" });
    }
  });

  // Test Run Routes
  app.get("/api/test-runs", async (req, res) => {
    try {
      const testRuns = await storage.getTestRuns();
      res.json(testRuns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch test runs" });
    }
  });

  app.get("/api/test-cases/:testCaseId/runs", async (req, res) => {
    try {
      const testRuns = await storage.getTestRunsByTestCase(req.params.testCaseId);
      res.json(testRuns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch test runs for test case" });
    }
  });

  app.post("/api/test-runs", async (req, res) => {
    try {
      const validatedData = insertTestRunSchema.parse(req.body);
      const testRun = await storage.createTestRun(validatedData);
      
      // Update test case status only if the run is starting immediately
      if (validatedData.testCaseId && testRun.status === 'in_progress') {
        await storage.updateTestCase(validatedData.testCaseId, { status: 'running' });
      }
      
      res.status(201).json(testRun);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid test run data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create test run" });
    }
  });

  app.put("/api/test-runs/:id", async (req, res) => {
    try {
      const validatedData = z.object({
        status: z.enum(['planned', 'in_progress', 'completed', 'aborted']),
        endTime: z.string().datetime().optional(),
        errorMessage: z.string().optional(),
      }).parse(req.body);

      const endTime = validatedData.endTime ? new Date(validatedData.endTime) : undefined;
      
      const testRun = await storage.updateTestRun(req.params.id, {
        ...validatedData,
        endTime
      });
      
      if (!testRun) {
        return res.status(404).json({ message: "Test run not found" });
      }

      // Update test case status with proper mapping
      if (testRun.testCaseId) {
        const updateData: any = {};
        
        // Map TestRun status to appropriate TestCase status
        if (validatedData.status === 'in_progress') {
          updateData.status = 'running';
        } else if (validatedData.status === 'completed') {
          // Don't automatically set test case status for completed runs
          // The test result should be determined by actual execution results
        } else if (validatedData.status === 'aborted') {
          updateData.status = 'pending'; // Reset to pending when aborted
        }
        // 'planned' status doesn't require test case status change
        
        if (testRun.duration !== null) {
          updateData.duration = testRun.duration;
        }
        
        // Only update if there are changes to make
        if (Object.keys(updateData).length > 0) {
          await storage.updateTestCase(testRun.testCaseId, updateData);
        }
      }

      res.json(testRun);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid test run data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update test run" });
    }
  });

  // Test Execution Actions
  app.post("/api/test-cases/:id/run", async (req, res) => {
    try {
      const testCase = await storage.getTestCase(req.params.id);
      if (!testCase) {
        return res.status(404).json({ message: "Test case not found" });
      }

      // Create a new test run
      const testRun = await storage.createTestRun({
        testCaseId: testCase.id,
        status: 'in_progress',
      });

      // Update test case status
      await storage.updateTestCase(testCase.id, { status: 'running' });

      // Simulate test execution completion after a random time (2-10 seconds)
      const executionTime = Math.random() * 8000 + 2000; // 2-10 seconds
      const timer = setTimeout(async () => {
        try {
          // Check if the test run is still running (could have been stopped)
          const currentRun = await storage.getTestRun(testRun.id);
          if (!currentRun || currentRun.status !== 'in_progress') {
            // Test was stopped, don't update status
            runningTestTimers.delete(testRun.id);
            return;
          }

          // Randomly determine if test passes or fails (80% pass rate)
          const testPassed = Math.random() < 0.8;
          const testCaseResult = testPassed ? 'passed' : 'failed';
          
          // Update the test run with completion status (domain: run lifecycle)
          const updatedRun = await storage.updateTestRun(testRun.id, {
            status: 'completed',
            endTime: new Date(),
            errorMessage: testPassed ? null : 'Test execution failed due to assertion error'
          });
          
          // Update the test case with final result (domain: test result)
          if (updatedRun) {
            const updateData = {
              status: testCaseResult,
              duration: updatedRun.duration || Math.round(executionTime)
            };
            await storage.updateTestCase(testCase.id, updateData);
          }
          
          // Clean up timer reference
          runningTestTimers.delete(testRun.id);
        } catch (error) {
          console.error('Failed to complete test execution:', error);
          // Fallback: mark as failed only if still running
          try {
            const currentRun = await storage.getTestRun(testRun.id);
            if (currentRun && currentRun.status === 'in_progress') {
              await storage.updateTestRun(testRun.id, {
                status: 'completed',
                endTime: new Date(),
                errorMessage: 'Test execution timed out or failed to complete'
              });
              const fallbackUpdateData = {
                status: 'failed' as any,
                duration: Math.round(executionTime)
              };
              await storage.updateTestCase(testCase.id, fallbackUpdateData);
            }
            runningTestTimers.delete(testRun.id);
          } catch (fallbackError) {
            console.error('Failed to handle test completion fallback:', fallbackError);
            runningTestTimers.delete(testRun.id);
          }
        }
      }, executionTime);

      // Track the timer for cancellation
      runningTestTimers.set(testRun.id, timer);

      res.json({ message: "Test execution started", testRun });
    } catch (error) {
      res.status(500).json({ message: "Failed to start test execution" });
    }
  });

  app.post("/api/test-cases/:id/stop", async (req, res) => {
    try {
      const testCase = await storage.getTestCase(req.params.id);
      if (!testCase) {
        return res.status(404).json({ message: "Test case not found" });
      }

      // Find the running test run and stop it
      const testRuns = await storage.getTestRunsByTestCase(testCase.id);
      const runningTestRun = testRuns.find(tr => tr.status === 'in_progress');
      
      if (runningTestRun) {
        // Cancel the automatic completion timer if it exists
        const timer = runningTestTimers.get(runningTestRun.id);
        if (timer) {
          clearTimeout(timer);
          runningTestTimers.delete(runningTestRun.id);
        }
        
        // Update the test run to aborted status
        await storage.updateTestRun(runningTestRun.id, {
          status: 'aborted',
          endTime: new Date(),
        });
      }

      // Update test case status
      await storage.updateTestCase(testCase.id, { status: 'pending' });

      res.json({ message: "Test execution stopped" });
    } catch (error) {
      res.status(500).json({ message: "Failed to stop test execution" });
    }
  });

  // Requirements CRUD Operations
  app.get("/api/requirements", async (req, res) => {
    try {
      const requirements = await storage.getRequirements();
      res.json(requirements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch requirements" });
    }
  });

  app.post("/api/requirements", async (req, res) => {
    try {
      const validatedData = insertRequirementSchema.parse(req.body);
      const requirement = await storage.createRequirement(validatedData);
      res.status(201).json(requirement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid requirement data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create requirement" });
    }
  });

  app.put("/api/requirements/:id", async (req, res) => {
    try {
      const validatedData = insertRequirementSchema.partial().parse(req.body);
      const requirement = await storage.updateRequirement(req.params.id, validatedData);
      if (!requirement) {
        return res.status(404).json({ message: "Requirement not found" });
      }
      res.json(requirement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid requirement data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update requirement" });
    }
  });

  app.delete("/api/requirements/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteRequirement(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Requirement not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete requirement" });
    }
  });

  // Requirements AI Generation Route
  app.post("/api/requirements/:reqId/generate-scenarios", async (req, res) => {
    try {
      const requirementId = req.params.reqId;
      
      // Fetch the requirement from the database
      const requirement = await storage.getRequirement(requirementId);
      if (!requirement) {
        return res.status(404).json({ message: "Requirement not found" });
      }

      // Generate AI prompt
      const prompt = generateScenarioPrompt(requirement);
      
      // Call AI service
      const aiResponse = await generateWithAI(prompt);
      
      // Extract and parse JSON from AI response (handle code fences and extra text)
      let parsedResponse;
      try {
        // First try direct parsing
        try {
          parsedResponse = JSON.parse(aiResponse);
        } catch (directParseError) {
          console.log('Direct JSON parse failed, attempting extraction...');
          
          // Try to extract JSON from code fences or surrounding text
          const jsonMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || 
                           aiResponse.match(/(\{[\s\S]*\})/);
          
          if (jsonMatch) {
            parsedResponse = JSON.parse(jsonMatch[1]);
          } else {
            throw directParseError;
          }
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        console.error('AI Response content:', aiResponse.substring(0, 500) + '...');
        return res.status(500).json({ 
          message: "AI service returned invalid JSON format",
          details: "The AI response could not be parsed as valid JSON. Please try again."
        });
      }

      // Validate response structure with Zod
      const validationResult = aiResponseSchema.safeParse(parsedResponse);
      if (!validationResult.success) {
        console.error('AI response validation failed:', validationResult.error);
        return res.status(500).json({ 
          message: "AI service returned invalid response format",
          details: `Validation errors: ${validationResult.error.issues.map(i => i.message).join(', ')}`
        });
      }

      const validatedResponse = validationResult.data;

      // Save the new test scenarios to the database with detailed tracking
      const scenarioResults = [];
      const createdScenarios = [];
      const errors = [];

      for (const scenario of validatedResponse.scenarios) {
        try {
          // Normalize data before database insertion
          const scenarioData = {
            scenarioId: scenario.scenario_id,
            title: scenario.title.trim(),
            description: scenario.description.trim(),
            linkedRequirementId: requirementId,
            module: requirement.module || 'General',
            testType: scenario.test_type.toLowerCase(), // Normalize to lowercase
            priority: scenario.priority.toLowerCase(), // Normalize to lowercase
            author: requirement.author,
            status: "draft"
          };

          const newScenario = await storage.createTestScenario(scenarioData);
          createdScenarios.push(newScenario);
          scenarioResults.push({
            scenario_id: scenario.scenario_id,
            title: scenario.title,
            status: 'created',
            id: newScenario.id
          });
        } catch (dbError) {
          console.error(`Failed to save scenario ${scenario.scenario_id}:`, dbError);
          errors.push({
            scenario_id: scenario.scenario_id,
            title: scenario.title,
            status: 'failed',
            error: dbError.message || 'Database error'
          });
          scenarioResults.push({
            scenario_id: scenario.scenario_id,
            title: scenario.title,
            status: 'failed',
            error: dbError.message || 'Database error'
          });
        }
      }

      // Determine response status code based on results
      const successCount = createdScenarios.length;
      const totalCount = validatedResponse.scenarios.length;
      
      if (successCount === 0) {
        return res.status(500).json({ 
          message: "Failed to save any scenarios to database",
          details: "All scenario creation attempts failed",
          requirement: {
            id: requirement.id,
            title: requirement.title
          },
          results: scenarioResults,
          summary: {
            total: totalCount,
            created: successCount,
            failed: errors.length
          }
        });
      }

      // Return detailed results (207 Multi-Status if partial success, 201 if all succeeded)
      const statusCode = successCount === totalCount ? 201 : 207;
      res.status(statusCode).json({
        message: successCount === totalCount ? 
          `Successfully generated ${successCount} test scenarios` :
          `Generated ${successCount} of ${totalCount} test scenarios`,
        requirement: {
          id: requirement.id,
          title: requirement.title
        },
        scenarios: createdScenarios,
        results: scenarioResults,
        summary: {
          total: totalCount,
          created: successCount,
          failed: errors.length
        }
      });

    } catch (error: any) {
      console.error('Error in generate-scenarios route:', error);
      
      // Handle specific error types
      if (error.message && error.message.includes('DEEPSEEK_API_KEY')) {
        return res.status(500).json({ 
          message: "AI service configuration error",
          details: "DeepSeek API key is not configured"
        });
      } else if (error.message && (error.message.includes('Network error') || error.message.includes('connection'))) {
        return res.status(503).json({ 
          message: "AI service temporarily unavailable",
          details: "Unable to connect to DeepSeek API. Please try again later."
        });
      } else if (error.message && error.message.includes('Rate limit')) {
        return res.status(429).json({ 
          message: "AI service rate limit exceeded",
          details: "Please wait before making another request"
        });
      } else {
        return res.status(500).json({ 
          message: "Failed to generate test scenarios",
          details: error.message || 'Unknown error occurred'
        });
      }
    }
  });

// POST /api/scenarios/:scenarioId/generate-test-cases - Generate test cases from a scenario using AI
app.post('/api/scenarios/:scenarioId/generate-test-cases', async (req, res) => {
  try {
    const { scenarioId } = req.params;
    
    if (!scenarioId || typeof scenarioId !== 'string') {
      return res.status(400).json({ 
        message: "Invalid scenario ID",
        details: "scenarioId parameter is required and must be a string"
      });
    }

    // Fetch the scenario from the database
    const scenario = await storage.getTestScenario(scenarioId);
    if (!scenario) {
      return res.status(404).json({ 
        message: "Test scenario not found",
        details: `No scenario found with ID: ${scenarioId}`
      });
    }

    console.log(`Generating test cases for scenario: ${scenario.title} (${scenario.scenarioId})`);

    // Create the AI prompt
    const prompt = generateTestCasePrompt({
      scenario_id: scenario.scenarioId || scenario.id,
      title: scenario.title,
      description: scenario.description || '',
      test_type: scenario.testType || 'Functional',
      priority: scenario.priority || 'Medium'
    });

    // Call AI service
    const aiResponse = await generateWithAI(prompt);
    
    // Extract and parse JSON from AI response (handle code fences and extra text)
    let parsedResponse;
    try {
      // First try direct parsing
      try {
        parsedResponse = JSON.parse(aiResponse);
      } catch (directParseError) {
        console.log('Direct JSON parse failed, attempting extraction...');
        
        // Try to extract JSON from code fences or surrounding text
        const jsonMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || 
                         aiResponse.match(/(\{[\s\S]*\})/);
        
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[1]);
        } else {
          throw directParseError;
        }
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('AI Response content:', aiResponse.substring(0, 500) + '...');
      return res.status(500).json({ 
        message: "AI service returned invalid JSON format",
        details: "The AI response could not be parsed as valid JSON. Please try again."
      });
    }

    // Validate response structure with Zod
    let validatedResponse;
    try {
      validatedResponse = aiTestCaseResponseSchema.parse(parsedResponse);
    } catch (validationError) {
      console.error('AI response validation failed:', validationError);
      return res.status(500).json({ 
        message: "AI service returned invalid response format",
        details: validationError instanceof z.ZodError ? 
          validationError.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') :
          "Response structure validation failed"
      });
    }

    // Save the new test cases to the database with detailed tracking
    const testCaseResults = [];
    const createdTestCases = [];
    const errors = [];

    for (const testCase of validatedResponse.test_cases) {
      try {
        // Normalize data before database insertion
        const testCaseData = {
          title: testCase.title?.trim(),
          linkedScenarioId: scenario.id,
          preconditions: testCase.preconditions?.trim(),
          testSteps: testCase.steps ? JSON.stringify(testCase.steps) : null,
          testData: testCase.test_data?.trim(),
          expectedResult: testCase.expected_result?.trim(),
          priority: scenario.priority || 'medium',
          module: scenario.module || 'General',
          testType: 'manual',
          author: scenario.author,
          automationStatus: 'not_automated',
          status: 'pending'
        };

        const newTestCase = await storage.createTestCase(testCaseData);
        createdTestCases.push(newTestCase);
        testCaseResults.push({
          title: testCase.title,
          status: 'created',
          id: newTestCase.id
        });
      } catch (dbError) {
        console.error(`Failed to save test case ${testCase.title}:`, dbError);
        errors.push({
          title: testCase.title,
          status: 'failed',
          error: dbError.message || 'Database error'
        });
        testCaseResults.push({
          title: testCase.title,
          status: 'failed',
          error: dbError.message || 'Database error'
        });
      }
    }

    // Determine response status code based on results
    const successCount = createdTestCases.length;
    const totalCount = parsedResponse.test_cases.length;
    
    if (successCount === 0) {
      return res.status(500).json({ 
        message: "Failed to save any test cases to database",
        details: "All test case creation attempts failed",
        scenario: {
          id: scenario.id,
          title: scenario.title
        },
        results: testCaseResults,
        summary: {
          total: totalCount,
          created: successCount,
          failed: errors.length
        }
      });
    }

    // Return detailed results (207 Multi-Status if partial success, 201 if all succeeded)
    const statusCode = successCount === totalCount ? 201 : 207;
    res.status(statusCode).json({
      message: successCount === totalCount ? 
        `Successfully generated ${successCount} test cases` :
        `Generated ${successCount} of ${totalCount} test cases`,
      scenario: {
        id: scenario.id,
        title: scenario.title
      },
      testCases: createdTestCases,
      results: testCaseResults,
      summary: {
        total: totalCount,
        created: successCount,
        failed: errors.length
      }
    });

  } catch (error: any) {
    console.error('Error in generate-test-cases route:', error);
    
    // Handle specific error types
    if (error.message && error.message.includes('DEEPSEEK_API_KEY')) {
      return res.status(500).json({ 
        message: "AI service configuration error",
        details: "DeepSeek API key is not configured"
      });
    } else if (error.message && (error.message.includes('Network error') || error.message.includes('connection'))) {
      return res.status(503).json({ 
        message: "AI service temporarily unavailable",
        details: "Unable to connect to DeepSeek API. Please try again later."
      });
    } else if (error.message && error.message.includes('Rate limit')) {
      return res.status(429).json({ 
        message: "AI service rate limit exceeded",
        details: "Please wait before making another request"
      });
    } else {
      return res.status(500).json({ 
        message: "Failed to generate test cases",
        details: error.message || 'Unknown error occurred'
      });
    }
  }
});

// PUT /api/test-executions/:executionId - Update test execution with manual results and auto-create defects for failures
app.put('/api/test-executions/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;
    const { actual_result, execution_status, evidence_url } = req.body;
    
    // Validate input parameters
    if (!executionId || typeof executionId !== 'string') {
      return res.status(400).json({ 
        message: "Invalid execution ID",
        details: "executionId parameter is required and must be a string"
      });
    }

    if (!execution_status || !['pass', 'fail', 'blocked', 'not_executed', 'skip'].includes(execution_status)) {
      return res.status(400).json({ 
        message: "Invalid execution status",
        details: "execution_status must be one of: pass, fail, blocked, not_executed, skip"
      });
    }

    // Get the execution record
    const execution = await storage.getTestExecution(executionId);
    if (!execution) {
      return res.status(404).json({ 
        message: "Test execution not found",
        details: `No test execution found with ID: ${executionId}`
      });
    }

    // Update the execution record
    const executionUpdate = {
      actualResult: actual_result?.trim(),
      executionStatus: execution_status,
      executedAt: new Date(),
      evidenceUrl: evidence_url?.trim() || null
    };

    const updatedExecution = await storage.updateTestExecution(executionId, executionUpdateData);
    
    if (!updatedExecution) {
      return res.status(500).json({ 
        message: "Failed to update test execution",
        details: "Database update operation failed"
      });
    }

    let newDefect = null;
    
    // Auto-create defect if execution failed
    if (execution_status === 'fail') {
      try {
        // Get the associated test case for defect details
        const testCase = execution.testCaseId ? await storage.getTestCase(execution.testCaseId) : null;
        
        const defectData = {
          title: `Failed Test: ${testCase?.title || testCase?.name || 'Unknown Test'}`,
          description: actual_result?.trim() || 'Test execution failed',
          stepsToReproduce: testCase?.testSteps ? 
            (typeof testCase.testSteps === 'string' ? testCase.testSteps : JSON.stringify(testCase.testSteps)) : 
            'Follow test case steps',
          expectedResult: testCase?.expectedResult || 'Test should pass',
          actualResult: actual_result?.trim() || 'Test failed',
          severity: 'medium',
          priority: testCase?.priority || 'medium',
          status: 'new',
          module: testCase?.module || 'General',
          environment: 'development',
          reportedBy: 'System (Auto-generated)',
          linkedTestCaseId: execution.testCaseId,
          linkedRequirementId: testCase?.linkedRequirementId || null
        };

        newDefect = await storage.createDefect(defectData);
        console.log(`Auto-created defect ${newDefect.id} for failed test execution ${executionId}`);
      } catch (defectError) {
        console.error('Failed to create automatic defect:', defectError);
        // Don't fail the execution update if defect creation fails
      }
    }

    // Return the updated execution and new defect ID
    const response = {
      message: `Test execution updated successfully`,
      execution: updatedExecution,
      defect: newDefect ? {
        id: newDefect.id,
        title: newDefect.title,
        status: newDefect.status
      } : null
    };

    res.status(200).json(response);

  } catch (error: any) {
    console.error('Error in update test execution route:', error);
    
    return res.status(500).json({ 
      message: "Failed to update test execution",
      details: error.message || 'Unknown error occurred'
    });
  }
});

// GET /api/defects/dashboard/stats - Get defect counts grouped by status, severity, and priority
app.get('/api/defects/dashboard/stats', async (req, res) => {
  try {
    const { project, module } = req.query;
    
    // SQL query for defect dashboard statistics
    let defectStatsQuery = `
      SELECT 
        status,
        severity,
        priority,
        COUNT(*) as count
      FROM defects 
    `;
    
    const conditions = [];
    const params = [];
    
    if (project && typeof project === 'string') {
      conditions.push('module = $' + (params.length + 1));
      params.push(project);
    }
    
    if (module && typeof module === 'string') {
      conditions.push('module = $' + (params.length + 1));
      params.push(module);
    }
    
    if (conditions.length > 0) {
      defectStatsQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    defectStatsQuery += `
      GROUP BY status, severity, priority
      ORDER BY 
        CASE status 
          WHEN 'new' THEN 1
          WHEN 'assigned' THEN 2
          WHEN 'in_progress' THEN 3
          WHEN 'resolved' THEN 4
          WHEN 'closed' THEN 5
          WHEN 'reopened' THEN 6
          ELSE 7
        END,
        CASE severity 
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
          ELSE 5
        END,
        CASE priority 
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
          ELSE 4
        END
    `;
    
    // Additional summary queries
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_defects,
        COUNT(CASE WHEN status = 'new' THEN 1 END) as new_defects,
        COUNT(CASE WHEN status = 'assigned' THEN 1 END) as assigned_defects,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_defects,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_defects,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_defects,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_defects,
        COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_severity_defects
      FROM defects
      ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}
    `;
    
    // For demonstration, return the SQL queries
    // In production, these would be executed against the database
    res.status(200).json({
      message: "Defect dashboard statistics queries",
      queries: {
        defectStats: {
          sql: defectStatsQuery,
          params: params,
          description: "Groups defects by status, severity, and priority with counts"
        },
        summary: {
          sql: summaryQuery,
          params: params,
          description: "Provides summary counts by status and severity"
        }
      },
      // Mock data for demonstration
      mockData: {
        groupedStats: [
          { status: 'new', severity: 'critical', priority: 'high', count: 3 },
          { status: 'new', severity: 'high', priority: 'high', count: 5 },
          { status: 'assigned', severity: 'medium', priority: 'medium', count: 8 },
          { status: 'in_progress', severity: 'low', priority: 'low', count: 2 },
          { status: 'resolved', severity: 'medium', priority: 'medium', count: 12 }
        ],
        summary: {
          total_defects: 30,
          new_defects: 8,
          assigned_defects: 10,
          in_progress_defects: 5,
          resolved_defects: 12,
          closed_defects: 5,
          critical_defects: 3,
          high_severity_defects: 8
        }
      }
    });
    
  } catch (error: any) {
    console.error('Error in defect dashboard stats route:', error);
    return res.status(500).json({ 
      message: "Failed to fetch defect dashboard statistics",
      details: error.message || 'Unknown error occurred'
    });
  }
});

// GET /api/defects - Get paginated list of defects with filtering
app.get('/api/defects', async (req, res) => {
  try {
    const { 
      page = '1', 
      limit = '20', 
      status, 
      assigned_to, 
      reported_by,
      severity,
      priority,
      module,
      sort_by = 'date_reported',
      sort_order = 'desc'
    } = req.query;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;
    
    // Validate sort parameters
    const validSortFields = ['date_reported', 'title', 'status', 'severity', 'priority', 'assigned_to'];
    const validSortOrders = ['asc', 'desc'];
    
    const sortField = validSortFields.includes(sort_by as string) ? sort_by : 'date_reported';
    const sortDirection = validSortOrders.includes(sort_order as string) ? sort_order : 'desc';
    
    // Build the main query for paginated defects
    let defectsQuery = `
      SELECT 
        d.id,
        d.defect_id,
        d.title,
        d.description,
        d.status,
        d.severity,
        d.priority,
        d.module,
        d.environment,
        d.reported_by,
        d.date_reported,
        d.assigned_to,
        d.linked_test_case_id,
        d.linked_requirement_id,
        tc.title as test_case_title,
        tc.test_case_id,
        r.title as requirement_title,
        r.requirement_id
      FROM defects d
      LEFT JOIN test_cases tc ON d.linked_test_case_id = tc.id
      LEFT JOIN requirements r ON d.linked_requirement_id = r.id
    `;
    
    // Build WHERE conditions
    const conditions = [];
    const params = [];
    
    if (status && typeof status === 'string') {
      conditions.push('d.status = $' + (params.length + 1));
      params.push(status);
    }
    
    if (assigned_to && typeof assigned_to === 'string') {
      conditions.push('d.assigned_to = $' + (params.length + 1));
      params.push(assigned_to);
    }
    
    if (reported_by && typeof reported_by === 'string') {
      conditions.push('d.reported_by = $' + (params.length + 1));
      params.push(reported_by);
    }
    
    if (severity && typeof severity === 'string') {
      conditions.push('d.severity = $' + (params.length + 1));
      params.push(severity);
    }
    
    if (priority && typeof priority === 'string') {
      conditions.push('d.priority = $' + (params.length + 1));
      params.push(priority);
    }
    
    if (module && typeof module === 'string') {
      conditions.push('d.module = $' + (params.length + 1));
      params.push(module);
    }
    
    if (conditions.length > 0) {
      defectsQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    defectsQuery += ` ORDER BY d.${sortField} ${sortDirection.toUpperCase()}`;
    defectsQuery += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limitNum, offset);
    
    // Count query for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM defects d';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    // For demonstration, return the SQL queries
    res.status(200).json({
      message: "Paginated defects list query",
      pagination: {
        page: pageNum,
        limit: limitNum,
        offset: offset
      },
      filters: {
        status,
        assigned_to,
        reported_by,
        severity,
        priority,
        module
      },
      sorting: {
        field: sortField,
        order: sortDirection
      },
      queries: {
        defects: {
          sql: defectsQuery,
          params: params,
          description: "Fetches paginated defects with joins to test cases and requirements"
        },
        count: {
          sql: countQuery,
          params: params.slice(0, -2), // Remove limit and offset for count
          description: "Gets total count for pagination"
        }
      },
      // Mock data for demonstration
      mockData: {
        defects: [
          {
            id: "def-1",
            defect_id: "BUG-1001",
            title: "Login button not working on mobile",
            description: "Users cannot tap the login button on mobile devices",
            status: "assigned",
            severity: "high",
            priority: "high",
            module: "Authentication",
            environment: "production",
            reported_by: "john.doe@company.com",
            date_reported: "2024-01-15T10:30:00Z",
            assigned_to: "jane.smith@company.com",
            test_case_title: "Mobile Login Test",
            requirement_title: "User Authentication System"
          },
          {
            id: "def-2",
            defect_id: "BUG-1002",
            title: "Payment processing timeout",
            description: "Payment gateway times out after 30 seconds",
            status: "new",
            severity: "critical",
            priority: "high",
            module: "Payment",
            environment: "production",
            reported_by: "test.user@company.com",
            date_reported: "2024-01-16T14:20:00Z",
            assigned_to: null,
            test_case_title: "Payment Flow Test",
            requirement_title: "Payment Processing"
          }
        ],
        pagination: {
          total: 45,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(45 / limitNum),
          hasNext: pageNum * limitNum < 45,
          hasPrev: pageNum > 1
        }
      }
    });
    
  } catch (error: any) {
    console.error('Error in defects list route:', error);
    return res.status(500).json({ 
      message: "Failed to fetch defects list",
      details: error.message || 'Unknown error occurred'
    });
  }
});

  const httpServer = createServer(app);
  return httpServer;
}
