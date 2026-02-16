## Project Description

This project aim to help user manage tasks and time spent on each tasks. The goal of this project is to help solve my current pain point which is to know how much time I spent on working on different tasks, whether it's for work or personal matter, I want an web application that I can come in and create tasks and sub-tasks as needed. Whenever I start to work on certain task, I can just click start and there would a picture in picture time showing the timer and I can click finish or stop when I'm done.

## UI specification

I want a dashboard-like UI with:

- Sidebar on the left showing the two core tabs (Task Manager and Dashboard)
- Main UI on the right

**Task Manager**: need to be designed like a modern to-do list application with one additional core functionality of start button. When clicked this, there should be a picture in picture timer pop up with control buttons that allow me to complete when I finished the task or stop when I want to pause the task and do it later. For now, I want to keep the task simple, I just want a main task and a sub-task data structure. To better organise these main and sub-task, I would like to have a function to create a folder for different work I'm doing. For example, Office work, Personal Work, Start up and so on. Sub-task should show how much time were spent and the Main-task should should the aggregate amount of time spent from the corresponding sub-tasks.

**Dashboard**: this section should use the data from the tasks and provide key statistic about my time spent working. The key insights should be presented in graphs and intuitive visualizations that help me understand my current workload, what are the things I spent the most time on, how much time I spent this month/week/day working, what are the tasks that I completed this month/week/day.

## Techinical Specification

**UI**: use next js framework to develop a modern and minimalistic user interface.
**Backend**: should use supabase to store user data and user authentication.
**Deployment**: should be deployed to vercel for production as it is easy to integrate with next js.
