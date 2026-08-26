import * as taskService from "../services/task.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const getTasks = async (req, res) => {
  const query = req.validatedQuery || req.query;
  const tasks = await taskService.getUserTasks(req.user.userId, query);
  return sendSuccess(res, tasks, 200);
};

export const getTask = async (req, res) => {
  const task = await taskService.getTaskById(req.user.userId, req.params.id);
  return sendSuccess(res, task, 200);
};

export const createTask = async (req, res) => {
  const task = await taskService.createTask(req.user.userId, req.body);
  return sendSuccess(res, task, 201);
};

export const updateTask = async (req, res) => {
  const task = await taskService.updateTask(req.user.userId, req.params.id, req.body);
  return sendSuccess(res, task, 200);
};

export const deleteTask = async (req, res) => {
  const result = await taskService.deleteTask(req.user.userId, req.params.id);
  return sendSuccess(res, result, 200);
};
