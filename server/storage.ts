import { 
  type TestSuite, 
  type InsertTestSuite,
  type TestCase,
  type InsertTestCase,
  type TestRun,
  type InsertTestRun,
  type TestCaseWithSuite,
  type TestSuiteWithStats,
  testSuites,
  testCases,
  testRuns
} from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, sql, desc, and } from "drizzle-orm";

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
        description: testCases.description,
        suiteId: testCases.suiteId,
        priority: testCases.priority,
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

  async createTestCase(testCase: InsertTestCase): Promise<TestCase> {
    const result = await this.db.insert(testCases).values({
      ...testCase,
      description: testCase.description || null,
      suiteId: testCase.suiteId || null,
      priority: testCase.priority || "medium",
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
