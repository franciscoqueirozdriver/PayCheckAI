import { useEffect } from 'react';
import { useRouter } from 'next/router';

const HomePage = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect the user to the main calculator page
    router.replace('/calcular-dsr');
  }, [router]);

  // Return a null or a simple loader while the redirect is happening
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh'
    }}>
      <p>Redirecionando...</p>
    </div>
  );
};

export default HomePage;
