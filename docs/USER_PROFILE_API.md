# User Profile API Documentation

## Base URL
```
/api/profile
```

## Authentication
All endpoints require authentication. Include the JWT token in the request:
- **Cookie**: `auth_token`
- **Header**: `Authorization: Bearer <token>`

---

## Endpoints

### 1. Get User Profile

**GET** `/api/profile`

Retrieves the authenticated user's profile information.

#### Request
```bash
curl -X GET http://localhost:3232/api/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response (200 OK)
```json
{
  "status": true,
  "message": "User profile retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "firstname": "John",
    "lastname": "Doe",
    "email": "john.doe@example.com",
    "mobilenumber": 9876543210,
    "profilePicture": "https://supabase.co/storage/profile-pictures/123.jpg",
    "userRole": 0,
    "isVerified": true,
    "authProvider": "password",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T14:45:00.000Z"
  }
}
```

#### Error Responses
- **401 Unauthorized**: No token or invalid token
- **404 Not Found**: User not found
- **500 Internal Server Error**: Server error

---

### 2. Update User Profile

**PUT** `/api/profile`

Updates the authenticated user's profile information.

#### Request Body
```json
{
  "firstname": "John",
  "lastname": "Doe",
  "mobilenumber": 9876543210
}
```

**Note**: All fields are optional. Only send the fields you want to update.

#### Validation Rules
- `firstname`: String, 1-50 characters
- `lastname`: String, 1-50 characters
- `mobilenumber`: Number, 10 digits (1000000000 - 9999999999)

#### Request Example
```bash
curl -X PUT http://localhost:3232/api/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstname": "John",
    "lastname": "Smith",
    "mobilenumber": 9876543210
  }'
```

#### Response (200 OK)
```json
{
  "status": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "firstname": "John",
    "lastname": "Smith",
    "email": "john.doe@example.com",
    "mobilenumber": 9876543210,
    "profilePicture": "https://supabase.co/storage/profile-pictures/123.jpg",
    "userRole": 0,
    "isVerified": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T15:00:00.000Z"
  }
}
```

#### Error Responses
- **400 Bad Request**: Validation error
- **401 Unauthorized**: No token or invalid token
- **404 Not Found**: User not found
- **500 Internal Server Error**: Server error

---

### 3. Upload Profile Picture

**POST** `/api/profile/picture`

Uploads a profile picture for the authenticated user.

#### Request
- **Content-Type**: `multipart/form-data`
- **Field Name**: `profilePicture`
- **Accepted Formats**: JPEG, PNG, WebP
- **Max File Size**: 10MB

#### Request Example (cURL)
```bash
curl -X POST http://localhost:3232/api/profile/picture \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "profilePicture=@/path/to/image.jpg"
```

#### Request Example (JavaScript/Fetch)
```javascript
const formData = new FormData();
formData.append('profilePicture', fileInput.files[0]);

fetch('http://localhost:3232/api/profile/picture', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

#### Response (200 OK)
```json
{
  "status": true,
  "message": "Profile picture uploaded successfully",
  "data": {
    "profilePicture": "https://supabase.co/storage/profile-pictures/1234567890.jpg"
  }
}
```

#### Error Responses
- **400 Bad Request**: No file uploaded or invalid file type
- **401 Unauthorized**: No token or invalid token
- **404 Not Found**: User not found
- **500 Internal Server Error**: Server error or upload failed

---

## Rate Limiting

- **General endpoints** (GET, PUT): 25 requests per minute
- **Upload endpoint** (POST /picture): 10 requests per minute

---

## Notes

1. **Profile Picture Storage**: Images are uploaded to Supabase storage with fallback to local storage if Supabase fails.

2. **Security**: 
   - Password and tokens are never returned in responses
   - All endpoints require authentication
   - File uploads are validated for type and size

3. **User Roles**:
   - 0 = User
   - 1 = Product Manager
   - 2 = Booking Operator
   - 3 = Super Admin

4. **Email Updates**: Email cannot be updated through this API for security reasons. Contact admin for email changes.

---

## Example Integration

### React Example
```javascript
import { useState, useEffect } from 'react';

function UserProfile() {
  const [profile, setProfile] = useState(null);
  const token = localStorage.getItem('auth_token');

  // Get profile
  useEffect(() => {
    fetch('http://localhost:3232/api/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => setProfile(data.data));
  }, []);

  // Update profile
  const updateProfile = async (updates) => {
    const response = await fetch('http://localhost:3232/api/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    const data = await response.json();
    setProfile(data.data);
  };

  // Upload picture
  const uploadPicture = async (file) => {
    const formData = new FormData();
    formData.append('profilePicture', file);

    const response = await fetch('http://localhost:3232/api/profile/picture', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    const data = await response.json();
    setProfile(prev => ({ ...prev, profilePicture: data.data.profilePicture }));
  };

  return (
    <div>
      {profile && (
        <>
          <img src={profile.profilePicture} alt="Profile" />
          <h2>{profile.firstname} {profile.lastname}</h2>
          <p>{profile.email}</p>
        </>
      )}
    </div>
  );
}
```
