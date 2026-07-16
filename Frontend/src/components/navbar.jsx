import { Link } from "react-router-dom";

export default function Navbar() {

    return (

        <nav>

            <Link to="/">Signup</Link>

            {" | "}

            <Link to="/login">Login</Link>

            {" | "}

            <Link to="/profile">Profile</Link>

            {" / "}

            <Link to="/dashboard">Dashboard</Link>

        </nav>

    );

}