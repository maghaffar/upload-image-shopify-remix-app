import mongoose from "mongoose";

const Schema = mongoose.Schema;

const imageSchema = new Schema({
  name: {
    type: String,
  },
  url: {
    type: String,
  },
  shopifyId: {
    type: String,
    require: true,
  },
});
const Image = mongoose.model("images", imageSchema);
export default Image;
