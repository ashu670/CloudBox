import { useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Signup(){
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email : "",
        password : ""
    });

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name] : e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try{
            const res = await axios.post('api/auth/login', form);
            localStorage.setItem('accessToken', res.data.accessToken);
            navigate('/dashboard');
        }catch(err){
            alert(err.response.data.error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                name="email"
                placeholder="Email"
                onChange={handleChange}
            />

            <br />

            <input
                type="password"
                name="password"
                placeholder="Password"
                onChange={handleChange}
            />

            <br />

            <button>

                Login

            </button>

        </form>
    );
}