import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer, Legend } from "recharts";

const data = [
  { name: "Total Product", value: 400 },
  { name: "Total Paid Orders", value: 300 },
  { name: "Total Customers", value: 200 },
  { name: "Sales", value: 150 },
];

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f7f"];

export default function PieChartGraph() {
  // We use a smaller radius for mobile to prevent overflow
  const isMobile = window.innerWidth < 768;

  return (
    <div className="bg-primary text-primary p-4 rounded-lg card-shadow">
      <h2 className="text-lg font-semibold mb-4 text-center md:text-left">Category Share</h2>

      {/* Adjust height: 200px on mobile, 240px on desktop */}
      <div className="w-full h-[200px] md:h-60">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              // Dynamic radius: 70 for mobile, 100 for desktop
              outerRadius={isMobile ? 70 : 100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} 
            />
            {/* Added Legend for better mobile UX since labels are hidden */}
            <Legend 
              verticalAlign="bottom" 
              height={6} 
              iconType="circle" 
              wrapperStyle={{ fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
