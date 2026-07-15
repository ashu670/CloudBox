import {prisma} from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const salt = 10;

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        {id : user.id, role : user.role},
        process.env.JWT_SECRET,
        {expiresIn : '15m'}
    );

    const refreshToken = jwt.sign(
        {id : user.id},
        process.env.JWT_SECRET_REF,
        {expiresIn : '7d'}
    );

    return {accessToken, refreshToken};
};

export const registerUser = async (name, email, password) => {   // name, email, password aaya controller se 
    const existing = await prisma.user.findUnique({where : {email}});  // prisma ka db hamne bana rkha h usme se check kra unique email
    if(existing) throw new Error('Email already exists');   // agar mil gya to user pahle se exist krta h 

    const hashed = await bcrypt.hash(password, salt);    // otherwise nhi mila unique email to  hashed variable mai  password ko salt ki help leke bcrypt kra
    const newUser = await prisma.user.create({data : {name, email, password : hashed}}); // and model mai user ka name, email, and hashed password store krwa diya 

    const tokens = generateTokens(newUser);   // abb newuser jisme h user ka name, email, hashedpassword  ka use krke genrattoken mai bhej diya or genrate token -> acesss token and refresh token dono bana ke return kr dera h waps jo ki store ho jaa rha h tokens mai and ham fir wo tokens send kr rhe h waps to controllers 

    const {password : _, ...rest} = newUser;    // destructuring ---->>> const _ = newUser.password;    newuser.password store in the variable name -> _   ,      _ = "$2b$10$abcxyz12345"  ,        why only _ bcz -> Ye value intentionally ignore kar rahe hain.   rest all are in ...rest
    return {user : rest, ...tokens};   // here return the user : rest means -> id, name, email (not password)  and all tokens (access, refresh)
};

// same as register user
export const loginUser = async (email, password) => {
    const user = await prisma.user.findUnique({where : {email}});
    if(!user) throw new Error('Invalid email');

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) throw new Error('Invalid Password');

    const tokens = generateTokens(user);
    const {password : _, ...rest} = user;
    return {user : rest, ...tokens};
}

export const refreshAccessTokens = async (refreshToken) => {  // coming from authcontroller jo refresh token store h hammare res.cokies m  
    const decode = jwt.verify(refreshToken, process.env.JWT_SECRET_REF);  // yha verify hora h ki wo refresh token shi h ki nhi 

                                                                         // agar shi nhi h to yhi se return ho jayega err and chala jayega authcontroller m err send krne ki refresh token is not valid 

    const user = await prisma.user.findUnique({where : {id : decode.id}});   // other wise searching the user -> agar mila to ok (new access token genrate krke return krnege ) . 
    if(!user) throw new Error('user not found');   // otherwise -> err ki user not found or acces token nhi banega ku ? user hai hi nhi iss credentials ka 

    //issue new access token
    const accessToken = jwt.sign(                   // abb user h agar mil gya to uski new access token waps create krke return kr denge 
        {id : user.id, role : user.role},
        process.env.JWT_SECRET,
        {expiresIn : '15m'}
    );

    return {accessToken};
}