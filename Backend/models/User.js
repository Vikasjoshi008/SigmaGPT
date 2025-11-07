import mongoose, { mongo } from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: function () {
      return this.authProvider === "local";
    },
    select: false,
  },
    authProvider: {
    type: String,
    enum: ["local", "google", "firebase"],
    default: "local"
  },
}, {timestamps: true});

UserSchema.index({ email: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
export default mongoose.model("User", UserSchema);