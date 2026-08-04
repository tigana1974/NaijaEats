import { supabase } from "@/integrations/supabase/client";

/**
 * Wallet transaction PIN.
 *
 * The PIN never leaves the device in plaintext beyond the RPC call, and is only
 * ever stored server-side as a bcrypt hash. Every money movement — whether the
 * user taps Pay themselves or asks Xora to do it — is gated on wallet_pin_verify.
 */
export type PinStatus = { has_pin: boolean; locked: boolean; locked_until: string | null };

export async function getPinStatus(): Promise<PinStatus> {
  const { data, error } = await (supabase as any).rpc("wallet_pin_status");
  if (error) throw new Error(error.message);
  return (data ?? { has_pin: false, locked: false, locked_until: null }) as PinStatus;
}

/** Create a PIN, or change it (currentPin required when one already exists). */
export async function setWalletPin(newPin: string, currentPin?: string): Promise<void> {
  const { error } = await (supabase as any).rpc("wallet_pin_set", {
    p_new_pin: newPin,
    p_current_pin: currentPin ?? null,
  });
  if (error) throw new Error(error.message);
}

/** Returns true when the PIN is correct. Throws if locked out or unset. */
export async function verifyWalletPin(pin: string): Promise<boolean> {
  const { data, error } = await (supabase as any).rpc("wallet_pin_verify", { p_pin: pin });
  if (error) throw new Error(error.message);
  return Boolean(data);
}
