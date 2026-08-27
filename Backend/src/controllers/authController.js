import * as authService from '../services/authService.js';
import * as userRepo from '../repositories/userRepo.js';
import { formatUserForResponse } from '../utils/userFormatter.js';

const isProduction = process.env.NODE_ENV === "production";

const COOKIE_OPTIONS = {
    httpOnly : true,
    secure : isProduction,
    sameSite : isProduction ? 'none' : 'strict',
    maxAge : 7 * 24 * 60 * 60 * 1000
};

export const signup = async (req, res) => {
    try{
        const {name, email, password} = req.body;   //validation will be done before this   
        const {user, accessToken, refreshToken} = await authService.registerUser(name, email, password);
        res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
        return res.status(201).json({user, accessToken});
    }catch(err){
        return res.status(400).json({error : err.message});
    }
};

export const login = async (req, res) => {
    try{
        const {email, password} = req.body;
        const {user, accessToken, refreshToken} = await authService.loginUser(email, password);

        res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
        return res.status(200).json({user, accessToken});
    }catch(err){
        return res.status(401).json({error : err.message});
    }
}

export const refresh = async (req, res) => {
    try{
        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken) return res.status(401).json({error : 'Refresh token are missing'});

        const {accessToken} = await authService.refreshAccessTokens(refreshToken);
        return res.status(200).json({accessToken});
    }catch(err){
        return res.status(403).json({error : 'invalid refresh tokens'});
    }
};

export const logout = (req, res) => {
    res.clearCookie('refreshToken', {...COOKIE_OPTIONS, maxAge : 0});
    return res.status(200).json({message : 'Logout successful'});
};

export const getProfile = async (req, res) => {
    try {
        const user = await userRepo.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found" });
        return res.status(200).json({ user: formatUserForResponse(user) });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

export const handleGoogleCallback = async (req, res) => {
    const data = {
        id : req.user.id,
        email : req.user.email,
        role : req.user.role
    };

    try{
        const {accessToken, refreshToken} = await authService.googleTokens(data);

        res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
        const frontendURL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
        return res.redirect(`${frontendURL}/auth/success?token=${accessToken}`);
    }catch(err){
        return res.status(500).json({error : "Failed to generate authentication tokens"});
    }
}

export const healthCheck = (req, res) => {
    return res.status(200).json({health : "OK"});
}