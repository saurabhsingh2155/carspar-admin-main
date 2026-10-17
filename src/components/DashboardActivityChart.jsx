import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function RealTimeGraph() {
  const [data, setData] = useState([
    { time: 1, value: 10 },
    { time: 2, value: 15 },
    { time: 3, value: 12 },
    { time: 4, value: 18 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prevData) => [
        ...prevData.slice(-7), 
        {
          time: prevData.length + 1,
          value: Math.floor(Math.random() * 30) + 5, // random live value
        },
      ]);
    }, 2000); 

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-[100% ] h-80 p-4 card-shadow shadow bg-primary text-primary rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2">Real-Time Growth Chart</h2>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" label={{ value: "Time", position: "insideBottomRight" }} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
