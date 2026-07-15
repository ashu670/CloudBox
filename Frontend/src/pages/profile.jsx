import { useEffect, useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";



export default function Profile() {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {

        const fetchProfile = async () => {

            try {

                const token = localStorage.getItem("accessToken");

                const res = await axios.get("api/auth/profile", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                setUser(res.data.user);

            } catch (err) {

                console.log(err);

                alert(
                    err.response?.data?.error || "Unable to fetch profile."
                );

            } finally {

                setLoading(false);

            }

        };

        fetchProfile();

    }, []);

    const logout = async () => {
        try{
            await axios.post("api/auth/logout");

            localStorage.removeItem("accessToken");
            navigate('/login');
        }catch(err){
            console.error(err);
            alert(err.response?.data?.error || "Logout failed.");
        }
    }

    if (loading) {
        return <h2>Loading...</h2>;
    }

    if (!user) {
        return <h2>No User Found</h2>;
    }

    return (
        <div>

            <h1>CloudBox Profile</h1>

            <hr />

            <h3>ID : {user.id}</h3>

            <h3>Role : {user.role}</h3>

            <button onClick={logout}>logout</button>

        </div>
    );
}