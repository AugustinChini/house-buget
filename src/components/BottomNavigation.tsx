import { useState, useEffect } from "react";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import {
  Home as HomeIcon,
  List as ListIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { Note as NoteIcon } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";

export function BottomNavigationBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = useState(0);

  // Update the selected value based on current route
  useEffect(() => {
    switch (location.pathname) {
      case "/":
        setValue(0);
        break;
      case "/expenses":
        setValue(1);
        break;
      case "/notes":
        setValue(2);
        break;
      case "/settings":
        setValue(3);
        break;
      default:
        // Check if the path starts with any of the known paths
        if (location.pathname.startsWith("/expenses")) {
          setValue(1);
        } else if (location.pathname.startsWith("/notes")) {
          setValue(2);
        } else if (location.pathname.startsWith("/settings")) {
          setValue(3);
        } else {
          setValue(0);
        }
    }
  }, [location.pathname]);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    switch (newValue) {
      case 0:
        navigate("/");
        break;
      case 1:
        navigate("/expenses");
        break;
      case 2:
        navigate("/notes");
        break;
      case 3:
        navigate("/settings");
        break;
    }
  };

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderTop: 1,
        borderColor: "divider",
      }}
      elevation={3}
    >
      <BottomNavigation
        value={value}
        onChange={handleChange}
        showLabels
        sx={{
          "& .MuiBottomNavigationAction-root": {
            minWidth: "auto",
            padding: "6px 12px 8px",
          },
          "& .MuiBottomNavigationAction-label": {
            fontSize: "0.75rem",
            marginTop: "4px",
          },
        }}
      >
        <BottomNavigationAction
          label="Accueil"
          icon={<HomeIcon />}
          sx={{
            "&.Mui-selected": {
              color: "primary.main",
            },
          }}
        />
        <BottomNavigationAction
          label="Dépenses"
          icon={<ListIcon />}
          sx={{
            "&.Mui-selected": {
              color: "primary.main",
            },
          }}
        />
        <BottomNavigationAction
          label="Notes"
          icon={<NoteIcon />}
          sx={{
            "&.Mui-selected": {
              color: "primary.main",
            },
          }}
        />
        <BottomNavigationAction
          label="Paramètres"
          icon={<SettingsIcon />}
          sx={{
            "&.Mui-selected": {
              color: "primary.main",
            },
          }}
        />
      </BottomNavigation>
    </Paper>
  );
}
