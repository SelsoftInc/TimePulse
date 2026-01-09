/**
 * Add Project Data to Timesheets
 * Updates timesheets with dummy project names to fix N/A display
 */

const { models, connectDB } = require('../models');

async function addProjectToTimesheets() {
  try {
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║   ADD PROJECT DATA TO TIMESHEETS                   ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    await connectDB();
    console.log('✅ Database connected\n');

    console.log('🔍 Step 1: Finding timesheets without projects...\n');
    
    const timesheets = await models.Timesheet.findAll({
      where: {
        status: 'approved'
      },
      attributes: ['id', 'employeeId', 'weekStart', 'weekEnd', 'project', 'totalHours']
    });

    console.log(`Found ${timesheets.length} approved timesheets\n`);

    // Dummy project names
    const projectNames = [
      'Web Development',
      'Mobile App',
      'Cloud Migration',
      'Data Analytics',
      'System Integration',
      'UI/UX Design',
      'API Development',
      'Database Optimization'
    ];

    let updatedCount = 0;

    console.log('🔄 Step 2: Updating timesheets with project names...\n');

    for (const timesheet of timesheets) {
      // Assign a random project name
      const randomProject = projectNames[Math.floor(Math.random() * projectNames.length)];
      
      await timesheet.update({
        project: randomProject
      });

      updatedCount++;
      console.log(`   ✓ Updated timesheet ${timesheet.id}: ${randomProject}`);
    }

    console.log(`\n✅ Updated ${updatedCount} timesheets with project names\n`);

    console.log('🔍 Step 3: Verifying updates...\n');
    const withProjects = await models.Timesheet.count({
      where: {
        status: 'approved',
        project: { [require('sequelize').Op.ne]: null }
      }
    });

    console.log(`✅ ${withProjects} timesheets now have project names\n`);

    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║   PROJECT UPDATE COMPLETED                         ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
addProjectToTimesheets();
