import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Box } from "@mui/material";

interface TransitionWrapperProps {
  children: React.ReactNode;
}

export function TransitionWrapper({ children }: TransitionWrapperProps) {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Start exit animation
    setIsExiting(true);
    setIsVisible(false);

    // After exit animation, change route and start enter animation
    const exitTimer = setTimeout(() => {
      setIsExiting(false);
      setIsVisible(true);
    }, 300); // Match the transition duration

    return () => clearTimeout(exitTimer);
  }, [location.pathname]);

  const getTransitionStyle = () => {
    if (isExiting) {
      return {
        opacity: 0,
        transform: "translateY(-20px) scale(0.98)",
        filter: "blur(2px)",
      };
    }

    if (isVisible) {
      return {
        opacity: 1,
        transform: "translateY(0) scale(1)",
        filter: "blur(0px)",
      };
    }

    return {
      opacity: 0,
      transform: "translateY(20px) scale(0.98)",
      filter: "blur(2px)",
    };
  };

  return (
    <Box
      sx={{
        ...getTransitionStyle(),
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        minHeight: "100vh",
        width: "100%",
        position: "relative",
        "& > *": {
          // Ensure all child elements inherit the transition
          transition: "inherit",
        },
      }}
    >
      {children}
    </Box>
  );
}
