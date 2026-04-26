# Bunny.net Image Upload for Services - Implementation Guide

## Overview
The Services page now supports uploading portfolio images to Bunny.net CDN. When users add a new service, they can upload up to 4 portfolio images that are stored on Bunny.net and the URLs are saved with the service data in Firestore.

## How It Works

### 1. Image Selection
- Users can select up to 4 portfolio images when creating a service
- Images are selected through the file input in the Add Service modal
- Preview thumbnails are shown immediately after selection

### 2. Upload Process
When the user clicks "Save Service":

1. **Validation**: Checks if user is logged in and required fields are filled
2. **Image Upload**: All selected images are uploaded to Bunny.net in parallel
   - Files are uploaded to: `tenant_{userId}/services/{timestamp}-{filename}`
   - Uses PUT request with AccessKey authentication
3. **URL Collection**: Successful upload URLs are collected
4. **Service Creation**: Service data including `portfolioImages` array is saved to Firestore

### 3. Storage Structure
```
Bunny.net Storage Zone:
└── tenant_{userId}/
    └── services/
        ├── 1234567890-image1.jpg
        ├── 1234567891-image2.png
        └── ...

Firestore (services collection):
{
  id: "service_id",
  tenantId: "tenant_userId",
  name: "Service Name",
  portfolioImages: [
    "https://zone.b-cdn.net/tenant_userId/services/1234567890-image1.jpg",
    "https://zone.b-cdn.net/tenant_userId/services/1234567891-image2.png"
  ],
  ...
}
```

## Configuration Required

Add these environment variables to your `.env.local` file:

```env
# Bunny.net Storage Configuration
NEXT_PUBLIC_BUNNY_STORAGE_HOST=storage.bunnycdn.com
NEXT_PUBLIC_BUNNY_STORAGE_ZONE=your_storage_zone_name
BUNNY_API_KEY=your_bunny_api_key
NEXT_PUBLIC_BUNNY_CDN_URL=https://your_zone_name.b-cdn.net
```

### Getting Bunny.net Credentials

1. **Create a Storage Zone** at [bunnycdn.com](https://bunnycdn.com/)
2. **Get your API Key** from Account Settings → API Keys
3. **Find your Storage Zone name** in the Storage Zones dashboard
4. **Your CDN URL** will be: `https://{zone_name}.b-cdn.net`

## Code Flow

### File: `src/app/(app)/services/components/AddServiceButton.tsx`

**Key Functions:**

1. **`handleImageSelect`** (lines 327-334)
   - Handles file input change
   - Stores selected files in state

2. **`removeImage`** (lines 337-341)
   - Removes image from selection
   - Updates state array

3. **`saveService`** (lines 344-444)
   - Main save function
   - Uploads images to Bunny.net (lines 391-411)
   - Saves service with image URLs to Firestore (line 432)

**Upload Code:**
```typescript
// Upload portfolio images
let portfolioImageUrls: string[] = [];
const validImages = portfolioImages.filter(img => img != null);

if (validImages.length > 0) {
  setUploadingImages(true);
  try {
    const uploadPromises = validImages.map(img => 
      bunnyStorage.uploadFile(user, img, "services")
    );
    
    const uploadResults = await Promise.all(uploadPromises);
    portfolioImageUrls = uploadResults
      .filter(result => result.success && result.url)
      .map(result => result.url!);
    
    console.log("Uploaded portfolio images:", portfolioImageUrls);
  } catch (error) {
    console.error("Error uploading images:", error);
    alert("Failed to upload images. Please try again.");
    return;
  } finally {
    setUploadingImages(false);
  }
}
```

### File: `src/lib/storage.ts`

**Bunny.net Storage Service:**

- **`uploadFile`** (lines 33-109): Handles file upload to Bunny.net
  - Generates unique filename with timestamp
  - Uploads using PUT request with AccessKey
  - Returns CDN URL on success
  
- **`deleteFile`** (lines 111-133): Deletes file from Bunny.net
- **`getFileUrl`** (lines 136-142): Generates CDN URL for a file

### File: `src/app/(app)/services/components/ViewServiceModal.tsx`

**Display Portfolio Images** (lines 234-254):
```typescript
{service.portfolioImages && service.portfolioImages.length > 0 && (
  <div className="form-section">
    <div className="section-title">
      <i className="fas fa-images"></i>
      Portfolio Photos
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {service.portfolioImages.map((imageUrl, idx) => (
        <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-[#f8fafc]">
          <img
            src={imageUrl}
            alt={`Portfolio ${idx + 1}`}
            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
            onClick={() => window.open(imageUrl, '_blank')}
          />
        </div>
      ))}
    </div>
  </div>
)}
```

## Features

✅ **Parallel Uploads**: Multiple images uploaded simultaneously for faster performance  
✅ **Error Handling**: Graceful failure with user-friendly error messages  
✅ **Loading States**: Shows "Uploading..." during image upload  
✅ **Image Preview**: Thumbnails shown before upload  
✅ **Remove Images**: Users can remove selected images before saving  
✅ **CDN Delivery**: Images served via Bunny.net CDN for fast loading  
✅ **Tenant Isolation**: Each user's images stored in separate tenant folder  
✅ **Unique Filenames**: Timestamp-based naming prevents conflicts  

## Testing

To test the implementation:

1. Ensure Bunny.net credentials are set in `.env.local`
2. Start the development server: `npm run dev`
3. Navigate to Services page
4. Click "Add Service"
5. Fill in service details
6. Upload portfolio images (up to 4)
7. Click "Save Service"
8. Verify images appear in the View Service modal

## Troubleshooting

### Images Not Uploading

1. **Check Console Logs**: Look for errors in browser console
2. **Verify Credentials**: Ensure all Bunny.net env vars are set correctly
3. **Check Network Tab**: Inspect PUT requests to Bunny.net
4. **API Key Permissions**: Ensure API key has write access to storage zone

### Common Errors

- **"Bunny Storage not configured"**: Missing environment variables
- **"Upload failed: 401"**: Invalid API key or storage zone name
- **"Upload failed: 403"**: API key lacks permissions
- **"CORS error"**: Check storage zone CORS settings in Bunny.net dashboard

## Future Enhancements

Potential improvements:
- [ ] Image compression before upload
- [ ] Progress indicators for each image
- [ ] Drag-and-drop image upload
- [ ] Image cropping/editing
- [ ] Automatic thumbnail generation
- [ ] Lazy loading for portfolio images
- [ ] Image optimization (WebP conversion)

## Security Notes

⚠️ **Important**: The BUNNY_API_KEY is exposed in client-side code. Consider:
- Using server-side upload proxy for production
- Implementing upload tokens/signatures
- Setting appropriate CORS policies
- Restricting API key permissions to specific operations

For production use, consider implementing a server-side upload endpoint that handles the actual Bunny.net upload to keep the API key secure.
