import * as authService from '../services/authService.js';

    const COOKIE_OPTIONS = {
    httpOnly : true,
    secure : process.env.NODE_ENV === "production",
    sameSite : 'strict',
    maxAge : 7 * 24 * 60 * 60 * 1000
    };

export const signup = async (req, res) => {
    try{
        const {name, email, password} = req.body;   //validation will be done before this
        const {user, accessToken, refreshToken} = await authService.registerUser(name, email, password);  // ye jo servise se return hoke aari h  user and token (token-> acess token , refreh token)
        // registerUser(name, email, password);  ye call hoke jari h services mai and fir services se return hoke aara h  (...rest, tokens)
       
        res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);  // fir yha cookie m bhej diya only refresh token in http (using predefined cookies option).    Reason:   Refresh Token long-term hota hai. Secure cookie me store karte hain.
        return res.status(201).json({user, accessToken});   // hamne client ko bheja that 201 Created and -> access token bhi kuki access token client side se store hogi naki backend se
    }catch(err){
        return res.status(400).json({error : err.message});
    }
};

// same as register user
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

export const refresh = async (req, res) => {      // Agr Access Token expire hogya to refresh token se kaise wapss acess token banega 
    try{
        const {refreshToken} = req.cookies.refreshToken;    // refresh token naam ke variable mai pahle to aa jayega cokies pe store hui refresh token
        if(!refreshToken) return res.status(401).json({error : 'Refresh token are missing'});   // refresh token hai hi nhi to error

        const {accessToken} = await authService.refreshAccessTokens(refreshToken); // agar hai to service ka  --> refreshAccessTokens(refreshToken) function run krenge with the parameter jo bhi refresh token mila h .... ku ? -> verify krne ke liye ki shi h ya nhi agar shi hua to auth sevice hi verify kreke ek nya token banna ke return kr dega 
        return res.status(200).json({accessToken});  // agar authservice ne hamne new accesstoken bhej di to ham isko res.status krke bhej denge
    }catch(err){
        return res.status(403).json({error : 'invalid refresh tokens'});  // otherwise hame authservice ne error bhej di to iska mtlb kya ?? jo refresh token hame milii thi or hamne authservice ko bheji thi verify krne ke liye wo access token glt h ...
    }
};

export const logout = (req, res) => {
    res.clearCookie('refreshToken', {...COOKIE_OPTIONS, maxAge : 0});  // ye sirf logout h jisme hamne cookie ke saree option to whi rkhe h ki  httpOnly : true, ho and same site -> strict ho but bss age -> 0 kr diya jisee cookie hat gya and ham logout hogye 
    return res.status(200).json({message : 'Logout succesfull'});
};

export const getProfile = (req, res) => {
    return res.status(200).json({user : req.user});   // profile page pe bhej rha h bss normally 
}