import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTestSuiteSchema, insertTestCaseSchema, insertTestRunSchema } from "@shared/schema";
import { z } from "zod";

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

  const httpServer = createServer(app);
  return httpServer;
}
