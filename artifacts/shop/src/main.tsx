import { createRoot } from "react-dom/client";
import "./lib/api"; // Initialize api settings
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
