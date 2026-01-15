import React from "react";
import Button from "@/components/Button";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Login to Zendvo</h1>
      <form className="w-full max-w-sm space-y-4">
        <input
          type="email"
          placeholder="Email address"
          className="w-full p-2 border rounded"
        />
        <Button className="w-full">Sign In</Button>
      </form>
    </div>
  );
}
