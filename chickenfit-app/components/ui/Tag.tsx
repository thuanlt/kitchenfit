export interface TagProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "success";
  size?: "sm" | "md";
  className?: string;
}

export function Tag({ children, variant = "primary", size = "md", className = "" }: TagProps) {
  const variants = {
    primary: "bg-orange-100 text-orange-700",
    secondary: "bg-gray-100 text-gray-700",
    success: "bg-green-100 text-green-700",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  };

  return (
    <span className={`inline-block rounded-full font-medium ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}