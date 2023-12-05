import Image from "./schema";

export const createImage = async (name, url, shopifyId) => {
  const image = await Image.create({
    name,
    url,
    shopifyId,
  });
  return image;
};

export const getImages = async () => {
  const images = await Image.find();
  return images;
};

export const getImage = async (_id) => {
  const image = await Image.find({ _id });
  return image;
};

export const getImgs = async (ids) => {
  const images = await Image.find({ _id: { $in: ids } });
  return images;
};

export const deleteImage = async (_id) => {
  const del = await Image.deleteOne({ _id });
  return del;
};

export const deleteImages = async (ids) => {
  const del = await Image.deleteMany({ _id: { $in: ids } });
  return del;
};
