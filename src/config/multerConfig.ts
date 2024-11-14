import multer from "multer";
import path from "path";


const categoryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images/categories/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); 
  },
});


const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images/products/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});


export const uploadCategoryImage = multer({ storage: categoryStorage }).single(
  "image"
);

export const uploadProductImage = multer({ storage: productStorage }).single(
  "image"
);
