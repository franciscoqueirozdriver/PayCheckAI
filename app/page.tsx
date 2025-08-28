import { redirect } from 'next/navigation';

// This component will automatically redirect users from the root path ("/")
// to the main application page ("/paycheckai").
export default function RootPage() {
  redirect('/paycheckai');

  // Note: a component that calls `redirect` should not return any JSX,
  // as the redirect happens on the server before rendering.
  return null;
}
