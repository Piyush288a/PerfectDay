import { spawn } from "child_process";

const API_BASE = "http://localhost:3000/api";

const runTests = async () => {
  console.log("=== PerfectDay Phase 7B: Frontend Tasks & Lists Integration Verification ===\n");
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

  // Wait for server to start
  await new Promise((resolve) => setTimeout(resolve, 2000));

  try {
    // 1. Health check
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.success, "1. Backend /api/health online");

    // 2. Register User A & User B
    const userA = {
      email: `user_p7b_a_${Date.now()}@example.com`,
      password: "Password123!",
      displayName: "Alice Tester",
    };
    const userB = {
      email: `user_p7b_b_${Date.now()}@example.com`,
      password: "Password123!",
      displayName: "Bob Tester",
    };

    const regARes = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userA),
    });
    const cookieA = regARes.headers.get("set-cookie")?.split(";")[0] || "";
    assert(regARes.status === 201 && cookieA.includes("pd_auth="), "2. User A registered with HTTP-only cookie");

    const regBRes = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userB),
    });
    const cookieB = regBRes.headers.get("set-cookie")?.split(";")[0] || "";
    assert(regBRes.status === 201 && cookieB.includes("pd_auth="), "3. User B registered with HTTP-only cookie");

    // 4. Session restoration check
    const meRes = await fetch(`${API_BASE}/auth/me`, { headers: { Cookie: cookieA } });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.data.email === userA.email.toLowerCase(), "4. GET /api/auth/me restores User A session");

    // 5. Initial real lists loading from PostgreSQL
    const listsRes = await fetch(`${API_BASE}/lists`, { headers: { Cookie: cookieA } });
    const listsData = await listsRes.json();
    const defaultList = listsData.data.find((l) => l.isDefault === true);
    assert(listsRes.status === 200 && defaultList && defaultList.name === "Tasks", "5. Real default 'Tasks' list loaded from DB");

    // 6. Create custom list "Personal Goals"
    const createListRes = await fetch(`${API_BASE}/lists`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({ name: "Personal Goals" }),
    });
    const createListData = await createListRes.json();
    const personalListId = createListData.data.id;
    assert(createListRes.status === 201 && createListData.data.name === "Personal Goals", "6. Create custom list persists to DB");

    // 7. Rename custom list
    const updateListRes = await fetch(`${API_BASE}/lists/${personalListId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({ name: "Personal Aspirations" }),
    });
    const updateListData = await updateListRes.json();
    assert(updateListRes.status === 200 && updateListData.data.name === "Personal Aspirations", "7. Rename custom list persists to DB");

    // 8. Create task in My Day
    const todayStr = new Date().toISOString().split("T")[0];
    const taskMyDayRes = await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({
        title: "Morning Sunlight & Espresso",
        myDayOn: todayStr,
      }),
    });
    const taskMyDayData = await taskMyDayRes.json();
    const myDayTaskId = taskMyDayData.data.id;
    assert(taskMyDayRes.status === 201 && taskMyDayData.data.myDayOn !== null, "8. Create My Day task persists to DB");

    // 9. Create Important task (priority === HIGH)
    const taskImportantRes = await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({
        title: "Quarterly Revenue Review",
        priority: "HIGH",
      }),
    });
    const taskImportantData = await taskImportantRes.json();
    const importantTaskId = taskImportantData.data.id;
    assert(taskImportantRes.status === 201 && taskImportantData.data.priority === "HIGH", "9. Create Important task (priority=HIGH) persists to DB");

    // 10. Create Planned task with due date
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const taskPlannedRes = await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({
        title: "Submit Design System Specs",
        dueDate: tomorrowStr,
      }),
    });
    const taskPlannedData = await taskPlannedRes.json();
    const plannedTaskId = taskPlannedData.data.id;
    assert(taskPlannedRes.status === 201 && taskPlannedData.data.dueDate !== null, "10. Create Planned task persists to DB");

    // 11. Create Task in Custom List
    const taskCustomRes = await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({
        title: "Read 20 pages of architecture patterns",
        listId: personalListId,
      }),
    });
    const taskCustomData = await taskCustomRes.json();
    const customTaskId = taskCustomData.data.id;
    assert(taskCustomRes.status === 201 && taskCustomData.data.listId === personalListId, "11. Create task in custom list persists to DB");

    // 12. View filtering: My Day view
    const myDayViewRes = await fetch(`${API_BASE}/tasks?myDay=true`, { headers: { Cookie: cookieA } });
    const myDayViewData = await myDayViewRes.json();
    assert(
      myDayViewRes.status === 200 &&
        myDayViewData.data.some((t) => t.id === myDayTaskId) &&
        !myDayViewData.data.some((t) => t.id === taskCustomData.data.id),
      "12. My Day view displays only My Day tasks"
    );

    // 13. View filtering: Important view (priority=HIGH)
    const importantViewRes = await fetch(`${API_BASE}/tasks?priority=HIGH`, { headers: { Cookie: cookieA } });
    const importantViewData = await importantViewRes.json();
    assert(
      importantViewRes.status === 200 &&
        importantViewData.data.some((t) => t.id === importantTaskId) &&
        importantViewData.data.every((t) => t.priority === "HIGH"),
      "13. Important view displays only HIGH-priority tasks"
    );

    // 14. View filtering: Planned view (due=upcoming)
    const plannedViewRes = await fetch(`${API_BASE}/tasks?due=upcoming`, { headers: { Cookie: cookieA } });
    const plannedViewData = await plannedViewRes.json();
    assert(
      plannedViewRes.status === 200 && plannedViewData.data.some((t) => t.id === plannedTaskId),
      "14. Planned view displays upcoming due tasks"
    );

    // 15. View filtering: Custom list view
    const customListViewRes = await fetch(`${API_BASE}/tasks?listId=${personalListId}`, { headers: { Cookie: cookieA } });
    const customListViewData = await customListViewRes.json();
    assert(
      customListViewRes.status === 200 &&
        customListViewData.data.length === 1 &&
        customListViewData.data[0].id === customTaskId,
      "15. Custom list view displays only its tasks"
    );

    // 16. Complete task: sets isCompleted: true and completedAt
    const completeRes = await fetch(`${API_BASE}/tasks/${customTaskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({ isCompleted: true }),
    });
    const completeData = await completeRes.json();
    assert(
      completeRes.status === 200 &&
        completeData.data.isCompleted === true &&
        completeData.data.completedAt !== null,
      "16. Task completion sets completedAt timestamp"
    );

    // 17. Uncomplete task: sets isCompleted: false and completedAt: null
    const uncompleteRes = await fetch(`${API_BASE}/tasks/${customTaskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({ isCompleted: false }),
    });
    const uncompleteData = await uncompleteRes.json();
    assert(
      uncompleteRes.status === 200 &&
        uncompleteData.data.isCompleted === false &&
        uncompleteData.data.completedAt === null,
      "17. Task uncompletion clears completedAt timestamp"
    );

    // 18. Priority toggle: toggles HIGH -> NONE
    const priorityToggleRes = await fetch(`${API_BASE}/tasks/${importantTaskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({ priority: "NONE" }),
    });
    const priorityToggleData = await priorityToggleRes.json();
    assert(
      priorityToggleRes.status === 200 && priorityToggleData.data.priority === "NONE",
      "18. Priority toggle (HIGH -> NONE) persists to DB"
    );

    // 19. Move task between lists (from Personal list to Default list)
    const moveTaskRes = await fetch(`${API_BASE}/tasks/${customTaskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({ listId: defaultList.id }),
    });
    const moveTaskData = await moveTaskRes.json();
    assert(
      moveTaskRes.status === 200 && moveTaskData.data.listId === defaultList.id,
      "19. Moving task to another list persists to DB"
    );

    // 20. Non-empty custom list deletion (now personalListId is empty because task was moved)
    // First, let's create a task back in a second custom list to test 409
    const list2Res = await fetch(`${API_BASE}/lists`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({ name: "Protected List" }),
    });
    const list2Data = await list2Res.json();
    const list2Id = list2Data.data.id;

    await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({ title: "Task in protected list", listId: list2Id }),
    });

    const delNonEmptyListRes = await fetch(`${API_BASE}/lists/${list2Id}`, {
      method: "DELETE",
      headers: { Cookie: cookieA },
    });
    const delNonEmptyListData = await delNonEmptyListRes.json();
    assert(
      delNonEmptyListRes.status === 409 &&
        delNonEmptyListData.error.message.includes("contains tasks"),
      "20. Non-empty list deletion returns 409 Conflict"
    );

    // 21. Delete empty custom list
    const delEmptyListRes = await fetch(`${API_BASE}/lists/${personalListId}`, {
      method: "DELETE",
      headers: { Cookie: cookieA },
    });
    assert(delEmptyListRes.status === 200, "21. Empty custom list deletion succeeds");

    // 22. Reject deleting default list
    const delDefaultRes = await fetch(`${API_BASE}/lists/${defaultList.id}`, {
      method: "DELETE",
      headers: { Cookie: cookieA },
    });
    assert(delDefaultRes.status === 400, "22. Default list deletion rejected (400)");

    // 23. Cross-User Isolation (User B cannot see User A's tasks/lists)
    const userBListsRes = await fetch(`${API_BASE}/lists`, { headers: { Cookie: cookieB } });
    const userBListsData = await userBListsRes.json();
    assert(
      userBListsRes.status === 200 &&
        !userBListsData.data.some((l) => l.userId === meData.data.id || l.id === list2Id),
      "23. User B cannot see User A's lists"
    );

    const userBTaskRes = await fetch(`${API_BASE}/tasks/${myDayTaskId}`, { headers: { Cookie: cookieB } });
    assert(userBTaskRes.status === 404, "24. User B cannot access User A's task (404)");

    // 25. Delete task
    const delTaskRes = await fetch(`${API_BASE}/tasks/${myDayTaskId}`, {
      method: "DELETE",
      headers: { Cookie: cookieA },
    });
    assert(delTaskRes.status === 200, "25. Delete task persists to DB");

    console.log(`\n=== Phase 7B Verification Results: ${passed}/${total} Passed ===`);
    if (passed === total) {
      console.log("🎉 ALL 25 PHASE 7B TESTS PASSED!");
    } else {
      process.exit(1);
    }
  } finally {
    server.kill();
  }
};

runTests();
