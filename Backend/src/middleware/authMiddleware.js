import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
    const head = req.headers.authorization;

    if(!head || !head.startsWith('Bearer ')){
        return res.status(401).json({error : 'Acess token missing'});
    }

    const token = head.split(' ')[1];

    try{
        const decode = jwt.verify(token, process.env.JWT_ACCESS_SECRET); //token sign compares with new sign...
        req.user = decode;
        next();
    }catch(err){
        return res.status(403).json({err : 'Access token invalid or expired'});
    }
};
// newSignature = HMAC_SHA256(
//     AAA + "." + BBB,
//     JWT_ACCESS_SECRET
// )


export const authorizeRoles = (...allowed) => {
    return (req, res, next) => {
        if(!req.user){
            return res.status(401).json({error : 'unauthorised'});
        }

        if(!allowed.includes(req.user.role)){
            return res.status(403).json({error : 'insuffiecient permission'});
        }

        next();
    }
}