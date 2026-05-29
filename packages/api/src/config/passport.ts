import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './env.js';

/**
 * Passport Configuration
 * 
 * Configures Passport.js with Google OAuth strategy for authentication.
 * 
 * Requirements: 4.1, 4.2, 17.1, 17.2
 */

// Configure Google OAuth strategy
// Requirements: 4.1, 17.1
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'], // Requirements: 17.1
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Extract profile data
          // Requirements: 4.2, 17.1
          const googleProfile = {
            googleId: profile.id,
            email: profile.emails?.[0]?.value || '',
            name: profile.displayName || '',
            avatarUrl: profile.photos?.[0]?.value,
          };

          // Validation
          if (!googleProfile.email) {
            return done(new Error('Email not provided by Google'), undefined);
          }

          // Pass profile to callback handler
          // The actual authentication logic is in authService.loginWithGoogle()
          return done(null, googleProfile);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );
}

// Minimal serialization for stateless JWT authentication
// Requirements: 17.1
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

export default passport;
