# 🛒 E-Commerce Application

A full-stack e-commerce web application built using **Next.js, Spring Boot, and PostgreSQL**.

The application provides a complete online shopping experience including user authentication, product browsing, shopping cart management, checkout, order placement, order history, and administrative product management.

---

## ✨ Features

### 👤 User Authentication
- User registration
- User login
- JWT-based authentication
- Secure password handling
- Role-based access control
- Customer and Admin roles

### 🛍️ Product Management
- Browse available products
- View individual product details
- Product pagination
- Product sorting
- Product stock management
- Admin product management

### 🛒 Shopping Cart
- Add products to cart
- View cart items
- Update product quantities
- Remove products from cart
- Automatic cart total calculation

### 💳 Checkout
- Multi-step checkout process
- Order summary
- Delivery address
- Cash on Delivery (COD)
- Mock/Test card payment
- Backend-authoritative order totals
- Stock validation before order placement

> **Note:** Card payments are implemented for demonstration/testing purposes only. The application does not process real card payments.

### 📦 Orders
- Place orders
- View order history
- Store delivery address with each order
- Track order/payment information
- Automatic stock reduction after successful order placement
- Cart cleared after successful checkout

### 🛠️ Admin Features
- Admin dashboard
- Add products
- Update products
- Delete products
- Manage product information and stock

---

## 🧰 Tech Stack

### Frontend

- **Next.js 16**
- **React 19**
- **JavaScript**
- **Tailwind CSS**
- **Axios**

### Backend

- **Java 21**
- **Spring Boot 4**
- **Spring Security**
- **Spring Data JPA**
- **JWT Authentication**
- **Hibernate**
- **Maven**

### Database

- **PostgreSQL**

### Development & Deployment

- **Git & GitHub**
- **Vercel**
- **Neon PostgreSQL**

---

## 📁 Project Structure

```text
ecommerce-app/
│
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/app/ecom/
│   │   │   └── resources/
│   │   └── test/
│   ├── pom.xml
│   └── mvnw
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── context/
│   │   └── services/
│   ├── public/
│   └── package.json
│
├── products_seed.sql
├── .gitignore
└── README.md
```

---

## 🔐 Authentication

The application uses **JWT (JSON Web Token)** authentication.

After successful login, the backend generates a JWT token. The frontend sends this token with authenticated API requests.

Protected resources are controlled using **Spring Security** and role-based authorization.

### Roles

| Role | Access |
|---|---|
| `CUSTOMER` | Products, cart, checkout, and orders |
| `ADMIN` | Administrative product management |

---

## 🌐 Main API Endpoints

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
```

### Products

```http
GET    /api/products
GET    /api/products/{id}
```

### Cart

```http
GET    /api/cart
POST   /api/cart
PUT    /api/cart
DELETE /api/cart
```

### Orders

```http
POST /api/orders
GET  /api/orders
```

### Users

```http
GET /api/users/me
```

### Admin

```http
POST   /api/admin/products
PUT    /api/admin/products/{id}
DELETE /api/admin/products/{id}
```

---

## 🚀 Running the Project Locally

### Prerequisites

Make sure the following are installed:

- Java 21
- Node.js
- npm
- PostgreSQL
- Git

---

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd ecommerce-app
```

---

### 2. Configure PostgreSQL

Create a PostgreSQL database:

```text
ecomdb
```

Configure your local database credentials using environment variables or the backend configuration.

Example:

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/ecomdb
SPRING_DATASOURCE_USERNAME=your_username
SPRING_DATASOURCE_PASSWORD=your_password
JWT_SECRET=your_secure_jwt_secret
```

> Never commit real database passwords or JWT secrets to GitHub.

---

### 3. Start the Backend

Navigate to the backend:

```bash
cd backend
```

On Windows:

```powershell
.\mvnw spring-boot:run
```

The backend will run at:

```text
http://localhost:8081
```

---

### 4. Configure the Frontend

Inside the `frontend` directory, create:

```text
.env.local
```

Add:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8081
```

---

### 5. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will run at:

```text
http://localhost:3000
```

---

## 🖥️ Application Pages

| Page | Route |
|---|---|
| Products | `/products` |
| Product Details | `/product/[id]` |
| Login | `/login` |
| Register | `/register` |
| Cart | `/cart` |
| Checkout | `/checkout` |
| Orders | `/orders` |
| Admin Dashboard | `/admin` |

---

## 🔄 Application Flow

```text
Register / Login
       ↓
Browse Products
       ↓
View Product
       ↓
Add to Cart
       ↓
Review Cart
       ↓
Checkout
       ↓
Choose Payment Method
       ↓
Enter Delivery Details
       ↓
Review Order
       ↓
Place Order
       ↓
Order History
```

---

## 🔒 Security

The backend implements:

- JWT-based authentication
- Spring Security
- Role-based authorization
- Password protection
- Protected API endpoints
- CORS configuration
- Backend validation
- Environment-based production secrets

Sensitive information such as database passwords and JWT secrets should be stored using environment variables and must not be committed to the repository.

---

## 🗄️ Database

PostgreSQL is used as the relational database.

The application stores information related to:

- Users
- Products
- Shopping carts
- Orders
- Order items
- Delivery information

Spring Data JPA and Hibernate are used for database interaction.

---

## 🌱 Future Improvements

Possible future improvements include:

- Real payment gateway integration
- Email order confirmation
- Password reset functionality
- Product reviews and ratings
- Wishlist functionality
- Product image upload
- Advanced product search and filtering
- Order status tracking
- Admin order management
- Improved analytics dashboard

---

## 🎯 Project Purpose

This project was developed to gain practical experience in building a complete full-stack application using modern frontend and backend technologies.

It demonstrates concepts including:

- REST API development
- Frontend-backend integration
- Database design
- JWT authentication
- Role-based authorization
- Shopping cart implementation
- Transactional order processing
- Responsive UI development
- Full-stack application deployment

---

## 👩‍💻 Author

**Kushalini Satheeswaran**

Computer Engineering Undergraduate  
Faculty of Engineering  
University of Sri Jayewardenepura

