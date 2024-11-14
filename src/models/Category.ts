import mongoose, { Document, Schema } from "mongoose";

interface ICategory extends Document {
  name: string;
  description: string;
  image?: string;
  creationDate: Date;
}

const categorySchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: false }
  },
  { timestamps: true }
);

const  Category = mongoose.model<ICategory>("Category", categorySchema);
export default Category;
