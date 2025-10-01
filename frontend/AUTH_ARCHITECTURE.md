# 🏗️ Authentication Architecture

## 📁 Cấu trúc thư mục
```
src/
├── types/
│   └── auth.ts                 # Type definitions, enums, interfaces
├── services/
│   └── auth.service.ts         # Business logic, API calls
├── contexts/
│   └── AuthContext.tsx         # React Context, state management
├── components/
│   └── guards/
│       └── AuthGuard.tsx       # Route protection components
└── app/
    ├── admin/                  # Admin routes (protected)
    ├── customer/               # Customer routes (protected)
    ├── restaurant/             # Restaurant routes (protected)
    ├── driver/                 # Driver routes (protected)
    └── unauthorized/           # Error pages
```

## 🔄 Data Flow
1. **User Action** → Login form submission
2. **Auth Service** → API call, token management
3. **Auth Context** → State update, notification
4. **Auth Guard** → Route protection check
5. **UI Update** → Redirect or show content

## 🎯 Separation of Concerns
- **Types**: Data contracts và interfaces
- **Service**: Business logic, API integration
- **Context**: State management, React integration
- **Guards**: Route protection, authorization
- **Components**: UI components, user interaction
