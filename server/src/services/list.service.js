import { prisma } from "../config/prisma.js";
import { NotFoundError, BadRequestError, ConflictError } from "../utils/errors.js";

export const getUserLists = async (userId) => {
  return prisma.list.findMany({
    where: { userId },
    include: {
      _count: {
        select: { tasks: true },
      },
    },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
};

export const createList = async (userId, { name }) => {
  return prisma.list.create({
    data: {
      userId,
      name,
      isDefault: false,
    },
    include: {
      _count: {
        select: { tasks: true },
      },
    },
  });
};

export const updateList = async (userId, listId, { name }) => {
  const existingList = await prisma.list.findFirst({
    where: { id: listId, userId },
  });

  if (!existingList) {
    throw new NotFoundError("List not found");
  }

  return prisma.list.update({
    where: { id: listId },
    data: { name },
    include: {
      _count: {
        select: { tasks: true },
      },
    },
  });
};

export const deleteList = async (userId, listId) => {
  const existingList = await prisma.list.findFirst({
    where: { id: listId, userId },
  });

  if (!existingList) {
    throw new NotFoundError("List not found");
  }

  if (existingList.isDefault) {
    throw new BadRequestError("Default list cannot be deleted");
  }

  // Check if list contains tasks (respecting ON DELETE RESTRICT behavior)
  const taskCount = await prisma.task.count({
    where: { listId, userId },
  });

  if (taskCount > 0) {
    throw new ConflictError("Cannot delete list that contains tasks");
  }

  await prisma.list.delete({
    where: { id: listId },
  });

  return { message: "List deleted successfully" };
};
