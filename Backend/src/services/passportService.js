import * as repo from "../repositories/userRepo.js";

export const passportService = async (GoogleAccessToken, GoogleRefreshToken, profile, done) => {
    try{
        const email = profile.emails && profile.emails[0]?.value;
        const googleId = profile.id;
        const name = profile.displayName || "Google User";

        if(!email) return done(new Error("no email found in google profile"), null);

        let user = await repo.findByGoogleId(googleId);
        if(!user) user = await repo.findByEmail(email);

        if(user) user = await repo.updateGoogleId(user.id, googleId);
        else user = await repo.createWithGoogle({name, email, googleId});

        return done(null, user);
    }catch(err){
        return done(err, null);
    }
}