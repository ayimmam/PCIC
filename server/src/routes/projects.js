import { Router } from "express";
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  setRepoUrl,
  addTodo,
  updateTodo,
  getReports,
  submitReport,
  scoreReport,
  getResources,
  addResource,
  getIssues,
  createIssue,
  replyIssue,
  getBurndown,
  getBurndownSummary,
} from "../controllers/projectController.js";
import auth from "../middleware/auth.js";
import roleGuard from "../middleware/roleGuard.js";

const router = Router();

// Projects CRUD
router.get("/", auth, getProjects);
router.get("/burndown-summary", auth, roleGuard("pm"), getBurndownSummary);
router.get("/:id", auth, getProjectById);
router.post("/", auth, roleGuard("pm"), createProject);
router.put("/:id", auth, roleGuard("pm"), updateProject);
router.put("/:id/repo", auth, setRepoUrl);

// Todos
router.post("/:id/todos", auth, addTodo);
router.put("/:id/todos/:todoId", auth, updateTodo);

// Weekly reports
router.get("/:id/reports", auth, getReports);
router.post("/:id/reports", auth, submitReport);
router.put("/:id/reports/:reportId/score", auth, roleGuard("pm"), scoreReport);

// Resources
router.get("/:id/resources", auth, getResources);
router.post("/:id/resources", auth, roleGuard("pm"), addResource);

// Issues
router.get("/:id/issues", auth, getIssues);
router.post("/:id/issues", auth, createIssue);
router.post("/:id/issues/:issueId/reply", auth, replyIssue);

// Burndown
router.get("/:id/burndown", auth, getBurndown);

export default router;
