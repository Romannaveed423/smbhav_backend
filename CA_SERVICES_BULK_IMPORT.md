# CA Services - Bulk Import Feature

## Overview

The bulk import feature allows admins to upload Excel (.xlsx, .xls) or CSV (.csv) files to add multiple categories and subcategories at once, saving time when setting up the CA Services hierarchy.

## API Endpoints

### 1. Bulk Import Categories
**Endpoint:** `POST /api/v1/ca/bulk-import/categories`

**Authentication:** Required (Admin only)

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Form data with `file` field containing Excel/CSV file

**Example using cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/ca/bulk-import/categories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@categories.xlsx"
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully imported 5 categories",
  "data": {
    "totalRows": 6,
    "imported": 5,
    "failed": 1,
    "errors": [
      {
        "row": 3,
        "data": { "cat_name": "", "cat_img": "..." },
        "errors": ["Category/Subcategory name (cat_name) is required"]
      }
    ]
  }
}
```

### 2. Bulk Import Subcategories
**Endpoint:** `POST /api/v1/ca/bulk-import/subcategories`

**Authentication:** Required (Admin only)

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Form data with `file` field containing Excel/CSV file

**Example using cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/ca/bulk-import/subcategories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@subcategories.xlsx"
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully imported 8 subcategories",
  "data": {
    "totalRows": 10,
    "imported": 8,
    "failed": 2,
    "errors": [
      {
        "row": 5,
        "data": { "cat_name": "GST Filing", "parentCategoryName": "Invalid Category" },
        "error": "Parent category \"Invalid Category\" not found"
      }
    ]
  }
}
```

## File Format

### Categories File Format

**Required Columns:**
- `cat_name` - Category name (required)
- `cat_img` - Category image URL (required)

**Optional Columns:**
- `description` - Category description
- `order` - Display order (number, default: 0)
- `status` - Active status (1/0 or "Active"/"Inactive", default: 1)

**Example Excel/CSV:**

| cat_name | cat_img | description | order | status |
|----------|---------|-------------|-------|--------|
| GST | https://example.com/gst.jpg | GST Services | 1 | 1 |
| Income Tax | https://example.com/income-tax.jpg | Income Tax Services | 2 | Active |
| Company Registration | https://example.com/company.jpg | Company Registration | 3 | 1 |

### Subcategories File Format

**Required Columns:**
- `cat_name` - Subcategory name (required)
- `cat_img` - Subcategory image URL (required)
- `parentCategoryId` OR `parentCategoryName` - Parent category (required)

**Optional Columns:**
- `description` - Subcategory description
- `order` - Display order (number, default: 0)
- `status` - Active status (1/0 or "Active"/"Inactive", default: 1)
- `level` - Hierarchy level (default: "subcategory")

**Example Excel/CSV:**

| cat_name | cat_img | parentCategoryName | description | order | status |
|----------|---------|-------------------|-------------|-------|--------|
| GST Registration | https://example.com/gst-reg.jpg | GST | Register for GST | 1 | 1 |
| GST Filing | https://example.com/gst-filing.jpg | GST | File GST returns | 2 | Active |
| ITR Filing | https://example.com/itr.jpg | Income Tax | File Income Tax Returns | 1 | 1 |
| PAN Services | https://example.com/pan.jpg | Income Tax | PAN Card Services | 2 | 1 |

**Note:** You can use either `parentCategoryId` (MongoDB ObjectId) or `parentCategoryName` (exact name match). Using `parentCategoryName` is recommended as it's more readable.

## File Requirements

1. **File Types Supported:**
   - Excel: `.xlsx`, `.xls`
   - CSV: `.csv`

2. **File Size Limit:** 10MB

3. **File Structure:**
   - First row should contain column headers
   - Each subsequent row represents one category/subcategory
   - Empty rows are ignored

## Validation Rules

### Categories
- `cat_name`: Required, non-empty string
- `cat_img`: Required, non-empty string (URL)
- `order`: Optional, must be a number
- `status`: Optional, accepts: 1, 0, "Active", "Inactive"

### Subcategories
- `cat_name`: Required, non-empty string
- `cat_img`: Required, non-empty string (URL)
- `parentCategoryId` OR `parentCategoryName`: Required
  - If using `parentCategoryId`, must be a valid MongoDB ObjectId
  - If using `parentCategoryName`, must exactly match an existing category name
- `order`: Optional, must be a number
- `status`: Optional, accepts: 1, 0, "Active", "Inactive"

## Error Handling

The bulk import process:
1. Validates all rows
2. Separates valid and invalid rows
3. Inserts only valid rows
4. Returns detailed error information for failed rows

**Error Response Format:**
```json
{
  "success": false,
  "message": "No valid categories found in file",
  "data": {
    "totalRows": 5,
    "valid": 0,
    "invalid": 5,
    "errors": [
      {
        "row": 2,
        "data": { "cat_name": "", "cat_img": "..." },
        "errors": ["Category/Subcategory name (cat_name) is required"]
      },
      {
        "row": 3,
        "data": { "cat_name": "GST", "cat_img": "" },
        "errors": ["Category/Subcategory image (cat_img) is required"]
      }
    ]
  }
}
```

## Admin Panel UI Integration

### Upload Button
Add an "Import from Excel/CSV" button in the Categories and Subcategories management pages.

### Upload Modal
```
┌─────────────────────────────────────────┐
│  Bulk Import Categories                 │
├─────────────────────────────────────────┤
│  Select File:                            │
│  [Choose File] categories.xlsx           │
│                                         │
│  Supported formats: .xlsx, .xls, .csv  │
│  Max file size: 10MB                    │
│                                         │
│  [Download Template]                    │
│                                         │
│  [Cancel]  [Upload & Import]           │
└─────────────────────────────────────────┘
```

### Import Results Modal
```
┌─────────────────────────────────────────┐
│  Import Results                         │
├─────────────────────────────────────────┤
│  ✅ Successfully imported: 5            │
│  ❌ Failed: 1                            │
│                                         │
│  Errors:                                │
│  Row 3: Category name is required      │
│                                         │
│  [Download Error Report] [Close]       │
└─────────────────────────────────────────┘
```

## Sample Template Files

### Categories Template (categories_template.csv)
```csv
cat_name,cat_img,description,order,status
GST,https://example.com/gst.jpg,GST Services,1,1
Income Tax,https://example.com/income-tax.jpg,Income Tax Services,2,1
Company Registration,https://example.com/company.jpg,Company Registration,3,1
```

### Subcategories Template (subcategories_template.csv)
```csv
cat_name,cat_img,parentCategoryName,description,order,status
GST Registration,https://example.com/gst-reg.jpg,GST,Register for GST,1,1
GST Filing,https://example.com/gst-filing.jpg,GST,File GST returns,2,1
ITR Filing,https://example.com/itr.jpg,Income Tax,File Income Tax Returns,1,1
PAN Services,https://example.com/pan.jpg,Income Tax,PAN Card Services,2,1
```

## Implementation Notes

1. **File Cleanup:** Uploaded files are automatically deleted after processing
2. **Transaction Safety:** Uses `insertMany` with `ordered: false` to continue inserting even if some rows fail
3. **Parent Resolution:** For subcategories, parent categories are resolved by name (case-insensitive) or ID
4. **Error Reporting:** Detailed error messages include row numbers and specific validation failures

## Testing

Test the bulk import with sample files:

```bash
# Test categories import
curl -X POST http://localhost:3000/api/v1/ca/bulk-import/categories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test_categories.xlsx"

# Test subcategories import
curl -X POST http://localhost:3000/api/v1/ca/bulk-import/subcategories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test_subcategories.csv"
```

## Dependencies

- `xlsx` - For parsing Excel files
- `csv-parser` - For parsing CSV files
- `multer` - For handling file uploads

