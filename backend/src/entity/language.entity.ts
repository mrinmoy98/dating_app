import * as mongoose from 'mongoose';

export const LanguageSchema = new mongoose.Schema(
    {
        title: { type: String, default: '' },
        status: { type: Boolean, required: true },
        sequence: { type: Number, default: 0 },
        is_active: { type: Boolean, default: true },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

export interface Language extends mongoose.Document {
    title: string;
    status: boolean;
    sequence: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
