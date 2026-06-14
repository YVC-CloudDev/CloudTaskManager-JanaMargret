# CloudTask Manager

CloudTask Manager is a serverless task management web application deployed on AWS.
The system allows users to create projects, add tasks, update task statuses, delete projects and tasks, and view progress through a dashboard.

## Live Website

https://cloudtaskmanage.proj.rotem.click

## Project Overview

This project was developed as part of the Cloud Development course.
The goal of the project is to demonstrate how to build and deploy a cloud-based application using AWS services, GitHub, CI/CD, HTTPS, monitoring, and secure permissions.

CloudTask Manager helps users organize projects and tasks in a simple and clear way.

## Main Features

* Create new projects
* View all projects
* Delete projects
* Add tasks to a selected project
* View tasks by project
* Update task status
* Delete tasks
* Display dashboard statistics
* Calculate project progress percentage

## AWS Services Used

* Amazon S3 – hosts the frontend static files
* Amazon CloudFront – serves the frontend securely using HTTPS
* AWS Certificate Manager ACM – provides SSL/TLS certificate
* Amazon Route 53 – manages DNS and connects the domain to CloudFront
* Amazon API Gateway – exposes the backend API routes
* AWS Lambda – runs the backend logic
* Amazon DynamoDB – stores projects and tasks
* Amazon CloudWatch – monitors logs and metrics
* AWS IAM – manages secure permissions

## System Architecture

The project uses a serverless AWS architecture.

```text
User / Web Browser
        |
        v
Route 53
        |
        v
CloudFront + ACM HTTPS Certificate
        |
        v
Amazon S3 Frontend
        |
        v
API Gateway
        |
        v
AWS Lambda: CloudTaskManager
        |
        v
Amazon DynamoDB
        |
        v
CloudWatch Logs
```

## Architecture Explanation

The user opens the website using the custom domain.
Route 53 routes the domain to CloudFront.
CloudFront serves the frontend files from the private S3 bucket using HTTPS.
The frontend sends API requests to API Gateway.
API Gateway triggers one Lambda function called CloudTaskManager.
The Lambda function handles all backend logic and reads or writes data to DynamoDB.
CloudWatch is used to monitor Lambda logs and errors.

## API Routes

| Method | Route                        | Description              |
| ------ | ---------------------------- | ------------------------ |
| GET    | /projects                    | Get all projects         |
| POST   | /projects                    | Create a new project     |
| DELETE | /projects/{projectId}        | Delete a project         |
| GET    | /tasks?projectId={projectId} | Get tasks for a project  |
| POST   | /tasks                       | Create a new task        |
| PUT    | /tasks/{taskId}              | Update task status       |
| DELETE | /tasks/{taskId}              | Delete a task            |
| GET    | /dashboard                   | Get dashboard statistics |

## Database Design

The project uses two DynamoDB tables:

### Projects Table

Primary key:

```text
projectId
```

Main attributes:

* projectId
* projectName
* description
* createdAt

### Tasks Table

Primary key:

```text
taskId
```

Main attributes:

* taskId
* projectId
* taskTitle
* description
* status
* createdAt
* updatedAt

## Repository Structure

```text
CloudTaskManager-JanaMargret/
│
├── Frontend/
│   ├── index.html
│   ├── style.css
│   └── js/
│       ├── app.js
│       └── config.js
│
├── BackendLambda/
│   └── Lambda/
│       └── index.mjs
│
└── README.md
```

## CI/CD with GitHub Actions

The project uses GitHub Actions for the CI/CD process.

When changes are pushed to the main branch, the workflow deploys the frontend files automatically to the S3 bucket and invalidates the CloudFront cache.

The workflow uses GitHub Secrets to store AWS credentials securely.
No access keys or secrets are stored inside the source code.

## Security

* The S3 bucket is private.
* The website is served through CloudFront.
* HTTPS is enabled using ACM.
* Lambda uses an IAM Role.
* IAM permissions are limited to the required AWS services.
* AWS access keys are not stored in the code.
* GitHub Secrets are used for deployment credentials.

## Monitoring

CloudWatch Logs are used to monitor the Lambda function.
The logs help track API requests, backend errors, and function execution.

## Demo Flow

During the demo, the following steps can be shown:

1. Open the live website.
2. Create a new project.
3. Select the project.
4. Add a new task.
5. Change the task status.
6. Delete a task.
7. Show that the dashboard updates automatically.
8. Show CloudWatch logs after using the website.

## Authors

* Jana Jabareen
* Margret Bathish
