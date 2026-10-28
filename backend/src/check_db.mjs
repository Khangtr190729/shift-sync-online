import 'dotenv/config';
import connectDB from './config/db.js';
import Schedule from './models/Schedule.js';
import User from './models/User.js';
import Store from './models/Store.js';

async function main() {
  await connectDB();
  const schedules = await Schedule.find({}).lean();
  console.log('SCHEDULES_COUNT=' + schedules.length);
  for (const s of schedules) {
    console.log('SCHEDULE_INFO:', JSON.stringify({
      _id: s._id,
      storeId: s.storeId,
      week: s.week,
      year: s.year,
      status: s.status,
      assignments: s.assignments?.map(a => ({ date: a.date, userId: a.userId, shiftId: a.shiftId }))
    }, null, 2));
  }

  const users = await User.find({}).lean();
  console.log('USERS_COUNT=' + users.length);
  for (const u of users) {
    console.log('USER:', u._id, u.email, u.fullName, u.role);
  }

  const stores = await Store.find({}).lean();
  for (const st of stores) {
    console.log('STORE:', st._id, st.name, 'owner:', st.ownerId, 'members:', JSON.stringify(st.members));
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

