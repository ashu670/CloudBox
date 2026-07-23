import jwt from 'jsonwebtoken';   // jwt is a string and we can use jsonwebtoken in order to decode, decode and verify

export const authenticate = (req, res, next) => {
    const head = req.headers.authorization;  // req.headers ek JavaScript object hai jisme client ke saare HTTP headers hote hain.  and  authorization = object ki property (key) hai baad m bhejnege hum frontend se .     this line contains Bearer at Starting.

    if(!head || !head.startsWith('Bearer ')){    // Bearer hum frontend ke sath bhejnege 
        return res.status(401).json({error : 'Acess token missing'});
    }
    // jwt contains 3 parts - header , payload , sign 

    // - >  sign part structure 

//     newSignature = HMAC_SHA256( 
//     AAA + "." + BBB,
//     JWT_ACCESS_SECRET
//     )

// so sign part contains the jwt_access_secret 

    const token = head.split(' ')[1]; // Splits "Bearer <JWT>" into ["Bearer", "<JWT>"] and extracts the JWT token using index [1].

    try{
       const decode = jwt.verify(token, process.env.JWT_SECRET); // Verifies the received JWT by checking its signature with the secret key (header + payload + secret); if valid, it returns the decoded payload.          or       Uses the server's JWT secret key to verify whether the received JWT is valid, untampered, and not expired. If valid, it returns the decoded payload.
        const userId = Number(decode.id);

        if (!Number.isInteger(userId)) {
            return res.status(401).json({ error: "Invalid token" });
        }

        req.user = { ...decode, id: userId };  // abhi jo current m user h jisee authenticate kiya h req.user m ussi ki id and role aayegi 

        next();
    }catch(error){
        return res.status(401).json({error : "Invalid token"});
    }
};

export const authorizeRoles = (...allowed) => {  // ye rest operator h yha kuch bhiaa skta h - admin, user   jo ki aisa banega [admin] or [user] or [admin, user]
    return (req, res, next) => {      // express ko middleware chayiye isliye iske andr return kr rha h
        if(!req.user){
            return res.status(401).json({error : 'unauthorised'});
        }
        if(!allowed.includes(req.user.role)) return res.status(403).json({error : 'Insuffiecient permisson'});

        next();
    }
}




/*

const decode = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

explanation:- 

jwt = 
    {
       header
       payload

       sign - header + " . " + payload , secrettoken
    }

 to isee ek jwt ban jayegi to bss aage kya hoga server ke poss jwt access secret token present h 
   
const decode = jwt.verify(token, process.env.JWT_ACCESS_SECRET); too yha pr ussii secret token ka use krke verify kr rhi h ki valid h kio nhi 


isme token - jwt h orr uss jwt ka signature verify hota h new bani hui signature se using server side secret token

*/




