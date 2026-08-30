import { spawn } from "child_process";

const API_BASE = "http://localhost:3000/api";

const runTests = async () => {
  console.log("=== PerfectDay Phase 7.5: Stabilization, Security Isolation & Regression Suite ===\n");
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
    // ----------------------------------------------------
    // TEST SECTION 1: Cross-Account State Isolation & Security
    // ----------------------------------------------------
    console.log("\n--- SECTION 1: Auth & Cross-Account Data Isolation ---");

    // 1. Health check
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.success, "1. Backend /api/health online");

    // 2. Register User A
    const userA = {
      email: `user_a_${Date.now()}@example.com`,
      password: "Password123!",
      displayName: "Alice Security",
    };
    const regResA = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userA),
    });
    const cookieA = regResA.headers.get("set-cookie")?.split(";")[0] || "";
    const dataA = await regResA.json();
    assert(regResA.status === 201 && dataA.data?.email === userA.email.toLowerCase(), "2. User A registered successfully");

    // 3. User A creates a task and a custom list
    const createListResA = await fetch(`${API_BASE}/lists`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({ name: "Secret Alice Projects" }),
    });
    const listDataA = await createListResA.json();
    const listIdA = listDataA.data.id;
    assert(createListResA.status === 201 && listIdA, "3. User A created custom list");

    const createTaskResA = await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({
        title: "Alice Confidential Strategy",
        notes: "Classified notes belonging only to Alice.",
        listId: listIdA,
        priority: "HIGH",
        myDayOn: new Date().toISOString().split("T")[0],
      }),
    });
    const taskDataA = await createTaskResA.json();
    const taskIdA = taskDataA.data.id;
    assert(createTaskResA.status === 201 && taskIdA, "4. User A created task with sensitive notes");

    // 4. Register User B
    const userB = {
      email: `user_b_${Date.now()}@example.com`,
      password: "Password123!",
      displayName: "Bob Isolated",
    };
    const regResB = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userB),
    });
    const cookieB = regResB.headers.get("set-cookie")?.split(";")[0] || "";
    assert(regResB.status === 201 && cookieB.includes("pd_auth="), "5. User B registered with separate session");

    // 5. User B fetches tasks - MUST NOT see User A's tasks
    const tasksResB = await fetch(`${API_BASE}/tasks`, { headers: { Cookie: cookieB } });
    const tasksDataB = await tasksResB.json();
    const leakedTask = tasksDataB.data.find((t) => t.id === taskIdA || t.title.includes("Alice"));
    assert(tasksResB.status === 200 && !leakedTask, "6. User B task collection contains ZERO User A tasks");

    // 6. User B fetches lists - MUST NOT see User A's lists
    const listsResB = await fetch(`${API_BASE}/lists`, { headers: { Cookie: cookieB } });
    const listsDataB = await listsResB.json();
    const leakedList = listsDataB.data.find((l) => l.id === listIdA || l.name.includes("Alice"));
    assert(listsResB.status === 200 && !leakedList, "7. User B list collection contains ZERO User A lists");

    // 7. Security Authorization: User B directly attempts to GET User A's task by ID
    const directGetResB = await fetch(`${API_BASE}/tasks/${taskIdA}`, { headers: { Cookie: cookieB } });
    assert(directGetResB.status === 404 || directGetResB.status === 403, "8. Direct API access: User B cannot GET User A task (404/403)");

    // 8. Security Authorization: User B directly attempts to PATCH User A's task by ID
    const directPatchResB = await fetch(`${API_BASE}/tasks/${taskIdA}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookieB },
      body: JSON.stringify({ title: "Hacked by Bob" }),
    });
    assert(directPatchResB.status === 404 || directPatchResB.status === 403, "9. Direct API access: User B cannot PATCH User A task (404/403)");

    // 9. Security Authorization: User B directly attempts to DELETE User A's task by ID
    const directDeleteResB = await fetch(`${API_BASE}/tasks/${taskIdA}`, {
      method: "DELETE",
      headers: { Cookie: cookieB },
    });
    assert(directDeleteResB.status === 404 || directDeleteResB.status === 403, "10. Direct API access: User B cannot DELETE User A task (404/403)");

    // 10. User A logs in again: User A data is fully restored
    const loginResA = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userA.email, password: userA.password }),
    });
    const reCookieA = loginResA.headers.get("set-cookie")?.split(";")[0] || "";
    const restoredTasksResA = await fetch(`${API_BASE}/tasks`, { headers: { Cookie: reCookieA } });
    const restoredTasksDataA = await restoredTasksResA.json();
    const originalTaskA = restoredTasksDataA.data.find((t) => t.id === taskIdA);
    assert(
      loginResA.status === 200 &&
        originalTaskA &&
        originalTaskA.title === "Alice Confidential Strategy" &&
        originalTaskA.notes.includes("Classified notes"),
      "11. User A re-login: User A server data is completely intact and restored"
    );

    // ----------------------------------------------------
    // TEST SECTION 2: My Day Add/Remove Synchronization
    // ----------------------------------------------------
    console.log("\n--- SECTION 2: My Day Add/Remove Synchronization ---");

    const todayStr = new Date().toISOString().split("T")[0];

    // Create a task not in My Day
    const taskNotInMyDayRes = await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: reCookieA },
      body: JSON.stringify({ title: "Draft Quarterly Goals" }),
    });
    const taskNotInMyDay = (await taskNotInMyDayRes.json()).data;
    assert(taskNotInMyDay.myDayOn === null, "12. Task initialized without My Day");

    // Add to My Day
    const addToMyDayRes = await fetch(`${API_BASE}/tasks/${taskNotInMyDay.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: reCookieA },
      body: JSON.stringify({ myDayOn: todayStr }),
    });
    const addedTask = (await addToMyDayRes.json()).data;
    assert(addToMyDayRes.status === 200 && addedTask.myDayOn !== null, "13. Task added to My Day persists in backend");

    // Verify task appears in My Day query
    const myDayQueryRes1 = await fetch(`${API_BASE}/tasks?myDay=true`, { headers: { Cookie: reCookieA } });
    const myDayTasks1 = (await myDayQueryRes1.json()).data;
    assert(myDayTasks1.some((t) => t.id === taskNotInMyDay.id), "14. My Day query returns newly added task");

    // Remove from My Day (Undo "Add to My Day")
    const removeFromMyDayRes = await fetch(`${API_BASE}/tasks/${taskNotInMyDay.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: reCookieA },
      body: JSON.stringify({ myDayOn: null }),
    });
    const removedTask = (await removeFromMyDayRes.json()).data;
    assert(removeFromMyDayRes.status === 200 && removedTask.myDayOn === null, "15. Task removed from My Day (myDayOn: null) in backend");

    // Verify task is removed from My Day query
    const myDayQueryRes2 = await fetch(`${API_BASE}/tasks?myDay=true`, { headers: { Cookie: reCookieA } });
    const myDayTasks2 = (await myDayQueryRes2.json()).data;
    assert(!myDayTasks2.some((t) => t.id === taskNotInMyDay.id), "16. My Day query confirms task is immediately removed from My Day");

    // ----------------------------------------------------
    // TEST SECTION 3: Multi-Character Continuous Notes & Autosave
    // ----------------------------------------------------
    console.log("\n--- SECTION 3: Continuous Multi-Character Notes & Autosave ---");

    const longNoteText = "Complete the database normalization assignment and revise the ER diagram.";
    const updateNotesRes = await fetch(`${API_BASE}/tasks/${taskNotInMyDay.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: reCookieA },
      body: JSON.stringify({ notes: longNoteText }),
    });
    const updatedNotesData = await updateNotesRes.json();
    assert(
      updateNotesRes.status === 200 && updatedNotesData.data.notes === longNoteText,
      "17. Long continuous note saved and matches exact text"
    );

    // Rapid edits simulation
    const rapidNote1 = "Draft note revision 1";
    const rapidNote2 = "Draft note revision 2 with extra lines\n- Item A\n- Item B";
    await fetch(`${API_BASE}/tasks/${taskNotInMyDay.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: reCookieA },
      body: JSON.stringify({ notes: rapidNote1 }),
    });
    const finalRapidRes = await fetch(`${API_BASE}/tasks/${taskNotInMyDay.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: reCookieA },
      body: JSON.stringify({ notes: rapidNote2 }),
    });
    const finalRapidData = await finalRapidRes.json();
    assert(
      finalRapidRes.status === 200 && finalRapidData.data.notes === rapidNote2,
      "18. Rapid multi-line note updates persist without corruption"
    );

    // ----------------------------------------------------
    // TEST SECTION 4: List Renaming & Protection
    // ----------------------------------------------------
    console.log("\n--- SECTION 4: List Renaming & Protection ---");

    // Get default list and custom list
    const listsRes = await fetch(`${API_BASE}/lists`, { headers: { Cookie: reCookieA } });
    const allLists = (await listsRes.json()).data;
    const defaultList = allLists.find((l) => l.isDefault === true);
    const customList = allLists.find((l) => l.id === listIdA);

    // Rename custom list
    const renameRes = await fetch(`${API_BASE}/lists/${customList.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: reCookieA },
      body: JSON.stringify({ name: "Renamed Innovation Projects" }),
    });
    const renamedData = await renameRes.json();
    assert(
      renameRes.status === 200 && renamedData.data.name === "Renamed Innovation Projects",
      "19. Custom list renamed successfully via PATCH /api/lists/:id"
    );

    // Attempt to rename default list (Should be protected or rejected)
    const renameDefaultRes = await fetch(`${API_BASE}/lists/${defaultList.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: reCookieA },
      body: JSON.stringify({ name: "Custom Tasks Rename" }),
    });
    assert(
      renameDefaultRes.status === 400 || renameDefaultRes.status === 403,
      "20. Default Tasks list is protected from renaming (400/403)"
    );

    // ----------------------------------------------------
    // TEST SECTION 5: Due Date Policy & Overdue Task Validity
    // ----------------------------------------------------
    console.log("\n--- SECTION 5: Due Date Policy & Overdue Semantics ---");

    // Create a task with upcoming due date
    const upcomingDate = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    const upcomingTaskRes = await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: reCookieA },
      body: JSON.stringify({
        title: "Sprint Review Presentation",
        dueDate: upcomingDate,
      }),
    });
    const upcomingTask = (await upcomingTaskRes.json()).data;
    assert(upcomingTaskRes.status === 201 && upcomingTask.dueDate !== null, "21. Task created with upcoming due date");

    // Clear due date
    const clearDueRes = await fetch(`${API_BASE}/tasks/${upcomingTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: reCookieA },
      body: JSON.stringify({ dueDate: null }),
    });
    const clearedDueData = await clearDueRes.json();
    assert(clearDueRes.status === 200 && clearedDueData.data.dueDate === null, "22. Due date cleared (null) successfully");

    // Existing overdue task creation (simulation of preexisting task in DB)
    const pastDate = "2026-08-01";
    const pastTaskRes = await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: reCookieA },
      body: JSON.stringify({
        title: "Legacy Overdue Task",
        dueDate: pastDate,
        isCompleted: false,
      }),
    });
    const pastTask = (await pastTaskRes.json()).data;
    assert(pastTaskRes.status === 201 && pastTask.dueDate !== null, "23. Existing overdue task remains valid and stored");

    // Planned query includes upcoming due dates
    const plannedRes = await fetch(`${API_BASE}/tasks?due=upcoming`, { headers: { Cookie: reCookieA } });
    const plannedData = await plannedRes.json();
    assert(plannedRes.status === 200 && Array.isArray(plannedData.data), "24. Planned query GET /api/tasks?due=upcoming succeeds");

    // ----------------------------------------------------
    // TEST SECTION 6: Priority & Completion
    // ----------------------------------------------------
    console.log("\n--- SECTION 6: Priority & Completion Lifecycle ---");

    // Priority transitions: HIGH -> MEDIUM -> LOW -> NONE
    const prioMedRes = await fetch(`${API_BASE}/tasks/${upcomingTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: reCookieA },
      body: JSON.stringify({ priority: "MEDIUM" }),
    });
    assert(prioMedRes.status === 200 && (await prioMedRes.json()).data.priority === "MEDIUM", "25. Priority set to MEDIUM");

    const prioLowRes = await fetch(`${API_BASE}/tasks/${upcomingTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: reCookieA },
      body: JSON.stringify({ priority: "LOW" }),
    });
    assert(prioLowRes.status === 200 && (await prioLowRes.json()).data.priority === "LOW", "26. Priority set to LOW");

    // Completion toggle
    const compRes = await fetch(`${API_BASE}/tasks/${upcomingTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: reCookieA },
      body: JSON.stringify({ isCompleted: true }),
    });
    const compData = await compRes.json();
    assert(compRes.status === 200 && compData.data.isCompleted === true && compData.data.completedAt !== null, "27. Task completed with backend timestamp");

    // Task deletion
    const delRes = await fetch(`${API_BASE}/tasks/${upcomingTask.id}`, {
      method: "DELETE",
      headers: { Cookie: reCookieA },
    });
    assert(delRes.status === 200, "28. Task deleted successfully");

    console.log(`\n=== Phase 7.5 Suite Complete: ${passed}/${total} Tests Passed ===`);
    if (passed === total) {
      console.log("🎉 ALL 28 PHASE 7.5 TESTS PASSED SUCCESSFULLY!");
    } else {
      process.exit(1);
    }
  } finally {
    server.kill();
  }
};

runTests();
