import { getImage, getImages } from "../mongo/controllers";
import { json } from "@remix-run/node";
export const loader = async ({}) => {
  const images = await getImages();
  return json({ images });
};
