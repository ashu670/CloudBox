import {prisma} from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const salt = 10;

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        {id : user.id, role : user.role},
        process.env.JWT_SECRET,
        {expiresIn : '60m'}
    );

    const refreshToken = jwt.sign(
        {id : user.id},
        process.env.JWT_SECRET_REF,
        {expiresIn : '7d'}
    );

    return {accessToken, refreshToken};
};

export const registerUser = async (name, email, password) => {
    const existing = await prisma.user.findUnique({where : {email}});
    if(existing) throw new Error('Email already exists');

    const hashed = await bcrypt.hash(password, salt);
    const newUser = await prisma.user.create({data : {name, email, password : hashed}});

    const tokens = generateTokens(newUser);

    const {password : _, ...rest} = newUser;
    return {user : rest, ...tokens};
};

export const loginUser = async (email, password) => {
    const user = await prisma.user.findUnique({where : {email}});
    if(!user) throw new Error('Invalid email');

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) throw new Error('Invalid Password');

    const tokens = generateTokens(user);
    const {password : _, ...rest} = user;
    return {user : rest, ...tokens};
}

export const refreshAccessTokens = async (refreshToken) => {
    const decode = jwt.verify(refreshToken, process.env.JWT_SECRET_REF);

    const user = await prisma.user.findUnique({where : {id : decode.id}});
    if(!user) throw new Error('user not found');

    //issue new access token
    const accessToken = jwt.sign(
        {id : user.id, role : user.role},
        process.env.JWT_SECRET,
        {expiresIn : '15m'}
    );

    return {accessToken};
}