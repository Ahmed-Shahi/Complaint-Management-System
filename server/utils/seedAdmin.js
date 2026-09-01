const User = require('../models/User');
const Category = require('../models/Category');

const seedData = async () => {
  try {
    // 1. Seed Admin Account
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@cms.com';
    let adminUser = await User.findOne({ role: 'ADMIN' });

    if (!adminUser) {
      adminUser = new User({
        name: process.env.ADMIN_NAME || 'System Administrator',
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD || 'admin123',
        role: 'ADMIN',
        status: 'ACTIVE'
      });

      await adminUser.save();
      console.log(`[SEED] Initial Admin account created: ${adminEmail}`);
    } else {
      console.log(`[SEED] Admin account ready: ${adminUser.email}`);
    }

    // 2. Seed Default Categories if empty
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      const defaultCategories = [
        { name: 'Hostel & Housing', description: 'Hostel rooms, plumbing, electrical, and room maintenance' },
        { name: 'IT & Wi-Fi Network', description: 'Wi-Fi connectivity, portal access, and computer labs' },
        { name: 'Academics & Examinations', description: 'Course registration, grade sheets, and exam schedules' },
        { name: 'Maintenance & Infrastructure', description: 'Campus facilities, furniture, sanitation, and lighting' },
        { name: 'Library & Learning Resources', description: 'Book issue, digital library, and quiet study area' },
        { name: 'Miscellaneous', description: 'General complaints and student welfare support' }
      ];

      for (const cat of defaultCategories) {
        await Category.create({ ...cat, createdBy: adminUser._id });
      }
      console.log(`[SEED] ${defaultCategories.length} default complaint categories created.`);
    } else {
      console.log(`[SEED] ${categoryCount} categories ready in database.`);
    }
  } catch (error) {
    console.error(`[SEED ERROR] Failed to seed initial data:`, error.message);
  }
};

module.exports = seedData;
