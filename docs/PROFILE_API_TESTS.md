# User Profile API - Testing Guide

## Prerequisites
1. Server running on `http://localhost:3232`
2. Valid JWT token (login first to get token)
3. MongoDB connected

## Test Sequence

### 1. Login to Get Token
```bash
curl -X POST http://localhost:3232/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "yourpassword"
  }'
```

Save the token from response.

---

### 2. Get User Profile
```bash
curl -X GET http://localhost:3232/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "status": true,
  "message": "User profile retrieved successfully",
  "data": {
    "_id": "...",
    "firstname": "John",
    "lastname": "Doe",
    "email": "test@example.com",
    "mobilenumber": 9876543210,
    "profilePicture": null,
    "userRole": 0,
    "isVerified": true
  }
}
```

---

### 3. Update Profile
```bash
curl -X PUT http://localhost:3232/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "firstname": "Jane",
    "lastname": "Smith",
    "mobilenumber": 9123456789
  }'
```

**Expected Response:**
```json
{
  "status": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "...",
    "firstname": "Jane",
    "lastname": "Smith",
    "mobilenumber": 9123456789
  }
}
```

---

### 4. Upload Profile Picture
```bash
curl -X POST http://localhost:3232/api/profile/picture \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "profilePicture=@/path/to/your/image.jpg"
```

**Expected Response:**
```json
{
  "status": true,
  "message": "Profile picture uploaded successfully",
  "data": {
    "profilePicture": "https://supabase.co/storage/profile-pictures/123456.jpg"
  }
}
```

---

## Postman Collection

### Setup
1. Create new collection "User Profile API"
2. Add environment variable `baseUrl` = `http://localhost:3232`
3. Add environment variable `token` = your JWT token

### Requests

#### 1. Get Profile
- **Method**: GET
- **URL**: `{{baseUrl}}/api/profile`
- **Headers**: 
  - `Authorization`: `Bearer {{token}}`

#### 2. Update Profile
- **Method**: PUT
- **URL**: `{{baseUrl}}/api/profile`
- **Headers**: 
  - `Authorization`: `Bearer {{token}}`
  - `Content-Type`: `application/json`
- **Body** (raw JSON):
```json
{
  "firstname": "Updated Name",
  "mobilenumber": 9876543210
}
```

#### 3. Upload Picture
- **Method**: POST
- **URL**: `{{baseUrl}}/api/profile/picture`
- **Headers**: 
  - `Authorization`: `Bearer {{token}}`
- **Body** (form-data):
  - Key: `profilePicture`
  - Type: File
  - Value: Select image file

---

## Error Testing

### Test Invalid Token
```bash
curl -X GET http://localhost:3232/api/profile \
  -H "Authorization: Bearer invalid_token"
```

**Expected**: 401 Unauthorized

### Test Missing File Upload
```bash
curl -X POST http://localhost:3232/api/profile/picture \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected**: 400 Bad Request - "No file uploaded"

### Test Invalid Mobile Number
```bash
curl -X PUT http://localhost:3232/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "mobilenumber": 123
  }'
```

**Expected**: 400 Bad Request - Validation error

---

## Production Testing (Render)

Replace `http://localhost:3232` with `https://sarvatrah-backend.onrender.com`

```bash
curl -X GET https://sarvatrah-backend.onrender.com/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
