import React, { useState, useEffect } from "react";
import api from "../utils/axiosInstance";
import { Table, Button, Space, Image, Popconfirm, message } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import LoadingOverlay from "../components/LoadingOverlay";
import { getYouTubeVideoId, toSafeHttpUrl } from "../utils/url";

export default function VideosPage() {
  const API_VIDEOS = "/videos";

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [newVideo, setNewVideo] = useState({
    id: null,
    title: "",
    description: "",
    youtubeUrl: "",
  });

  /* ================= FETCH VIDEOS ================= */
  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await api.get(API_VIDEOS);
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setVideos(data);
    } catch (err) {
      console.error("Error fetching videos:", err);
      message.error(err.response?.data?.message || "Failed to fetch videos");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  /* ================= BODY SCROLL LOCK ================= */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  /* ================= SAVE VIDEO ================= */
  const handleSaveVideo = async () => {
    if (!newVideo.title || !newVideo.youtubeUrl) {
      message.warning("Title and Video Link are required");
      return;
    }

    const videoId = getYouTubeVideoId(newVideo.youtubeUrl);
    if (!videoId) {
      message.error("Invalid YouTube URL");
      return;
    }

    const payload = {
      title: newVideo.title,
      description: newVideo.description,
      videoLink: newVideo.youtubeUrl,
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };

    try {
      setLoading(true);
      if (isEditing) {
        await api.patch(`${API_VIDEOS}/${newVideo.id}`, payload);
        message.success("Video updated successfully");
      } else {
        await api.post(API_VIDEOS, payload);
        message.success("Video added successfully");
      }

      await fetchVideos();
      setOpen(false);
      setIsEditing(false);
      setNewVideo({ id: null, title: "", description: "", youtubeUrl: "" });
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to save video");
    } finally {
      setLoading(false);
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (video) => {
    setNewVideo({
      id: video._id,
      title: video.title,
      description: video.description,
      youtubeUrl: video.videoLink,
    });
    setIsEditing(true);
    setOpen(true);
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await api.delete(`${API_VIDEOS}/${id}`);
      message.success("Video deleted successfully");
      await fetchVideos();
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to delete video");
    } finally {
      setLoading(false);
    }
  };

  /* ================= TABLE COLUMNS ================= */
  const columns = [
    {
      title: "Thumbnail",
      dataIndex: "videoLink",
      key: "thumbnail",
      align: "center",
      render: (link) => {
        const videoId = getYouTubeVideoId(link);
        const thumbnail = videoId
          ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
          : null;
        return thumbnail ? (
          <a href={toSafeHttpUrl(link) || undefined} target="_blank" rel="noreferrer">
            <Image
              src={thumbnail}
              width={95}
              height={60}
              preview={false}
              style={{ borderRadius: 7 }}
            />
          </a>
        ) : (
          "—"
        );
      },
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      align: "center",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      align: "center",
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      render: (_, record) => (
        <Space>
          <Button type="primary" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete Video"
            description="Are you sure you want to delete this video?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
            icon={<QuestionCircleOutlined style={{ color: "red" }} />}
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div
      style={{ fontFamily: "Poppins, sans-serif" }}
      className="p-6 h-[87vh] bg-primary text-primary card-shadow shadow rounded-lg relative overflow-auto"
    >
      {/* GLOBAL CUSTOM LOADER */}
      {loading && <LoadingOverlay />}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-blue-500 text-lg font-bold">Video Management</h2>
        <Button
          type="primary"
          onClick={() => {
            setIsEditing(false);
            setNewVideo({
              id: null,
              title: "",
              description: "",
              youtubeUrl: "",
            });
            setOpen(true);
          }}
        >
          + Add Video
        </Button>
      </div>

      {/* TABLE */}
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={videos}
        pagination={false}
      />

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40 px-4">
          <div className="bg-secondary p-6 rounded-lg w-full max-w-md shadow-xl border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-blue-500">
              {isEditing ? "Edit Video" : "Add Video"}
            </h3>

            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              className="w-full mb-3 p-2 border rounded focus:ring-1 focus:ring-blue-400 outline-none"
              placeholder="Enter title"
              value={newVideo.title}
              onChange={(e) =>
                setNewVideo({ ...newVideo, title: e.target.value })
              }
            />

            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              className="w-full mb-3 p-2 border rounded focus:ring-1 focus:ring-blue-400 outline-none"
              placeholder="Enter description"
              rows={3}
              value={newVideo.description}
              onChange={(e) =>
                setNewVideo({ ...newVideo, description: e.target.value })
              }
            />

            <label className="block text-sm font-medium mb-1">
              YouTube URL
            </label>
            <input
              className="w-full mb-4 p-2 border rounded focus:ring-1 focus:ring-blue-400 outline-none"
              placeholder="https://www.youtube.com/watch?v=..."
              value={newVideo.youtubeUrl}
              onChange={(e) =>
                setNewVideo({ ...newVideo, youtubeUrl: e.target.value })
              }
            />

            <div className="flex justify-end gap-3">
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="primary" onClick={handleSaveVideo}>
                {isEditing ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
