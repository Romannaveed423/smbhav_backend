const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const CAServiceCategory = require('./dist/models/CAServiceCategory').CAServiceCategory;
const CAFormSchema = require('./dist/models/CAFormSchema').CAFormSchema;
const CAFormEntry = require('./dist/models/CAFormEntry').CAFormEntry;
const User = require('./dist/models/User').User;

const connectDB = async () => {
  try {
    const dbUrl = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/sombhav';
    await mongoose.connect(dbUrl);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    await connectDB();

    // Get or create test user
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      console.log('Creating test user...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('test123', 10);
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        phone: '9876543210',
        password: hashedPassword,
      });
    }
    console.log(`Using user: ${testUser.email} (ID: ${testUser._id})`);

    // Clear existing CA data (optional)
    console.log('Clearing existing CA data...');
    await CAServiceCategory.deleteMany({});
    await CAFormSchema.deleteMany({});
    await CAFormEntry.deleteMany({});
    console.log('Existing CA data cleared');

    // 1. Create Categories (Level 1)
    console.log('Creating categories...');
    const categories = await CAServiceCategory.insertMany([
      {
        cat_name: 'GST',
        cat_img: 'https://example.com/images/gst.jpg',
        status: 1,
        level: 'category',
        order: 1,
        description: 'GST Registration, Filing, and Compliance Services',
      },
      {
        cat_name: 'Income Tax',
        cat_img: 'https://example.com/images/income-tax.jpg',
        status: 1,
        level: 'category',
        order: 2,
        description: 'Income Tax Return Filing and PAN Services',
      },
      {
        cat_name: 'Company Registration',
        cat_img: 'https://example.com/images/company-registration.jpg',
        status: 1,
        level: 'category',
        order: 3,
        description: 'Company and Business Registration Services',
      },
    ]);
    console.log(`Created ${categories.length} categories`);

    // 2. Create Subcategories (Level 2)
    console.log('Creating subcategories...');
    const gstSubcategories = await CAServiceCategory.insertMany([
      {
        cat_name: 'GST Registration',
        cat_img: 'https://example.com/images/gst-registration.jpg',
        status: 1,
        level: 'subcategory',
        parentCategoryId: categories[0]._id,
        order: 1,
        description: 'Register for GST with different business types',
      },
      {
        cat_name: 'GST Filing',
        cat_img: 'https://example.com/images/gst-filing.jpg',
        status: 1,
        level: 'subcategory',
        parentCategoryId: categories[0]._id,
        order: 2,
        description: 'File GST returns monthly or quarterly',
      },
      {
        cat_name: 'GST Cancellation',
        cat_img: 'https://example.com/images/gst-cancellation.jpg',
        status: 1,
        level: 'subcategory',
        parentCategoryId: categories[0]._id,
        order: 3,
        description: 'Cancel or surrender GST registration',
      },
    ]);

    const incomeTaxSubcategories = await CAServiceCategory.insertMany([
      {
        cat_name: 'ITR Filing',
        cat_img: 'https://example.com/images/itr-filing.jpg',
        status: 1,
        level: 'subcategory',
        parentCategoryId: categories[1]._id,
        order: 1,
        description: 'File Income Tax Returns',
      },
      {
        cat_name: 'PAN Services',
        cat_img: 'https://example.com/images/pan-services.jpg',
        status: 1,
        level: 'subcategory',
        parentCategoryId: categories[1]._id,
        order: 2,
        description: 'Apply for new PAN or make corrections',
      },
    ]);

    const companyRegSubcategories = await CAServiceCategory.insertMany([
      {
        cat_name: 'Private Limited Company',
        cat_img: 'https://example.com/images/private-limited.jpg',
        status: 1,
        level: 'subcategory',
        parentCategoryId: categories[2]._id,
        order: 1,
        description: 'Register a Private Limited Company',
      },
      {
        cat_name: 'One Person Company',
        cat_img: 'https://example.com/images/opc.jpg',
        status: 1,
        level: 'subcategory',
        parentCategoryId: categories[2]._id,
        order: 2,
        description: 'Register a One Person Company',
      },
      {
        cat_name: 'Partnership Firm',
        cat_img: 'https://example.com/images/partnership.jpg',
        status: 1,
        level: 'subcategory',
        parentCategoryId: categories[2]._id,
        order: 3,
        description: 'Register a Partnership Firm',
      },
    ]);

    const allSubcategories = [...gstSubcategories, ...incomeTaxSubcategories, ...companyRegSubcategories];
    console.log(`Created ${allSubcategories.length} subcategories`);

    // 3. Create Sub-subcategories (Level 3)
    console.log('Creating sub-subcategories...');
    
    // GST Registration sub-subcategories
    const gstRegSubSubcategories = await CAServiceCategory.insertMany([
      {
        cat_name: 'Proprietorship',
        cat_img: 'https://example.com/images/proprietorship.jpg',
        status: 1,
        level: 'sub_subcategory',
        parentCategoryId: gstSubcategories[0]._id,
        order: 1,
        description: 'GST Registration for Proprietorship',
      },
      {
        cat_name: 'Partnership Firm',
        cat_img: 'https://example.com/images/partnership-firm.jpg',
        status: 1,
        level: 'sub_subcategory',
        parentCategoryId: gstSubcategories[0]._id,
        order: 2,
        description: 'GST Registration for Partnership Firm',
      },
      {
        cat_name: 'Private Limited Company',
        cat_img: 'https://example.com/images/private-limited-company.jpg',
        status: 1,
        level: 'sub_subcategory',
        parentCategoryId: gstSubcategories[0]._id,
        order: 3,
        description: 'GST Registration for Private Limited Company',
      },
      {
        cat_name: 'One Person Company',
        cat_img: 'https://example.com/images/opc-gst.jpg',
        status: 1,
        level: 'sub_subcategory',
        parentCategoryId: gstSubcategories[0]._id,
        order: 4,
        description: 'GST Registration for One Person Company',
      },
    ]);

    // GST Filing sub-subcategories
    const gstFilingSubSubcategories = await CAServiceCategory.insertMany([
      {
        cat_name: 'Monthly Filing',
        cat_img: 'https://example.com/images/monthly-filing.jpg',
        status: 1,
        level: 'sub_subcategory',
        parentCategoryId: gstSubcategories[1]._id,
        order: 1,
        description: 'Monthly GST Return Filing',
      },
      {
        cat_name: 'Quarterly Filing',
        cat_img: 'https://example.com/images/quarterly-filing.jpg',
        status: 1,
        level: 'sub_subcategory',
        parentCategoryId: gstSubcategories[1]._id,
        order: 2,
        description: 'Quarterly GST Return Filing',
      },
    ]);

    // GST Cancellation sub-subcategories
    const gstCancellationSubSubcategories = await CAServiceCategory.insertMany([
      {
        cat_name: 'Normal Cancellation',
        cat_img: 'https://example.com/images/normal-cancellation.jpg',
        status: 1,
        level: 'sub_subcategory',
        parentCategoryId: gstSubcategories[2]._id,
        order: 1,
        description: 'Normal GST Cancellation',
      },
      {
        cat_name: 'Surrender Registration',
        cat_img: 'https://example.com/images/surrender-registration.jpg',
        status: 1,
        level: 'sub_subcategory',
        parentCategoryId: gstSubcategories[2]._id,
        order: 2,
        description: 'Surrender GST Registration',
      },
    ]);

    // ITR Filing sub-subcategories
    const itrFilingSubSubcategories = await CAServiceCategory.insertMany([
      {
        cat_name: 'ITR-1',
        cat_img: 'https://example.com/images/itr1.jpg',
        status: 1,
        level: 'sub_subcategory',
        parentCategoryId: incomeTaxSubcategories[0]._id,
        order: 1,
        description: 'ITR-1 Filing for Salaried Individuals',
      },
      {
        cat_name: 'ITR-2',
        cat_img: 'https://example.com/images/itr2.jpg',
        status: 1,
        level: 'sub_subcategory',
        parentCategoryId: incomeTaxSubcategories[0]._id,
        order: 2,
        description: 'ITR-2 Filing for Individuals and HUFs',
      },
      {
        cat_name: 'ITR-3',
        cat_img: 'https://example.com/images/itr3.jpg',
        status: 1,
        level: 'sub_subcategory',
        parentCategoryId: incomeTaxSubcategories[0]._id,
        order: 3,
        description: 'ITR-3 Filing for Business and Professional Income',
      },
    ]);

    // PAN Services sub-subcategories
    const panServicesSubSubcategories = await CAServiceCategory.insertMany([
      {
        cat_name: 'New PAN',
        cat_img: 'https://example.com/images/new-pan.jpg',
        status: 1,
        level: 'sub_subcategory',
        parentCategoryId: incomeTaxSubcategories[1]._id,
        order: 1,
        description: 'Apply for New PAN Card',
      },
      {
        cat_name: 'PAN Correction',
        cat_img: 'https://example.com/images/pan-correction.jpg',
        status: 1,
        level: 'sub_subcategory',
        parentCategoryId: incomeTaxSubcategories[1]._id,
        order: 2,
        description: 'Correct Details on PAN Card',
      },
    ]);

    const allSubSubcategories = [
      ...gstRegSubSubcategories,
      ...gstFilingSubSubcategories,
      ...gstCancellationSubSubcategories,
      ...itrFilingSubSubcategories,
      ...panServicesSubSubcategories,
    ];
    console.log(`Created ${allSubSubcategories.length} sub-subcategories`);

    // 4. Create Form Schemas for Sub-subcategories
    console.log('Creating form schemas...');
    const formSchemas = [];

    // Form Schema for GST Registration - Proprietorship
    const proprietorshipSchema = new CAFormSchema({
      subSubcategoryId: gstRegSubSubcategories[0]._id,
      fields: [
        {
          name: 'businessName',
          label: 'Business Name',
          type: 'text',
          placeholder: 'Enter your business name',
          isRequired: true,
          validation: { minLength: 3, maxLength: 100 },
          order: 1,
          section: 'business_details',
        },
        {
          name: 'ownerName',
          label: 'Owner Name',
          type: 'text',
          placeholder: 'Enter owner full name',
          isRequired: true,
          validation: { minLength: 2, maxLength: 50 },
          order: 2,
          section: 'business_details',
        },
        {
          name: 'businessType',
          label: 'Business Type',
          type: 'select',
          isRequired: true,
          options: [
            { value: 'retail', label: 'Retail' },
            { value: 'wholesale', label: 'Wholesale' },
            { value: 'manufacturing', label: 'Manufacturing' },
            { value: 'service', label: 'Service' },
          ],
          order: 3,
          section: 'business_details',
        },
        {
          name: 'businessAddress',
          label: 'Business Address',
          type: 'textarea',
          placeholder: 'Enter complete business address',
          isRequired: true,
          validation: { minLength: 10, maxLength: 500 },
          order: 4,
          section: 'business_details',
        },
        {
          name: 'pincode',
          label: 'Pincode',
          type: 'text',
          placeholder: 'Enter pincode',
          isRequired: true,
          validation: { pattern: '^[0-9]{6}$' },
          order: 5,
          section: 'business_details',
        },
        {
          name: 'mobileNumber',
          label: 'Mobile Number',
          type: 'phone',
          placeholder: 'Enter 10-digit mobile number',
          isRequired: true,
          validation: { pattern: '^[0-9]{10}$' },
          order: 6,
          section: 'contact_details',
        },
        {
          name: 'email',
          label: 'Email Address',
          type: 'email',
          placeholder: 'Enter email address',
          isRequired: true,
          order: 7,
          section: 'contact_details',
        },
        {
          name: 'panNumber',
          label: 'PAN Number',
          type: 'text',
          placeholder: 'Enter PAN number',
          isRequired: true,
          validation: { pattern: '^[A-Z]{5}[0-9]{4}[A-Z]{1}$' },
          helpText: 'Format: ABCDE1234F',
          order: 8,
          section: 'documents',
        },
        {
          name: 'aadharCard',
          label: 'Aadhar Card',
          type: 'file',
          isRequired: true,
          helpText: 'Upload scanned copy of Aadhar Card',
          order: 9,
          section: 'documents',
        },
        {
          name: 'addressProof',
          label: 'Address Proof',
          type: 'file',
          isRequired: true,
          helpText: 'Upload address proof document',
          order: 10,
          section: 'documents',
        },
      ],
      sections: [
        {
          id: 'business_details',
          title: 'Business Details',
          description: 'Enter your business information',
          order: 1,
        },
        {
          id: 'contact_details',
          title: 'Contact Details',
          description: 'Enter your contact information',
          order: 2,
        },
        {
          id: 'documents',
          title: 'Documents',
          description: 'Upload required documents',
          order: 3,
        },
      ],
      createdBy: testUser._id,
    });
    await proprietorshipSchema.save();
    formSchemas.push(proprietorshipSchema);

    // Form Schema for ITR-1
    const itr1Schema = new CAFormSchema({
      subSubcategoryId: itrFilingSubSubcategories[0]._id,
      fields: [
        {
          name: 'assessmentYear',
          label: 'Assessment Year',
          type: 'select',
          isRequired: true,
          options: [
            { value: '2024-25', label: '2024-25' },
            { value: '2023-24', label: '2023-24' },
          ],
          order: 1,
        },
        {
          name: 'panNumber',
          label: 'PAN Number',
          type: 'text',
          placeholder: 'Enter PAN number',
          isRequired: true,
          validation: { pattern: '^[A-Z]{5}[0-9]{4}[A-Z]{1}$' },
          order: 2,
        },
        {
          name: 'totalIncome',
          label: 'Total Income (₹)',
          type: 'number',
          placeholder: 'Enter total income',
          isRequired: true,
          validation: { min: 0 },
          order: 3,
        },
        {
          name: 'tdsDeducted',
          label: 'TDS Deducted (₹)',
          type: 'number',
          placeholder: 'Enter TDS deducted',
          isRequired: false,
          validation: { min: 0 },
          order: 4,
        },
        {
          name: 'form16',
          label: 'Form 16',
          type: 'file',
          isRequired: true,
          helpText: 'Upload Form 16 from employer',
          order: 5,
        },
      ],
      createdBy: testUser._id,
    });
    await itr1Schema.save();
    formSchemas.push(itr1Schema);

    console.log(`Created ${formSchemas.length} form schemas`);

    // 5. Create Form Entries (Sample user submissions)
    console.log('Creating form entries...');
    const formEntries = [];

    // Entry for GST Registration - Proprietorship
    const count1 = await CAFormEntry.countDocuments();
    const entry1 = new CAFormEntry({
      entryId: `ENTRY${String(count1 + 1).padStart(6, '0')}`,
      userId: testUser._id,
      subSubcategoryId: gstRegSubSubcategories[0]._id,
      formSchemaId: proprietorshipSchema._id,
      formData: {
        businessName: 'Test Business Solutions',
        ownerName: 'Test User',
        businessType: 'service',
        businessAddress: '123 Main Street, Mumbai, Maharashtra',
        pincode: '400001',
        mobileNumber: '9876543210',
        email: 'test@example.com',
        panNumber: 'ABCDE1234F',
      },
      files: {
        aadharCard: 'https://example.com/documents/aadhar.pdf',
        addressProof: 'https://example.com/documents/address.pdf',
      },
      status: 'submitted',
      submittedAt: new Date(),
    });
    await entry1.save();
    formEntries.push(entry1);

    // Entry for ITR-1 (Draft)
    const count2 = await CAFormEntry.countDocuments();
    const entry2 = new CAFormEntry({
      entryId: `ENTRY${String(count2 + 1).padStart(6, '0')}`,
      userId: testUser._id,
      subSubcategoryId: itrFilingSubSubcategories[0]._id,
      formSchemaId: itr1Schema._id,
      formData: {
        assessmentYear: '2024-25',
        panNumber: 'ABCDE1234F',
        totalIncome: 500000,
        tdsDeducted: 5000,
      },
      files: {
        form16: 'https://example.com/documents/form16.pdf',
      },
      status: 'draft',
    });
    await entry2.save();
    formEntries.push(entry2);

    console.log(`Created ${formEntries.length} form entries`);

    console.log('\n✅ CA Services seed data created successfully!');
    console.log('\nSummary:');
    console.log(`- Categories: ${categories.length}`);
    console.log(`- Subcategories: ${allSubcategories.length}`);
    console.log(`- Sub-subcategories: ${allSubSubcategories.length}`);
    console.log(`- Form Schemas: ${formSchemas.length}`);
    console.log(`- Form Entries: ${formEntries.length}`);
    console.log(`\nTest User: ${testUser.email}`);
    console.log(`User ID: ${testUser._id}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();

