// Shared JavaScript for navigation, student records and contact form.
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".year").forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".site-nav");
  if (menuButton && navigation) {
    menuButton.addEventListener("click", () => {
      const isOpen = navigation.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.textContent = isOpen ? "×" : "☰";
    });
  }

  setupStudentManager();
  setupContactForm();

  // Course-page links can preselect the course when the learner reaches the form.
  const selectedCourse = new URLSearchParams(window.location.search).get("course");
  const courseSelect = document.getElementById("studentCourse");
  if (selectedCourse && courseSelect) courseSelect.value = selectedCourse;
});

function setupStudentManager() {
  const form = document.getElementById("studentForm");
  if (!form) return;

  // Required by the assignment: an array of objects stores records while this page is open.
  let students = [];
  let nextId = 1;
  let sortDescending = true;

  const tableBody = document.getElementById("studentTableBody");
  const message = document.getElementById("formMessage");
  const searchInput = document.getElementById("searchInput");
  const courseFilter = document.getElementById("courseFilter");

  function getPerformance(marks) {
    if (marks >= 80) return "Excellent";
    if (marks >= 70) return "Very Good";
    if (marks >= 60) return "Good";
    if (marks >= 50) return "Average";
    return "Failed";
  }

  function showMessage(text, type) {
    message.textContent = text;
    message.className = `form-message ${type}`;
  }

  function updateDashboard() {
    const total = students.length;
    const passed = students.filter((student) => student.marks >= 50).length;
    const failed = total - passed;
    const average = total
      ? students.reduce((sum, student) => sum + student.marks, 0) / total
      : 0;

    document.getElementById("totalStudents").textContent = total;
    document.getElementById("passedStudents").textContent = passed;
    document.getElementById("failedStudents").textContent = failed;
    document.getElementById("averageMarks").textContent = `${average.toFixed(1)}%`;

    const highest = students.length
      ? students.reduce((best, current) => current.marks > best.marks ? current : best)
      : null;
    const lowest = students.length
      ? students.reduce((worst, current) => current.marks < worst.marks ? current : worst)
      : null;
    document.getElementById("highestStudent").textContent = highest ? `${highest.name} (${highest.marks})` : "—";
    document.getElementById("lowestStudent").textContent = lowest ? `${lowest.name} (${lowest.marks})` : "—";
    document.getElementById("recordCount").textContent = `${total} ${total === 1 ? "record" : "records"}`;
  }

  function makeCell(text) {
    const cell = document.createElement("td");
    cell.textContent = text;
    return cell;
  }

  function renderStudents() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedCourse = courseFilter.value;
    let visibleStudents = students.filter((student) => {
      const matchesName = student.name.toLowerCase().includes(searchTerm);
      const matchesCourse = !selectedCourse || student.course === selectedCourse;
      return matchesName && matchesCourse;
    });

    visibleStudents.sort((a, b) => sortDescending ? b.marks - a.marks : a.marks - b.marks);
    tableBody.replaceChildren();

    if (visibleStudents.length === 0) {
      const row = document.createElement("tr");
      row.className = "empty-row";
      const cell = document.createElement("td");
      cell.colSpan = 7;
      cell.textContent = students.length
        ? "No matching students found. Try a different search or filter."
        : "No students registered yet. Add the first student using the form above.";
      row.appendChild(cell);
      tableBody.appendChild(row);
    } else {
      visibleStudents.forEach((student) => {
        const row = document.createElement("tr");
        row.append(
          makeCell(student.name),
          makeCell(student.age),
          makeCell(student.gender),
          makeCell(student.course),
          makeCell(student.marks)
        );

        const performanceCell = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = `performance ${student.marks >= 50 ? "pass" : "fail"}`;
        badge.textContent = getPerformance(student.marks);
        performanceCell.appendChild(badge);
        row.appendChild(performanceCell);

        const actionsCell = document.createElement("td");
        actionsCell.className = "actions-cell";
        const editButton = document.createElement("button");
        editButton.className = "table-action edit-action";
        editButton.type = "button";
        editButton.textContent = "Edit marks";
        editButton.addEventListener("click", () => updateMarks(student.id));
        const deleteButton = document.createElement("button");
        deleteButton.className = "table-action delete-action";
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => deleteStudent(student.id));
        actionsCell.append(editButton, deleteButton);
        row.appendChild(actionsCell);
        tableBody.appendChild(row);
      });
    }
    updateDashboard();
  }

  function updateMarks(id) {
    const student = students.find((item) => item.id === id);
    if (!student) return;
    const newMarks = prompt(`Enter new marks for ${student.name} (0–100):`, student.marks);
    if (newMarks === null) return;
    if (newMarks.trim() === "" || !Number.isFinite(Number(newMarks)) || Number(newMarks) < 0 || Number(newMarks) > 100) {
      showMessage("Marks must be a number between 0 and 100.", "error");
      return;
    }
    student.marks = Number(newMarks);
    showMessage(`Marks updated for ${student.name}.`, "success");
    renderStudents();
  }

  function deleteStudent(id) {
    const student = students.find((item) => item.id === id);
    if (!student || !confirm(`Delete ${student.name}'s record?`)) return;
    students = students.filter((item) => item.id !== id);
    showMessage(`${student.name}'s record was deleted.`, "success");
    renderStudents();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.getElementById("studentName").value.trim();
    const ageValue = document.getElementById("studentAge").value;
    const gender = document.getElementById("studentGender").value;
    const course = document.getElementById("studentCourse").value;
    const marksValue = document.getElementById("studentMarks").value;

    if (!name || !ageValue || !gender || !course || marksValue === "") {
      showMessage("Please complete every field before registering.", "error");
      return;
    }
    const age = Number(ageValue);
    const marks = Number(marksValue);
    if (!Number.isInteger(age) || age < 1 || age > 120) {
      showMessage("Please enter a valid age between 1 and 120.", "error");
      return;
    }
    if (!Number.isFinite(marks) || marks < 0 || marks > 100) {
      showMessage("Marks must be a number between 0 and 100.", "error");
      return;
    }

    students.push({ id: nextId++, name, age, gender, course, marks });
    form.reset();
    showMessage(`${name} was registered successfully.`, "success");
    renderStudents();
  });

  searchInput.addEventListener("input", renderStudents);
  courseFilter.addEventListener("change", renderStudents);
  document.getElementById("sortButton").addEventListener("click", (event) => {
    sortDescending = !sortDescending;
    event.currentTarget.textContent = sortDescending ? "Sort: highest marks ↓" : "Sort: lowest marks ↑";
    renderStudents();
  });
  document.getElementById("clearAllButton").addEventListener("click", () => {
    if (!students.length) {
      showMessage("There are no records to clear.", "error");
      return;
    }
    if (!confirm("Clear every student record? This cannot be undone.")) return;
    students = [];
    showMessage("All student records have been cleared.", "success");
    renderStudents();
  });

  renderStudents();
}

function setupContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;
  const feedback = document.getElementById("contactFeedback");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.getElementById("contactName").value.trim();
    const email = document.getElementById("contactEmail").value.trim();
    const subject = document.getElementById("contactSubject").value.trim();
    const message = document.getElementById("contactMessage").value.trim();
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!name || !email || !subject || !message) {
      feedback.textContent = "Please fill in all fields.";
      feedback.className = "form-message error";
      return;
    }
    if (!validEmail) {
      feedback.textContent = "Please enter a valid email address containing @ and a dot.";
      feedback.className = "form-message error";
      return;
    }
    if (message.length < 10) {
      feedback.textContent = "Your message must be at least 10 characters long.";
      feedback.className = "form-message error";
      return;
    }

    feedback.textContent = "Thank you! Your message has been validated. (Demo only: it was not sent.)";
    feedback.className = "form-message success";
    form.reset();
  });
}
