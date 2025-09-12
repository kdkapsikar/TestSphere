import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Test Suites Table
export const testSuites = pgTable("test_suites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"), // active, inactive, archived
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Test Cases Table
export const testCases = pgTable("test_cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  suiteId: varchar("suite_id").references(() => testSuites.id),
  priority: text("priority").notNull().default("medium"), // high, medium, low
  status: text("status").notNull().default("pending"), // pending, running, passed, failed
  lastRun: timestamp("last_run"),
  duration: integer("duration"), // in milliseconds
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Test Runs Table
export const testRuns = pgTable("test_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testCaseId: varchar("test_case_id").references(() => testCases.id),
  status: text("status").notNull(), // running, passed, failed, aborted
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in milliseconds
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertTestSuiteSchema = createInsertSchema(testSuites).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTestCaseSchema = createInsertSchema(testCases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastRun: true,
  duration: true,
});

export const insertTestRunSchema = createInsertSchema(testRuns).omit({
  id: true,
  createdAt: true,
  endTime: true,
  duration: true,
});

// Types
export type TestSuite = typeof testSuites.$inferSelect;
export type InsertTestSuite = z.infer<typeof insertTestSuiteSchema>;

export type TestCase = typeof testCases.$inferSelect;
export type InsertTestCase = z.infer<typeof insertTestCaseSchema>;

export type TestRun = typeof testRuns.$inferSelect;
export type InsertTestRun = z.infer<typeof insertTestRunSchema>;

// Extended types for UI
export type TestCaseWithSuite = TestCase & {
  suite?: Pick<TestSuite, "name">;
};

export type TestSuiteWithStats = TestSuite & {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  runningTests: number;
  passRate: number;
};
