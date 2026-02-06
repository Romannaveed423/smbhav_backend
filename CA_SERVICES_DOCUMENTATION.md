# CA Services System Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Service Catalog System](#service-catalog-system)
4. [Application Management](#application-management)
5. [Document Management](#document-management)
6. [Chat & Support System](#chat--support-system)
7. [Data Models](#data-models)
8. [API Endpoints](#api-endpoints)
9. [Workflow Examples](#workflow-examples)
10. [Configuration](#configuration)
11. [File Upload System](#file-upload-system)
12. [Status Management](#status-management)

---

## Overview

The CA Services System is a comprehensive solution for managing Chartered Accountant (CA) services including GST registration, company registration, tax filing, and compliance services. It provides a complete workflow from service discovery to application submission, document management, status tracking, and expert support.

### Key Features
- ✅ **Service Catalog**: Browse categories, subcategories, and services
- ✅ **Application Management**: Submit and track service applications
- ✅ **Document Upload**: Secure document upload and verification
- ✅ **Status Tracking**: Real-time application status with timeline
- ✅ **Chat Support**: Direct communication with CA experts
- ✅ **Certificate Download**: Download approved certificates
- ✅ **Callback Requests**: Request callback from CA experts
- ✅ **Testimonials & Courses**: Educational content and customer reviews

---

## System Architecture

### Core Components

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ├───▶ Browse Services
       │     └───▶ Service Catalog
       │
       ├───▶ Submit Application
       │     ├───▶ Application Record
       │     └───▶ Document Upload
       │
       ├───▶ Track Status
       │     └───▶ Timeline Updates
       │
       ├───▶ Chat with Expert
       │     ├───▶ Chat Session
       │     └───▶ Messages
       │
       └───▶ Download Certificate
             └───▶ Approved Application
```

### Data Flow

```
User → Service Selection → Application Submission → Document Upload
  ↓
Status Tracking → Expert Review → Approval → Certificate Generation
  ↓
Download Certificate / Chat Support
```

---

## Service Catalog System

### Category Structure

The system supports a hierarchical category structure:

```
Main Categories
├── GST Services
│   ├── GST Registration
│   ├── GST Filing
│   ├── GST Cancellation
│   └── GST Compliance
├── Company Registration
├── Tax Services
│   ├── ITR Filing
│   └── Tax Consultation
├── PAN/TAN Services
└── Audit Services
```

### Service Information

Each service includes:
- **Basic Info**: Title, description, logo
- **Pricing**: Current price and crossed-out price
- **Timeline**: Estimated completion time
- **Features**: List of service features
- **Required Documents**: Document checklist
- **Process Steps**: Step-by-step process

---

## Application Management

### Application Lifecycle

```
Application Submitted (pending)
       │
       ▼
In Review (in_review)
       │
       ├───▶ Awaiting Clarification (awaiting_clarification)
       │     └───▶ User provides additional info
       │
       ├───▶ Approved (approved)
       │     └───▶ Certificate Generated
       │
       └───▶ Rejected (rejected)
```

### Application Fields

**Client Details**:
- Client Name
- Business Name
- GSTIN (optional, for existing businesses)
- Address Proof

**Documents**:
- Aadhar Card
- PAN Card
- Address Proof
- Business Proof (if applicable)
- Other documents as required

**Additional Info**:
- Business Type (for company registration)
- Turnover (for GST services)
- Custom notes

### Timeline Tracking

Each application maintains a timeline with:
- **Title**: Status title
- **Time**: Timestamp or "Current"
- **Status**: completed | current | pending
- **Icon**: Visual indicator
- **Description**: Status description

**Example Timeline**:
```json
[
  {
    "title": "Application Submitted",
    "time": "10:30 AM",
    "status": "completed",
    "icon": "check_circle",
    "timestamp": "2024-01-01T10:30:00.000Z",
    "description": "Your application has been received"
  },
  {
    "title": "In Review",
    "time": "Current",
    "status": "current",
    "icon": "hourglass_empty",
    "timestamp": "2024-01-01T11:00:00.000Z",
    "description": "CA expert is reviewing your documents"
  }
]
```

---

## Document Management

### Document Types

- **aadhar**: Aadhar Card
- **pan**: PAN Card
- **address_proof**: Address Proof
- **business_proof**: Business Registration Proof
- **other**: Other documents

### Upload Process

1. **File Selection**: User selects file (PDF, JPG, PNG)
2. **Validation**: File type and size validation (max 10MB)
3. **Upload**: File saved to server/cloud storage
4. **Verification**: CA expert reviews document
5. **Status Update**: Document marked as verified/rejected

### File Requirements

- **Max Size**: 10MB per file
- **Allowed Formats**: PDF, JPG, JPEG, PNG
- **Storage**: Local storage (development) / Cloud storage (production)

---

## Chat & Support System

### Chat Features

- **Expert Assignment**: Automatic assignment to available CA expert
- **Real-time Messaging**: Send and receive messages
- **File Attachments**: Attach documents in chat
- **Read Receipts**: Track message read status
- **Chat History**: View complete conversation history

### Support Options

1. **Live Chat**: Instant messaging with CA expert
2. **Callback Request**: Request phone callback
3. **Phone Support**: Direct phone number for urgent queries

### Chat Flow

```
User Starts Chat
    │
    ├───▶ Expert Assigned
    │
    ├───▶ Messages Exchanged
    │
    └───▶ Chat Closed (when resolved)
```

---

## Data Models

### CAServiceCategory Model

```typescript
{
  id: string;
  cat_name: string;
  cat_img: string;
  status: number;  // 1 = active, 0 = inactive
  parentCategoryId?: ObjectId;  // For subcategories
  order: number;  // Display order
  hasCheckmark?: boolean;  // For active/completed services
  createdAt: Date;
  updatedAt: Date;
}
```

### CAService Model

```typescript
{
  id: string;
  title: string;
  description: string;
  logo: string;
  price: number;
  cross_price?: number;
  categoryId: ObjectId;
  subcategoryId?: ObjectId;
  estimatedTime: string;  // "7-10 days"
  isActive: boolean;
  features: string[];
  requiredDocuments: Array<{
    name: string;
    type: string;
    isRequired: boolean;
  }>;
  processSteps: string[];
  serviceType: string;  // gst_registration, company_registration, etc.
  createdAt: Date;
  updatedAt: Date;
}
```

### CAApplication Model

```typescript
{
  id: string;
  applicationId: string;  // Display ID like "APP001"
  userId: ObjectId;
  serviceId: ObjectId;
  serviceType: string;
  status: 'pending' | 'in_review' | 'awaiting_clarification' | 
          'approved' | 'rejected' | 'completed';
  clientDetails: {
    clientName: string;
    businessName: string;
    gstin?: string;
    addressProof?: string;
  };
  documents: {
    aadhar?: string;
    pan?: string;
    addressProof?: string;
    [key: string]: string | undefined;
  };
  additionalInfo?: {
    businessType?: string;
    turnover?: number;
    notes?: string;
    [key: string]: any;
  };
  timeline: Array<{
    title: string;
    time: string;
    status: 'completed' | 'current' | 'pending';
    icon: string;
    timestamp?: Date;
    description?: string;
  }>;
  certificateNumber?: string;
  downloadUrl?: string;
  issuedAt?: Date;
  price: number;
  expertId?: ObjectId;  // Assigned CA expert
  submittedAt: Date;
  updatedAt: Date;
}
```

### CADocument Model

```typescript
{
  id: string;
  documentId: string;  // Display ID
  userId: ObjectId;
  applicationId?: ObjectId;
  documentType: 'aadhar' | 'pan' | 'address_proof' | 
                'business_proof' | 'other';
  documentUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  verifiedAt?: Date;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### CAChat Model

```typescript
{
  id: string;
  chatId: string;  // Display ID
  userId: ObjectId;
  expertId: ObjectId;
  applicationId?: ObjectId;
  status: 'active' | 'closed';
  startedAt: Date;
  lastMessageAt: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### CAChatMessage Model

```typescript
{
  id: string;
  messageId: string;
  chatId: ObjectId;
  senderId: ObjectId;
  senderType: 'user' | 'expert';
  message: string;
  attachments?: string[];  // File URLs
  isRead: boolean;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### CACallback Model

```typescript
{
  id: string;
  callbackId: string;
  userId: ObjectId;
  phoneNumber: string;
  preferredTime: string;
  applicationId?: ObjectId;
  reason?: string;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  requestedAt: Date;
  scheduledAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## API Endpoints

### Priority 1: Service Catalog APIs

#### 1. Get Service Categories
**Endpoint**: `GET /api/v1/ca/category`

**Headers**:
```
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "cat_name": "GST Services",
      "cat_img": "https://example.com/images/gst.jpg",
      "status": 1,
      "hasCheckmark": true
    }
  ]
}
```

**Frontend Usage**: Service categories display, main navigation

---

#### 2. Get Service Subcategories
**Endpoint**: `GET /api/v1/ca/category/:categoryId/subcategory`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "11",
      "cat_name": "GST Registration",
      "cat_img": "https://example.com/images/gst-reg.jpg",
      "status": 1,
      "parentCategoryId": "1"
    }
  ]
}
```

**Frontend Usage**: Subcategory listing after category selection

---

#### 3. Get Services by Category/Subcategory
**Endpoint**: `GET /api/v1/ca/services?categoryId=1&subcategoryId=11&page=1&limit=20`

**Query Parameters**:
- `categoryId`: string (optional)
- `subcategoryId`: string (optional)
- `page`: number (default: 1)
- `limit`: number (default: 20)

**Response**:
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "id": "101",
        "title": "GST Registration for New Business",
        "description": "Complete GST registration process...",
        "logo": "https://example.com/images/gst-reg-service.jpg",
        "price": 999,
        "cross_price": 1499,
        "categoryId": "1",
        "subcategoryId": "11",
        "estimatedTime": "7-10 days",
        "isActive": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

---

#### 4. Get Service Details
**Endpoint**: `GET /api/v1/ca/services/:serviceId`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "101",
    "title": "GST Registration for New Business",
    "description": "Complete GST registration process...",
    "logo": "https://example.com/images/gst-reg-service.jpg",
    "price": 999,
    "cross_price": 1499,
    "categoryId": "1",
    "subcategoryId": "11",
    "estimatedTime": "7-10 days",
    "features": [
      "Expert CA guidance",
      "Document verification",
      "Application submission",
      "Status tracking"
    ],
    "requiredDocuments": [
      {
        "name": "Aadhar Card",
        "type": "aadhar",
        "isRequired": true
      }
    ],
    "processSteps": [
      "Fill application form",
      "Upload documents",
      "CA review",
      "Application submission",
      "Certificate delivery"
    ]
  }
}
```

---

#### 5. Get GST Service Tabs
**Endpoint**: `GET /api/v1/ca/services/gst/tabs`

**Response**:
```json
{
  "success": true,
  "data": {
    "tabs": [
      {
        "id": "gst_registration",
        "name": "GST Registration",
        "isActive": true
      },
      {
        "id": "gst_filing",
        "name": "GST Filing",
        "isActive": true
      }
    ]
  }
}
```

---

### Priority 2: Application Management APIs

#### 6. Submit Service Application
**Endpoint**: `POST /api/v1/ca/applications`

**Request Body**:
```json
{
  "serviceId": "101",
  "serviceType": "gst_registration",
  "clientDetails": {
    "clientName": "John Doe",
    "businessName": "ABC Business Pvt Ltd",
    "gstin": "29ABCDE1234F1Z5",
    "addressProof": "Address proof text"
  },
  "documents": {
    "aadhar": "https://example.com/uploads/aadhar_12345.pdf",
    "pan": "https://example.com/uploads/pan_12345.pdf"
  },
  "additionalInfo": {
    "businessType": "private_limited",
    "turnover": 5000000,
    "notes": "Additional information"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "applicationId": "APP000001",
    "serviceId": "101",
    "serviceTitle": "GST Registration for New Business",
    "status": "pending",
    "submittedAt": "2024-01-01T10:30:00.000Z",
    "estimatedCompletionTime": "7-10 days"
  }
}
```

---

#### 7. Upload Document
**Endpoint**: `POST /api/v1/ca/documents/upload`

**Request**: Multipart form data
- `file`: File (required) - PDF, JPG, or PNG
- `documentType`: `"aadhar"` | `"pan"` | `"address_proof"` | `"business_proof"` | `"other"` (required)
- `applicationId`: string (optional)

**Response**:
```json
{
  "success": true,
  "data": {
    "documentId": "DOC000001",
    "documentUrl": "https://example.com/uploads/ca/documents/file-1234567890.pdf",
    "documentType": "aadhar",
    "fileName": "aadhar_card.pdf",
    "fileSize": 245678,
    "uploadedAt": "2024-01-01T10:35:00.000Z"
  }
}
```

**File Requirements**:
- Max size: 10MB
- Allowed types: PDF, JPG, JPEG, PNG

---

#### 8. Get Application Status
**Endpoint**: `GET /api/v1/ca/applications/:applicationId/status`

**Response**:
```json
{
  "success": true,
  "data": {
    "applicationId": "APP000001",
    "serviceTitle": "GST Registration for New Business",
    "status": "in_review",
    "currentStatus": "In Review",
    "timeline": [
      {
        "title": "Application Submitted",
        "time": "10:30 AM",
        "status": "completed",
        "icon": "check_circle",
        "timestamp": "2024-01-01T10:30:00.000Z",
        "description": "Your application has been received"
      },
      {
        "title": "In Review",
        "time": "Current",
        "status": "current",
        "icon": "hourglass_empty",
        "timestamp": "2024-01-01T11:00:00.000Z",
        "description": "CA expert is reviewing your documents"
      }
    ],
    "canDownload": false,
    "downloadUrl": null,
    "certificateNumber": null,
    "issuedAt": null
  }
}
```

---

#### 9. Get User Applications
**Endpoint**: `GET /api/v1/ca/applications?status=pending&page=1&limit=20`

**Query Parameters**:
- `status`: `"pending"` | `"in_review"` | `"awaiting_clarification"` | `"approved"` | `"rejected"` | `"completed"` (optional)
- `serviceType`: string (optional)
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `startDate`: ISO date string (optional)
- `endDate`: ISO date string (optional)

**Response**:
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "507f1f77bcf86cd799439011",
        "applicationId": "APP000001",
        "service": "GST Registration",
        "serviceId": "101",
        "status": "Approved",
        "date": "2024-01-15",
        "submittedAt": "2024-01-01T10:30:00.000Z",
        "canDownload": true,
        "certificateNumber": "CERT123456789",
        "price": 999
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "totalPages": 1
    },
    "summary": {
      "totalApplications": 15,
      "pending": 3,
      "inReview": 2,
      "approved": 8,
      "rejected": 2
    }
  }
}
```

---

#### 10. Download Certificate/Document
**Endpoint**: `GET /api/v1/ca/applications/:applicationId/download?type=certificate`

**Query Parameters**:
- `type`: `"certificate"` | `"application"` | `"invoice"` (default: "certificate")

**Response**:
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://example.com/certificates/APP000001.pdf",
    "fileName": "Certificate_APP000001.pdf",
    "expiresAt": "2024-01-08T10:30:00.000Z"
  }
}
```

---

#### 11. Update Application Status (Admin/CA)
**Endpoint**: `PATCH /api/v1/ca/applications/:applicationId/status`

**Request Body**:
```json
{
  "status": "in_review",
  "notes": "Documents verified, proceeding with submission",
  "timelineUpdate": {
    "title": "In Review",
    "description": "CA expert is reviewing your documents",
    "icon": "hourglass_empty"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "applicationId": "APP000001",
    "status": "in_review",
    "updatedAt": "2024-01-01T16:00:00.000Z"
  }
}
```

**Note**: This is typically an admin/CA endpoint, not for regular users.

---

#### 12. Request Clarification
**Endpoint**: `POST /api/v1/ca/applications/:applicationId/clarification`

**Request Body**:
```json
{
  "message": "Please provide additional address proof",
  "requiredDocuments": ["address_proof"],
  "deadline": "2024-01-10T00:00:00.000Z"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "clarificationId": "CLAR123456",
    "applicationId": "APP000001",
    "status": "pending",
    "requestedAt": "2024-01-01T16:00:00.000Z"
  }
}
```

---

### Priority 3: Support & Communication APIs

#### 13. Start Chat with CA Expert
**Endpoint**: `POST /api/v1/ca/chat/start`

**Request Body**:
```json
{
  "applicationId": "APP000001",
  "serviceType": "gst_registration",
  "message": "Hello, I need help with my GST registration"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "chatId": "CHAT000001",
    "expertId": "EXP001",
    "expertName": "CA Expert",
    "expertImage": "https://example.com/images/ca-expert.jpg",
    "isOnline": true,
    "startedAt": "2024-01-01T15:00:00.000Z"
  }
}
```

---

#### 14. Send Chat Message
**Endpoint**: `POST /api/v1/ca/chat/:chatId/messages`

**Request Body**:
```json
{
  "message": "I need clarification on document requirements",
  "attachments": []
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "messageId": "MSG000001",
    "chatId": "CHAT000001",
    "message": "I need clarification on document requirements",
    "senderId": "USER123",
    "senderType": "user",
    "timestamp": "2024-01-01T15:05:00.000Z",
    "isRead": false
  }
}
```

---

#### 15. Get Chat Messages
**Endpoint**: `GET /api/v1/ca/chat/:chatId/messages?page=1&limit=50`

**Query Parameters**:
- `page`: number (default: 1)
- `limit`: number (default: 50)
- `before`: ISO date string (optional, for pagination)

**Response**:
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "507f1f77bcf86cd799439011",
        "message": "Hello! How can I help you?",
        "senderId": "EXP001",
        "senderType": "expert",
        "senderName": "CA Expert",
        "isUser": false,
        "timestamp": "2024-01-01T15:00:00.000Z",
        "isRead": true
      },
      {
        "id": "507f1f77bcf86cd799439012",
        "message": "I need help with GST registration",
        "senderId": "USER123",
        "senderType": "user",
        "isUser": true,
        "timestamp": "2024-01-01T15:05:00.000Z",
        "isRead": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "hasMore": false
    }
  }
}
```

---

#### 16. Get Active Chats
**Endpoint**: `GET /api/v1/ca/chat`

**Response**:
```json
{
  "success": true,
  "data": {
    "chats": [
      {
        "chatId": "CHAT000001",
        "expertId": "EXP001",
        "expertName": "CA Expert",
        "expertImage": "https://example.com/images/ca-expert.jpg",
        "lastMessage": "I need help with GST registration",
        "lastMessageTime": "2024-01-01T15:05:00.000Z",
        "unreadCount": 2,
        "isOnline": true,
        "applicationId": "APP000001"
      }
    ]
  }
}
```

---

#### 17. Request Callback
**Endpoint**: `POST /api/v1/ca/support/callback`

**Request Body**:
```json
{
  "phoneNumber": "+919876543210",
  "preferredTime": "10:00 AM - 12:00 PM",
  "applicationId": "APP000001",
  "reason": "Need clarification on GST registration process"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Callback request submitted successfully",
  "data": {
    "callbackId": "CALLBACK000001",
    "requestedAt": "2024-01-01T16:00:00.000Z",
    "estimatedCallbackTime": "Within 2 hours",
    "status": "pending"
  }
}
```

---

#### 18. Get Support Phone Number
**Endpoint**: `GET /api/v1/ca/support/phone`

**Response**:
```json
{
  "success": true,
  "data": {
    "phoneNumber": "+911234567890",
    "availableHours": "9:00 AM - 6:00 PM",
    "availableDays": "Monday - Saturday",
    "isAvailable": true
  }
}
```

---

### Priority 4: Additional Features APIs

#### 19. Get Testimonials
**Endpoint**: `GET /api/v1/ca/testimonials?type=video&limit=10`

**Query Parameters**:
- `type`: `"video"` | `"text"` (optional)
- `limit`: number (default: 10)

**Response**:
```json
{
  "success": true,
  "data": {
    "testimonials": [
      {
        "id": "1",
        "title": "Excellent GST Services",
        "type": "youtube",
        "video": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "thumbnail": "https://example.com/thumbnails/testimonial1.jpg",
        "duration": "2:30",
        "rating": 5,
        "customerName": "John Doe",
        "serviceType": "gst_registration"
      }
    ]
  }
}
```

---

#### 20. Get Recent Courses
**Endpoint**: `GET /api/v1/ca/courses?limit=10&category=gst`

**Query Parameters**:
- `limit`: number (default: 10)
- `category`: string (optional)

**Response**:
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "1",
        "title": "Learn and Earn with Demat Account",
        "thumbnail": "https://example.com/thumbnails/course1.jpg",
        "duration": "2:30",
        "category": "investment",
        "views": 1250,
        "rating": 4.5
      }
    ]
  }
}
```

---

## Workflow Examples

### Example 1: Complete Application Flow

1. **User Browses Services**
   ```
   GET /api/v1/ca/category
   → Selects "GST Services"
   → GET /api/v1/ca/category/1/subcategory
   → Selects "GST Registration"
   → GET /api/v1/ca/services?subcategoryId=11
   ```

2. **User Views Service Details**
   ```
   GET /api/v1/ca/services/101
   → Reviews features, documents, process
   ```

3. **User Submits Application**
   ```
   POST /api/v1/ca/applications
   Body: {
     serviceId: "101",
     clientDetails: {...},
     documents: {...}
   }
   → Application created with status "pending"
   → Returns applicationId: "APP000001"
   ```

4. **User Uploads Documents**
   ```
   POST /api/v1/ca/documents/upload
   Form Data: {
     file: <file>,
     documentType: "aadhar",
     applicationId: "APP000001"
   }
   → Document uploaded and linked to application
   ```

5. **User Tracks Status**
   ```
   GET /api/v1/ca/applications/APP000001/status
   → View timeline and current status
   ```

6. **Application Approved**
   ```
   PATCH /api/v1/ca/applications/APP000001/status (Admin)
   → Status changed to "approved"
   → Certificate generated
   → Timeline updated
   ```

7. **User Downloads Certificate**
   ```
   GET /api/v1/ca/applications/APP000001/download
   → Download certificate PDF
   ```

---

### Example 2: Chat Support Flow

1. **User Starts Chat**
   ```
   POST /api/v1/ca/chat/start
   Body: {
     applicationId: "APP000001",
     message: "I need help with my application"
   }
   → Chat created, expert assigned
   → Returns chatId: "CHAT000001"
   ```

2. **User Sends Messages**
   ```
   POST /api/v1/ca/chat/CHAT000001/messages
   Body: {
     message: "When will my application be reviewed?"
   }
   → Message sent
   ```

3. **User Receives Response**
   ```
   GET /api/v1/ca/chat/CHAT000001/messages
   → View all messages including expert responses
   ```

4. **User Views Active Chats**
   ```
   GET /api/v1/ca/chat
   → List of all active chat sessions
   ```

---

### Example 3: Request Callback Flow

1. **User Requests Callback**
   ```
   POST /api/v1/ca/support/callback
   Body: {
     phoneNumber: "+919876543210",
     preferredTime: "10:00 AM - 12:00 PM",
     applicationId: "APP000001"
   }
   → Callback request created
   ```

2. **CA Expert Calls Back**
   - System notifies CA expert
   - Expert calls user at preferred time
   - Status updated to "completed"

---

## Configuration

### Environment Variables

Add to `.env` file:

```env
# Base URL for generating file URLs
BASE_URL=https://yourapp.com

# CA Support Phone Number
CA_SUPPORT_PHONE=+911234567890

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760  # 10MB in bytes
UPLOAD_ALLOWED_TYPES=pdf,jpg,jpeg,png
```

### File Upload Configuration

**Storage Options**:
1. **Development**: Local file system (`uploads/ca/documents/`)
2. **Production**: Cloud storage (AWS S3, Google Cloud Storage, etc.)

**File Limits**:
- Maximum file size: 10MB
- Allowed types: PDF, JPG, JPEG, PNG
- Maximum files per application: 10

---

## File Upload System

### Upload Process

1. **Client Request**: Multipart form data with file
2. **Server Validation**: 
   - File type check
   - File size check
   - MIME type validation
3. **File Storage**: Save to configured storage
4. **Database Record**: Create CADocument record
5. **Response**: Return document URL and metadata

### Storage Structure

```
uploads/
└── ca/
    └── documents/
        ├── file-1234567890.pdf
        ├── file-1234567891.jpg
        └── file-1234567892.png
```

### Production Considerations

For production, implement:
- Cloud storage integration (S3, GCS, Azure Blob)
- Signed URLs for secure access
- CDN for fast delivery
- Virus scanning
- File compression
- Automatic cleanup of old files

---

## Status Management

### Application Status Flow

```
pending
  ↓
in_review
  ↓
  ├───▶ awaiting_clarification ──▶ (user responds) ──▶ in_review
  │
  ├───▶ approved ──▶ completed
  │
  └───▶ rejected
```

### Status Descriptions

- **pending**: Application submitted, awaiting initial review
- **in_review**: CA expert is reviewing documents
- **awaiting_clarification**: Additional information required from user
- **approved**: Application approved, certificate generated
- **rejected**: Application rejected (with reason)
- **completed**: Service completed and delivered

### Timeline Auto-Update

The system automatically updates timeline when:
- Application status changes
- Expert adds notes
- Clarification requested
- Certificate generated

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "message": "Error message",
  "error": "ERROR_CODE",
  "details": {}  // Optional additional error details
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Invalid input data
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `FILE_TOO_LARGE`: File exceeds size limit
- `INVALID_FILE_TYPE`: File type not allowed
- `CERTIFICATE_NOT_READY`: Certificate not available yet
- `SERVICE_UNAVAILABLE`: CA expert not available

---

## Security Considerations

### Authentication
- All endpoints require JWT authentication
- Admin endpoints require additional role verification

### File Upload Security
- File type validation
- File size limits
- Virus scanning (recommended)
- Secure file storage
- Access control on downloads

### Data Protection
- Encrypt sensitive client information
- Secure document storage
- HTTPS for all communications
- Regular security audits

---

## Best Practices

### For Developers

1. **Error Handling**: Always handle errors gracefully
2. **Validation**: Validate all inputs before processing
3. **Logging**: Log important events for debugging
4. **Testing**: Test all endpoints thoroughly
5. **Documentation**: Keep API documentation updated

### For Administrators

1. **Monitor Applications**: Regularly check pending applications
2. **Expert Assignment**: Ensure experts are properly assigned
3. **Response Times**: Maintain quick response times
4. **File Management**: Regularly clean up old files
5. **Backup**: Regular database and file backups

### For CA Experts

1. **Review Promptly**: Review applications within SLA
2. **Clear Communication**: Provide clear feedback in chat
3. **Document Verification**: Thoroughly verify all documents
4. **Status Updates**: Update status promptly
5. **Customer Service**: Maintain professional communication

---

## Rate Limiting

### Recommended Limits

- **Application Submission**: 5 per hour per user
- **Document Upload**: 10 per hour per user
- **Chat Messages**: 30 per minute per user
- **API Calls**: 1000 per 15 minutes per user

---

## Notification Requirements

### Email/SMS Notifications

Send notifications when:
- Application submitted
- Application status changes
- Clarification requested
- Certificate ready for download
- CA expert responds to chat
- Callback scheduled

### Notification Templates

1. **Application Submitted**: Confirmation with application ID
2. **Status Update**: New status with timeline update
3. **Clarification Request**: Details of required information
4. **Certificate Ready**: Download link and instructions
5. **Chat Response**: New message notification
6. **Callback Scheduled**: Time and expert details

---

## Database Indexes

### Optimized Queries

The system includes indexes for:
- User applications lookup
- Status-based filtering
- Service category queries
- Chat message retrieval
- Document verification status

### Index Strategy

```javascript
// Application indexes
{ userId: 1, status: 1 }
{ serviceType: 1, status: 1 }
{ expertId: 1, status: 1 }

// Document indexes
{ userId: 1, applicationId: 1 }
{ verificationStatus: 1 }

// Chat indexes
{ userId: 1, status: 1 }
{ chatId: 1, timestamp: -1 }
```

---

## Testing Checklist

### API Testing

- [ ] Service catalog endpoints
- [ ] Application submission
- [ ] Document upload
- [ ] Status tracking
- [ ] Chat functionality
- [ ] Certificate download
- [ ] Error handling
- [ ] Authentication
- [ ] Validation
- [ ] Pagination

### Integration Testing

- [ ] Complete application flow
- [ ] Chat with expert
- [ ] Document verification
- [ ] Status updates
- [ ] Certificate generation
- [ ] Notification delivery

---

## Troubleshooting

### Common Issues

1. **File Upload Fails**
   - Check file size (max 10MB)
   - Verify file type (PDF, JPG, PNG only)
   - Check uploads directory permissions

2. **Application Not Found**
   - Verify applicationId format
   - Check user ownership
   - Ensure application exists

3. **Chat Not Starting**
   - Check expert availability
   - Verify user authentication
   - Check chat limits

4. **Certificate Not Downloadable**
   - Verify application status is "approved"
   - Check certificate generation
   - Verify download URL

---

## Summary

The CA Services System provides a complete solution for:
- ✅ Service catalog browsing
- ✅ Application submission and tracking
- ✅ Document management
- ✅ Real-time status updates
- ✅ Expert chat support
- ✅ Certificate generation and download
- ✅ Callback requests
- ✅ Educational content

All processes are automated, secure, and designed to provide excellent user experience while maintaining efficiency for CA experts and administrators.

