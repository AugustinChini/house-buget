import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { PageTransition } from "./PageTransition";

interface AnimatedRoutesProps {
  children: React.ReactNode;
}

export function AnimatedRoutes({ children }: AnimatedRoutesProps) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState("fadeIn");

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage("fadeOut");
    }
  }, [location, displayLocation]);

  const onAnimationEnd = () => {
    if (transitionStage === "fadeOut") {
      setDisplayLocation(location);
      setTransitionStage("fadeIn");
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
      }}
    >
      <Box
        key={displayLocation.pathname}
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          opacity: transitionStage === "fadeOut" ? 0 : 1,
          transform:
            transitionStage === "fadeOut"
              ? "translateY(-20px)"
              : "translateY(0)",
          transition: "opacity 0.3s ease-in-out, transform 0.3s ease-in-out",
        }}
        onTransitionEnd={onAnimationEnd}
      >
        <PageTransition isActive={transitionStage === "fadeIn"}>
          {children}
        </PageTransition>
      </Box>
    </Box>
  );
}
