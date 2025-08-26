import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// Mock user data simulating a database
const users = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'adminpassword',
    role: 'admin',
  },
  {
    id: '2',
    name: 'Regular User',
    email: 'user@example.com',
    password: 'userpassword',
    role: 'user',
  },
];

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'admin@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) {
          return null;
        }

        const user = users.find(
          (u) => u.email === credentials.email && u.password === credentials.password
        );

        if (user) {
          // Return the user object to be encoded in the JWT
          return { id: user.id, name: user.name, email: user.email, role: user.role };
        } else {
          // If you return null then an error will be displayed advising the user to check their details.
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Persist the user's role to the token right after signin
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user role.
      if (session.user) {
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin', // A page for signing in (optional, can be created later)
    error: '/auth/error', // Error page (e.g., for auth errors)
  },
  secret: process.env.NEXTAUTH_SECRET || 'supersecretkey', // In production, use an env variable
});
