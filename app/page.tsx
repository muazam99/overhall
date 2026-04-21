import { cookies } from "next/headers";
import { HomeArchitectureCard } from "@/features/home/components/home-architecture-card";
import { AUTH_MESSAGE_COOKIE, AUTH_PROMPT_COOKIE } from "@/lib/auth-ui";

export default async function Home() {
  const cookieStore = await cookies();
  const initialAuthPrompt = cookieStore.get(AUTH_PROMPT_COOKIE)?.value ?? null;
  const initialAuthMessage = cookieStore.get(AUTH_MESSAGE_COOKIE)?.value ?? null;

  return (
    <HomeArchitectureCard
      initialAuthPrompt={initialAuthPrompt}
      initialAuthMessage={initialAuthMessage}
    />
  );
}
