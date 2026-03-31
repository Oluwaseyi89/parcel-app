"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle, Loader2, Shield, XCircle } from "lucide-react";

import { env } from "@/env";
import { storage } from "@/lib/storage";

type VerifyState = "pending" | "verified" | "failed";

export default function VerifyPaymentView() {
  const router = useRouter();
  const [status, setStatus] = useState<VerifyState>("pending");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Verifying your payment transaction...");

  const payRef = storage.getPaymentReference();

  async function verify(reference: string) {
    setLoading(true);

    try {
      const response = await fetch(`${env.paymentApiBase}/v1/verifypayment/${reference}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Verification failed (${response.status})`);
      }

      const raw = (await response.json()) as boolean | { status?: boolean; verified?: boolean };
      const verified = typeof raw === "boolean" ? raw : Boolean(raw.status ?? raw.verified);

      if (verified) {
        setStatus("verified");
        setMessage("Payment successfully verified.");
      } else {
        setStatus("pending");
        setMessage("Payment is still pending. Please refresh in a moment.");
      }
    } catch {
      setStatus("failed");
      setMessage("Unable to verify payment right now. Please try again shortly.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!payRef) {
      setLoading(false);
      setStatus("failed");
      setMessage("No payment reference found. Please initiate payment first.");
      return;
    }

    void verify(payRef);
  }, [payRef]);

  return (
    <section className="min-h-screen bg-zinc-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-danger to-orange-500">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900">Payment Verification</h1>
          <p className="mt-2 text-zinc-600">Verifying your payment transaction</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-lg">
          {payRef && (
            <div className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <p className="mb-1 text-sm font-medium text-zinc-700">Payment Reference</p>
              <p className="truncate rounded border border-zinc-300 bg-white p-2 font-mono text-sm">{payRef}</p>
            </div>
          )}

          {loading ? (
            <div className="py-8 text-center">
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-danger" />
              <p className="text-zinc-700">{message}</p>
            </div>
          ) : (
            <div className="py-2 text-center">
              {status === "verified" && <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />}
              {status === "pending" && <AlertCircle className="mx-auto mb-4 h-16 w-16 text-amber-500" />}
              {status === "failed" && <XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />}

              <h2 className="mb-2 text-xl font-bold text-zinc-900">
                {status === "verified" ? "Payment Verified" : status === "pending" ? "Payment Pending" : "Verification Failed"}
              </h2>
              <p className="mb-6 text-zinc-600">{message}</p>

              <div className="space-y-3">
                {status === "pending" && (
                  <button
                    onClick={() => payRef && void verify(payRef)}
                    className="w-full rounded-lg bg-danger px-6 py-3 font-medium text-white hover:brightness-95"
                  >
                    Refresh Verification
                  </button>
                )}

                {status === "verified" && (
                  <button
                    onClick={() => router.push("/")}
                    className="w-full rounded-lg bg-danger px-6 py-3 font-medium text-white hover:brightness-95"
                  >
                    Return to Homepage
                  </button>
                )}

                {status === "failed" && (
                  <button
                    onClick={() => router.push("/payment")}
                    className="w-full rounded-lg bg-danger px-6 py-3 font-medium text-white hover:brightness-95"
                  >
                    Back to Payment
                  </button>
                )}

                <button
                  onClick={() => router.push("/cart-check")}
                  className="w-full rounded-lg border border-danger px-6 py-3 font-medium text-danger hover:bg-red-50"
                >
                  Go to Cart
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs text-blue-700">
            Secure payment verification is used for this transaction. If verification remains pending,
            retry shortly or contact support.
          </p>
        </div>
      </div>
    </section>
  );
}
