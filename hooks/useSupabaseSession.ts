"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase-client";

interface SupabaseSessionState {
  session: Session | null;
  loading: boolean;
}

export const useSupabaseSession = () => {
  const [{ session, loading }, setState] = useState<SupabaseSessionState>({
    session: null,
    loading: true
  });

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setState({ session: null, loading: false });
      return;
    }

    let isMounted = true;

    void client.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setState({ session: data.session ?? null, loading: false });
    });

    const {
      data: { subscription }
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setState({ session: nextSession ?? null, loading: false });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    user: session?.user ?? null,
    loading
  };
};
