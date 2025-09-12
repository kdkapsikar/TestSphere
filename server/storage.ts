import { 
  type TestSuite, 
  type InsertTestSuite,
  type TestCase,
  type InsertTestCase,
  type TestRun,
  type InsertTestRun,
  type TestCaseWithSuite,
  type TestSuiteWithStats
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
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
  createTestCase(testCase: InsertTestCase): Promise<TestCase>;
  updateTestCase(id: string, testCase: Partial<InsertTestCase>): Promise<TestCase | undefined>;
  deleteTestCase(id: string): Promise<boolean>;

  // Test Runs
  getTestRun(id: string): Promise<TestRun | undefined>;
  getTestRuns(): Promise<TestRun[]>;
  getTestRunsByTestCase(testCaseId: string): Promise<TestRun[]>;
  createTestRun(testRun: InsertTestRun): Promise<TestRun>;
  updateTestRun(id: string, testRun: Partial<TestRun>): Promise<TestRun | undefined>;

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
  private testSuites: Map<string, TestSuite>;
  private testCases: Map<string, TestCase>;
  private testRuns: Map<string, TestRun>;
  private activity: Array<{
    id: string;
    type: 'test_passed' | 'test_failed' | 'test_created' | 'test_started';
    testCaseName: string;
    suiteName?: string;
    timestamp: Date;
    message: string;
  }>;

  constructor() {
    this.testSuites = new Map();
    this.testCases = new Map();
    this.testRuns = new Map();
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
      description: testCase.description || null,
      suiteId: testCase.suiteId || null,
      priority: testCase.priority || "medium",
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
      testCaseName: testCase.name,
      suiteName: suite?.name,
      timestamp: now,
      message: `New test case created: "${testCase.name}"`
    });

    return newTestCase;
  }

  private addActivity(type: 'test_passed' | 'test_failed' | 'test_created' | 'test_started', testCase: TestCase, message: string) {
    const suite = testCase.suiteId ? this.testSuites.get(testCase.suiteId) : undefined;
    this.activity.unshift({
      id: randomUUID(),
      type,
      testCaseName: testCase.name,
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

export const storage = new MemStorage();
