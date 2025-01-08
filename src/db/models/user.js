import { model, Schema } from "mongoose";

const usersSchema = new Schema(
  {
    name: {
      type: String,
      required: false,
      default: "User",
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      default: "female",
    },
    weight: {
      type: Number,
      required: false,
      default: 0,
    },
    activeHours: {
      type: Number,
      required: false,
      default: 0,
    },
    waterNorm: {
      type: Number,
      required: false,
      default: 0,
    },
    avatar: {
      type: String,
      required: false,
    },
  },
  { timestamps: true, versionKey: false },
);

usersSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const UsersCollection = model("users", usersSchema);
