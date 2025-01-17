import { model, Schema } from "mongoose";

const waterSchema = new Schema({
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    norm: { type: Number, required: true },
    percentage: { type: Number },
    owner: { type: Schema.Types.ObjectId, ref: 'users' },
},
    {
        timestamps: true,
        versionKey: false,
    }
);

export const WaterCollection = model('water', waterSchema);