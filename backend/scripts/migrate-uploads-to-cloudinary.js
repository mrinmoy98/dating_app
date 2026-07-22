/**
 * One-off migration: move everything that still lives in backend/public/uploads
 * up to Cloudinary, then rewrite the URLs stored in MongoDB.
 *
 *   cd backend && node scripts/migrate-uploads-to-cloudinary.js
 *
 * Run this BEFORE deleting public/uploads. Safe to run more than once — rows
 * that already point at Cloudinary are skipped.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { v2: cloudinary } = require('cloudinary');

const ROOT = process.env.CLOUDINARY_ROOT_FOLDER || 'sn';
const TAG = process.env.CLOUDINARY_ASSET_TAG || 'sangamX';
const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const isLocal = (url) => typeof url === 'string' && url.includes('/uploads/');

/** Upload one local file and return its Cloudinary URL (null if missing). */
async function push(localUrl, slug, kind, video = false) {
  const name = localUrl.split('/uploads/').pop();
  const file = path.join(UPLOAD_DIR, name);
  if (!fs.existsSync(file)) {
    console.log(`    ! missing on disk, left as-is: ${name}`);
    return null;
  }
  const res = await cloudinary.uploader.upload(file, {
    folder: `${ROOT}/${slug}/${kind}`,
    public_id: `${Date.now()}_${TAG}`,
    resource_type: video ? 'video' : 'image',
    use_filename: false,
    unique_filename: false,
  });
  return res.secure_url;
}

(async () => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) throw new Error('Cloudinary is not configured in .env');
  await mongoose.connect(process.env.MONGODB_URL);
  const users = mongoose.connection.collection('users');
  const reels = mongoose.connection.collection('reels');
  const banners = mongoose.connection.collection('banners');
  const settings = mongoose.connection.collection('settings');

  // ---- users: photos, cover, intro video ----
  const rows = await users
    .find({
      $or: [{ 'photos.url': /\/uploads\// }, { video_url: /\/uploads\// }, { cover_url: /\/uploads\// }],
    })
    .toArray();
  console.log(`Users to migrate: ${rows.length}`);

  for (const u of rows) {
    const slug = u.slug || 'user';
    console.log(`  ${u.first_name ?? u.phone} (${slug})`);
    const set = {};

    if ((u.photos ?? []).some((p) => isLocal(p.url))) {
      const photos = [];
      for (const p of u.photos) {
        const url = isLocal(p.url) ? (await push(p.url, slug, 'profile-images')) ?? p.url : p.url;
        photos.push({ ...p, url });
      }
      set.photos = photos;
    }
    if (isLocal(u.cover_url)) {
      set.cover_url = (await push(u.cover_url, slug, 'profile-images')) ?? u.cover_url;
    }
    if (isLocal(u.video_url)) {
      set.video_url = (await push(u.video_url, slug, 'videos', true)) ?? u.video_url;
    }
    if (Object.keys(set).length) await users.updateOne({ _id: u._id }, { $set: set });
  }

  // ---- reels ----
  const reelRows = await reels.find({ video_url: /\/uploads\// }).toArray();
  console.log(`Reels to migrate: ${reelRows.length}`);
  for (const r of reelRows) {
    const owner = await users.findOne({ _id: r.user }, { projection: { slug: 1 } });
    const url = await push(r.video_url, owner?.slug || 'user', 'reels', true);
    if (url) await reels.updateOne({ _id: r._id }, { $set: { video_url: url } });
  }

  // ---- CMS banners + site settings ----
  const bannerRows = await banners.find({ image_url: /\/uploads\// }).toArray();
  console.log(`Banners to migrate: ${bannerRows.length}`);
  for (const b of bannerRows) {
    const url = await push(b.image_url, 'admin', 'cms');
    if (url) await banners.updateOne({ _id: b._id }, { $set: { image_url: url } });
  }

  const settingRows = await settings.find({}).toArray();
  for (const s of settingRows) {
    const set = {};
    for (const key of ['logo_url', 'favicon_url', 'banner_url']) {
      if (isLocal(s[key])) {
        const url = await push(s[key], 'admin', 'cms');
        if (url) set[key] = url;
      }
    }
    if (Object.keys(set).length) {
      console.log(`Settings: ${Object.keys(set).join(', ')}`);
      await settings.updateOne({ _id: s._id }, { $set: set });
    }
  }

  console.log('\nDone. public/uploads can be deleted now.');
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
