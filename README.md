 Multi-Tenant SaaS Frontend

React-based enterprise SaaS platform with real-time features, multi-tenant architecture, and comprehensive project management.

## 🚀 Live Demo
[Coming Soon]

## 📋 Features

### Core Features
- **JWT Authentication** - Secure login/register with token-based auth
- **Multi-Tenant Architecture** - Organization-based data isolation
- **Real-time Dashboard** - Live analytics with Chart.js
- **Project Management** - Create, update, delete projects
- **Task Management** - Task tracking with status and priority
- **Nested Comments** - Threaded discussions with replies
- **Real-time Notifications** - WebSocket-powered instant alerts
- **Global Search** - Search across projects, tasks, and comments

### Advanced Features
- **Data Export** - CSV, PDF, and Excel reports
- **Subscription Management** - Plan upgrades and billing
- **User Roles** - Admin, Member, Viewer permissions
- **Activity Logs** - Track all user actions
- **File Uploads** - Attach files to projects
- **Analytics Dashboard** - Project trends and completion rates

### Technical Features
- **WebSocket Connections** - Real-time updates via Daphne
- **REST API Integration** - Axios HTTP client
- **Responsive Design** - Mobile-friendly interface
- **Error Handling** - Comprehensive error boundaries
- **Loading States** - Skeleton loaders and spinners

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| Axios | API Calls |
| WebSocket | Real-time notifications |
| Chart.js | Analytics visualizations |
| React Router | Navigation |
| CSS Modules | Styling |

## 📦 Installation

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Backend running on `http://localhost:8000`

### Setup

```bash
# Clone repository
git clone https://github.com/andugetachew/multi-tenant-saas-frontend.git
cd multi-tenant-saas-frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your backend URL

# Start development server
npm start
Environment Variables
env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_WS_URL=ws://localhost:8001
🔗 Backend Repository
Multi-Tenant SaaS Backend

📁 Project Structure
text
src/
├── components/
│   ├── Dashboard/
│   ├── Projects/
│   ├── Comments/
│   ├── Notifications/
│   └── Common/
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   └── ProjectDetail.jsx
├── services/
│   ├── api.js
│   └── websocket.js
├── hooks/
│   └── useAuth.js
├── utils/
│   └── helpers.js
└── App.jsx
🚀 API Integration
Authentication Endpoints
Method	Endpoint	Description
POST	/auth/login/	User login
POST	/auth/register/	New registration
POST	/auth/logout/	User logout
Project Endpoints
Method	Endpoint	Description
GET	/projects/	List projects
POST	/projects/	Create project
PUT	/projects/{id}/	Update project
DELETE	/projects/{id}/	Delete project
Real-time WebSocket
javascript
// Connect to notifications
const ws = new WebSocket(`ws://localhost:8001/ws/notifications/?token=${token}`);
ws.onmessage = (event) => {
  console.log('Notification:', JSON.parse(event.data));
};
🧪 Testing
bash
# Run tests
npm test

# Build for production
npm run build
📊 Key Features Demo
Dashboard Analytics
Real-time project trends

Task completion rates

Active users metrics

7-day activity heatmap

Comments System
Nested replies (infinite depth)

Real-time updates

User mentions

Edit/delete functionality

Notifications
WebSocket real-time alerts

Read/unread status

Mark all as read

Click to navigate

🤝 Contributing
Fork the repository

Create feature branch (git checkout -b feature/AmazingFeature)

Commit changes (git commit -m 'Add AmazingFeature')

Push to branch (git push origin feature/AmazingFeature)

Open Pull Request

📝 License
MIT License - see LICENSE file

👨‍💻 Author
Andu Getachew

GitHub: @andugetachew

🙏 Acknowledgments
Django REST Framework team

React community

All contributors

📞 Support
For issues or questions:

Create GitHub issue

Email: [your-email]

🎯 Quick Start Commands
bash
# Clone and install
git clone https://github.com/andugetachew/multi-tenant-saas-frontend.git
cd multi-tenant-saas-frontend
npm install
npm start

# Build for production
npm run build

# Run tests
npm test
🌟 Star History
If you find this project useful, please star it on GitHub!

Built with React and Django REST Framework 🚀
