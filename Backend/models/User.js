import mongoose, { mongo } from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: { 
    type: String, 
    required: function () {
      return this.authProvider !== "google";
    },
    authProvider: {
    type: String,
    enum: ["local", "google"],
    default: "local"
  }
  },
});

export default mongoose.model("User", UserSchema);