import mongoose, { Schema, Document } from "mongoose";

interface IBoard extends Document {
  name: string;
  standards: mongoose.Types.ObjectId[];
  subjects: mongoose.Types.ObjectId[];
  image: string;
}

const BoardSchema: Schema<IBoard> = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    standards: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Standard'
    }],
    subjects: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    }],
    image: {
      type: String,
      required: false
    }
  },
  { timestamps: true }
);

export const Board = mongoose.model<IBoard>("Board", BoardSchema);