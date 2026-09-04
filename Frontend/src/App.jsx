import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import Signup from "./pages/signup";
import Login from "./pages/login";
import FolderView from "./pages/Dashboard";
import AuthSuccess from "./pages/AuthSuccess";
import PublicShare from "./pages/PublicShare";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Signup />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/auth/success"
          element={<AuthSuccess />}
        />

        <Route
          path="/dashboard"
          element={<FolderView />}
        />

        <Route
          path="/share/:token"
          element={<PublicShare />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;