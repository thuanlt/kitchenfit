export interface BadgeProps {
  children: React.ReactNode;
  color?: "orange" | "green" | "blue" | "purple";
}

export function Badge({ children, color = "orange" }: BadgeProps) {
  const colors = {
    orange: "bg-orange-500 text-white",
    green: "bg-green-500 text-white",
    blue: "bg-blue-500 text-white",
    purple: "bg-purple-500 text-white",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${colors[color]}`}>
      {children}
    </span>
  );
}