import * as mongoose from 'mongoose';

/**
 * A CMS content page — Privacy Policy, Terms of Service, About Us, FAQ, etc.
 * Identified by a stable `slug` used by the mobile app to fetch it.
 */
export const PageSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    title: { type: String, required: true },
    content: { type: String, default: '' }, // HTML / rich text
    is_published: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

export interface Page extends mongoose.Document {
  slug: string;
  title: string;
  content: string;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
}
