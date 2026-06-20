import { useCallback, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signIn } from "../lib/auth-client";
import { GoogleIcon } from "./GoogleIcon";

interface GoogleAuthButtonProps {
  /** Text shown on the button, e.g. "Continue with Google". */
  label: string;
  /** Frontend path to return to after a successful sign-in. */
  callbackURL?: string;
}

export const GoogleAuthButton = ({
  label,
  callbackURL = "/",
}: GoogleAuthButtonProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Resolve to an absolute URL on the *frontend* origin. A relative path would
    // otherwise be resolved against the auth server's origin (the server URL),
    // landing the user there instead of back in the app after Google.
    const resolvedCallbackURL = new URL(
      callbackURL,
      window.location.origin
    ).toString();

    // On success this redirects the browser to Google, so the loading state
    // persists until navigation. We only land back here on failure.
    const { error: authError } = await signIn.social({
      provider: "google",
      callbackURL: resolvedCallbackURL,
    });

    if (authError) {
      setError(authError.message ?? "Unable to start Google sign-in.");
      setIsLoading(false);
    }
  }, [callbackURL]);

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        onClick={handleClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <GoogleIcon className="size-4" />
        )}
        {label}
      </Button>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
};
