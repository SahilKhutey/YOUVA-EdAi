"use client";

import React from "react";
import MainLayout from "@/app/components/MainLayout";
import { PublicCredentialVerifier } from "@/components/credentials/PublicCredentialVerifier";

export default function PublicVerificationPage() {
  return (
    <MainLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        <PublicCredentialVerifier />
      </div>
    </MainLayout>
  );
}
