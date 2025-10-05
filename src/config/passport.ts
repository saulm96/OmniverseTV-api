import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.API_CALLBACK_URL!,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
            return done(new Error("No email found from Google profile"), false);
        }

        let user = await User.findOne({ where: { provider_id: profile.id } });

        if (user) {
          return done(null, user);
        }

        // If no user with that Google ID, check if the email is already in use
        // MODIFICADO: Use the email variable we defined above
        user = await User.findByEmail(email);

        if (user) {
          user.provider_id = profile.id;
          // You might want to update the auth_provider as well if they can now login via Google
          // user.auth_provider = 'google'; 
          await user.save();
          return done(null, user);
        }

        const newUser = await User.create({
          username: profile.displayName,
          email: email, 
          auth_provider: 'google',
          provider_id: profile.id,
          is_verified: true, 
          password_hash: null, 
          preferred_language: 'en',
        });

        return done(null, newUser);
      } catch (error: any) {
        return done(error, false);
      }
    }
  )
);