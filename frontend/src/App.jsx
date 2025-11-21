import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import SignupStudent from "./pages/SignupStudent";
import DashboardStudent from "./pages/DashboardStudent";
import ProtectedRoute from "./components/ProtectedRoute"; // 👈 import this
import SignupCaretaker from "./pages/SignupCaretaker";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup/student" element={<SignupStudent />} />
        <Route path="/signup/caretaker" element={<SignupCaretaker />} />
        <Route
          path="/dashboard-student"
          element={
            <ProtectedRoute>
              <DashboardStudent />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
// function App() {
//   return (
//     <div className="flex items-center justify-center h-screen bg-blue-500 text-white text-4xl">
//       Tailwind is Working 🎉
//     </div>
//   )
// }

// export default App
