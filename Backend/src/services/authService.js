import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as repo from '../repositories/userRepo.js';
import { create, findRootFolder } from '../repositories/folderRepo.js';
import { formatUserForResponse } from '../utils/userFormatter.js';

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
    const data = {
        name : "root",
        uid : newUser.id,
        isRoot : true
    }
    const root  = await create(data);

    const tokens = generateTokens(newUser);   // abb newuser jisme h user ka name, email, hashedpassword  ka use krke genrattoken mai bhej diya or genrate token -> acesss token and refresh token dono bana ke return kr dera h waps jo ki store ho jaa rha h tokens mai and ham fir wo tokens send kr rhe h waps to controllers 

    return {user : formatUserForResponse(newUser), ...tokens, root : root.id};
};

// same as register user
export const loginUser = async (email, password) => {
    const user = await repo.findByEmail(email);
    if(!user) throw new Error('Invalid email');

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) throw new Error('Invalid Password');

    let rootFolder = await findRootFolder(user.id);
    if (!rootFolder) {
        rootFolder = await create({ name: "root", uid: user.id, isRoot: true });
    }

    const tokens = generateTokens(user);
    return { user: formatUserForResponse(user), ...tokens, root: rootFolder.id };
}

export const refreshAccessTokens = async (refreshToken) => {  // coming from authcontroller jo refresh token store h hammare res.cokies m  
    const decode = jwt.verify(refreshToken, process.env.JWT_SECRET_REF);  // yha verify hora h ki wo refresh token shi h ki nhi 

    const user = await repo.findById(decode.id);
    if(!user) throw new Error('user not found');

    //issue new access token
    const accessToken = jwt.sign(                   // abb user h agar mil gya to uski new access token waps create krke return kr denge 
        {id : user.id, role : user.role},
        process.env.JWT_SECRET,
        {expiresIn : '15m'}
    );

    return {accessToken};
}