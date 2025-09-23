import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext"; // Import AuthProvider
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import CreateItem from "./pages/CreateItem";
import AllItems from "./pages/AllItem";
import ItemDetail from "./pages/ItemDetail";
import ProfilePage from "./pages/ProfilePage";
import UpdateItem from "./pages/UpdateItem";
import BuyItemPage from "./pages/BuyItemPage";
import PrivateChat from "./components/PrivateChat";
import SellerChats from "./components/SellerChats";
import OtherProfilePage from "./pages/OtherProfilePage";

function App() {
  return (
    <AuthProvider>
      {" "}
      {/* Wrap everything with AuthProvider */}
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/create-item" element={<CreateItem />} />
          <Route path="/all-items" element={<AllItems />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile\:otherUserId" element={<OtherProfilePage />} />
          <Route path="/item/:itemId" element={<ItemDetail />} />
          <Route path="/item/:itemId/updateItem" element={<UpdateItem />} />
          <Route path="/items/:itemId/buy" element={<BuyItemPage />} />
          <Route path="/chats/:itemId/:otherUserId" element={<PrivateChat />} />
          <Route path="/seller-chats/:itemId" element={<SellerChats />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
