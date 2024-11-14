import mongoose, { Document, Schema } from "mongoose";

interface IProduct extends Document {
  category: mongoose.Types.ObjectId;
  name: string;
  description: string;
  image?: string;
  availableQuantity: number;
  price: number;
  creationDate: Date;
}

const productSchema: Schema = new Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    name: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: false },
    availableQuantity: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

const Product = mongoose.model<IProduct>("Product", productSchema);
export default Product;
