import React, { useState, useEffect } from "react";
import { Form, useLoaderData, Link, useNavigation } from "@remix-run/react";
import { redirect } from "@remix-run/node";
import { getImages } from "../mongo/controllers";
import { Frame, Toast } from "@shopify/polaris";
import { LoadingOutlined, SyncOutlined } from "@ant-design/icons";
import { MdDelete } from "react-icons/md";
import { Spin } from "antd";

export const loader = async () => {
  console.log("====================>>>>>>>>>> Loader Called...");
  const images = await getImages();
  return [images];
};

const Home = () => {
  const [images] = useLoaderData();
  const [confirm, setConfirm] = useState(false);
  const [id, setId] = useState();
  const [active, setActive] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [file, setFile] = useState();
  const [loader, setLoader] = useState(false);
  let [selectedIds, setSelectedIds] = useState([]);
  let [imagess, setImages] = useState([]);
  const [delLoader, setDelLoader] = useState(false);
  let [deletedImages, setDeletedImages] = useState([]);
  let [clearTimer, setClearTimer] = useState();
  let myTimeout;
  const navigation = useNavigation();

  const toggle = () => {
    setActive((p) => !p);
  };

  const getFile = (e) => {
    const file = e.target.files[0];
    setFile(file);
  };

  const upload = async () => {
    setLoader(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/image", {
      method: "POST",
      body: formData,
    });

    try {
      const resp = await fetch("/api/getImages", {
        method: "GET",
      });
      const { images } = await resp.json();
      setImages(images);
      // console.log("IMAGES IN UPLOAD FUNC:", images);
      setLoader(false);
    } catch (err) {
      console.log("ERORR", err);
      setLoader(false);
    }
  };

  const deleteImage = () => {
    setDelLoader(true);
    let tempArr = [];
    if (selectedIds.length > 1) {
      console.log(
        "========>>>>>>>>>>>multiple Case Selected Ids:",
        selectedIds
      );
      imagess.map((image) => {
        if (selectedIds.includes(image._id)) {
          console.log("Image ID:", image._id);
          deletedImages.push(image);
        } else {
          tempArr.push(image);
        }
      });
      console.log(
        "===================>>>multiple Case DeletedImages:",
        deletedImages
      );
    } else {
      console.log("===================>>>Single Case:");
      imagess.map((image) => {
        if (image._id == `${selectedIds[0]}`) {
          deletedImages.push(image);
        } else {
          tempArr.push(image);
        }
      });
      console.log(
        "===================>>>Single Case DeletedImages:",
        deletedImages
      );
    }

    setImages(tempArr);
    toggle();
    // const formData = new FormData?
    myTimeout = setTimeout(async () => {
      console.log("Set Time Out Called...");
      await fetch(`/image/destroy`, {
        method: "POST",
        body: JSON.stringify({
          selectedIds,
        }),
      });
      setShowDelete(false);
      setDelLoader(false);
    }, 5000);
    deletedImages.splice(0, deletedImages.length - 1);
    setClearTimer(myTimeout);
    setConfirm(false);
    setSelectedIds([]);
  };
  const undo = () => {
    if (deletedImages.length > 0) {
      deletedImages.map((image) => {
        imagess.push(image);
      });
    }
    console.log("=====>>>>>Deleted Images in undo func:", deletedImages);
    setSelectedIds([]);
    setImages(imagess);
    toggle();
    setConfirm(false);
    setShowDelete(false);
    setDelLoader(false);
  };

  const removeId = (id) => {
    console.log("Selected Ids Before Cancel:", selectedIds);
    selectedIds.map((selectedId, index) => {
      if (selectedId == id) {
        selectedIds.splice(index, 1);
      }
    });
    console.log("Selected Ids After Cancel:", selectedIds);
  };

  useEffect(() => {
    setImages(images);
    // upload();
  }, [images]);

  return (
    <div className="m-5">
      <p className="font-bold text-lg">Upload Image</p>
      <p className="text-blue-500 font-bold text-lg text-center">
        {navigation.state === "loading" ? "Loading Images..." : ""}
      </p>
      <Form method="post" action="/api/image" encType="multipart/form-data">
        <div className="flex gap-2">
          <input
            type="file"
            name="file"
            id="file"
            onChange={(e) => getFile(e)}
          ></input>
          <button
            type="button"
            className="bg-blue-200 py-2 px-3 rounded-lg"
            disabled={loader}
            onClick={upload}
          >
            {loader ? <SyncOutlined spin /> : "Upload"}
          </button>
        </div>
      </Form>
      <div className="m-5">
        <table className="border-collapse border border-slate-600">
          <thead className="text-left">
            <tr>
              <th className="p-2 border border-slate-600">
                {showDelete ? (
                  <button
                    type="button"
                    className="bg-slate-300 py-1 px-2 rounded-lg text-lg"
                    disabled={delLoader}
                    onClick={deleteImage}
                  >
                    {delLoader ? (
                      <Spin
                        indicator={
                          <LoadingOutlined
                            style={{
                              fontSize: 24,
                            }}
                            spin
                          />
                        }
                      />
                    ) : (
                      <MdDelete />
                    )}
                  </button>
                ) : null}
              </th>
              <th className="p-2 border border-slate-600">Name</th>
              <th className="p-2 border border-slate-600">URL</th>
              {showDelete ? null : (
                <th className="p-2 border border-slate-600">Action</th>
              )}
            </tr>
          </thead>
          <tbody>
            {imagess.length
              ? imagess.map((image) => {
                  return (
                    <tr key={image.shopifyId}>
                      <td className="p-2 border border-slate-600">
                        <input
                          type="checkbox"
                          value={image._id}
                          onChange={(e) => {
                            const val = e.target.value;

                            if (e.target.checked) {
                              if (!selectedIds.includes(val)) {
                                selectedIds.push(val);
                              }
                              console.log(
                                "=====>>>>>on Checked Selected Ids:",
                                selectedIds
                              );
                            } else {
                              if (selectedIds.includes(val)) {
                                selectedIds.map((id, index) => {
                                  if (id == val) {
                                    selectedIds.splice(index, 1);
                                  }
                                });
                              }
                              console.log(
                                "=====>>>>>on Unchecked Selected Ids:",
                                selectedIds
                              );
                            }
                            if (selectedIds.length > 0) {
                              setShowDelete(true);
                            } else {
                              setShowDelete(false);
                            }
                          }}
                        ></input>
                      </td>
                      <td className="p-2 border border-slate-600">
                        {image.name}
                      </td>
                      <td className="p-2 border border-slate-600">
                        <Link
                          to={`${image.url}`}
                          target="_blank"
                          className="text-blue-400 active:text-blue-600 visited:text-purple-500"
                        >
                          {image.url}
                        </Link>
                      </td>
                      {showDelete ? null : (
                        <td className="p-2 border border-slate-600">
                          <Form
                            action={`/image/${image._id}/destroy`}
                            method="post"
                          >
                            {confirm && id == image._id ? (
                              <div className="flex gap-1">
                                <button
                                  className="bg-red-400 rounded-lg px-2 text-white"
                                  type="button"
                                  onClick={() => {
                                    deleteImage();
                                  }}
                                >
                                  OK
                                </button>
                                <button
                                  className="bg-yellow-300 rounded-lg"
                                  onClick={() => {
                                    setConfirm(false);
                                    removeId(image._id);
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                className={`${
                                  showDelete ? "text-slate-300" : ""
                                } bg-slate-300 rounded-lg text-xl`}
                                type="button"
                                disabled={showDelete}
                                onClick={() => {
                                  setConfirm(true);
                                  setId(image._id);
                                  console.log(
                                    "Selected IDs before del press:",
                                    selectedIds
                                  );
                                  selectedIds.push(image._id);
                                  console.log(
                                    "======>OnDelPress:",
                                    selectedIds
                                  );
                                }}
                              >
                                <MdDelete />
                              </button>
                            )}
                          </Form>
                        </td>
                      )}
                    </tr>
                  );
                })
              : null}
          </tbody>
        </table>
      </div>
      {active ? (
        <Frame>
          <Toast
            content="Image Deleted Successfully!"
            onDismiss={toggle}
            duration={5000}
            action={{
              content: "Undo",
              onAction: () => {
                clearTimeout(clearTimer);
                undo();
              },
            }}
          />
        </Frame>
      ) : null}
    </div>
  );
};

export default Home;
