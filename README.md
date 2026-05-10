Smart Inventory Manager 📦
Smart Inventory Manager is a full-stack inventory and stock tracking application developed as a modern solution for businesses to monitor their products, categories, and stock movements in real-time.
🚀 Key Features
Real-time Dashboard: Displays total inventory value and highlights products with critical (low) stock levels.
Smart Product Management: A modern UI for adding/editing products with manual input support and quick-increment buttons.
Automated SKU Generation: Supports unique Stock Keeping Unit (SKU) codes for every product.
Transaction Logging: Automatically logs every stock change (In/Out/Adjustment) to the StockMovements table for a full audit trail.
Portable Architecture: Uses SQLite for a zero-configuration, file-based database experience.
🛠️ Technical Stack
Backend: .NET 8 (ASP.NET Core Web API)
Frontend: Next.js 15 (App Router), Tailwind CSS
ORM: Entity Framework Core
Database: SQLite
⚙️ Setup and Installation
1. Prerequisites
First, ensure you have the following installed:
.NET 8 SDK
Node.js (v18 or higher)
Git
2. Backend Setup
Navigate to the backend directory and run the project:
cd backend/SmartInventory.Api
dotnet run


Note: The API will be available at http://localhost:5255 by default.
3. Frontend Setup
Open a new terminal window and follow these steps:
# Go to frontend folder
cd frontend

# Install necessary packages
npm install

# Start the development server
npm run dev


4. Environment Configuration
Create a file named .env.local inside the frontend directory and paste the following:
NEXT_PUBLIC_API_URL=http://localhost:5255
