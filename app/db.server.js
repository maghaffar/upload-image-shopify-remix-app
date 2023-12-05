import mongoose from "mongoose";
const conn = mongoose.connect("mongodb://127.0.0.1:27017/shopifyUploads");

export default conn;
