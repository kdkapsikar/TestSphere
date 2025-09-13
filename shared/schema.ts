import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Requirements Table
export const requirements = pgTable("requirements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requirementId: varchar("requirement_id", { length: 50 }), // e.g., 'REQ-1' - nullable for migration
  title: text("title").notNull(),
  description: text("description"),
  module: text("module"),
  priority: text("priority").notNull().default("medium"), // high, medium, low
  author: text("author").notNull(),
  dateCreated: timestamp("date_created").defaultNow().notNull(),
}, (table) => ({
  requirementIdIdx: index("requirements_requirement_id_idx").on(table.requirementId),
  moduleIdx: index("requirements_module_idx").on(table.module),
  priorityIdx: index("requirements_priority_idx").on(table.priority),
}));

// Test Scenarios Table
export const testScenarios = pgTable("test_scenarios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scenarioId: varchar("scenario_id", { length: 50 }), // e.g., 'SC_LOGIN_01' - nullable for migration
  title: text("title").notNull(),
  description: text("description"),
  linkedRequirementId: varchar("linked_requirement_id").references(() => requirements.id),
  module: text("module"),
  testType: text("test_type"), // functional, integration, regression, etc.
  priority: text("priority").notNull().default("medium"), // high, medium, low
  author: text("author").notNull(),
  reviewer: text("reviewer"),
  status: text("status").notNull().default("draft"), // draft, reviewed, approved, deprecated
}, (table) => ({
  scenarioIdIdx: index("test_scenarios_scenario_id_idx").on(table.scenarioId),
  linkedRequirementIdx: index("test_scenarios_linked_requirement_idx").on(table.linkedRequirementId),
  moduleIdx: index("test_scenarios_module_idx").on(table.module),
  statusIdx: index("test_scenarios_status_idx").on(table.status),
}));

// Test Cases Table (Updated with new comprehensive fields)
export const testCases = pgTable("test_cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testCaseId: varchar("test_case_id", { length: 50 }), // e.g., 'TC_LOGIN_01' - nullable for migration
  title: text("title"), // nullable for migration compatibility
  linkedScenarioId: varchar("linked_scenario_id").references(() => testScenarios.id),
  preconditions: text("preconditions"),
  testSteps: jsonb("test_steps"), // Array of step objects
  testData: text("test_data"),
  expectedResult: text("expected_result"),
  actualResult: text("actual_result"), // To be filled during execution
  executionStatus: text("execution_status").notNull().default("not_executed"), // pass, fail, blocked, not_executed
  priority: text("priority").notNull().default("medium"), // high, medium, low
  module: text("module"),
  testType: text("test_type"), // positive, negative, boundary_value, smoke
  postConditions: text("post_conditions"), // State of system after test runs
  author: text("author"), // nullable for migration compatibility
  dateCreated: timestamp("date_created").defaultNow(),
  automationStatus: text("automation_status").notNull().default("manual"), // manual, automated, to_be_automated
  automationScriptId: text("automation_script_id"), // Link to automated test script
  comments: text("comments"), // Additional notes
  // Legacy fields for backward compatibility
  name: text("name"),
  description: text("description"),
  suiteId: varchar("suite_id").references(() => testSuites.id),
  status: text("status").notNull().default("pending"), // pending, running, passed, failed
  lastRun: timestamp("last_run"),
  duration: integer("duration"), // in milliseconds
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  testCaseIdIdx: index("test_cases_test_case_id_idx").on(table.testCaseId),
  linkedScenarioIdx: index("test_cases_linked_scenario_idx").on(table.linkedScenarioId),
  moduleIdx: index("test_cases_module_idx").on(table.module),
  priorityIdx: index("test_cases_priority_idx").on(table.priority),
  automationStatusIdx: index("test_cases_automation_status_idx").on(table.automationStatus),
  executionStatusIdx: index("test_cases_execution_status_idx").on(table.executionStatus),
}));

// Test Suites Table (Preserved for backward compatibility)
export const testSuites = pgTable("test_suites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"), // active, inactive, archived
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Test Runs Table (Updated with new comprehensive fields)
export const testRuns = pgTable("test_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name"), // nullable for migration compatibility
  environment: text("environment"), // dev, staging, production, etc. - nullable for migration
  buildVersion: text("build_version"),
  status: text("status").notNull().default("planned"), // planned, in_progress, completed, aborted
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  // Legacy fields for backward compatibility
  testCaseId: varchar("test_case_id").references(() => testCases.id),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in milliseconds
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  environmentIdx: index("test_runs_environment_idx").on(table.environment),
  statusIdx: index("test_runs_status_idx").on(table.status),
  startedAtIdx: index("test_runs_started_at_idx").on(table.startedAt),
}));

// Test Executions Table
export const testExecutions = pgTable("test_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testRunId: varchar("test_run_id").references(() => testRuns.id).notNull(),
  testCaseId: varchar("test_case_id").references(() => testCases.id).notNull(),
  assignedTo: text("assigned_to"),
  actualResult: text("actual_result"),
  executionStatus: text("execution_status").notNull().default("not_executed"), // pass, fail, blocked, not_executed, skip
  executedAt: timestamp("executed_at"),
  evidenceUrl: text("evidence_url"), // for screenshots, videos, etc.
}, (table) => ({
  testRunIdIdx: index("test_executions_test_run_id_idx").on(table.testRunId),
  testCaseIdIdx: index("test_executions_test_case_id_idx").on(table.testCaseId),
  executionStatusIdx: index("test_executions_execution_status_idx").on(table.executionStatus),
  executedAtIdx: index("test_executions_executed_at_idx").on(table.executedAt),
}));

// Defects Table
export const defects = pgTable("defects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  defectId: varchar("defect_id", { length: 50 }), // e.g., 'BUG-1001' - nullable for migration
  title: text("title").notNull(),
  description: text("description"),
  stepsToReproduce: text("steps_to_reproduce"),
  expectedResult: text("expected_result"),
  actualResult: text("actual_result"),
  severity: text("severity").notNull().default("medium"), // critical, high, medium, low
  priority: text("priority").notNull().default("medium"), // high, medium, low
  status: text("status").notNull().default("new"), // new, assigned, in_progress, resolved, closed, reopened
  module: text("module"),
  environment: text("environment"),
  reportedBy: text("reported_by").notNull(),
  dateReported: timestamp("date_reported").defaultNow().notNull(),
  assignedTo: text("assigned_to"),
  linkedTestCaseId: varchar("linked_test_case_id").references(() => testCases.id),
  linkedRequirementId: varchar("linked_requirement_id").references(() => requirements.id),
  foundInVersion: text("found_in_version"),
  fixedInVersion: text("fixed_in_version"),
  resolutionType: text("resolution_type"), // fixed, duplicate, not_a_bug, wont_fix, cannot_reproduce
}, (table) => ({
  defectIdIdx: index("defects_defect_id_idx").on(table.defectId),
  severityIdx: index("defects_severity_idx").on(table.severity),
  statusIdx: index("defects_status_idx").on(table.status),
  moduleIdx: index("defects_module_idx").on(table.module),
  reportedByIdx: index("defects_reported_by_idx").on(table.reportedBy),
  assignedToIdx: index("defects_assigned_to_idx").on(table.assignedTo),
  linkedTestCaseIdx: index("defects_linked_test_case_idx").on(table.linkedTestCaseId),
  linkedRequirementIdx: index("defects_linked_requirement_idx").on(table.linkedRequirementId),
}));

// Insert schemas
export const insertRequirementSchema = createInsertSchema(requirements).omit({
  id: true,
  dateCreated: true,
});

export const insertTestScenarioSchema = createInsertSchema(testScenarios).omit({
  id: true,
});

export const insertTestCaseSchema = createInsertSchema(testCases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastRun: true,
  duration: true,
  dateCreated: true,
});

export const insertTestSuiteSchema = createInsertSchema(testSuites).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTestRunSchema = createInsertSchema(testRuns).omit({
  id: true,
  createdAt: true,
  endTime: true,
  duration: true,
});

export const insertTestExecutionSchema = createInsertSchema(testExecutions).omit({
  id: true,
});

export const insertDefectSchema = createInsertSchema(defects).omit({
  id: true,
  dateReported: true,
});

// Types
export type Requirement = typeof requirements.$inferSelect;
export type InsertRequirement = z.infer<typeof insertRequirementSchema>;

export type TestScenario = typeof testScenarios.$inferSelect;
export type InsertTestScenario = z.infer<typeof insertTestScenarioSchema>;

export type TestCase = typeof testCases.$inferSelect;
export type InsertTestCase = z.infer<typeof insertTestCaseSchema>;

export type TestSuite = typeof testSuites.$inferSelect;
export type InsertTestSuite = z.infer<typeof insertTestSuiteSchema>;

export type TestRun = typeof testRuns.$inferSelect;
export type InsertTestRun = z.infer<typeof insertTestRunSchema>;

export type TestExecution = typeof testExecutions.$inferSelect;
export type InsertTestExecution = z.infer<typeof insertTestExecutionSchema>;

export type Defect = typeof defects.$inferSelect;
export type InsertDefect = z.infer<typeof insertDefectSchema>;

// Extended types for UI
export type TestCaseWithScenario = TestCase & {
  scenario?: Pick<TestScenario, "title" | "scenarioId">;
};

export type TestCaseWithSuite = TestCase & {
  suite?: Pick<TestSuite, "name">;
};

export type TestScenarioWithRequirement = TestScenario & {
  requirement?: Pick<Requirement, "title" | "requirementId">;
};

export type TestExecutionWithDetails = TestExecution & {
  testCase?: Pick<TestCase, "title" | "testCaseId">;
  testRun?: Pick<TestRun, "name" | "environment">;
};

export type DefectWithLinks = Defect & {
  testCase?: Pick<TestCase, "title" | "testCaseId">;
  requirement?: Pick<Requirement, "title" | "requirementId">;
};

export type TestRunWithStats = TestRun & {
  totalExecutions: number;
  passedExecutions: number;
  failedExecutions: number;
  blockedExecutions: number;
  notExecutedCount: number;
  passRate: number;
};

export type TestSuiteWithStats = TestSuite & {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  runningTests: number;
  passRate: number;
};