let selectedProjectId = null;
let selectedProjectName = null;

window.onload = function () {
  loadProjects();
};

async function apiRequest(path, method = "GET", body = null) {
  if (DEMO_MODE) {
    return demoApi(path, method, body);
  }

  const options = {
    method: method,
    headers: {
      "Content-Type": "application/json"
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (!response.ok) {
    throw new Error("API request failed");
  }

  return await response.json();
}

async function createProject() {
  const projectName = document.getElementById("projectName").value.trim();
  const description = document.getElementById("projectDescription").value.trim();

  if (!projectName) {
    alert("Please enter project name");
    return;
  }

  await apiRequest("/projects", "POST", {
    projectName,
    description
  });

  document.getElementById("projectName").value = "";
  document.getElementById("projectDescription").value = "";

  await loadProjects();
}

async function loadProjects() {
  try {
    const projects = await apiRequest("/projects");
    renderProjects(projects);
    await updateDashboard();
  } catch (error) {
    console.error(error);
    alert("Error loading projects");
  }
}

function renderProjects(projects) {
  const projectsList = document.getElementById("projectsList");
  projectsList.innerHTML = "";

  if (!projects || projects.length === 0) {
    projectsList.innerHTML = "<p class='empty'>No projects yet.</p>";
    return;
  }

  projects.forEach(project => {
    const div = document.createElement("div");
    div.className = "project-card";

    div.innerHTML = `
      <h3>${escapeHtml(project.projectName)}</h3>
      <p>${escapeHtml(project.description || "")}</p>
      <small>Created: ${project.createdAt || ""}</small>

      <div class="actions">
        <button class="view-btn" onclick="selectProject('${project.projectId}', '${escapeForJs(project.projectName)}')">
          View Tasks
        </button>

        <button class="delete-btn" onclick="deleteProject('${project.projectId}')">
          Delete
        </button>
      </div>
    `;

    projectsList.appendChild(div);
  });
}

async function selectProject(projectId, projectName) {
  selectedProjectId = projectId;
  selectedProjectName = projectName;

  document.getElementById("tasksTitle").innerText = `Tasks - ${projectName}`;
  document.getElementById("taskForm").classList.remove("hidden");
  document.getElementById("selectProjectMessage").style.display = "none";

  await loadTasks();
}

async function deleteProject(projectId) {
  if (!confirm("Are you sure you want to delete this project?")) {
    return;
  }

  await apiRequest(`/projects/${projectId}`, "DELETE");

  selectedProjectId = null;
  selectedProjectName = null;

  document.getElementById("tasksTitle").innerText = "Tasks";
  document.getElementById("taskForm").classList.add("hidden");
  document.getElementById("selectProjectMessage").style.display = "block";
  document.getElementById("tasksList").innerHTML = "";

  await loadProjects();
}

async function createTask() {
  if (!selectedProjectId) {
    alert("Please select a project first");
    return;
  }

  const taskTitle = document.getElementById("taskTitle").value.trim();
  const description = document.getElementById("taskDescription").value.trim();
  const status = document.getElementById("taskStatus").value;

  if (!taskTitle) {
    alert("Please enter task title");
    return;
  }

  await apiRequest("/tasks", "POST", {
    projectId: selectedProjectId,
    taskTitle,
    description,
    status
  });

  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDescription").value = "";
  document.getElementById("taskStatus").value = "To Do";

  await loadTasks();
  await updateDashboard();
}

async function loadTasks() {
  if (!selectedProjectId) {
    return;
  }

  try {
    const tasks = await apiRequest(`/tasks?projectId=${selectedProjectId}`);
    renderTasks(tasks);
  } catch (error) {
    console.error(error);
    alert("Error loading tasks");
  }
}

function renderTasks(tasks) {
  const tasksList = document.getElementById("tasksList");
  tasksList.innerHTML = "";

  if (!tasks || tasks.length === 0) {
    tasksList.innerHTML = "<p class='empty'>No tasks for this project yet.</p>";
    return;
  }

  tasks.forEach(task => {
    const div = document.createElement("div");
    div.className = "task-card";

    const badgeClass = getStatusClass(task.status);

    div.innerHTML = `
      <h3>${escapeHtml(task.taskTitle)}</h3>
      <p>${escapeHtml(task.description || "")}</p>
      <span class="badge ${badgeClass}">${task.status}</span>

      <select class="status-select" onchange="updateTaskStatus('${task.taskId}', this.value)">
        <option value="To Do" ${task.status === "To Do" ? "selected" : ""}>To Do</option>
        <option value="In Progress" ${task.status === "In Progress" ? "selected" : ""}>In Progress</option>
        <option value="Done" ${task.status === "Done" ? "selected" : ""}>Done</option>
      </select>

      <div class="actions">
        <button class="delete-btn" onclick="deleteTask('${task.taskId}')">
          Delete Task
        </button>
      </div>
    `;

    tasksList.appendChild(div);
  });
}

async function updateTaskStatus(taskId, status) {
  await apiRequest(`/tasks/${taskId}`, "PUT", {
    status
  });

  await loadTasks();
  await updateDashboard();
}

async function deleteTask(taskId) {
  if (!confirm("Are you sure you want to delete this task?")) {
    return;
  }

  await apiRequest(`/tasks/${taskId}`, "DELETE");

  await loadTasks();
  await updateDashboard();
}

async function updateDashboard() {
  const dashboard = await apiRequest("/dashboard");

  document.getElementById("totalProjects").innerText = dashboard.totalProjects;
  document.getElementById("totalTasks").innerText = dashboard.totalTasks;
  document.getElementById("doneTasks").innerText = dashboard.doneTasks;
  document.getElementById("progressPercent").innerText = dashboard.progressPercent + "%";
}

function getStatusClass(status) {
  if (status === "Done") {
    return "done";
  }

  if (status === "In Progress") {
    return "progress";
  }

  return "todo";
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeForJs(text) {
  return String(text)
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'")
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "");
}

/* DEMO MODE using localStorage */

function getDemoProjects() {
  return JSON.parse(localStorage.getItem("projects") || "[]");
}

function saveDemoProjects(projects) {
  localStorage.setItem("projects", JSON.stringify(projects));
}

function getDemoTasks() {
  return JSON.parse(localStorage.getItem("tasks") || "[]");
}

function saveDemoTasks(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function demoApi(path, method, body) {
  return new Promise((resolve) => {
    let projects = getDemoProjects();
    let tasks = getDemoTasks();

    if (path === "/projects" && method === "GET") {
      resolve(projects);
      return;
    }

    if (path === "/projects" && method === "POST") {
      const project = {
        projectId: crypto.randomUUID(),
        projectName: body.projectName,
        description: body.description || "",
        createdAt: new Date().toISOString()
      };

      projects.unshift(project);
      saveDemoProjects(projects);
      resolve(project);
      return;
    }

    if (path.startsWith("/projects/") && method === "DELETE") {
      const projectId = path.split("/")[2];

      projects = projects.filter(project => project.projectId !== projectId);
      tasks = tasks.filter(task => task.projectId !== projectId);

      saveDemoProjects(projects);
      saveDemoTasks(tasks);

      resolve({ message: "Project deleted" });
      return;
    }

    if (path.startsWith("/tasks?projectId=") && method === "GET") {
      const projectId = path.split("=")[1];
      resolve(tasks.filter(task => task.projectId === projectId));
      return;
    }

    if (path === "/tasks" && method === "POST") {
      const task = {
        taskId: crypto.randomUUID(),
        projectId: body.projectId,
        taskTitle: body.taskTitle,
        description: body.description || "",
        status: body.status || "To Do",
        createdAt: new Date().toISOString()
      };

      tasks.unshift(task);
      saveDemoTasks(tasks);
      resolve(task);
      return;
    }

    if (path.startsWith("/tasks/") && method === "PUT") {
      const taskId = path.split("/")[2];

      tasks = tasks.map(task => {
        if (task.taskId === taskId) {
          return {
            ...task,
            status: body.status,
            updatedAt: new Date().toISOString()
          };
        }

        return task;
      });

      saveDemoTasks(tasks);
      resolve({ message: "Task updated" });
      return;
    }

    if (path.startsWith("/tasks/") && method === "DELETE") {
      const taskId = path.split("/")[2];

      tasks = tasks.filter(task => task.taskId !== taskId);
      saveDemoTasks(tasks);

      resolve({ message: "Task deleted" });
      return;
    }

    if (path === "/dashboard" && method === "GET") {
      const totalProjects = projects.length;
      const totalTasks = tasks.length;
      const doneTasks = tasks.filter(task => task.status === "Done").length;
      const progressPercent = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

      resolve({
        totalProjects,
        totalTasks,
        doneTasks,
        progressPercent
      });
      return;
    }

    resolve({});
  });
}