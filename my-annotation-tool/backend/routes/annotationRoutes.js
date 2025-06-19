import express from "express";
import {
  getAnnotations,
  saveAnnotations,
  deleteAnnotation,
} from "../controllers/annotationController.js"; 

const router = express.Router();

// ✅ Route to fetch annotations for a specific video
router.get("/:videoId", getAnnotations);

// ✅ Route to save/update annotations
router.post("/", saveAnnotations);

// ✅ Route to delete an annotation
router.delete("/:id", deleteAnnotation);

export default router;
