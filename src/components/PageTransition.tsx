import { useEffect, useState } from "react";
import { Box } from "@mui/material";

interface PageTransitionProps {
  children: React.ReactNode;
  isActive: boolean;
}

export function PageTransition({ children, isActive }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isActive) {
      // Small delay to ensure the component is mounted before showing
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isActive]);

  return (
    <Box
      sx={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.3s ease-in-out, transform 0.3s ease-in-out",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      {children}
    </Box>
  );
}
