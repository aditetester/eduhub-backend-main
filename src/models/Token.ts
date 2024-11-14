import mongoose, { Schema, Document } from "mongoose";

interface IToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  createdAt: Date;
}

const TokenSchema: Schema<IToken> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Token = mongoose.model<IToken>("Token", TokenSchema);
