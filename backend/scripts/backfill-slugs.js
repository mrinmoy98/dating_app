/**
 * One-off migration: give every existing account a media slug.
 *
 *   cd backend && node scripts/backfill-slugs.js
 *
 * New accounts get their slug at registration; this only fixes users created
 * before slugs existed. Safe to run more than once.
 */
require('dotenv').config();
const mongoose = require('mongoose');

function slugify(value) {
  return (
    String(value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'user'
  );
}

(async () => {
  const uri = process.env.MONGODB_URL;
  if (!uri) throw new Error('MONGODB_URL is not set. Define it in backend/.env');

  await mongoose.connect(uri);
  const users = mongoose.connection.collection('users');

  const pending = await users.find({ $or: [{ slug: null }, { slug: { $exists: false } }] }).toArray();
  console.log(`Users without a slug: ${pending.length}`);

  let done = 0;
  for (const u of pending) {
    const base = slugify([u.first_name, u.last_name].filter(Boolean).join(' ') || u.phone);

    // Append a number until the slug is free.
    let slug = base;
    for (let i = 1; await users.findOne({ slug, _id: { $ne: u._id } }); i++) {
      slug = `${base}${i + 1}`;
    }

    await users.updateOne({ _id: u._id }, { $set: { slug } });
    console.log(`  ${u.first_name ?? u.phone} → ${slug}`);
    done++;
  }

  console.log(`\nDone. ${done} user(s) updated.`);
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
