import { redirect } from "next/navigation";
import { isArcAuthConfigured } from "../../lib/auth-config";
import { createArcServerClient } from "../../lib/supabase-server";
import { signInWithGoogle } from "./actions";
import styles from "./login.module.css";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!isArcAuthConfigured()) redirect("/");

  const supabase = await createArcServerClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (data.user) redirect("/");

  const params = await searchParams;

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.brand}><small>Wax &amp; Wing</small><strong>Arc</strong></div>
        <h1>Come back to your desk.</h1>
        <p>Use Google to sign in to your Arc workspace. The beta access code is separate and only controls who can reach the testing build.</p>
        <form action={signInWithGoogle}><button className={styles.googleButton} type="submit">Continue with Google</button></form>
        {params.error && <p className={styles.error}>Google sign-in did not finish. Try again.</p>}
      </section>
    </main>
  );
}
