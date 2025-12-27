"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function FormSuccessPage() {
  return (
    <div className="min-h-screen bg-[#9a9cc2] py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header Card */}
        <Card className="bg-white rounded-lg overflow-hidden">
          <div className="h-2 bg-[#673ab7]" />
          <CardContent className="p-6">
            <h1 className="text-2xl font-normal text-gray-800">
              Productivity Accountability Form
            </h1>
          </CardContent>
        </Card>

        {/* Success Card */}
        <Card className="bg-white rounded-lg">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="text-xl text-gray-800 mb-2">
              Your response has been recorded.
            </h2>
            <p className="text-gray-600 mb-6">
              Thank you for submitting your productivity accountability form.
            </p>
            <Link
              href="/new-form"
              className="text-[#673ab7] hover:underline font-medium"
            >
              Submit another response
            </Link>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-gray-600 text-sm pt-4">
          <p>Keep the main thing the main thing.</p>
        </div>
      </div>
    </div>
  );
}
