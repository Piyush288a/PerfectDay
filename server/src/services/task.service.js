import { prisma } from "../config/prisma.js";
import { NotFoundError, BadRequestError } from "../utils/errors.js";

export const getUserTasks = async (userId, filters = {}) => {
  const where = { userId };

  if (filters.listId) {
    where.listId = filters.listId;
  }

  if (typeof filters.isCompleted === "boolean") {
    where.isCompleted = filters.isCompleted;
  }

  if (filters.priority) {
    where.priority = filters.priority;
  }

  if (filters.myDay === true) {
    where.myDayOn = { not: null };
  } else if (filters.myDay === false) {
    where.myDayOn = null;
  }

  if (filters.due) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (filters.due === "today") {
      where.dueDate = today;
    } else if (filters.due === "upcoming") {
      where.dueDate = { gt: today };
    } else if (filters.due === "overdue") {
      where.dueDate = { lt: today };
      where.isCompleted = false;
    }
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { notes: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const sortBy = filters.sortBy || "order";
  const sortOrder = filters.sortOrder || "asc";

  const orderBy = [{ [sortBy]: sortOrder }];
  if (sortBy !== "createdAt") {
    orderBy.push({ createdAt: "desc" });
  }

  return prisma.task.findMany({
    where,
    include: {
      list: {
        select: {
          id: true,
          name: true,
          isDefault: true,
        },
      },
      _count: {
        select: {
          subtasks: true,
        },
      },
    },
    orderBy,
  });
};

export const getTaskById = async (userId, taskId) => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      userId,
    },
    include: {
      list: {
        select: {
          id: true,
          name: true,
          isDefault: true,
        },
      },
      subtasks: {
        orderBy: { order: "asc" },
      },
      taskTags: {
        include: {
          tag: true,
        },
      },
      reminder: true,
    },
  });

  if (!task) {
    throw new NotFoundError("Task not found");
  }

  return task;
};

export const createTask = async (userId, data) => {
  let listId = data.listId;

  if (listId) {
    // Validate target list belongs to the user
    const list = await prisma.list.findFirst({
      where: { id: listId, userId },
    });
    if (!list) {
      throw new NotFoundError("List not found");
    }
  } else {
    // Find or fallback to default "Tasks" list
    const defaultList = await prisma.list.findFirst({
      where: { userId, isDefault: true },
    });
    if (!defaultList) {
      throw new BadRequestError("No default list found for user");
    }
    listId = defaultList.id;
  }

  const isCompleted = data.isCompleted ?? false;
  let completedAt = data.completedAt;

  if (isCompleted && !completedAt) {
    completedAt = new Date();
  } else if (!isCompleted) {
    completedAt = null;
  }

  return prisma.task.create({
    data: {
      userId,
      listId,
      title: data.title,
      notes: data.notes || null,
      isCompleted,
      completedAt,
      dueDate: data.dueDate || null,
      myDayOn: data.myDayOn || null,
      priority: data.priority || "NONE",
      order: data.order ?? 0,
      recurrenceRule: data.recurrenceRule || "NONE",
      recurrenceInterval: data.recurrenceInterval ?? 1,
      recurrenceEndsOn: data.recurrenceEndsOn || null,
    },
    include: {
      list: {
        select: {
          id: true,
          name: true,
          isDefault: true,
        },
      },
      _count: {
        select: {
          subtasks: true,
        },
      },
    },
  });
};

export const updateTask = async (userId, taskId, data) => {
  const existingTask = await prisma.task.findFirst({
    where: { id: taskId, userId },
  });

  if (!existingTask) {
    throw new NotFoundError("Task not found");
  }

  if (data.listId && data.listId !== existingTask.listId) {
    const targetList = await prisma.list.findFirst({
      where: { id: data.listId, userId },
    });
    if (!targetList) {
      throw new NotFoundError("Target list not found");
    }
  }

  let completedAt = data.completedAt;
  if (data.isCompleted !== undefined) {
    if (data.isCompleted && !existingTask.isCompleted && !completedAt) {
      completedAt = new Date();
    } else if (!data.isCompleted) {
      completedAt = null;
    }
  }

  return prisma.task.update({
    where: { id: taskId },
    data: {
      title: data.title,
      notes: data.notes,
      listId: data.listId,
      isCompleted: data.isCompleted,
      completedAt,
      dueDate: data.dueDate,
      myDayOn: data.myDayOn,
      priority: data.priority,
      order: data.order,
      recurrenceRule: data.recurrenceRule,
      recurrenceInterval: data.recurrenceInterval,
      recurrenceEndsOn: data.recurrenceEndsOn,
    },
    include: {
      list: {
        select: {
          id: true,
          name: true,
          isDefault: true,
        },
      },
      _count: {
        select: {
          subtasks: true,
        },
      },
    },
  });
};

export const deleteTask = async (userId, taskId) => {
  const existingTask = await prisma.task.findFirst({
    where: { id: taskId, userId },
  });

  if (!existingTask) {
    throw new NotFoundError("Task not found");
  }

  await prisma.task.delete({
    where: { id: taskId },
  });

  return { message: "Task deleted successfully" };
};
