import { initIcons } from "../utils/icons.js";
import { parseLocalDate, formatDateISO, getTodayLocal } from "../utils/date.js";

export const showDatePicker = ({
  anchorEl,
  currentDate = null,
  onSelect = () => {},
  onClear = () => {},
}) => {
  // Remove any existing datepicker popovers
  closeDatePicker();

  // Normalize today at midnight
  const today = getTodayLocal();

  // Selected date object
  let selectedDateObj = parseLocalDate(currentDate);

  // Initial viewing month/year
  let viewDate = selectedDateObj || getTodayLocal();
  let currentMonth = viewDate.getMonth();
  let currentYear = viewDate.getFullYear();

  const popover = document.createElement("div");
  popover.id = "pd-datepicker-popover";
  popover.className = "datepicker-popover";
  popover.setAttribute("role", "dialog");
  popover.setAttribute("aria-label", "Choose date");

  const renderCalendar = () => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Check if task is overdue
    let isOverdue = false;
    if (selectedDateObj) {
      if (selectedDateObj.getTime() < today.getTime()) {
        isOverdue = true;
      }
    }

    let daysHTML = "";
    // Empty padding days
    for (let i = 0; i < firstDayIndex; i++) {
      daysHTML += `<div class="dp-day empty"></div>`;
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const thisDate = new Date(currentYear, currentMonth, day, 0, 0, 0, 0);

      const isPast = thisDate.getTime() < today.getTime();
      const isToday = thisDate.getTime() === today.getTime();
      const isSelected = selectedDateObj &&
        selectedDateObj.getFullYear() === currentYear &&
        selectedDateObj.getMonth() === currentMonth &&
        selectedDateObj.getDate() === day;

      const dateISO = formatDateISO(thisDate);

      // Past dates are disabled for normal scheduling unless it is the existing selected overdue date
      const isDisabled = isPast && !isSelected;

      daysHTML += `
        <button 
          type="button" 
          class="dp-day ${isToday ? "today" : ""} ${isSelected ? "selected" : ""} ${isSelected && isOverdue ? "overdue" : ""} ${isDisabled ? "disabled" : ""}" 
          data-date="${dateISO}"
          ${isDisabled ? "disabled" : ""}
          aria-label="${monthNames[currentMonth]} ${day}, ${currentYear}"
        >
          ${day}
        </button>
      `;
    }

    popover.innerHTML = `
      <div class="dp-header">
        <div class="dp-title">${monthNames[currentMonth]} ${currentYear}</div>
        <div class="dp-nav-btns">
          <button type="button" class="dp-nav-btn" id="dp-prev-month" aria-label="Previous month">
            <i data-lucide="chevron-left" style="width: 16px; height: 16px;"></i>
          </button>
          <button type="button" class="dp-nav-btn" id="dp-next-month" aria-label="Next month">
            <i data-lucide="chevron-right" style="width: 16px; height: 16px;"></i>
          </button>
        </div>
      </div>

      <div class="dp-quick-row">
        <button type="button" class="dp-quick-btn" data-quick="today">Today</button>
        <button type="button" class="dp-quick-btn" data-quick="tomorrow">Tomorrow</button>
        <button type="button" class="dp-quick-btn" data-quick="next-week">Next Week</button>
      </div>

      <div class="dp-weekdays">
        <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
      </div>

      <div class="dp-grid">
        ${daysHTML}
      </div>

      <div class="dp-footer">
        ${selectedDateObj ? `<button type="button" class="dp-clear-btn" id="dp-clear-btn">Clear Date</button>` : ""}
        <button type="button" class="dp-close-btn" id="dp-close-btn">Done</button>
      </div>
    `;

    initIcons();

    // Month Navigation
    popover.querySelector("#dp-prev-month")?.addEventListener("click", (e) => {
      e.stopPropagation();
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar();
    });

    popover.querySelector("#dp-next-month")?.addEventListener("click", (e) => {
      e.stopPropagation();
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      renderCalendar();
    });

    // Quick Select Buttons
    popover.querySelectorAll("[data-quick]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = btn.dataset.quick;
        let d = getTodayLocal();
        if (action === "today") {
          // today
        } else if (action === "tomorrow") {
          d.setDate(d.getDate() + 1);
        } else if (action === "next-week") {
          d.setDate(d.getDate() + 7);
        }
        const iso = formatDateISO(d);
        onSelect(iso);
        closeDatePicker();
      });
    });

    // Day Selection
    popover.querySelectorAll(".dp-day:not(.disabled):not(.empty)").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const iso = btn.dataset.date;
        if (iso) {
          onSelect(iso);
          closeDatePicker();
        }
      });
    });

    // Clear Date
    popover.querySelector("#dp-clear-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      onClear();
      closeDatePicker();
    });

    // Done / Close
    popover.querySelector("#dp-close-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      closeDatePicker();
    });
  };

  renderCalendar();
  document.body.appendChild(popover);

  // Position popover relative to anchorEl (or centered on mobile screens)
  if (window.innerWidth <= 640) {
    popover.style.position = "fixed";
    popover.style.top = "50%";
    popover.style.left = "50%";
    popover.style.transform = "translate(-50%, -50%)";
    popover.style.zIndex = "2500";
    popover.style.maxWidth = "calc(100vw - 32px)";
  } else if (anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    const popoverHeight = 320;
    const popoverWidth = 280;

    let top = rect.bottom + 6;
    let left = rect.left;

    // Check bottom boundary
    if (top + popoverHeight > window.innerHeight) {
      top = Math.max(10, rect.top - popoverHeight - 6);
    }
    // Check right boundary
    if (left + popoverWidth > window.innerWidth) {
      left = Math.max(10, window.innerWidth - popoverWidth - 16);
    }

    popover.style.position = "fixed";
    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
    popover.style.zIndex = "2500";
  }

  // Dismiss on click outside or Escape
  const onOutsideClick = (e) => {
    if (!popover.contains(e.target) && (!anchorEl || !anchorEl.contains(e.target))) {
      closeDatePicker();
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      closeDatePicker();
    }
  };

  setTimeout(() => {
    document.addEventListener("click", onOutsideClick);
    document.addEventListener("keydown", onKeyDown);
  }, 10);

  popover._cleanup = () => {
    document.removeEventListener("click", onOutsideClick);
    document.removeEventListener("keydown", onKeyDown);
  };
};

export const closeDatePicker = () => {
  const existing = document.getElementById("pd-datepicker-popover");
  if (existing) {
    if (existing._cleanup) existing._cleanup();
    existing.remove();
  }
};
