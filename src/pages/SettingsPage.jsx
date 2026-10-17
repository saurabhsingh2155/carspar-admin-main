import React, { useState, useEffect } from "react";
import api from "../utils/axiosInstance";
import { message, Button, Tabs, InputNumber } from "antd";
import LoadingOverlay from "../components/LoadingOverlay";

// Base API endpoints
const API_INFO = "/info";
const API_GLOBAL_CHARGES = "/charges";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [openEditor, setOpenEditor] = useState(false);

  const [content, setContent] = useState("");

  // Default 4 Slabs Template
  const defaultMatrix = [
    { minCc: 0, maxCc: 999, zoneARate: 0, zoneBRate: 0, threeYearTpPremium: 0 },
    { minCc: 1000, maxCc: 1200, zoneARate: 0, zoneBRate: 0, threeYearTpPremium: 0 },
    { minCc: 1201, maxCc: 1500, zoneARate: 0, zoneBRate: 0, threeYearTpPremium: 0 },
    { minCc: 1501, maxCc: 99999, zoneARate: 0, zoneBRate: 0, threeYearTpPremium: 0 },
  ];

  const [commonFields, setCommonFields] = useState({
    registrationFee: 0,
    hsrpPrice: 0,
    fastagCost: 0,
    hypothecation: 0,
    otherCharges: 0,
    ccPremiumMatrix: defaultMatrix,
  });

  const [infoId, setInfoId] = useState(null);
  const [activeTab, setActiveTab] = useState("terms");

  /* ================= FETCH DATA ================= */
  const fetchData = async (type) => {
    setLoading(true);
    try {
      if (type === "common") {
        const res = await api.get(API_GLOBAL_CHARGES);
        const data = res.data?.data;
        if (data) {
          // Keep the four fixed slabs and reuse any rates already stored.
          const mergedMatrix = defaultMatrix.map((defaultSlab, index) => {
            const existingSlab = data.tariffs && data.tariffs[index];
            return {
              ...defaultSlab,
              zoneARate: existingSlab?.zoneARate || 0,
              zoneBRate: existingSlab?.zoneBRate || 0,
              threeYearTpPremium: existingSlab?.threeYearTpPremium || 0,
            };
          });

          setCommonFields({
            registrationFee: data.registrationFee || 0,
            hsrpPrice: data.hsrpPrice || 0,
            fastagCost: data.fastagCost || 0,
            hypothecation: data.hypothecation || 0,
            otherCharges: data.otherCharges || 0,
            ccPremiumMatrix: mergedMatrix, // Guaranteed to be 4 slabs now
          });
        } else {
          resetState("common");
        }
      } else {
        const res = await api.get(API_INFO, { params: { type: type } });
        const data = res.data?.data;
        if (data) {
          setInfoId(data._id);
          setContent(data.content || "");
        } else {
          setInfoId(null);
          resetState(type);
        }
      }
    } catch (err) {
      console.error(`Error loading data for ${type}:`, err);
      setInfoId(null);
      resetState(type);
    } finally {
      setLoading(false);
    }
  };

  const resetState = (type) => {
    if (type === "common") {
      setCommonFields({
        registrationFee: 0,
        hsrpPrice: 0,
        fastagCost: 0,
        hypothecation: 0,
        otherCharges: 0,
        ccPremiumMatrix: defaultMatrix,
      });
    } else {
      setContent("");
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  /* ================= MATRIX HANDLERS ================= */
  const handleMatrixChange = (index, field, value) => {
    const updatedMatrix = [...commonFields.ccPremiumMatrix];
    updatedMatrix[index] = { ...updatedMatrix[index], [field]: value || 0 };
    setCommonFields({ ...commonFields, ccPremiumMatrix: updatedMatrix });
  };

  /* ================= SAVE DATA ================= */
  const handleSave = async () => {
    setLoading(true);

    try {
      if (activeTab === "common") {
        const payload = {
          registrationFee: commonFields.registrationFee,
          hsrpPrice: commonFields.hsrpPrice,
          fastagCost: commonFields.fastagCost,
          hypothecation: commonFields.hypothecation,
          otherCharges: commonFields.otherCharges,
          tariffs: commonFields.ccPremiumMatrix,
        };

        const res = await api.put(API_GLOBAL_CHARGES, payload);

        if (res.data?.success) {
          message.success("Global charges updated successfully!");
          fetchData("common");
        }
      } else {
        if (infoId) {
          await api.patch(`${API_INFO}/${infoId}`, { content });
        } else {
          const res = await api.post(API_INFO, { type: activeTab, content });
          setInfoId(res.data.data._id);
        }
        message.success("Saved successfully!");
      }

      setOpenEditor(false);
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI RENDERERS ================= */
  const renderCommonForm = (isEditable) => {
    const standardFields = Object.keys(commonFields).filter(
      (key) => key !== "ccPremiumMatrix",
    );

    return (
      <div className="flex flex-col gap-6">
        {/* Standard Global Fees Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {standardFields.map((key) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-sm font-medium capitalize text-gray-600 dark:text-gray-400">
                {key.replace(/([A-Z])/g, " $1").replace("Cost", "")} (₹)
              </label>
              <InputNumber
                className="w-full h-10 flex items-center"
                disabled={!isEditable}
                value={commonFields[key]}
                formatter={(value) =>
                  `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/₹\s?|,/g, "")}
                onChange={(val) =>
                  setCommonFields({ ...commonFields, [key]: val || 0 })
                }
              />
            </div>
          ))}
        </div>

        {/* CC Premium Slabs Form Matrix */}
        <div className="border-t pt-4 border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-blue-500 mb-3">
            Insurance Tax Slabs
          </h3>

          <div className="flex flex-col gap-3">
            {commonFields.ccPremiumMatrix.map((slab, index) => (
              <div
                key={index}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-primary/20"
              >
                <div className="text-xs font-bold text-gray-500 mb-2">
                  Slab {index + 1}: {slab.minCc} CC -{" "}
                  {slab.maxCc === 99999 ? "Above" : `${slab.maxCc} CC`}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">
                      Zone A Rate (%)
                    </label>
                    <InputNumber
                      className="w-full"
                      disabled={!isEditable}
                      value={slab.zoneARate}
                      placeholder="e.g. 3.127"
                      onChange={(val) =>
                        handleMatrixChange(index, "zoneARate", val)
                      }
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">
                      Zone B Rate (%)
                    </label>
                    <InputNumber
                      className="w-full"
                      disabled={!isEditable}
                      value={slab.zoneBRate}
                      placeholder="e.g. 3.039"
                      onChange={(val) =>
                        handleMatrixChange(index, "zoneBRate", val)
                      }
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">
                      3-Year TP Premium (₹)
                    </label>
                    <InputNumber
                      className="w-full"
                      disabled={!isEditable}
                      value={slab.threeYearTpPremium}
                      formatter={(value) =>
                        `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(value) => value.replace(/₹\s?|,/g, "")}
                      placeholder="e.g. 10248"
                      onChange={(val) =>
                        handleMatrixChange(index, "threeYearTpPremium", val)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const TabPaneContent = (title, type) => (
    <div className="flex flex-col h-full mt-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-base md:text-lg font-bold text-blue-500">
          {title}
        </h1>
        <Button type="primary" onClick={() => setOpenEditor(true)}>
          Edit {title}
        </Button>
      </div>

      <div className="bg-secondary rounded-xl shadow p-6 border border-gray-100 dark:border-gray-800 flex-grow overflow-auto">
        {type === "common" ? (
          renderCommonForm(false) 
        ) : content ? (
          <div className="prose dark:prose-invert max-w-none break-words whitespace-pre-wrap">
            {content}
          </div>
        ) : (
          <p className="text-gray-500 italic text-sm">No content added yet.</p>
        )}
      </div>
    </div>
  );

  const items = [
    { key: "terms", label: "T&C", children: TabPaneContent("Terms & Conditions", "terms") },
    { key: "privacy", label: "Privacy", children: TabPaneContent("Privacy Policy", "privacy") },
    { key: "aboutApp", label: "About", children: TabPaneContent("About App", "aboutApp") },
    { key: "common", label: "Common", children: TabPaneContent("Common Charges", "common") },
  ];

  return (
    <div className="p-3 md:p-6 w-full min-h-screen md:h-[100vh] bg-primary text-primary rounded-lg shadow relative flex flex-col">
      {loading && <LoadingOverlay />}
      <Tabs activeKey={activeTab} onChange={setActiveTab} type="card" items={items} />

      {openEditor && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex justify-center items-center p-2 md:p-4 z-50">
          <div className="bg-secondary p-6 rounded-xl shadow-xl w-full max-w-3xl flex flex-col border border-gray-100 dark:border-gray-800 max-h-[90vh]">
            <h2 className="text-xl font-semibold mb-6 text-blue-500">
              Edit {items.find((i) => i.key === activeTab)?.label}
            </h2>

            <div className="flex-grow overflow-y-auto pr-1">
              {activeTab === "common" ? (
                renderCommonForm(true) 
              ) : (
                <textarea
                  className="w-full h-[400px] p-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-primary text-primary focus:ring-2 focus:ring-blue-500 resize-none"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              )}
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <Button onClick={() => setOpenEditor(false)}>Cancel</Button>
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
