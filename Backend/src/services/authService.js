import {prisma} from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as repo from '../repositories/userRepo.js';

const salt = 10;

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        {id : user.id, role : user.role},
        process.env.JWT_SECRET,
        {expiresIn : '1h'}
    );

    const refreshToken = jwt.sign(
        {id : user.id},
        process.env.JWT_SECRET_REF,
        {expiresIn : '7d'}
    );

    return {accessToken, refreshToken};
};

export const googleTokens = (data) => {
    const accessToken = jwt.sign(data, process.env.JWT_SECRET, {expiresIn : "1h"});
    const refreshToken = jwt.sign(
        {id : data.id},
        process.env.JWT_SECRET_REF,
        {expiresIn : '7d'}
    );

    return {accessToken, refreshToken};
}

export const registerUser = async (name, email, password) => {
    const existing = await repo.findByEmail(email);
    if(existing) throw new Error('Email already exists');

    const hashed = await bcrypt.hash(password, salt);
    const newUser = await repo.create({name, email, password : hashed});

    const tokens = generateTokens(newUser);

    const {password : _, ...rest} = newUser;
    return {user : rest, ...tokens};
};

export const loginUser = async (email, password) => {
    const user = await repo.findByEmail(email);
    if(!user) throw new Error('Invalid email');

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) throw new Error('Invalid Password');

    const tokens = generateTokens(user);
    const {password : _, ...rest} = user;
    return {user : rest, ...tokens};
}

export const refreshAccessTokens = async (refreshToken) => {
    const decode = jwt.verify(refreshToken, process.env.JWT_SECRET_REF);

    const user = await repo.findById(decode.id);
    if(!user) throw new Error('user not found');

    //issue new access token
    const accessToken = jwt.sign(
        {id : user.id, role : user.role},
        process.env.JWT_SECRET,
        {expiresIn : '15m'}
    );

    return {accessToken};
}