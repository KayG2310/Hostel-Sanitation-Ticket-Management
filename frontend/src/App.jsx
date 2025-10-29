import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import SignupStudent from "./pages/SignupStudent";
import SignupCaretaker from "./pages/SignupCaretaker";
import SignupWarden from "./pages/SignupWarden";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup/student" element={<SignupStudent />} />
        <Route path="/signup/caretaker" element={<SignupCaretaker />} />
        <Route path="/signup/warden" element={<SignupWarden />} />
      </Routes>
    </Router>
  );
}

export default App;
