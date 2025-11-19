import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User, UserAuth } from "../models";
import { sequelize } from "../config/database/connection";

export const configurePassport = () => {
  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET ||
    !process.env.API_CALLBACK_URL
  ) {
    throw new Error("Google OAuth environment variables are not defined.");
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.API_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email found from Google profile"), false);
          }

          let userAuth = await UserAuth.findOne({
            where: { provider_id: profile.id },
            include: [{ model: User, as: "user" }],
          });

          if (userAuth && userAuth.user) {
            return done(null, userAuth.user.get({ plain: true }));
          }

          const user = await User.findOne({ where: { email } });
          const t = await sequelize.transaction();
          try {
            if (user) {
              userAuth = await UserAuth.findOne({
                where: { user_id: user.id },
                transaction: t,
              });
              if (userAuth) {
                userAuth.provider_id = profile.id;
                userAuth.auth_provider = "google";
                await userAuth.save({ transaction: t });
              } else {
                await UserAuth.create(
                  {
                    user_id: user.id,
                    provider_id: profile.id,
                    auth_provider: "google",
                    is_verified: true,
                    is_two_factor_enabled: false,
                  },
                  { transaction: t }
                );
              }
              await t.commit();
              return done(null, user.get({ plain: true }));
            }

            const newUser = await User.create(
              {
                username: profile.displayName,
                email: email,
                preferred_language: "en",
                role: "user",
              },
              { transaction: t }
            );

            await UserAuth.create(
              {
                user_id: newUser.id,
                provider_id: profile.id,
                auth_provider: "google",
                is_verified: true,
                is_two_factor_enabled: false,
              },
              { transaction: t }
            );

            await t.commit();
            return done(null, newUser.get({ plain: true }));
          } catch (error) {
            await t.rollback();
            return done(error as Error, false);
          }
        } catch (error: any) {
          return done(error, false);
        }
      }
    )
  );
};
