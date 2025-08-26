import { SessionProvider } from 'next-auth/react';
// The problem description mentions Tailwind CSS and Shadcn UI.
// A global stylesheet is required for them to work correctly.
// I will create this file in the next step.
import '../styles/globals.css';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    // The `session` prop is passed from `getServerSideProps` or `getInitialProps`
    // in Next.js pages, which NextAuth.js handles automatically.
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default MyApp;
