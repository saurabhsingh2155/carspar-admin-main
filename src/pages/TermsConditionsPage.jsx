import React, { useState, useEffect } from "react";
import api from "../utils/axiosInstance";
import { message, Button } from "antd";
import LoadingOverlay from "../components/LoadingOverlay";

export default function TermsConditionsPage() {
  const API_INFO = "/info";

  const [terms, setTerms] = useState("");
  const [infoId, setInfoId] = useState(null);
  const [openEditor, setOpenEditor] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH TERMS ================= */
  const fetchTerms = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_INFO, {
        params: { type: "terms" },
      });

      if (res.data?.data) {
        setTerms(res.data.data.content || "");
        setInfoId(res.data.data._id);
      }
    } catch {
      setTerms("");
      setInfoId(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms();
  }, []);

  /* ================= SAVE ================= */
  const handleSave = async () => {
    if (!terms) {
      message.warning("Terms content is empty");
      return;
    }

    setLoading(true);
    try {
      if (infoId) {
        await api.patch(`${API_INFO}/${infoId}`, {
          content: terms,
        });
      } else {
        const res = await api.post(API_INFO, {
          type: "terms",
          content: terms,
        });
        setInfoId(res.data.data._id);
      }

      setOpenEditor(false);
      message.success("Terms & Conditions saved successfully!");
    } catch (err) {
      console.error("Error saving terms:", err);
      message.error(err.response?.data?.message || "Failed to save terms");
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
        <h1 className="text-blue-500 text-lg font-bold">
          Terms & Conditions
        </h1>

        <Button type="primary" onClick={() => setOpenEditor(true)}>
          Edit Terms
        </Button>
      </div>

      {/* DISPLAY */}
      <div className="bg-secondary rounded-xl shadow p-6 text-primary leading-relaxed flex-grow border border-gray-100 dark:border-gray-800 overflow-auto">
        {terms ? (
          <div className="prose dark:prose-invert max-w-none">
            {renderFormattedText(terms)}
          </div>
        ) : (
          <p className="text-gray-500 italic">
            No terms and conditions added yet.
          </p>
        )}
      </div>

      {/* EDITOR */}
      {openEditor && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex justify-center items-center px-3 z-50">
          <div className="bg-secondary text-primary p-6 rounded-xl w-full max-w-5xl shadow-2xl border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 text-blue-500">
              Edit Terms & Conditions Content
            </h2>

            <textarea
              className="w-full h-[500px] p-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-primary dark:bg-gray-900 text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder={`Example:

Terms & Conditions

1. You must be 18+
2. Follow rules

- No misuse
- No illegal activity`}
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
