import { spawn } from "child_process";

const API_BASE = "http://localhost:3000/api";

const runTests = async () => {
  console.log("=== PerfectDay Phase 7C: Task Interaction & Productivity UX Verification ===\n");
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

    // 2. Register user
    const user = {
      email: `user_p7c_${Date.now()}@example.com`,
      password: "Password123!",
      displayName: "Clara UX",
    };

    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    const cookie = regRes.headers.get("set-cookie")?.split(";")[0] || "";
    assert(regRes.status === 201 && cookie.includes("pd_auth="), "2. User registered with HTTP-only cookie");

    // 3. Get initial lists
    const listsRes = await fetch(`${API_BASE}/lists`, { headers: { Cookie: cookie } });
    const listsData = await listsRes.json();
    const defaultList = listsData.data.find((l) => l.isDefault === true);
    assert(listsRes.status === 200 && defaultList, "3. Default list loaded");

    // Create custom list
    const createListRes = await fetch(`${API_BASE}/lists`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ name: "Design System" }),
    });
    const createListData = await createListRes.json();
    const customListId = createListData.data.id;
    assert(createListRes.status === 201 && customListId, "4. Custom list created");

    // 4. Create Task with Rich Metadata
    const todayStr = new Date().toISOString().split("T")[0];
    const targetDueDate = "2026-09-15";
    const richTaskRes = await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        title: "Refactor Color Tokens & Shadows",
        notes: "Align with WCAG AAA accessibility guidelines.\nReference: Figma token specs.",
        listId: customListId,
        priority: "HIGH",
        dueDate: targetDueDate,
        myDayOn: todayStr,
      }),
    });
    const richTaskData = await richTaskRes.json();
    const taskId = richTaskData.data.id;
    assert(
      richTaskRes.status === 201 &&
        richTaskData.data.title === "Refactor Color Tokens & Shadows" &&
        richTaskData.data.priority === "HIGH" &&
        richTaskData.data.notes.includes("Figma token specs") &&
        richTaskData.data.myDayOn !== null &&
        richTaskData.data.dueDate !== null,
      "5. Task created with full rich metadata (title, notes, dates, priority, list)"
    );

    // 5. Retrieve single task by ID (for detail panel)
    const getTaskRes = await fetch(`${API_BASE}/tasks/${taskId}`, { headers: { Cookie: cookie } });
    const getTaskData = await getTaskRes.json();
    assert(
      getTaskRes.status === 200 &&
        getTaskData.data.id === taskId &&
        getTaskData.data.list.name === "Design System",
      "6. GET /api/tasks/:id retrieves detailed task with list info"
    );

    // 6. Edit Title
    const updateTitleRes = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ title: "Refactor Color Tokens, Shadows & Radii" }),
    });
    const updateTitleData = await updateTitleRes.json();
    assert(
      updateTitleRes.status === 200 &&
        updateTitleData.data.title === "Refactor Color Tokens, Shadows & Radii",
      "7. Title autosave / update persists to DB"
    );

    // 7. Edit Notes
    const updateNotesRes = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ notes: "Updated: Completed audit of contrast ratios." }),
    });
    const updateNotesData = await updateNotesRes.json();
    assert(
      updateNotesRes.status === 200 &&
        updateNotesData.data.notes === "Updated: Completed audit of contrast ratios.",
      "8. Notes autosave / update persists to DB"
    );

    // 8. Update Due Date
    const updateDueDateRes = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ dueDate: "2026-10-01" }),
    });
    const updateDueDateData = await updateDueDateRes.json();
    assert(
      updateDueDateRes.status === 200 && updateDueDateData.data.dueDate !== null,
      "9. Due date update persists to DB"
    );

    // 9. Clear Due Date
    const clearDueDateRes = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ dueDate: null }),
    });
    const clearDueDateData = await clearDueDateRes.json();
    assert(
      clearDueDateRes.status === 200 && clearDueDateData.data.dueDate === null,
      "10. Clearing due date (null) persists to DB"
    );

    // 10. Change Priority: HIGH -> MEDIUM -> LOW -> NONE
    const priorityMedRes = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ priority: "MEDIUM" }),
    });
    const priorityMedData = await priorityMedRes.json();
    assert(priorityMedRes.status === 200 && priorityMedData.data.priority === "MEDIUM", "11. Priority update (MEDIUM) persists to DB");

    const priorityLowRes = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ priority: "LOW" }),
    });
    const priorityLowData = await priorityLowRes.json();
    assert(priorityLowRes.status === 200 && priorityLowData.data.priority === "LOW", "12. Priority update (LOW) persists to DB");

    // 11. Remove from My Day
    const removeMyDayRes = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ myDayOn: null }),
    });
    const removeMyDayData = await removeMyDayRes.json();
    assert(removeMyDayRes.status === 200 && removeMyDayData.data.myDayOn === null, "13. Remove from My Day persists to DB");

    // 12. Add back to My Day
    const addMyDayRes = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ myDayOn: todayStr }),
    });
    const addMyDayData = await addMyDayRes.json();
    assert(addMyDayRes.status === 200 && addMyDayData.data.myDayOn !== null, "14. Add back to My Day persists to DB");

    // 13. Reassign / Move to Default List
    const moveListRes = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ listId: defaultList.id }),
    });
    const moveListData = await moveListRes.json();
    assert(moveListRes.status === 200 && moveListData.data.listId === defaultList.id, "15. Move task to another list persists to DB");

    // 14. Complete task
    const completeRes = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ isCompleted: true }),
    });
    const completeData = await completeRes.json();
    assert(
      completeRes.status === 200 &&
        completeData.data.isCompleted === true &&
        completeData.data.completedAt !== null,
      "16. Task completion records completedAt timestamp in DB"
    );

    // 15. Uncomplete task
    const uncompleteRes = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ isCompleted: false }),
    });
    const uncompleteData = await uncompleteRes.json();
    assert(
      uncompleteRes.status === 200 &&
        uncompleteData.data.isCompleted === false &&
        uncompleteData.data.completedAt === null,
      "17. Task uncompletion clears completedAt in DB"
    );

    // 16. Delete task
    const deleteRes = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: "DELETE",
      headers: { Cookie: cookie },
    });
    assert(deleteRes.status === 200, "18. Delete task removes record from DB");

    // 17. Verify task no longer exists
    const verifyGetRes = await fetch(`${API_BASE}/tasks/${taskId}`, { headers: { Cookie: cookie } });
    assert(verifyGetRes.status === 404, "19. Verification: Deleted task returns 404");

    console.log(`\n=== Phase 7C Verification Results: ${passed}/${total} Passed ===`);
    if (passed === total) {
      console.log("🎉 ALL 19 PHASE 7C TESTS PASSED!");
    } else {
      process.exit(1);
    }
  } finally {
    server.kill();
  }
};

runTests();
