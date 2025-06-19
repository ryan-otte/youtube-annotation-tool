import mongoose from "mongoose";

const annotationSchema = new mongoose.Schema({
  videoId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  annotations: [
    {
      type: { type: String, required: true },
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
      color: { type: String, required: true },
      text: { type: String, default: "" },
      timestamp: { type: Number, required: true },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      points: { type: Array, default: null }, // For pencil/freehand drawings
      startX: { type: Number }, // For arrow annotations
      startY: { type: Number }, // For arrow annotations
      endX: { type: Number },   // For arrow annotations
      endY: { type: Number }    // For arrow annotations
    },
  ],
  // Still using Mixed type for flexibility, but providing a clear structure in the comments
  comments: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
    // The expected structure is:
    // {
    //   "annotationId1": [
    //     {
    //       _id: String,
    //       text: String,
    //       timestamp: String, // Date and time when comment was added
    //       videoTime: Number, // The video playback position when comment was added
    //       userId: mongoose.Schema.Types.ObjectId,
    //       username: String,
    //       annotationId: String
    //     },
    //     ...more comments
    //   ],
    //   "annotationId2": [...],
    //   ...
    // }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add index for faster queries
annotationSchema.index({ videoId: 1, userId: 1 });

// Update the updatedAt timestamp whenever the document is modified
annotationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Annotation = mongoose.model("Annotation", annotationSchema);
export default Annotation;