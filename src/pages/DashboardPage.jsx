import React, { useState, useEffect } from "react";
import RealTimeGraph from "../components/DashboardActivityChart";
import PieChartGraph from "../components/DashboardPieChart";
import api from "../utils/axiosInstance";
import UserTable from "./UsersPage";

export default function DashboardPage() {
  const [counts, setCounts] = useState({
    totalCars: 0,
    totalUsers: 0,
    totalVariants: 0, // Added to match API response
  });
  const [loading, setLoading] = useState(true);

  // Fetch API counts on component mount
  useEffect(() => {
    const fetchSummaryCounts = async () => {
      try {
                const response = await api.get(`/dashboard`); 
        const result = response.data;

        if (result.success) {
          setCounts({
            totalCars: result.data.totalCars,
            totalUsers: result.data.totalUsers,
            totalVariants: result.data.totalVariants,
          });
        }
      } catch (error) {
        console.error("Error fetching dashboard counts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummaryCounts();
  }, []);

  return (
    <>
      <main className="flex flex-col shadow gap-6.5 px-4.5 py-4.5 card-shadow rounded-lg bg-primary text-primary">
        <h1 className="text-xl font-bold mt-4 text-blue-500">Dashboard</h1>
        
        <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Cars (Products) Card */}
          <div className="flex flex-col shadow bg-primary card-shadow h-[170px]">
            <p className="pl-4 pt-3.5 text-[15px]">Total Cars</p>
            <div className="card-shadow ml-[15px] mt-[20px] rounded-3xl w-[80%] bg-red-300">
              <p className="p-5 text-black font-semibold">
                {loading ? "..." : counts.totalCars.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Total Paid Orders Card */}
          <div className="flex flex-col shadow bg-primary card-shadow h-[170px]">
            <p className="pl-4 pt-3.5 text-[15px]">Total Users</p>
            <div className="card-shadow ml-[15px] mt-[20px] rounded-3xl w-[80%] bg-yellow-200">
              <p className="p-5 text-black font-semibold">
                {loading ? "..." : counts.totalUsers.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Total Customers (Users) Card */}
          <div className="flex flex-col shadow bg-primary card-shadow h-[170px]">
            <p className="pl-4 pt-3.5 text-[15px]">Total Variants</p>
            <div className="card-shadow ml-[15px] mt-[20px] rounded-3xl w-[80%] bg-green-300">
              <p className="p-5 text-black font-semibold">
                 {loading ? "..." : counts.totalVariants.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Sales Card */}
          <div className="flex flex-col shadow bg-primary card-shadow h-[170px]">
            <p className="pl-4 pt-3.5 text-[15px]">Sales</p>
            <div className="card-shadow ml-[15px] mt-[20px] rounded-3xl w-[80%] bg-purple-300">
              <p className="p-5 text-black font-semibold">0</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 card-shadow">
          <div> <RealTimeGraph /> </div>
          <div> <PieChartGraph totalCars={counts.totalCars} totalUsers={counts.totalUsers} /> </div>
        </div>

        <div className="bg-primary text-primary rounded-lg">
          {/* <UserTable /> */}
        </div>
      </main>
    </>
  );
}
