import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTestSuiteSchema, insertTestCaseSchema, insertTestRunSchema } from "@shared/schema";
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
// Import ES modules with proper TypeScript handling
import { generateWithAI } from "../services/aiService.js";
import { generateScenarioPrompt } from "../promptGenerators/generateScenarioPrompt.js";

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
      
      // Update test case status to running
      if (validatedData.testCaseId) {
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
        status: z.enum(['running', 'passed', 'failed', 'aborted']),
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

      // Update test case status
      if (testRun.testCaseId) {
        const updateData: any = { status: validatedData.status };
        if (testRun.duration !== null) {
          updateData.duration = testRun.duration;
        }
        await storage.updateTestCase(testRun.testCaseId, updateData);
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
        status: 'running',
      });

      // Update test case status
      await storage.updateTestCase(testCase.id, { status: 'running' });

      // Simulate test execution completion after a random time (2-10 seconds)
      const executionTime = Math.random() * 8000 + 2000; // 2-10 seconds
      const timer = setTimeout(async () => {
        try {
          // Check if the test run is still running (could have been stopped)
          const currentRun = await storage.getTestRun(testRun.id);
          if (!currentRun || currentRun.status !== 'running') {
            // Test was stopped, don't update status
            runningTestTimers.delete(testRun.id);
            return;
          }

          // Randomly determine if test passes or fails (80% pass rate)
          const testPassed = Math.random() < 0.8;
          const finalStatus = testPassed ? 'passed' : 'failed';
          
          // Update the test run with completion status
          const updatedRun = await storage.updateTestRun(testRun.id, {
            status: finalStatus,
            endTime: new Date(),
            errorMessage: testPassed ? null : 'Test execution failed due to assertion error'
          });
          
          // Update the test case with final status and duration from actual test run
          if (updatedRun) {
            const updateData = {
              status: finalStatus as any,
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
            if (currentRun && currentRun.status === 'running') {
              await storage.updateTestRun(testRun.id, {
                status: 'failed',
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
      const runningTestRun = testRuns.find(tr => tr.status === 'running');
      
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

  const httpServer = createServer(app);
  return httpServer;
}
