# Redundant File Storage - Setup Guide

## Overview

Your file storage system now has **redundant storage** for high availability:

- **Primary Storage**: UploadThing (fast CDN, easy uploads)
- **Backup Storage**: AWS S3 or Cloudflare R2 (your own infrastructure)

Every file uploaded is stored in **BOTH** locations automatically!

## How It Works

```
User uploads file
       ↓
UploadThing receives file (PRIMARY)
       ↓
Server downloads from UploadThing
       ↓
Server processes (optimize, thumbnails, virus scan)
       ↓
Server uploads to S3/R2 (BACKUP)
       ↓
Database stores BOTH URLs
```

## Benefits

✅ **High Availability**: If UploadThing goes down, files still accessible from S3/R2  
✅ **Disaster Recovery**: Complete backup of all files  
✅ **Image Optimization**: Backup version is optimized and has thumbnails  
✅ **Virus Scanning**: Files are scanned before backup  
✅ **Cost Optimization**: Use UploadThing CDN for speed, S3 for reliability

## Setup Instructions

### 1. Configure AWS S3 (or Cloudflare R2)

Add to your `.env` file:

```bash
# Storage Provider
STORAGE_PROVIDER="s3"  # or "r2"

# AWS S3
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="your-bucket-name"

# OR Cloudflare R2
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET="your-bucket-name"
```

### 2. Test Upload

1. Go to any channel in your app
2. Upload a file using the chat interface
3. Check the server logs - you should see:

```
Primary storage (UploadThing): https://uploadthing.com/...
Backup storage (S3/R2): https://your-bucket.s3.amazonaws.com/...
File stored redundantly:
  - Primary: https://uploadthing.com/...
  - Backup: https://your-bucket.s3.amazonaws.com/...
  - Thumbnail: https://your-bucket.s3.amazonaws.com/thumbnails/...
```

### 3. Verify in Database

```sql
SELECT name, url, "backupUrl", "thumbnailUrl"
FROM file
ORDER BY "createdAt" DESC
LIMIT 5;
```

You should see both `url` (UploadThing) and `backupUrl` (S3/R2) populated.

## Using Failover

If UploadThing goes down, use the failover utility:

```typescript
import { getFileUrl } from "@/lib/file-failover";

// Automatically use backup if primary fails
const file = await prisma.file.findUnique({ where: { id: fileId } });
const workingUrl = await getFileUrl(file);

// Or prefer backup (useful for testing)
const backupUrl = await getFileUrl(file, true);
```

## What Happens on Upload

1. **User uploads** → UploadThing receives file
2. **UploadThing callback** → Server is notified
3. **Server downloads** → Gets file from UploadThing
4. **Image processing** (if image):
   - Optimize (WebP, 80% quality)
   - Resize (max 2048x2048)
   - Generate thumbnails (150px, 300px, 600px)
5. **Upload to S3/R2** → Backup copy created
6. **Virus scan** (async) → Scans file in background
7. **Database record** → Stores both URLs
8. **If infected** → Deletes from both storages

## Error Handling

- ✅ **Backup fails** → Primary upload still succeeds
- ✅ **Primary fails** → Upload fails (UploadThing is required)
- ✅ **Virus detected** → Deleted from both storages
- ✅ **Image processing fails** → Original uploaded to backup

## Monitoring

Check storage health:

```typescript
import { checkStorageHealth } from "@/lib/file-failover";

const health = await checkStorageHealth();
console.log("Primary available:", health.primary.available);
console.log("Backup available:", health.backup.available);
```

## Cost Considerations

**UploadThing**:

- Pays for CDN and bandwidth
- Fast global delivery
- Easy integration

**S3/R2**:

- You pay for storage (~$0.023/GB/month)
- Backup and disaster recovery
- Optimized versions saved

**Recommendation**: Keep both! UploadThing for speed, S3/R2 for reliability.

## Troubleshooting

**Backup uploads failing?**

- Check AWS credentials in `.env`
- Verify bucket exists and has correct permissions
- Check server logs for specific errors

**Files only in primary?**

- Backup is best-effort - primary always succeeds
- Check if AWS credentials are configured
- Look for errors in server logs

**Want to test failover?**

```typescript
// Force use of backup URL
const backupUrl = await getFileUrl(file, true);
```

## Future Enhancements

- [ ] Automatic sync if backup fails initially
- [ ] Periodic health checks and alerts
- [ ] Automatic migration from UploadThing to S3 only
- [ ] Backup verification (ensure files match)
- [ ] Cost analytics (track storage costs)

---

**You now have enterprise-grade redundant file storage! 🎉**
