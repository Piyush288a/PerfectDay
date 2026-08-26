import * as listService from "../services/list.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const getLists = async (req, res) => {
  const lists = await listService.getUserLists(req.user.userId);
  return sendSuccess(res, lists, 200);
};

export const createList = async (req, res) => {
  const list = await listService.createList(req.user.userId, req.body);
  return sendSuccess(res, list, 201);
};

export const updateList = async (req, res) => {
  const list = await listService.updateList(req.user.userId, req.params.id, req.body);
  return sendSuccess(res, list, 200);
};

export const deleteList = async (req, res) => {
  const result = await listService.deleteList(req.user.userId, req.params.id);
  return sendSuccess(res, result, 200);
};
