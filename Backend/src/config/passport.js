import passport from "passport";
import { Strategy as googleStrategy } from "passport-google-oauth20";
import { prisma } from "./db.js";
import { passportService } from "../services/passportService.js";

passport.use(
    new googleStrategy({
        clientID : process.env.GOOGLE_CLIENT_ID,
        clientSecret : process.env.GOOGLE_CLIENT_SEC,
        callbackURL : process.env.GOOGLE_CALLBACK_URL
    }, passportService)
)

export default passport;