
# Personal Finance Tracker System - Backend
Application Frameworks Assignment1 (Year 3 Semester 1)

## Overview
This is a backend API built with Node.js, Express.js, and MongoDB that helps users manage their personal finances with features like income & expense tracking, budgets, financial goals, reports, notifications, and multi-currency support.

## Features
- **User Roles & Authentication:** Admin & Regular User with JWT-based authentication.     
- **Income & Expense Tracking:** CRUD operations with category & tag support.        
- **Budget Management:** Set & track spending limits, get alerts when exceeding.       
- **Goals & Savings Tracking:** Auto-save a percentage of income for goals.               
- **Financial Reports:** Filter reports by date, category, and tags with multi-currency conversion.       
- **Recurring Transactions:** Automatic processing for monthly subscriptions, rent, etc.         
- **Notifications & Alerts:** Console alerts for upcoming/missed transactions & unusual spending.  
- **Role-Based Dashboard:** Personalized dashboard for Admins & Users.

## Setup Instructions
  **1. Clone the repository:**- git clone url   
  **2. Install dependencies:**- npm install   
  **3. Setup environmental variables:**- Create .env file and add mongodb connection   
  **4. Start server:**- npm start   

## API Documentation
**1. User Roles and Authentication:**   
- **Register a new user** - Endpoint: POST /auth/register
- **Login** - Endpoint: POST /auth/login
- **Get All Users** - Endpoint: GET /admin/users
- **Delete User** - Endpoint: DEL /admin/users/:userId    
- **Update User Detail** - Endpoint: PUT /admin/users/:userId   

**2.Expense and Income Tracking:**    
- **Add a Transaction** - Endpoint: POST  /transaction/addTransaction   
- **Get User Transactions** - Endpoint: GET /transaction/getUserTransactions
- **Update Transaction** - Endpoint: PUT /updateTransaction/:transactionId
- **Delete Transaction** - Endpoint: DEL /deleteTransaction/:transactionId

**3. Budget Management:**     
- **Set a Budget** - Endpoint: POST  /budget/setBudget
- **Get user budget** - Endpoit: GET /budget/getUserBudgets
- **Delete Budget** -Endpoint: DEL /budget/deleteBudget/:budgetId

**4. Goals and Savings Tracking:**
- **Create a Goal** - Endpoint: POST  /goals/createGoal
- **Get User Goals** - Endpoint: GET  /goals/getUserGoals
- **Update Goal Progress** - Endpoint: PUT /goals/updateGoalProgress/:goalId
- **Delete Goal** - Endpoint: DEL /goals/deleteGoal/:goalId

**5. Dashboard Data:**
- **Get dashboard data** - Endpoint: GET /admin/dashboard

## Testing Technologies used:         
Backend: Node.js, Express.js, MongoDB, Mongoose         
Authentication: JWT      
Scheduling: Node-Schedule     
Currency Conversion: Exchange Rate API     
Testing: Jest/Postman   
