import passport from "passport";
import { Strategy as googleStrategy } from "passport-google-oauth20";
import { prisma } from "./db.js";

passport.use(
    new googleStrategy({
        clientID : process.env.GOOGLE_CLIENT_ID,
        clientSecret : process.env.GOOGLE_CLIENT_SEC,
        callbackURL : process.env.GOOGLE_CALLBACK_URL
    }),

    async (accessToken, refreshToken, Profiler, done) => {
        
    }
)