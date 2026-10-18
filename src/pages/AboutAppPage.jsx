import React, { useState, useEffect } from "react";
import api from "../utils/axiosInstance";
import { message, Button } from "antd";
import LoadingOverlay from "../components/LoadingOverlay";

export default function AboutAppPage() {
  const API_INFO = "/info";

  const [policy, setPolicy] = useState("");
  const [policyId, setPolicyId] = useState(null);
  const [openEditor, setOpenEditor] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH ================= */
  const fetchPolicy = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_INFO, {
        params: { type: "aboutApp" },
    });

      setPolicy(res.data?.data?.content || "");
      setPolicyId(res.data?.data?._id || null);
    } catch (err) {
      if (err.response?.status === 404) {
        setPolicy("");
        setPolicyId(null);
      } else {
        console.error("Error fetching about app:", err);
        message.error("Failed to load about app");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicy();
  }, []);

  /* ================= SAVE ================= */
  const handleSave = async () => {
    setLoading(true);
    try {
      if (policyId) {
        await api.patch(`${API_INFO}/${policyId}`, {
          content: policy,
        });
      } else {
        const res = await api.post(API_INFO, {
          type: "aboutApp",
          content: policy,
        });
        setPolicyId(res.data.data._id);
      }

      setOpenEditor(false);
      message.success("About App saved successfully!");
    } catch (err) {
      console.error("Error saving about app:", err);
      message.error(
        err.response?.data?.message || "Failed to save about app"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= FORMATTER ================= */
  const renderFormattedText = (text) => {
    const lines = text.split("\n");
    let elements = [];
    let listItems = [];
    let listType = null;

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Numbered list
      if (/^\d+\./.test(trimmed)) {
        if (listType !== "ol") {
          if (listItems.length > 0) {
            elements.push(
              <ul key={`ul-${index}`} className="list-disc ml-6 mb-4">
                {listItems}
              </ul>
            );
            listItems = [];
          }
          listType = "ol";
        }

        listItems.push(
          <li key={index}>
            {trimmed.replace(/^\d+\.\s*/, "")}
          </li>
        );
      }

      // Bullet list
      else if (/^[-*•]/.test(trimmed)) {
        if (listType !== "ul") {
          if (listItems.length > 0) {
            elements.push(
              <ol key={`ol-${index}`} className="list-decimal ml-6 mb-4">
                {listItems}
              </ol>
            );
            listItems = [];
          }
          listType = "ul";
        }

        listItems.push(
          <li key={index}>
            {trimmed.replace(/^[-*•]\s*/, "")}
          </li>
        );
      }

      // Normal text
      else {
        if (listItems.length > 0) {
          elements.push(
            listType === "ol" ? (
              <ol key={`ol-${index}`} className="list-decimal ml-6 mb-4">
                {listItems}
              </ol>
            ) : (
              <ul key={`ul-${index}`} className="list-disc ml-6 mb-4">
                {listItems}
              </ul>
            )
          );
          listItems = [];
        }

        listType = null;

        if (trimmed) {
          elements.push(
            <p key={index} className="mb-3">
              {trimmed}
            </p>
          );
        }
      }
    });

    // Flush remaining list
    if (listItems.length > 0) {
      elements.push(
        listType === "ol" ? (
          <ol className="list-decimal ml-6">
            {listItems}
          </ol>
        ) : (
          <ul className="list-disc ml-6">
            {listItems}
          </ul>
        )
      );
    }

    return elements;
  };

  return (
    <div
      style={{ fontFamily: "Poppins, sans-serif" }}
      className="p-6 w-full h-[87vh] bg-primary text-primary rounded-lg shadow relative overflow-hidden flex flex-col"
    >
      {/* LOADER */}
      {loading && <LoadingOverlay />}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <h1 className="text-lg font-bold text-blue-500">
          About App
        </h1>

        <Button type="primary" onClick={() => setOpenEditor(true)}>
          Edit About App
        </Button>
      </div>

      {/* DISPLAY */}
      <div className="bg-secondary rounded-xl shadow p-6 text-primary leading-relaxed border border-gray-100 dark:border-gray-800 flex-grow overflow-auto">
        {policy ? (
          <div className="prose dark:prose-invert max-w-none">
            {renderFormattedText(policy)}
          </div>
        ) : (
          <p className="text-gray-500 italic">
            No About app added yet.
          </p>
        )}
      </div>

      {/* EDITOR */}
      {openEditor && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex justify-center items-center px-3 z-50">
          <div className="bg-secondary text-primary p-6 rounded-xl shadow-xl w-full max-w-5xl border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 text-blue-500">
              Edit About App Content
            </h2>

            <textarea
              className="w-full h-[500px] p-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-primary dark:bg-gray-900 text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={policy}
              onChange={(e) => setPolicy(e.target.value)}
              placeholder={`Example:

About App

1. Fast performance
2. Easy to use

- Secure
- Reliable`}
            />

            <div className="flex justify-end space-x-3 mt-6">
              <Button onClick={() => setOpenEditor(false)}>
                Cancel
              </Button>
              <Button type="primary" onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
