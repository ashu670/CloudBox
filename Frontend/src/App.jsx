import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import Navbar from "./components/navbar";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import FolderView from "./pages/Dashboard";
import AuthSuccess from "./pages/AuthSuccess";

function App() {
  return (
    <BrowserRouter>

      <Navbar />

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
          element={<FolderView/>}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;