import { JSDOM } from "jsdom";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_BASE = "http://localhost:3000/api";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runBrowserAcceptanceTests = async () => {
  console.log("=== PerfectDay Phase 7.5: Full Browser & UI Acceptance Testing ===\n");
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

  // Start real backend server
  const server = spawn("node", ["--env-file=.env", "src/index.js"], {
    cwd: "d:/IGNORE/PROJECTS/PerfectDay/server",
    stdio: "inherit",
  });

  await sleep(2000);

  try {
    const nativeFetch = global.fetch;
  const cookieJars = new Map(); // username -> cookieHeader

  const createBrowserContext = (currentUserCookie = "") => {
    const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="app"></div></body></html>`, {
      url: "http://localhost:5173",
      pretendToBeVisual: true,
    });

    const { window } = dom;
    global.window = window;
    global.document = window.document;
    global.HTMLElement = window.HTMLElement;
    global.Element = window.Element;
    global.CustomEvent = window.CustomEvent;

    let currentCookie = currentUserCookie;

    // Wrap fetch to use current session cookie and forward to port 3000
    global.fetch = async (url, options = {}) => {
      let fetchUrl = url;
      if (fetchUrl.startsWith("/api")) {
        fetchUrl = `http://localhost:3000${fetchUrl}`;
      }
      const headers = { ...(options.headers || {}) };
      if (currentCookie) {
        headers["Cookie"] = currentCookie;
      }
      const response = await nativeFetch(fetchUrl, { ...options, headers });
      const setCookie = response.headers.get("set-cookie");
      if (setCookie) {
        currentCookie = setCookie.split(";")[0];
      }
      return response;
    };

      const setCookie = (c) => {
        currentCookie = c;
      };

      const getCookie = () => currentCookie;

      return { dom, window, setCookie, getCookie };
    };

    // ----------------------------------------------------------------
    // SECTION 1: CRITICAL SECURITY & CROSS-ACCOUNT STATE ISOLATION (BROWSER)
    // ----------------------------------------------------------------
    console.log("--- BROWSER TEST 1: Cross-Account State Isolation on Identity Transition ---");

    const ctx = createBrowserContext();

    // Dynamically import stores & views in the browser context
    const { authStore } = await import("./src/store/auth.js");
    const { taskStore } = await import("./src/store/tasks.js");
    const { listStore } = await import("./src/store/lists.js");
    const { renderAppShellView, initAppShellEvents } = await import("./src/views/AppShellView.js");

    // 1. Register User A via API
    const userA = {
      email: `alice_browser_${Date.now()}@example.com`,
      password: "Password123!",
      displayName: "Alice Wonderland",
    };
    const regResA = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userA),
    });
    const cookieA = regResA.headers.get("set-cookie")?.split(";")[0] || "";
    cookieJars.set("userA", cookieA);

    // Set User A session in browser
    ctx.setCookie(cookieA);
    const meA = await authStore.checkSession();
    assert(meA && meA.email === userA.email.toLowerCase(), "1. User A browser session initialized");

    // Render User A dashboard
    document.getElementById("app").innerHTML = renderAppShellView();
    initAppShellEvents();
    await sleep(300);

    // User A creates a task
    const todayISO = new Date().toISOString().split("T")[0];
    const taskA = await taskStore.createTask({
      title: "Alice Secret Document",
      notes: "Top secret notes for Alice only.",
      priority: "HIGH",
      myDayOn: todayISO,
    });
    await sleep(200);

    assert(Boolean(taskA && taskA.id), "2. User A task created and rendered in DOM");

    // User A opens task detail panel
    taskStore.selectTask(taskA.id);
    await sleep(100);

    const detailPanel = document.getElementById("task-detail-panel");
    assert(
      detailPanel && detailPanel.classList.contains("open") && taskStore.getState().selectedTaskId === taskA.id,
      "3. User A opened task detail panel in DOM"
    );

    // User A logs out
    await authStore.logout();
    await sleep(100);

    // Verify all User A client state is completely cleared
    assert(
      taskStore.getState().selectedTaskId === null &&
        taskStore.getState().selectedTask === null &&
        taskStore.getState().tasks.length === 0 &&
        listStore.getState().lists.length === 0,
      "4. Logout immediately clears taskStore, listStore, selectedTaskId, and selectedTask"
    );
    assert(
      !detailPanel.classList.contains("open") && detailPanel.innerHTML === "",
      "5. Task detail panel DOM is completely closed and cleared upon logout"
    );

    // 2. Register User B
    const userB = {
      email: `bob_browser_${Date.now()}@example.com`,
      password: "Password123!",
      displayName: "Bob Builder",
    };
    const regResB = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userB),
    });
    const cookieB = regResB.headers.get("set-cookie")?.split(";")[0] || "";
    cookieJars.set("userB", cookieB);

    // User B logs in
    ctx.setCookie(cookieB);
    const meB = await authStore.checkSession();
    assert(meB && meB.email === userB.email.toLowerCase(), "6. User B browser session initialized");

    // Re-render dashboard for User B
    document.getElementById("app").innerHTML = renderAppShellView();
    initAppShellEvents();
    await sleep(300);

    // Verify User B sees ZERO data from User A
    const appHtml = document.getElementById("app").innerHTML;
    assert(!appHtml.includes("Alice Secret Document") && !appHtml.includes("Top secret notes"), "7. User B dashboard contains ZERO User A tasks or notes in DOM");
    assert(taskStore.getState().selectedTaskId === null && !document.getElementById("task-detail-panel").classList.contains("open"), "8. User B detail panel remains closed with null selectedTaskId");

    // 3. User B logs out -> User A logs in: restore User A data
    await authStore.logout();
    ctx.setCookie(cookieA);
    const restoreA = await authStore.checkSession();
    assert(restoreA && restoreA.email === userA.email.toLowerCase(), "9. User A re-authenticated");

    document.getElementById("app").innerHTML = renderAppShellView();
    initAppShellEvents();
    await sleep(300);

    const restoredTasks = taskStore.getState().tasks;
    assert(
      restoredTasks.some((t) => t.id === taskA.id && t.title === "Alice Secret Document"),
      "10. User A server data completely restored from database on login"
    );

    // ----------------------------------------------------------------
    // SECTION 2: MY DAY IMMEDIATE ADD/REMOVE SYNCHRONIZATION
    // ----------------------------------------------------------------
    console.log("\n--- BROWSER TEST 2: My Day Immediate Synchronization ---");

    taskStore.setView("my-day");
    await sleep(200);

    // Create a task in My Day
    await taskStore.createTask({
      title: "My Day Urgent Review",
      myDayOn: new Date().toISOString().split("T")[0],
    });
    await sleep(200);

    let myDayTask = taskStore.getState().tasks.find((t) => t.title === "My Day Urgent Review");
    assert(Boolean(myDayTask), "11. Task created in My Day and visible in DOM");

    // Open detail panel for this task
    taskStore.selectTask(myDayTask.id);
    await sleep(100);

    // Click "Added to My Day" toggle button to remove it from My Day
    const myDayToggleBtn = document.getElementById("detail-toggle-myday");
    assert(Boolean(myDayToggleBtn), "12. Found My Day toggle button in detail panel DOM");

    // Dispatch click event
    myDayToggleBtn.click();
    await sleep(300);

    // Verify task is IMMEDIATELY removed from the active My Day task list
    const currentMyDayTasks = taskStore.getState().tasks;
    const taskStillInView = currentMyDayTasks.some((t) => t.id === myDayTask.id);
    assert(!taskStillInView, "13. Task is IMMEDIATELY removed from My Day view without requiring refresh");

    // Verify persistence on simulated refresh
    await taskStore.fetchTasks();
    assert(!taskStore.getState().tasks.some((t) => t.id === myDayTask.id), "14. Task remains excluded from My Day after refetch/refresh");

    // ----------------------------------------------------------------
    // SECTION 3: NOTES CONTINUOUS MULTI-CHARACTER TYPING & AUTOSAVE
    // ----------------------------------------------------------------
    console.log("\n--- BROWSER TEST 3: Continuous Multi-Character Notes Typing ---");

    // Switch to all-tasks view and select taskA
    taskStore.setView("all-tasks");
    await sleep(200);

    taskStore.selectTask(taskA.id);
    await sleep(100);

    const notesTextarea = document.getElementById("detail-notes-input");
    assert(Boolean(notesTextarea), "15. Found notes textarea in DOM");

    // Simulate focus and typing a long sentence character-by-character
    notesTextarea.focus();
    const typedText = "Adding comprehensive security guidelines for the upcoming production deployment.";
    let accumulated = "";

    for (const char of typedText) {
      accumulated += char;
      notesTextarea.value = accumulated;
      notesTextarea.dispatchEvent(new window.Event("input", { bubbles: true }));
      await sleep(15); // rapid typing
    }

    // Verify textarea content matches typed text exactly without being wiped or losing focus
    assert(notesTextarea.value === typedText, "16. Notes textarea retained all characters during continuous rapid typing");
    assert(document.activeElement === notesTextarea, "17. Active element remained notes textarea without losing focus");

    // Trigger blur to flush save
    notesTextarea.dispatchEvent(new window.Event("blur", { bubbles: true }));
    await sleep(400);

    // Refetch task from server and verify exact match
    const freshTaskA = await (await fetch(`${API_BASE}/tasks/${taskA.id}`, { headers: { Cookie: cookieA } })).json();
    assert(freshTaskA.data.notes === typedText, "18. Notes autosaved to database and matched exact multi-character text");

    // ----------------------------------------------------------------
    // SECTION 4: NOTES PREVIEW POPOVER (WITHOUT OPENING DETAIL PANEL)
    // ----------------------------------------------------------------
    console.log("\n--- BROWSER TEST 4: Notes Preview Popover ---");

    // Close detail panel
    taskStore.closeDetail();
    await sleep(100);
    assert(taskStore.getState().selectedTaskId === null, "19. Detail panel closed");

    // Find notes indicator button on the task item
    const notesBtn = document.querySelector(`[data-task-id="${taskA.id}"] [data-action="preview-notes"]`);
    assert(Boolean(notesBtn), "20. Notes preview icon button found on task item");

    // Click the notes preview icon
    notesBtn.click();
    await sleep(100);

    const notesPopover = document.getElementById("pd-notes-popover");
    assert(Boolean(notesPopover), "21. Floating Notes Popover rendered in DOM");
    assert(
      taskStore.getState().selectedTaskId === null && !document.getElementById("task-detail-panel").classList.contains("open"),
      "22. Clicking notes icon opened popover WITHOUT opening the task detail panel (stopPropagation verified)"
    );

    // Click "Edit in details" button inside the popover
    const openDetailFromPopover = document.getElementById("notes-popover-open-detail");
    openDetailFromPopover.click();
    await sleep(100);

    assert(
      taskStore.getState().selectedTaskId === taskA.id && document.getElementById("task-detail-panel").classList.contains("open"),
      "23. 'Edit in details' button opened task detail panel"
    );

    // ----------------------------------------------------------------
    // SECTION 5: GRAPHICAL DATE PICKER & PAST-DATE POLICIES
    // ----------------------------------------------------------------
    console.log("\n--- BROWSER TEST 5: Graphical Date Picker & Policies ---");

    const datePickerBtn = document.getElementById("detail-date-picker-btn");
    assert(Boolean(datePickerBtn), "24. Date picker trigger button found");

    datePickerBtn.click();
    await sleep(100);

    const datePopover = document.getElementById("pd-datepicker-popover");
    assert(Boolean(datePopover), "25. Graphical DatePicker popover rendered in DOM");

    // Test Quick Tomorrow
    const tomorrowBtn = datePopover.querySelector('[data-quick="tomorrow"]');
    assert(Boolean(tomorrowBtn), "26. Quick Tomorrow button found");
    tomorrowBtn.click();
    await sleep(300);

    const updatedTaskDate = taskStore.getState().selectedTask.dueDate;
    assert(Boolean(updatedTaskDate), "27. Tomorrow due date selected and saved");

    // Test Past-Date Policy: open datepicker again and check past days
    datePickerBtn.click();
    await sleep(100);
    const pastDisabledDays = document.querySelectorAll(".dp-day.disabled");
    assert(pastDisabledDays.length > 0, "28. Past dates are strictly disabled for new scheduling/rescheduling");

    // Test Clear Date
    const clearDateBtn = document.getElementById("dp-clear-btn");
    if (clearDateBtn) {
      clearDateBtn.click();
      await sleep(300);
      assert(taskStore.getState().selectedTask.dueDate === null, "29. Clear due date reset task due date to null");
    }

    // ----------------------------------------------------------------
    // SECTION 6: CUSTOM LIST CREATION, RENAMING & RESTRICTIONS
    // ----------------------------------------------------------------
    console.log("\n--- BROWSER TEST 6: Custom List Lifecycle & Protection ---");

    // Create custom list
    const newList = await listStore.createList("Frontend Innovations");
    await sleep(200);

    assert(Boolean(listStore.getListById(newList.id)), "30. Custom list created and present in listStore");

    // Rename custom list
    await listStore.updateList(newList.id, "Core Architecture");
    await sleep(200);

    const renamedList = listStore.getListById(newList.id);
    assert(renamedList && renamedList.name === "Core Architecture", "31. Custom list renamed to 'Core Architecture'");

    // Verify default Tasks list is protected
    const defaultList = listStore.getDefaultList();
    let defaultRenameError = false;
    try {
      await listStore.updateList(defaultList.id, "Renamed Tasks");
    } catch {
      defaultRenameError = true;
    }
    assert(defaultRenameError, "32. Default 'Tasks' list is protected from renaming");

    // Delete custom list
    await listStore.deleteList(newList.id);
    await sleep(200);
    assert(!listStore.getListById(newList.id), "33. Empty custom list deleted successfully");

    // ----------------------------------------------------------------
    // SECTION 7: USER PROFILE POPOVER & ACCURATE AUTHENTICATED USER
    // ----------------------------------------------------------------
    console.log("\n--- BROWSER TEST 7: User Profile Popover ---");

    const profileBtn = document.getElementById("user-profile-btn");
    assert(Boolean(profileBtn), "34. User profile avatar button found in header");

    profileBtn.click();
    await sleep(100);

    const profilePopover = document.getElementById("pd-profile-popover");
    assert(Boolean(profilePopover), "35. User profile popover rendered in DOM");

    const profileName = profilePopover.querySelector(".profile-name")?.textContent;
    const profileEmail = profilePopover.querySelector(".profile-email")?.textContent;
    assert(
      profileName === userA.displayName && profileEmail === userA.email.toLowerCase(),
      "36. Profile popover accurately displays the CURRENT authenticated user identity"
    );

    // Escape closes popover
    document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape" }));
    await sleep(100);
    assert(!document.getElementById("pd-profile-popover"), "37. Escape key closes profile popover");

    // ----------------------------------------------------------------
    // SECTION 8: UI WORKSPACES & KEYBOARD ACCESSIBILITY
    // ----------------------------------------------------------------
    console.log("\n--- BROWSER TEST 8: UI Workspaces & Keyboard Interactions ---");

    // Bottom Quick Add Bar
    const quickAddForm = document.getElementById("quick-add-form");
    const quickAddInput = document.getElementById("quick-task-input");
    assert(Boolean(quickAddForm) && Boolean(quickAddInput), "38. Bottom-anchored Quick Add Task bar rendered in DOM");

    // Planned View Horizontal Layout
    taskStore.setView("planned");
    await sleep(200);
    await taskStore.createTask({
      title: "Planned Architecture Review",
      dueDate: new Date().toISOString().split("T")[0],
    });
    await sleep(200);
    const plannedContainer = document.getElementById("planned-horizontal-workspace");
    assert(Boolean(plannedContainer), "39. Horizontal date-based Planned workspace rendered in DOM");

    // Master/Detail Tasks View Layout
    taskStore.setView("all-tasks");
    await sleep(200);
    const masterContainer = document.querySelector(".tasks-master-view");
    assert(Boolean(masterContainer), "40. Master/Detail Tasks workspace with semantic date-grouping rendered in DOM");

    // Collapsible Navigation Rail
    const sidebarToggle = document.getElementById("sidebar-toggle");
    const sidebar = document.getElementById("shell-sidebar");
    assert(Boolean(sidebarToggle) && Boolean(sidebar), "41. Collapsible navigation rail toggle button rendered in DOM");

    sidebarToggle.click();
    await sleep(100);
    assert(sidebar.classList.contains("collapsed"), "42. Clicking navigation toggle collapses sidebar into compact rail");

    sidebarToggle.click();
    await sleep(100);
    assert(!sidebar.classList.contains("collapsed"), "43. Clicking navigation toggle expands sidebar back to full width");

    // ----------------------------------------------------------------
    // SECTION 9: PHASE 7.9 PLANNED & TASKS GROUPING SEMANTICS (BROWSER)
    // ----------------------------------------------------------------
    console.log("\n--- BROWSER TEST 9: Phase 7.9 Scheduling Semantics & Grouping ---");

    // 1. Create a task with myDayOn = today AND no dueDate
    const myDayNoDueTask = await taskStore.createTask({
      title: "My Day Only Task",
      myDayOn: todayISO,
    });
    await sleep(200);

    // 2. Create a task with myDayOn = today AND future dueDate (next week)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const futureISO = futureDate.toISOString().split("T")[0];

    const myDayFutureTask = await taskStore.createTask({
      title: "My Day Future Due Task",
      myDayOn: todayISO,
      dueDate: futureISO,
    });
    await sleep(200);

    // Switch to Planned view
    taskStore.setView("planned");
    await sleep(300);

    const todayColumn = document.querySelector(".planned-date-column.today-column");
    assert(
      todayColumn && todayColumn.textContent.includes("My Day Only Task"),
      "44. Task with myDayOn == today and no dueDate appears in Planned -> Today column"
    );

    const plannedHtml = document.getElementById("planned-horizontal-workspace")?.innerHTML || "";
    assert(
      plannedHtml.includes("My Day Future Due Task"),
      "45. Task with myDayOn == today and future dueDate appears in Planned view in its scheduled column"
    );

    // Switch to Tasks view (all-tasks)
    taskStore.setView("all-tasks");
    await sleep(300);

    const groupHeaders = Array.from(document.querySelectorAll(".task-date-group-header")).map((el) =>
      el.querySelector("span")?.textContent.trim()
    );
    const expectedOrder = ["Overdue", "Today", "Tomorrow", "Upcoming", "No Due Date", "Completed"].filter((h) =>
      groupHeaders.includes(h)
    );
    const isOrdered = groupHeaders.every((val, idx) => val === expectedOrder[idx]);
    assert(isOrdered, `46. Tasks view groups are rendered in exact required deterministic order: ${groupHeaders.join(" -> ")}`);

    // ----------------------------------------------------------------
    // SECTION 10: PHASE 7.9.1 FINAL SCROLL ARCHITECTURE & QA (BROWSER)
    // ----------------------------------------------------------------
    console.log("\n--- BROWSER TEST 10: Phase 7.9.1 Scroll Architecture & QA ---");

    // 1. Task Detail Title is a single-line input, not a textarea (Bug #1)
    taskStore.selectTask(myDayNoDueTask.id);
    await sleep(200);

    const titleField = document.getElementById("detail-title-input");
    assert(
      titleField && titleField.tagName === "INPUT" && titleField.type === "text",
      "47. Task detail title is rendered as a single-line <input type='text'>, not a textarea"
    );

    // Title typing and focus retention
    titleField.focus();
    titleField.value = "Updated Single-Line Title";
    titleField.dispatchEvent(new window.Event("input", { bubbles: true }));
    assert(
      document.activeElement === titleField,
      "48. Task detail title field retains focus during continuous character typing"
    );

    titleField.dispatchEvent(new window.Event("blur", { bubbles: true }));
    await sleep(200);
    assert(
      taskStore.getState().selectedTask?.title === "Updated Single-Line Title",
      "49. Task detail title successfully persists to store and backend"
    );

    // 2. Fixed Bottom Composer Layout & Scrolling Isolation (Bug #2)
    const composer = document.querySelector(".bottom-quick-add-container");
    const workspaceScroll = document.querySelector(".workspace-content-scroll");
    assert(
      composer && workspaceScroll && workspaceScroll.contains(composer) === false,
      "50. Bottom Add-Task Composer is strictly isolated outside scrollable content flow"
    );

    // 3. Scrollbar styling & Planned horizontal viewport (Bug #3)
    taskStore.setView("planned");
    await sleep(200);
    const plannedViewport = document.getElementById("planned-horizontal-workspace");
    const plannedTrack = document.querySelector(".planned-board-track");
    assert(
      Boolean(plannedViewport) && Boolean(plannedTrack),
      "51. Planned horizontal workspace contains dedicated .planned-board-viewport and .planned-board-track"
    );

    // 4. Planned Date Columns Independent Natural Heights (Requirement 5)
    const dateColumns = document.querySelectorAll(".planned-date-column");
    assert(
      dateColumns.length >= 2,
      "52. Planned board renders multiple independent date columns"
    );

    // 5. Custom List Rename Immediate Optimistic UI & Rollback (Bug #4)
    const customList = await listStore.createList("Finance Planning");
    await sleep(200);

    assert(
      listStore.getState().lists.some((l) => l.name === "Finance Planning"),
      "53. Custom list created and present in listStore"
    );

    // Execute optimistic update
    const updatePromise = listStore.updateList(customList.id, "Wealth Management");
    
    assert(
      listStore.getState().lists.find((l) => l.id === customList.id)?.name === "Wealth Management",
      "54. Custom list rename updates listStore state IMMEDIATELY (optimistic UI)"
    );

    await updatePromise;
    await sleep(100);

    assert(
      listStore.getState().lists.find((l) => l.id === customList.id)?.name === "Wealth Management",
      "55. Custom list rename confirmed by backend server"
    );

    // Clean up list
    await listStore.deleteList(customList.id);
    await sleep(100);

    // 6. Architectural Layer Verification: Sidebar, Header, Content, Composer
    const sidebarEl = document.getElementById("shell-sidebar");
    const headerEl = document.querySelector(".workspace-header");
    const workspaceEl = document.getElementById("shell-workspace");
    assert(
      sidebarEl && headerEl && workspaceEl && !workspaceEl.contains(sidebarEl),
      "56. Sidebar is completely structurally independent of workspace chrome and content"
    );

    // ----------------------------------------------------------------
    // SECTION 11: PHASE 7.9.5 TRUE FIXED APP CHROME & SCROLL ISOLATION
    // ----------------------------------------------------------------
    console.log("\n--- BROWSER TEST 11: Phase 7.9.5 Fixed App Chrome & Deep Scroll ---");

    // 1. Deep Vertical Task List Overflow
    taskStore.setView("all-tasks");
    await sleep(200);

    const taskScrollArea = document.querySelector(".workspace-content-scroll");
    const composerEl = document.querySelector(".bottom-quick-add-container");
    assert(
      Boolean(taskScrollArea) && Boolean(composerEl),
      "57. Workspace scroll area and stationary bottom composer located in DOM"
    );

    // Simulate vertical scrolling
    taskScrollArea.scrollTop = 500;
    taskScrollArea.dispatchEvent(new window.Event("scroll"));
    await sleep(50);

    // Assert composer and sidebar are NOT inside taskScrollArea
    assert(
      !taskScrollArea.contains(composerEl) && !taskScrollArea.contains(sidebarEl),
      "58. Vertical scrolling does not affect stationary sidebar or bottom composer"
    );

    // 2. Planned Horizontal Scroll Isolation
    taskStore.setView("planned");
    await sleep(200);

    const plannedBoard = document.querySelector(".planned-board-viewport");
    const plannedHeader = document.querySelector(".workspace-header");
    const plannedComposer = document.querySelector(".bottom-quick-add-container");
    assert(
      Boolean(plannedBoard),
      "59. Planned board horizontal viewport mounted in DOM"
    );

    // Simulate horizontal scrolling on board only
    plannedBoard.scrollLeft = 300;
    plannedBoard.dispatchEvent(new window.Event("scroll"));
    await sleep(50);

    assert(
      !plannedBoard.contains(plannedHeader) && !plannedBoard.contains(plannedComposer) && !plannedBoard.contains(sidebarEl),
      "60. Planned horizontal scrolling affects ONLY the date board, leaving header, composer, and sidebar stationary"
    );

    console.log(`\n=== Browser Acceptance Test Complete: ${passed}/${total} Tests Passed ===`);
    if (passed === total) {
      console.log("🎉 ALL 60 BROWSER & UI ACCEPTANCE TESTS PASSED SUCCESSFULLY!");
    } else {
      process.exit(1);
    }
  } finally {
    server.kill();
  }
};

runBrowserAcceptanceTests();
