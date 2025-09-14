import { 
  type TestSuite, 
  type InsertTestSuite,
  type TestCase,
  type InsertTestCase,
  type TestRun,
  type InsertTestRun,
  type TestCaseWithSuite,
  type TestSuiteWithStats,
  type Requirement,
  type InsertRequirement,
  type TestScenario,
  type InsertTestScenario,
  type TestExecution,
  type InsertTestExecution,
  type Defect,
  type InsertDefect,
  testSuites,
  testCases,
  testRuns,
  requirements,
  testScenarios,
  testExecutions,
  defects
} from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, sql, desc, and } from "drizzle-orm";

export interface IStorage {
  // Requirements
  getRequirement(id: string): Promise<Requirement | undefined>;
  getRequirements(): Promise<Requirement[]>;
  createRequirement(requirement: InsertRequirement): Promise<Requirement>;
  updateRequirement(id: string, requirement: Partial<InsertRequirement>): Promise<Requirement | undefined>;
  deleteRequirement(id: string): Promise<boolean>;

  // Test Scenarios
  getTestScenario(id: string): Promise<TestScenario | undefined>;
  getTestScenarios(): Promise<TestScenario[]>;
  getTestScenariosByRequirement(requirementId: string): Promise<TestScenario[]>;
  createTestScenario(scenario: InsertTestScenario): Promise<TestScenario>;
  updateTestScenario(id: string, scenario: Partial<InsertTestScenario>): Promise<TestScenario | undefined>;
  deleteTestScenario(id: string): Promise<boolean>;

  // Test Suites
  getTestSuite(id: string): Promise<TestSuite | undefined>;
  getTestSuites(): Promise<TestSuite[]>;
  getTestSuitesWithStats(): Promise<TestSuiteWithStats[]>;
  createTestSuite(suite: InsertTestSuite): Promise<TestSuite>;
  updateTestSuite(id: string, suite: Partial<InsertTestSuite>): Promise<TestSuite | undefined>;
  deleteTestSuite(id: string): Promise<boolean>;

  // Test Cases
  getTestCase(id: string): Promise<TestCase | undefined>;
  getTestCases(): Promise<TestCase[]>;
  getTestCasesWithSuite(): Promise<TestCaseWithSuite[]>;
  getTestCasesBySuite(suiteId: string): Promise<TestCase[]>;
  getTestCasesByScenario(scenarioId: string): Promise<TestCase[]>;
  createTestCase(testCase: InsertTestCase): Promise<TestCase>;
  updateTestCase(id: string, testCase: Partial<InsertTestCase>): Promise<TestCase | undefined>;
  deleteTestCase(id: string): Promise<boolean>;

  // Test Runs
  getTestRun(id: string): Promise<TestRun | undefined>;
  getTestRuns(): Promise<TestRun[]>;
  getTestRunsByTestCase(testCaseId: string): Promise<TestRun[]>;
  createTestRun(testRun: InsertTestRun): Promise<TestRun>;
  updateTestRun(id: string, testRun: Partial<TestRun>): Promise<TestRun | undefined>;

  // Test Executions
  getTestExecution(id: string): Promise<TestExecution | undefined>;
  getTestExecutions(): Promise<TestExecution[]>;
  getTestExecutionsByRun(testRunId: string): Promise<TestExecution[]>;
  createTestExecution(execution: InsertTestExecution): Promise<TestExecution>;
  updateTestExecution(id: string, execution: Partial<InsertTestExecution>): Promise<TestExecution | undefined>;
  deleteTestExecution(id: string): Promise<boolean>;

  // Defects
  getDefect(id: string): Promise<Defect | undefined>;
  getDefects(): Promise<Defect[]>;
  getDefectsByStatus(status: string): Promise<Defect[]>;
  getDefectsByAssignee(assignedTo: string): Promise<Defect[]>;
  createDefect(defect: InsertDefect): Promise<Defect>;
  updateDefect(id: string, defect: Partial<InsertDefect>): Promise<Defect | undefined>;
  deleteDefect(id: string): Promise<boolean>;

  // Dashboard Stats
  getDashboardStats(): Promise<{
    totalTests: number;
    passedTests: number;
    failedTests: number;
    runningTests: number;
    pendingTests: number;
  }>;

  // Recent Activity
  getRecentActivity(): Promise<Array<{
    id: string;
    type: 'test_passed' | 'test_failed' | 'test_created' | 'test_started';
    testCaseName: string;
    suiteName?: string;
    timestamp: Date;
    message: string;
  }>>;
}

export class MemStorage implements IStorage {
  private requirements: Map<string, Requirement>;
  private testScenarios: Map<string, TestScenario>;
  private testSuites: Map<string, TestSuite>;
  private testCases: Map<string, TestCase>;
  private testRuns: Map<string, TestRun>;
  private testExecutions: Map<string, TestExecution>;
  private defects: Map<string, Defect>;
  private activity: Array<{
    id: string;
    type: 'test_passed' | 'test_failed' | 'test_created' | 'test_started';
    testCaseName: string;
    suiteName?: string;
    timestamp: Date;
    message: string;
  }>;

  constructor() {
    this.requirements = new Map();
    this.testScenarios = new Map();
    this.testSuites = new Map();
    this.testCases = new Map();
    this.testRuns = new Map();
    this.testExecutions = new Map();
    this.defects = new Map();
    this.activity = [];

    // Initialize with some default test suites
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default test suites
    const authSuite = this.createTestSuiteSync({
      name: "Authentication",
      description: "User authentication and authorization tests",
      status: "active"
    });

    const integrationSuite = this.createTestSuiteSync({
      name: "Integration",
      description: "API and service integration tests",
      status: "active"
    });

    const backendSuite = this.createTestSuiteSync({
      name: "Backend",
      description: "Backend service and database tests",
      status: "active"
    });

    // Create some default test cases
    this.createTestCaseSync({
      name: "User Login Validation",
      description: "Test user login with valid credentials",
      suiteId: authSuite.id,
      priority: "high",
      status: "passed"
    });

    this.createTestCaseSync({
      name: "Password Reset Flow",
      description: "Test password reset functionality",
      suiteId: authSuite.id,
      priority: "medium",
      status: "failed"
    });

    this.createTestCaseSync({
      name: "Payment Processing",
      description: "Test payment gateway integration",
      suiteId: integrationSuite.id,
      priority: "high",
      status: "running"
    });

    this.createTestCaseSync({
      name: "Database Connection",
      description: "Test database connectivity and queries",
      suiteId: backendSuite.id,
      priority: "medium",
      status: "passed"
    });
  }

  private createTestSuiteSync(suite: InsertTestSuite): TestSuite {
    const id = randomUUID();
    const now = new Date();
    const newSuite: TestSuite = {
      ...suite,
      id,
      description: suite.description || null,
      status: suite.status || "active",
      createdAt: now,
      updatedAt: now,
    };
    this.testSuites.set(id, newSuite);
    return newSuite;
  }

  private createTestCaseSync(testCase: InsertTestCase): TestCase {
    const id = randomUUID();
    const now = new Date();
    const newTestCase: TestCase = {
      ...testCase,
      id,
      name: testCase.name || null,
      testCaseId: testCase.testCaseId || null,
      title: testCase.title || null,
      description: testCase.description || null,
      suiteId: testCase.suiteId || null,
      linkedScenarioId: testCase.linkedScenarioId || null,
      preconditions: testCase.preconditions || null,
      testSteps: testCase.testSteps || null,
      testData: testCase.testData || null,
      expectedResult: testCase.expectedResult || null,
      actualResult: testCase.actualResult || null,
      executionStatus: testCase.executionStatus || "not_executed",
      priority: testCase.priority || "medium",
      module: testCase.module || null,
      testType: testCase.testType || null,
      postConditions: testCase.postConditions || null,
      author: testCase.author || null,
      dateCreated: now,
      automationStatus: testCase.automationStatus || "manual",
      automationScriptId: testCase.automationScriptId || null,
      comments: testCase.comments || null,
      // Legacy fields
      status: testCase.status || "pending",
      lastRun: testCase.status !== 'pending' ? now : null,
      duration: testCase.status !== 'pending' ? Math.floor(Math.random() * 3000) + 500 : null,
      createdAt: now,
      updatedAt: now,
    };
    this.testCases.set(id, newTestCase);

    // Add to activity
    const suite = testCase.suiteId ? this.testSuites.get(testCase.suiteId) : undefined;
    this.activity.unshift({
      id: randomUUID(),
      type: 'test_created',
      testCaseName: testCase.name || testCase.title || "Unnamed Test",
      suiteName: suite?.name,
      timestamp: now,
      message: `New test case created: "${testCase.name || testCase.title || "Unnamed Test"}"`
    });

    return newTestCase;
  }

  private addActivity(type: 'test_passed' | 'test_failed' | 'test_created' | 'test_started', testCase: TestCase, message: string) {
    const suite = testCase.suiteId ? this.testSuites.get(testCase.suiteId) : undefined;
    this.activity.unshift({
      id: randomUUID(),
      type,
      testCaseName: testCase.name || testCase.title || "Unnamed Test",
      suiteName: suite?.name,
      timestamp: new Date(),
      message
    });

    // Keep only last 20 activities
    if (this.activity.length > 20) {
      this.activity = this.activity.slice(0, 20);
    }
  }

  // Test Suites
  async getTestSuite(id: string): Promise<TestSuite | undefined> {
    return this.testSuites.get(id);
  }

  async getTestSuites(): Promise<TestSuite[]> {
    return Array.from(this.testSuites.values()).sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getTestSuitesWithStats(): Promise<TestSuiteWithStats[]> {
    const suites = await this.getTestSuites();
    return suites.map(suite => {
      const suiteTests = Array.from(this.testCases.values()).filter(tc => tc.suiteId === suite.id);
      const totalTests = suiteTests.length;
      const passedTests = suiteTests.filter(tc => tc.status === 'passed').length;
      const failedTests = suiteTests.filter(tc => tc.status === 'failed').length;
      const runningTests = suiteTests.filter(tc => tc.status === 'running').length;
      const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

      return {
        ...suite,
        totalTests,
        passedTests,
        failedTests,
        runningTests,
        passRate
      };
    });
  }

  async createTestSuite(suite: InsertTestSuite): Promise<TestSuite> {
    return this.createTestSuiteSync(suite);
  }

  async updateTestSuite(id: string, suite: Partial<InsertTestSuite>): Promise<TestSuite | undefined> {
    const existing = this.testSuites.get(id);
    if (!existing) return undefined;

    const updated: TestSuite = {
      ...existing,
      ...suite,
      updatedAt: new Date(),
    };
    this.testSuites.set(id, updated);
    return updated;
  }

  async deleteTestSuite(id: string): Promise<boolean> {
    return this.testSuites.delete(id);
  }

  // Test Cases
  async getTestCase(id: string): Promise<TestCase | undefined> {
    return this.testCases.get(id);
  }

  async getTestCases(): Promise<TestCase[]> {
    return Array.from(this.testCases.values()).sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getTestCasesWithSuite(): Promise<TestCaseWithSuite[]> {
    const testCases = await this.getTestCases();
    return testCases.map(testCase => ({
      ...testCase,
      suite: testCase.suiteId ? this.testSuites.get(testCase.suiteId) : undefined
    }));
  }

  async getTestCasesBySuite(suiteId: string): Promise<TestCase[]> {
    return Array.from(this.testCases.values())
      .filter(tc => tc.suiteId === suiteId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async createTestCase(testCase: InsertTestCase): Promise<TestCase> {
    return this.createTestCaseSync(testCase);
  }

  async updateTestCase(id: string, testCase: Partial<InsertTestCase>): Promise<TestCase | undefined> {
    const existing = this.testCases.get(id);
    if (!existing) return undefined;

    const updated: TestCase = {
      ...existing,
      ...testCase,
      updatedAt: new Date(),
    };

    // Update lastRun if status changed to running, passed, or failed
    if (testCase.status && ['running', 'passed', 'failed'].includes(testCase.status)) {
      updated.lastRun = new Date();
      
      if (testCase.status === 'passed') {
        this.addActivity('test_passed', updated, `${updated.name} passed`);
      } else if (testCase.status === 'failed') {
        this.addActivity('test_failed', updated, `${updated.name} failed`);
      } else if (testCase.status === 'running') {
        this.addActivity('test_started', updated, `${updated.name} running`);
      }
    }

    this.testCases.set(id, updated);
    return updated;
  }

  async deleteTestCase(id: string): Promise<boolean> {
    return this.testCases.delete(id);
  }

  // Test Runs
  async getTestRun(id: string): Promise<TestRun | undefined> {
    return this.testRuns.get(id);
  }

  async getTestRuns(): Promise<TestRun[]> {
    return Array.from(this.testRuns.values()).sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getTestRunsByTestCase(testCaseId: string): Promise<TestRun[]> {
    return Array.from(this.testRuns.values())
      .filter(tr => tr.testCaseId === testCaseId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async createTestRun(testRun: InsertTestRun): Promise<TestRun> {
    const id = randomUUID();
    const now = new Date();
    const newTestRun: TestRun = {
      ...testRun,
      id,
      testCaseId: testRun.testCaseId || null,
      startTime: testRun.startTime || now,
      endTime: null,
      duration: null,
      errorMessage: testRun.errorMessage || null,
      createdAt: now,
    };
    this.testRuns.set(id, newTestRun);
    return newTestRun;
  }

  async updateTestRun(id: string, testRun: Partial<TestRun>): Promise<TestRun | undefined> {
    const existing = this.testRuns.get(id);
    if (!existing) return undefined;

    const updated: TestRun = {
      ...existing,
      ...testRun,
    };

    // Calculate duration if endTime is provided
    if (testRun.endTime && existing.startTime) {
      updated.duration = testRun.endTime.getTime() - existing.startTime.getTime();
    }

    this.testRuns.set(id, updated);
    return updated;
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<{
    totalTests: number;
    passedTests: number;
    failedTests: number;
    runningTests: number;
    pendingTests: number;
  }> {
    const testCases = Array.from(this.testCases.values());
    return {
      totalTests: testCases.length,
      passedTests: testCases.filter(tc => tc.status === 'passed').length,
      failedTests: testCases.filter(tc => tc.status === 'failed').length,
      runningTests: testCases.filter(tc => tc.status === 'running').length,
      pendingTests: testCases.filter(tc => tc.status === 'pending').length,
    };
  }

  // Requirements (stub implementations)
  async getRequirement(id: string): Promise<Requirement | undefined> {
    return this.requirements.get(id);
  }

  async getRequirements(): Promise<Requirement[]> {
    return Array.from(this.requirements.values()).sort((a, b) => b.dateCreated.getTime() - a.dateCreated.getTime());
  }

  async createRequirement(requirement: InsertRequirement): Promise<Requirement> {
    const id = randomUUID();
    const now = new Date();
    const newRequirement: Requirement = {
      ...requirement,
      id,
      requirementId: requirement.requirementId || null,
      description: requirement.description || null,
      module: requirement.module || null,
      priority: requirement.priority || "medium",
      dateCreated: now
    };
    this.requirements.set(id, newRequirement);
    return newRequirement;
  }

  async updateRequirement(id: string, requirement: Partial<InsertRequirement>): Promise<Requirement | undefined> {
    const existing = this.requirements.get(id);
    if (!existing) return undefined;

    const updated: Requirement = {
      ...existing,
      ...requirement
    };
    this.requirements.set(id, updated);
    return updated;
  }

  async deleteRequirement(id: string): Promise<boolean> {
    return this.requirements.delete(id);
  }

  // Test Scenarios (stub implementations)
  async getTestScenario(id: string): Promise<TestScenario | undefined> {
    return this.testScenarios.get(id);
  }

  async getTestScenarios(): Promise<TestScenario[]> {
    return Array.from(this.testScenarios.values());
  }

  async getTestScenariosByRequirement(requirementId: string): Promise<TestScenario[]> {
    return Array.from(this.testScenarios.values())
      .filter(scenario => scenario.linkedRequirementId === requirementId);
  }

  async createTestScenario(scenario: InsertTestScenario): Promise<TestScenario> {
    const id = randomUUID();
    const newScenario: TestScenario = {
      ...scenario,
      id,
      description: scenario.description || null,
      module: scenario.module || null,
      testType: scenario.testType || null,
      priority: scenario.priority || "medium",
      reviewer: scenario.reviewer || null,
      status: scenario.status || "draft"
    };
    this.testScenarios.set(id, newScenario);
    return newScenario;
  }

  async updateTestScenario(id: string, scenario: Partial<InsertTestScenario>): Promise<TestScenario | undefined> {
    const existing = this.testScenarios.get(id);
    if (!existing) return undefined;

    const updated: TestScenario = {
      ...existing,
      ...scenario
    };
    this.testScenarios.set(id, updated);
    return updated;
  }

  async deleteTestScenario(id: string): Promise<boolean> {
    return this.testScenarios.delete(id);
  }

  // Test Cases by Scenario
  async getTestCasesByScenario(scenarioId: string): Promise<TestCase[]> {
    return Array.from(this.testCases.values())
      .filter(tc => tc.linkedScenarioId === scenarioId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  // Test Executions
  async getTestExecution(id: string): Promise<TestExecution | undefined> {
    return this.testExecutions.get(id);
  }

  async getTestExecutions(): Promise<TestExecution[]> {
    return Array.from(this.testExecutions.values());
  }

  async getTestExecutionsByRun(testRunId: string): Promise<TestExecution[]> {
    return Array.from(this.testExecutions.values())
      .filter(execution => execution.testRunId === testRunId);
  }

  async createTestExecution(execution: InsertTestExecution): Promise<TestExecution> {
    const id = randomUUID();
    const newExecution: TestExecution = {
      ...execution,
      id,
      actualResult: execution.actualResult || null,
      executionStatus: execution.executionStatus || "not_executed",
      executedAt: execution.executedAt || null,
      evidenceUrl: execution.evidenceUrl || null
    };
    this.testExecutions.set(id, newExecution);
    return newExecution;
  }

  async updateTestExecution(id: string, execution: Partial<InsertTestExecution>): Promise<TestExecution | undefined> {
    const existing = this.testExecutions.get(id);
    if (!existing) return undefined;

    const updated: TestExecution = {
      ...existing,
      ...execution
    };
    this.testExecutions.set(id, updated);
    return updated;
  }

  async deleteTestExecution(id: string): Promise<boolean> {
    return this.testExecutions.delete(id);
  }

  // Defects
  async getDefect(id: string): Promise<Defect | undefined> {
    return this.defects.get(id);
  }

  async getDefects(): Promise<Defect[]> {
    return Array.from(this.defects.values())
      .sort((a, b) => b.dateReported.getTime() - a.dateReported.getTime());
  }

  async getDefectsByStatus(status: string): Promise<Defect[]> {
    return Array.from(this.defects.values())
      .filter(defect => defect.status === status)
      .sort((a, b) => b.dateReported.getTime() - a.dateReported.getTime());
  }

  async getDefectsByAssignee(assignedTo: string): Promise<Defect[]> {
    return Array.from(this.defects.values())
      .filter(defect => defect.assignedTo === assignedTo)
      .sort((a, b) => b.dateReported.getTime() - a.dateReported.getTime());
  }

  async createDefect(defect: InsertDefect): Promise<Defect> {
    const id = randomUUID();
    const now = new Date();
    const newDefect: Defect = {
      ...defect,
      id,
      defectId: defect.defectId || null,
      description: defect.description || null,
      stepsToReproduce: defect.stepsToReproduce || null,
      expectedResult: defect.expectedResult || null,
      actualResult: defect.actualResult || null,
      severity: defect.severity || "medium",
      priority: defect.priority || "medium",
      status: defect.status || "new",
      module: defect.module || null,
      environment: defect.environment || null,
      assignedTo: defect.assignedTo || null,
      linkedTestCaseId: defect.linkedTestCaseId || null,
      linkedRequirementId: defect.linkedRequirementId || null,
      foundInVersion: defect.foundInVersion || null,
      fixedInVersion: defect.fixedInVersion || null,
      resolutionType: defect.resolutionType || null,
      dateReported: now
    };
    this.defects.set(id, newDefect);
    return newDefect;
  }

  async updateDefect(id: string, defect: Partial<InsertDefect>): Promise<Defect | undefined> {
    const existing = this.defects.get(id);
    if (!existing) return undefined;

    const updated: Defect = {
      ...existing,
      ...defect
    };
    this.defects.set(id, updated);
    return updated;
  }

  async deleteDefect(id: string): Promise<boolean> {
    return this.defects.delete(id);
  }

  // Recent Activity
  async getRecentActivity(): Promise<Array<{
    id: string;
    type: 'test_passed' | 'test_failed' | 'test_created' | 'test_started';
    testCaseName: string;
    suiteName?: string;
    timestamp: Date;
    message: string;
  }>> {
    return [...this.activity];
  }
}

// Database Storage Implementation
export class DbStorage implements IStorage {
  private db;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    const sql = neon(connectionString);
    this.db = drizzle(sql);
    
    // Initialize with sample data if empty
    this.initializeIfEmpty();
  }

  private async initializeIfEmpty() {
    try {
      const existingSuites = await this.db.select().from(testSuites).limit(1);
      if (existingSuites.length === 0) {
        await this.seedInitialData();
      }
    } catch (error) {
      console.error('Failed to check or initialize database:', error);
    }
  }

  private async seedInitialData() {
    // Create default test suites
    const authSuite = await this.db.insert(testSuites).values({
      name: "Authentication",
      description: "User authentication and authorization tests",
      status: "active"
    }).returning().then(rows => rows[0]);

    const integrationSuite = await this.db.insert(testSuites).values({
      name: "Integration", 
      description: "API and service integration tests",
      status: "active"
    }).returning().then(rows => rows[0]);

    const backendSuite = await this.db.insert(testSuites).values({
      name: "Backend",
      description: "Backend service and database tests", 
      status: "active"
    }).returning().then(rows => rows[0]);

    // Create some default test cases
    await this.db.insert(testCases).values([
      {
        name: "User Login Validation",
        description: "Test user login with valid credentials",
        suiteId: authSuite.id,
        priority: "high",
        status: "passed",
        lastRun: new Date(),
        duration: 1200
      },
      {
        name: "Password Reset Flow", 
        description: "Test password reset functionality",
        suiteId: authSuite.id,
        priority: "medium",
        status: "failed",
        lastRun: new Date(),
        duration: 850
      },
      {
        name: "Payment Processing",
        description: "Test payment gateway integration", 
        suiteId: integrationSuite.id,
        priority: "high",
        status: "running",
        lastRun: new Date()
      },
      {
        name: "Database Connection",
        description: "Test database connectivity and queries",
        suiteId: backendSuite.id,
        priority: "medium", 
        status: "passed",
        lastRun: new Date(),
        duration: 650
      }
    ]);
  }

  // Test Suites
  async getTestSuite(id: string): Promise<TestSuite | undefined> {
    const result = await this.db.select().from(testSuites).where(eq(testSuites.id, id)).limit(1);
    return result[0];
  }

  async getTestSuites(): Promise<TestSuite[]> {
    return await this.db.select().from(testSuites).orderBy(desc(testSuites.createdAt));
  }

  async getTestSuitesWithStats(): Promise<TestSuiteWithStats[]> {
    const suites = await this.getTestSuites();
    const result: TestSuiteWithStats[] = [];

    for (const suite of suites) {
      const suiteTests = await this.db.select().from(testCases).where(eq(testCases.suiteId, suite.id));
      const totalTests = suiteTests.length;
      const passedTests = suiteTests.filter(tc => tc.status === 'passed').length;
      const failedTests = suiteTests.filter(tc => tc.status === 'failed').length;
      const runningTests = suiteTests.filter(tc => tc.status === 'running').length;
      const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

      result.push({
        ...suite,
        totalTests,
        passedTests,
        failedTests,
        runningTests,
        passRate
      });
    }

    return result;
  }

  async createTestSuite(suite: InsertTestSuite): Promise<TestSuite> {
    const result = await this.db.insert(testSuites).values({
      ...suite,
      description: suite.description || null,
      status: suite.status || "active"
    }).returning();
    return result[0];
  }

  async updateTestSuite(id: string, suite: Partial<InsertTestSuite>): Promise<TestSuite | undefined> {
    const result = await this.db.update(testSuites)
      .set({
        ...suite,
        updatedAt: new Date()
      })
      .where(eq(testSuites.id, id))
      .returning();
    return result[0];
  }

  async deleteTestSuite(id: string): Promise<boolean> {
    const result = await this.db.delete(testSuites).where(eq(testSuites.id, id));
    return result.rowCount > 0;
  }

  // Test Cases
  async getTestCase(id: string): Promise<TestCase | undefined> {
    const result = await this.db.select().from(testCases).where(eq(testCases.id, id)).limit(1);
    return result[0];
  }

  async getTestCases(): Promise<TestCase[]> {
    return await this.db.select().from(testCases).orderBy(desc(testCases.createdAt));
  }

  async getTestCasesWithSuite(): Promise<TestCaseWithSuite[]> {
    const result = await this.db
      .select({
        id: testCases.id,
        name: testCases.name,
        testCaseId: testCases.testCaseId,
        title: testCases.title,
        description: testCases.description,
        suiteId: testCases.suiteId,
        linkedScenarioId: testCases.linkedScenarioId,
        preconditions: testCases.preconditions,
        testSteps: testCases.testSteps,
        testData: testCases.testData,
        expectedResult: testCases.expectedResult,
        actualResult: testCases.actualResult,
        executionStatus: testCases.executionStatus,
        priority: testCases.priority,
        module: testCases.module,
        testType: testCases.testType,
        postConditions: testCases.postConditions,
        author: testCases.author,
        dateCreated: testCases.dateCreated,
        automationStatus: testCases.automationStatus,
        automationScriptId: testCases.automationScriptId,
        comments: testCases.comments,
        status: testCases.status,
        lastRun: testCases.lastRun,
        duration: testCases.duration,
        createdAt: testCases.createdAt,
        updatedAt: testCases.updatedAt,
        suite: {
          name: testSuites.name
        }
      })
      .from(testCases)
      .leftJoin(testSuites, eq(testCases.suiteId, testSuites.id))
      .orderBy(desc(testCases.createdAt));

    return result.map(row => ({
      ...row,
      suite: row.suite?.name ? { name: row.suite.name } : undefined
    }));
  }

  async getTestCasesBySuite(suiteId: string): Promise<TestCase[]> {
    return await this.db.select().from(testCases)
      .where(eq(testCases.suiteId, suiteId))
      .orderBy(desc(testCases.createdAt));
  }

  async getTestCasesByScenario(scenarioId: string): Promise<TestCase[]> {
    return await this.db.select().from(testCases)
      .where(eq(testCases.linkedScenarioId, scenarioId))
      .orderBy(desc(testCases.createdAt));
  }

  async createTestCase(testCase: InsertTestCase): Promise<TestCase> {
    const result = await this.db.insert(testCases).values({
      ...testCase,
      description: testCase.description || null,
      suiteId: testCase.suiteId || null,
      linkedScenarioId: testCase.linkedScenarioId || null,
      preconditions: testCase.preconditions || null,
      testData: testCase.testData || null,
      expectedResult: testCase.expectedResult || null,
      actualResult: testCase.actualResult || null,
      executionStatus: testCase.executionStatus || "not_executed",
      priority: testCase.priority || "medium",
      module: testCase.module || null,
      testType: testCase.testType || null,
      postConditions: testCase.postConditions || null,
      author: testCase.author || null,
      automationStatus: testCase.automationStatus || "manual",
      automationScriptId: testCase.automationScriptId || null,
      comments: testCase.comments || null,
      status: testCase.status || "pending"
    }).returning();
    return result[0];
  }

  async updateTestCase(id: string, testCase: Partial<InsertTestCase>): Promise<TestCase | undefined> {
    const updateData: any = {
      ...testCase,
      updatedAt: new Date()
    };

    // Update lastRun if status changed to running, passed, or failed
    if (testCase.status && ['running', 'passed', 'failed'].includes(testCase.status)) {
      updateData.lastRun = new Date();
    }

    const result = await this.db.update(testCases)
      .set(updateData)
      .where(eq(testCases.id, id))
      .returning();
    return result[0];
  }

  async deleteTestCase(id: string): Promise<boolean> {
    const result = await this.db.delete(testCases).where(eq(testCases.id, id));
    return result.rowCount > 0;
  }

  // Test Runs
  async getTestRun(id: string): Promise<TestRun | undefined> {
    const result = await this.db.select().from(testRuns).where(eq(testRuns.id, id)).limit(1);
    return result[0];
  }

  async getTestRuns(): Promise<TestRun[]> {
    return await this.db.select().from(testRuns).orderBy(desc(testRuns.createdAt));
  }

  async getTestRunsByTestCase(testCaseId: string): Promise<TestRun[]> {
    return await this.db.select().from(testRuns)
      .where(eq(testRuns.testCaseId, testCaseId))
      .orderBy(desc(testRuns.createdAt));
  }

  async createTestRun(testRun: InsertTestRun): Promise<TestRun> {
    const result = await this.db.insert(testRuns).values({
      ...testRun,
      testCaseId: testRun.testCaseId || null,
      startTime: testRun.startTime || new Date(),
      errorMessage: testRun.errorMessage || null
    }).returning();
    return result[0];
  }

  async updateTestRun(id: string, testRun: Partial<TestRun>): Promise<TestRun | undefined> {
    const updateData: any = { ...testRun };

    // Calculate duration if endTime is provided
    if (testRun.endTime) {
      const existing = await this.getTestRun(id);
      if (existing?.startTime) {
        updateData.duration = testRun.endTime.getTime() - existing.startTime.getTime();
      }
    }

    const result = await this.db.update(testRuns)
      .set(updateData)
      .where(eq(testRuns.id, id))
      .returning();
    return result[0];
  }

  // Requirements
  async getRequirement(id: string): Promise<Requirement | undefined> {
    const result = await this.db.select().from(requirements).where(eq(requirements.id, id)).limit(1);
    return result[0];
  }

  async getRequirements(): Promise<Requirement[]> {
    return await this.db.select().from(requirements).orderBy(desc(requirements.dateCreated));
  }

  async createRequirement(requirement: InsertRequirement): Promise<Requirement> {
    const result = await this.db.insert(requirements).values({
      ...requirement,
      description: requirement.description || null,
      module: requirement.module || null,
      priority: requirement.priority || "medium"
    }).returning();
    return result[0];
  }

  async updateRequirement(id: string, requirement: Partial<InsertRequirement>): Promise<Requirement | undefined> {
    const result = await this.db.update(requirements)
      .set(requirement)
      .where(eq(requirements.id, id))
      .returning();
    return result[0];
  }

  async deleteRequirement(id: string): Promise<boolean> {
    const result = await this.db.delete(requirements).where(eq(requirements.id, id));
    return result.rowCount > 0;
  }

  // Test Scenarios
  async getTestScenario(id: string): Promise<TestScenario | undefined> {
    const result = await this.db.select().from(testScenarios).where(eq(testScenarios.id, id)).limit(1);
    return result[0];
  }

  async getTestScenarios(): Promise<TestScenario[]> {
    return await this.db.select().from(testScenarios).orderBy(desc(testScenarios.id));
  }

  async getTestScenariosByRequirement(requirementId: string): Promise<TestScenario[]> {
    return await this.db.select().from(testScenarios)
      .where(eq(testScenarios.linkedRequirementId, requirementId));
  }

  async createTestScenario(scenario: InsertTestScenario): Promise<TestScenario> {
    const result = await this.db.insert(testScenarios).values({
      ...scenario,
      description: scenario.description || null,
      module: scenario.module || null,
      testType: scenario.testType || null,
      priority: scenario.priority || "medium",
      reviewer: scenario.reviewer || null,
      status: scenario.status || "draft"
    }).returning();
    return result[0];
  }

  async updateTestScenario(id: string, scenario: Partial<InsertTestScenario>): Promise<TestScenario | undefined> {
    const result = await this.db.update(testScenarios)
      .set(scenario)
      .where(eq(testScenarios.id, id))
      .returning();
    return result[0];
  }

  async deleteTestScenario(id: string): Promise<boolean> {
    const result = await this.db.delete(testScenarios).where(eq(testScenarios.id, id));
    return result.rowCount > 0;
  }

  // Test Executions
  async getTestExecution(id: string): Promise<TestExecution | undefined> {
    const result = await this.db.select().from(testExecutions).where(eq(testExecutions.id, id)).limit(1);
    return result[0];
  }

  async getTestExecutions(): Promise<TestExecution[]> {
    return await this.db.select().from(testExecutions);
  }

  async getTestExecutionsByRun(testRunId: string): Promise<TestExecution[]> {
    return await this.db.select().from(testExecutions)
      .where(eq(testExecutions.testRunId, testRunId));
  }

  async createTestExecution(execution: InsertTestExecution): Promise<TestExecution> {
    const result = await this.db.insert(testExecutions).values({
      ...execution,
      actualResult: execution.actualResult || null,
      executionStatus: execution.executionStatus || "not_executed",
      executedAt: execution.executedAt || null,
      evidenceUrl: execution.evidenceUrl || null
    }).returning();
    return result[0];
  }

  async updateTestExecution(id: string, execution: Partial<InsertTestExecution>): Promise<TestExecution | undefined> {
    const result = await this.db.update(testExecutions)
      .set(execution)
      .where(eq(testExecutions.id, id))
      .returning();
    return result[0];
  }

  async deleteTestExecution(id: string): Promise<boolean> {
    const result = await this.db.delete(testExecutions).where(eq(testExecutions.id, id));
    return result.rowCount > 0;
  }

  // Defects
  async getDefect(id: string): Promise<Defect | undefined> {
    const result = await this.db.select().from(defects).where(eq(defects.id, id)).limit(1);
    return result[0];
  }

  async getDefects(): Promise<Defect[]> {
    return await this.db.select().from(defects).orderBy(desc(defects.dateReported));
  }

  async getDefectsByStatus(status: string): Promise<Defect[]> {
    return await this.db.select().from(defects)
      .where(eq(defects.status, status))
      .orderBy(desc(defects.dateReported));
  }

  async getDefectsByAssignee(assignedTo: string): Promise<Defect[]> {
    return await this.db.select().from(defects)
      .where(eq(defects.assignedTo, assignedTo))
      .orderBy(desc(defects.dateReported));
  }

  async createDefect(defect: InsertDefect): Promise<Defect> {
    const result = await this.db.insert(defects).values({
      ...defect,
      defectId: defect.defectId || null,
      description: defect.description || null,
      stepsToReproduce: defect.stepsToReproduce || null,
      expectedResult: defect.expectedResult || null,
      actualResult: defect.actualResult || null,
      severity: defect.severity || "medium",
      priority: defect.priority || "medium",
      status: defect.status || "new",
      module: defect.module || null,
      environment: defect.environment || null,
      assignedTo: defect.assignedTo || null,
      linkedTestCaseId: defect.linkedTestCaseId || null,
      linkedRequirementId: defect.linkedRequirementId || null,
      foundInVersion: defect.foundInVersion || null,
      fixedInVersion: defect.fixedInVersion || null,
      resolutionType: defect.resolutionType || null
    }).returning();
    return result[0];
  }

  async updateDefect(id: string, defect: Partial<InsertDefect>): Promise<Defect | undefined> {
    const result = await this.db.update(defects)
      .set(defect)
      .where(eq(defects.id, id))
      .returning();
    return result[0];
  }

  async deleteDefect(id: string): Promise<boolean> {
    const result = await this.db.delete(defects).where(eq(defects.id, id));
    return result.rowCount > 0;
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<{
    totalTests: number;
    passedTests: number;
    failedTests: number;
    runningTests: number;
    pendingTests: number;
  }> {
    const allTests = await this.db.select().from(testCases);
    return {
      totalTests: allTests.length,
      passedTests: allTests.filter(tc => tc.status === 'passed').length,
      failedTests: allTests.filter(tc => tc.status === 'failed').length,
      runningTests: allTests.filter(tc => tc.status === 'running').length,
      pendingTests: allTests.filter(tc => tc.status === 'pending').length,
    };
  }

  // Recent Activity - derived from test runs
  async getRecentActivity(): Promise<Array<{
    id: string;
    type: 'test_passed' | 'test_failed' | 'test_created' | 'test_started';
    testCaseName: string;
    suiteName?: string;
    timestamp: Date;
    message: string;
  }>> {
    const recentRuns = await this.db
      .select({
        id: testRuns.id,
        status: testRuns.status,
        startTime: testRuns.startTime,
        endTime: testRuns.endTime,
        testCase: {
          name: testCases.name,
          id: testCases.id
        },
        suite: {
          name: testSuites.name
        }
      })
      .from(testRuns)
      .leftJoin(testCases, eq(testRuns.testCaseId, testCases.id))
      .leftJoin(testSuites, eq(testCases.suiteId, testSuites.id))
      .orderBy(desc(testRuns.startTime))
      .limit(20);

    return recentRuns
      .filter(run => run.testCase?.name) // Only include runs with valid test case names
      .map(run => {
        let type: 'test_passed' | 'test_failed' | 'test_created' | 'test_started';
        let message: string;
        let timestamp: Date;

        if (run.status === 'passed') {
          type = 'test_passed';
          message = `${run.testCase!.name} passed`;
          timestamp = run.endTime || run.startTime || new Date();
        } else if (run.status === 'failed') {
          type = 'test_failed'; 
          message = `${run.testCase!.name} failed`;
          timestamp = run.endTime || run.startTime || new Date();
        } else if (run.status === 'running') {
          type = 'test_started';
          message = `${run.testCase!.name} running`;
          timestamp = run.startTime || new Date();
        } else {
          type = 'test_started';
          message = `${run.testCase!.name} started`;
          timestamp = run.startTime || new Date();
        }

        return {
          id: run.id,
          type,
          testCaseName: run.testCase!.name,
          suiteName: run.suite?.name,
          timestamp,
          message
        };
      });
  }
}

// Use database storage if DATABASE_URL is available, otherwise fallback to memory
export const storage = process.env.DATABASE_URL ? new DbStorage() : new MemStorage();