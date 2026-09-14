import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
    const head = req.headers.authorization;

    if(!head || !head.startsWith('Bearer ')){
        return res.status(401).json({error : 'Acess token missing'});
    }

    const token = head.split(' ')[1];

    try{
       const decode = jwt.verify(token, process.env.JWT_SECRET);
        const userId = Number(decode.id);

        if (!Number.isInteger(userId)) {
            return res.status(401).json({ error: "Invalid token" });
        }

        req.user = { ...decode, id: userId }; 

        next();
    }catch(error){
        return res.status(401).json({error : "Invalid token"});
    }
};

export const authorizeRoles = (...allowed) => {
    return (req, res, next) => {
        if(!req.user){
            return res.status(401).json({error : 'unauthorised'});
        }
        if(!allowed.includes(req.user.role)) return res.status(403).json({error : 'Insuffiecient permisson'});

        next();
    }
}