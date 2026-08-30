import { spawn } from "child_process";

const API_BASE = "http://localhost:3000/api";

const runTests = async () => {
  console.log("=== PerfectDay Phase 7A: Backend Core Tasks & Lists API Verification ===\n");
  let passed = 0;
  let total = 0;

  const assert = (condition, name, details = "") => {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}: ${details}`);
    }
  };

  // Start backend server
  const server = spawn("node", ["--env-file=.env", "src/index.js"], {
    cwd: "d:/IGNORE/PROJECTS/PerfectDay/server",
    stdio: "inherit",
  });

  // Wait for server to boot
  await new Promise((resolve) => setTimeout(resolve, 2000));

  try {
    // 1. Health check
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.success, "GET /api/health online");

    // 2. Unauthenticated access rejections
    const unauthListRes = await fetch(`${API_BASE}/lists`);
    assert(unauthListRes.status === 401, "GET /api/lists without auth returns 401");

    const unauthTaskRes = await fetch(`${API_BASE}/tasks`);
    assert(unauthTaskRes.status === 401, "GET /api/tasks without auth returns 401");

    // 3. Register User A and User B
    const userAData = {
      email: `userA_${Date.now()}@example.com`,
      password: "Password123!",
      displayName: "User Alpha",
    };
    const userBData = {
      email: `userB_${Date.now()}@example.com`,
      password: "Password123!",
      displayName: "User Beta",
    };

    const regARes = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userAData),
    });
    const regAJson = await regARes.json();
    const cookieA = regARes.headers.get("set-cookie")?.split(";")[0] || "";
    assert(regARes.status === 201 && cookieA.includes("pd_auth="), "User A registered with cookie");

    const regBRes = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userBData),
    });
    const cookieB = regBRes.headers.get("set-cookie")?.split(";")[0] || "";
    assert(regBRes.status === 201 && cookieB.includes("pd_auth="), "User B registered with cookie");

    // 4. Lists CRUD for User A
    const listsARes = await fetch(`${API_BASE}/lists`, { headers: { Cookie: cookieA } });
    const listsAData = await listsARes.json();
    const defaultListA = listsAData.data.find((l) => l.isDefault === true);
    assert(
      listsARes.status === 200 && defaultListA && defaultListA.name === "Tasks",
      "User A has default 'Tasks' list",
      JSON.stringify(listsAData)
    );

    // Create custom list
    const createListRes = await fetch(`${API_BASE}/lists`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({ name: "Work Projects" }),
    });
    const createListData = await createListRes.json();
    const customListId = createListData.data.id;
    assert(
      createListRes.status === 201 &&
        createListData.data.name === "Work Projects" &&
        createListData.data.isDefault === false,
      "User A creates custom list",
      JSON.stringify(createListData)
    );

    // Rename custom list
    const updateListRes = await fetch(`${API_BASE}/lists/${customListId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({ name: "Work & Ambitions" }),
    });
    const updateListData = await updateListRes.json();
    assert(
      updateListRes.status === 200 && updateListData.data.name === "Work & Ambitions",
      "User A renames custom list",
      JSON.stringify(updateListData)
    );

    // Reject invalid list name (empty)
    const invalidListRes = await fetch(`${API_BASE}/lists`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({ name: "   " }),
    });
    assert(invalidListRes.status === 400, "Empty list name rejected with 400 Validation Error");

    // Reject deleting default list
    const delDefaultListRes = await fetch(`${API_BASE}/lists/${defaultListA.id}`, {
      method: "DELETE",
      headers: { Cookie: cookieA },
    });
    const delDefaultData = await delDefaultListRes.json();
    assert(
      delDefaultListRes.status === 400 && delDefaultData.error.message.includes("Default list"),
      "Default list deletion rejected (400)",
      JSON.stringify(delDefaultData)
    );

    // 5. Tasks CRUD for User A
    // Create task in custom list
    const task1Res = await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({
        title: "Plan sprint goals",
        notes: "Align with quarterly objectives",
        listId: customListId,
        priority: "HIGH",
        dueDate: "2026-09-01",
      }),
    });
    const task1Data = await task1Res.json();
    const task1Id = task1Data.data.id;
    assert(
      task1Res.status === 201 &&
        task1Data.data.title === "Plan sprint goals" &&
        task1Data.data.priority === "HIGH" &&
        task1Data.data.listId === customListId,
      "Task created in custom list",
      JSON.stringify(task1Data)
    );

    // Create task without listId (should auto-assign to default "Tasks" list)
    const todayStr = new Date().toISOString().split("T")[0];
    const task2Res = await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({
        title: "Morning coffee meditation",
        myDayOn: todayStr,
      }),
    });
    const task2Data = await task2Res.json();
    const task2Id = task2Data.data.id;
    assert(
      task2Res.status === 201 &&
        task2Data.data.listId === defaultListA.id &&
        task2Data.data.myDayOn !== null,
      "Task created without listId auto-assigns to default list",
      JSON.stringify(task2Data)
    );

    // Filter tasks by myDay=true
    const myDayTasksRes = await fetch(`${API_BASE}/tasks?myDay=true`, {
      headers: { Cookie: cookieA },
    });
    const myDayTasksData = await myDayTasksRes.json();
    assert(
      myDayTasksRes.status === 200 &&
        myDayTasksData.data.length === 1 &&
        myDayTasksData.data[0].id === task2Id,
      "GET /api/tasks?myDay=true filters My Day tasks",
      JSON.stringify(myDayTasksData)
    );

    // Filter tasks by listId
    const listTasksRes = await fetch(`${API_BASE}/tasks?listId=${customListId}`, {
      headers: { Cookie: cookieA },
    });
    const listTasksData = await listTasksRes.json();
    assert(
      listTasksRes.status === 200 &&
        listTasksData.data.length === 1 &&
        listTasksData.data[0].id === task1Id,
      "GET /api/tasks?listId=... filters tasks by list",
      JSON.stringify(listTasksData)
    );

    // Update task: mark completed
    const completeTaskRes = await fetch(`${API_BASE}/tasks/${task1Id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({ isCompleted: true }),
    });
    const completeTaskData = await completeTaskRes.json();
    assert(
      completeTaskRes.status === 200 &&
        completeTaskData.data.isCompleted === true &&
        completeTaskData.data.completedAt !== null,
      "Task completion sets completedAt timestamp",
      JSON.stringify(completeTaskData)
    );

    // Update task: mark uncompleted
    const uncompleteTaskRes = await fetch(`${API_BASE}/tasks/${task1Id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({ isCompleted: false }),
    });
    const uncompleteTaskData = await uncompleteTaskRes.json();
    assert(
      uncompleteTaskRes.status === 200 &&
        uncompleteTaskData.data.isCompleted === false &&
        uncompleteTaskData.data.completedAt === null,
      "Uncompleting task clears completedAt timestamp",
      JSON.stringify(uncompleteTaskData)
    );

    // GET single task by ID
    const getTaskRes = await fetch(`${API_BASE}/tasks/${task1Id}`, {
      headers: { Cookie: cookieA },
    });
    const getTaskData = await getTaskRes.json();
    assert(
      getTaskRes.status === 200 && getTaskData.data.id === task1Id && getTaskData.data.list.name,
      "GET /api/tasks/:id returns detailed task with list info",
      JSON.stringify(getTaskData)
    );

    // 6. Cross-User Isolation (User B cannot access or mutate User A's data)
    const crossGetTaskRes = await fetch(`${API_BASE}/tasks/${task1Id}`, {
      headers: { Cookie: cookieB },
    });
    assert(crossGetTaskRes.status === 404, "User B cannot GET User A's task (404)");

    const crossPatchTaskRes = await fetch(`${API_BASE}/tasks/${task1Id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookieB },
      body: JSON.stringify({ title: "Hacked title" }),
    });
    assert(crossPatchTaskRes.status === 404, "User B cannot PATCH User A's task (404)");

    const crossDeleteTaskRes = await fetch(`${API_BASE}/tasks/${task1Id}`, {
      method: "DELETE",
      headers: { Cookie: cookieB },
    });
    assert(crossDeleteTaskRes.status === 404, "User B cannot DELETE User A's task (404)");

    const crossPatchListRes = await fetch(`${API_BASE}/lists/${customListId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookieB },
      body: JSON.stringify({ name: "Hacked list name" }),
    });
    assert(crossPatchListRes.status === 404, "User B cannot PATCH User A's list (404)");

    const crossDeleteListRes = await fetch(`${API_BASE}/lists/${customListId}`, {
      method: "DELETE",
      headers: { Cookie: cookieB },
    });
    assert(crossDeleteListRes.status === 404, "User B cannot DELETE User A's list (404)");

    const crossCreateTaskTargetListRes = await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieB },
      body: JSON.stringify({ title: "Task in stolen list", listId: customListId }),
    });
    assert(
      crossCreateTaskTargetListRes.status === 404,
      "User B cannot create task targeting User A's list (404)"
    );

    // 7. ON DELETE RESTRICT on Lists (Cannot delete list containing tasks)
    const delListWithTasksRes = await fetch(`${API_BASE}/lists/${customListId}`, {
      method: "DELETE",
      headers: { Cookie: cookieA },
    });
    const delListWithTasksData = await delListWithTasksRes.json();
    assert(
      delListWithTasksRes.status === 409 &&
        delListWithTasksData.error.message.includes("contains tasks"),
      "Deleting list with tasks rejected with 409 Conflict",
      JSON.stringify(delListWithTasksData)
    );

    // Delete task first
    const deleteTask1Res = await fetch(`${API_BASE}/tasks/${task1Id}`, {
      method: "DELETE",
      headers: { Cookie: cookieA },
    });
    assert(deleteTask1Res.status === 200, "User A deletes task");

    // Delete empty custom list now succeeds
    const delEmptyListRes = await fetch(`${API_BASE}/lists/${customListId}`, {
      method: "DELETE",
      headers: { Cookie: cookieA },
    });
    assert(delEmptyListRes.status === 200, "User A deletes empty custom list successfully");

    console.log(`\n=== Phase 7A Verification Results: ${passed}/${total} Passed ===`);
    if (passed === total) {
      console.log("🎉 ALL PHASE 7A TESTS PASSED!");
    } else {
      process.exit(1);
    }
  } finally {
    server.kill();
  }
};

runTests();
