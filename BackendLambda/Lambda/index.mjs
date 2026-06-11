import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand
} from "@aws-sdk/lib-dynamodb";
import crypto from "crypto";

const client = new DynamoDBClient({});
const dynamoDB = DynamoDBDocumentClient.from(client);

const PROJECTS_TABLE = "Projects";
const TASKS_TABLE = "Tasks";

export const handler = async (event) => {
  console.log("Event:", JSON.stringify(event));

  try {
    const method = event.requestContext?.http?.method || event.httpMethod;
    const path = event.rawPath || event.path || "/";

    if (method === "OPTIONS") {
      return response(200, { message: "CORS OK" });
    }

    if (method === "GET" && path === "/projects") {
      return await getProjects();
    }

    if (method === "POST" && path === "/projects") {
      return await createProject(event);
    }

    if (method === "DELETE" && path.startsWith("/projects/")) {
      const projectId = path.split("/")[2];
      return await deleteProject(projectId);
    }

    if (method === "GET" && path === "/tasks") {
      const projectId = event.queryStringParameters?.projectId;
      return await getTasks(projectId);
    }

    if (method === "POST" && path === "/tasks") {
      return await createTask(event);
    }

    if (method === "PUT" && path.startsWith("/tasks/")) {
      const taskId = path.split("/")[2];
      return await updateTask(taskId, event);
    }

    if (method === "DELETE" && path.startsWith("/tasks/")) {
      const taskId = path.split("/")[2];
      return await deleteTask(taskId);
    }

    if (method === "GET" && path === "/dashboard") {
      return await getDashboard();
    }

    return response(404, { message: "Route not found" });

  } catch (error) {
    console.error("Server error:", error);
    return response(500, { message: "Internal server error", error: error.message });
  }
};

async function getProjects() {
  const result = await dynamoDB.send(new ScanCommand({
    TableName: PROJECTS_TABLE
  }));

  const projects = result.Items || [];
  projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return response(200, projects);
}

async function createProject(event) {
  const body = JSON.parse(event.body || "{}");

  if (!body.projectName) {
    return response(400, { message: "projectName is required" });
  }

  const project = {
    projectId: crypto.randomUUID(),
    projectName: body.projectName,
    description: body.description || "",
    createdAt: new Date().toISOString()
  };

  await dynamoDB.send(new PutCommand({
    TableName: PROJECTS_TABLE,
    Item: project
  }));

  return response(201, project);
}

async function deleteProject(projectId) {
  if (!projectId) {
    return response(400, { message: "projectId is required" });
  }

  await dynamoDB.send(new DeleteCommand({
    TableName: PROJECTS_TABLE,
    Key: { projectId }
  }));

  const tasksResult = await dynamoDB.send(new ScanCommand({
    TableName: TASKS_TABLE,
    FilterExpression: "projectId = :projectId",
    ExpressionAttributeValues: {
      ":projectId": projectId
    }
  }));

  const tasks = tasksResult.Items || [];

  for (const task of tasks) {
    await dynamoDB.send(new DeleteCommand({
      TableName: TASKS_TABLE,
      Key: {
        taskId: task.taskId
      }
    }));
  }

  return response(200, { message: "Project and related tasks deleted" });
}

async function getTasks(projectId) {
  if (!projectId) {
    return response(400, { message: "projectId is required" });
  }

  const result = await dynamoDB.send(new ScanCommand({
    TableName: TASKS_TABLE,
    FilterExpression: "projectId = :projectId",
    ExpressionAttributeValues: {
      ":projectId": projectId
    }
  }));

  const tasks = result.Items || [];
  tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return response(200, tasks);
}

async function createTask(event) {
  const body = JSON.parse(event.body || "{}");

  if (!body.projectId || !body.taskTitle) {
    return response(400, { message: "projectId and taskTitle are required" });
  }

  const task = {
    taskId: crypto.randomUUID(),
    projectId: body.projectId,
    taskTitle: body.taskTitle,
    description: body.description || "",
    status: body.status || "To Do",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await dynamoDB.send(new PutCommand({
    TableName: TASKS_TABLE,
    Item: task
  }));

  return response(201, task);
}

async function updateTask(taskId, event) {
  const body = JSON.parse(event.body || "{}");

  if (!taskId) {
    return response(400, { message: "taskId is required" });
  }

  if (!body.status) {
    return response(400, { message: "status is required" });
  }

  await dynamoDB.send(new UpdateCommand({
    TableName: TASKS_TABLE,
    Key: { taskId },
    UpdateExpression: "SET #status = :status, updatedAt = :updatedAt",
    ExpressionAttributeNames: {
      "#status": "status"
    },
    ExpressionAttributeValues: {
      ":status": body.status,
      ":updatedAt": new Date().toISOString()
    }
  }));

  return response(200, { message: "Task updated successfully" });
}

async function deleteTask(taskId) {
  if (!taskId) {
    return response(400, { message: "taskId is required" });
  }

  await dynamoDB.send(new DeleteCommand({
    TableName: TASKS_TABLE,
    Key: { taskId }
  }));

  return response(200, { message: "Task deleted successfully" });
}

async function getDashboard() {
  const projectsResult = await dynamoDB.send(new ScanCommand({
    TableName: PROJECTS_TABLE
  }));

  const tasksResult = await dynamoDB.send(new ScanCommand({
    TableName: TASKS_TABLE
  }));

  const projects = projectsResult.Items || [];
  const tasks = tasksResult.Items || [];

  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(task => task.status === "Done").length;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  return response(200, {
    totalProjects,
    totalTasks,
    doneTasks,
    progressPercent
  });
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE"
    },
    body: JSON.stringify(body)
  };
}