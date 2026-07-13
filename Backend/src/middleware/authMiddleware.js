import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
    const head = req.headers.authorization;

    if(!head || !head.startsWith("Bearer ")) return res.status(401).json({error : 'token missing'});

    const token = head.split(' ')[1];

    try{
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decode;
        next();
    }catch(error){
        return res.status(403).json({error : "Invalid token"});
    }
};

export const authorizeRole = (...allowed) => {
    return (req, res, next) => {
        if(!req.user) return res.status(401).json({error : 'unauthorized'});

        if(!allowed.includes(req.user.role)) return res.status(403).json({error : 'Insuffiecient permisson'});

        next();
    };
};