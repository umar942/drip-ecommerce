import { Router } from "express";
import multer from "multer";
import path from "path";
import { randomBytes } from "crypto";
import { requireAdmin } from "../lib/auth";
import {
  ALLOWED_IMAGE_TYPES,
  getProductUploadDir,
  MAX_IMAGE_BYTES,
} from "../lib/uploads";

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, getProductUploadDir());
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext) ? ext : ".jpg";
    cb(null, `${Date.now()}-${randomBytes(6).toString("hex")}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      cb(new Error("Only JPEG, PNG, WebP, and GIF images are allowed"));
      return;
    }
    cb(null, true);
  },
});

router.post(
  "/uploads/product-image",
  requireAdmin,
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          res.status(400).json({ error: "Image must be 5MB or smaller" });
          return;
        }
        res.status(400).json({ error: err.message });
        return;
      }
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      next();
    });
  },
  (req, res): void => {
    if (!req.file) {
      res.status(400).json({ error: "No image file provided" });
      return;
    }
    res.status(201).json({
      url: `/uploads/products/${req.file.filename}`,
    });
  },
);

export default router;
