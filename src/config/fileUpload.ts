import multer from 'multer';
import { Request } from 'express';

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req:Request, file:any, cb:any) => {
    if (!file) {
      return cb(new Error("File is required"), false);
    }
    const allowedMimeTypes :string[]= ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type. Only JPEG, PNG, and JPG are allowed."), false);
    }

    if (file.size > 2 * 1024 * 1024) { 
      return cb(new Error("File size should not exceed 2MB"), false);
    }
    cb(null, true);
  }

});

export{upload};