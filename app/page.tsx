"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart3,
  Users,
  Shield,
  Check,
  TrendingUp,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";

export default function LandingPage() {
  const { user } = useAuth();
  console.log(user);
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Image src="/logo.png" alt="Logo" width={40} height={50} />
              <span className="text-xl font-bold text-gray-900">
                Sentient Markets
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link href="/dashboard">
                  <Button className="bg-gray-900 hover:bg-black text-white">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      className="text-gray-900 hover:text-black"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="bg-gray-900 hover:bg-black text-white">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div
                 className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-md"
            style={{
              backgroundImage: `url('/images/heroImage.jpg')`,
              opacity: 0.7, // makes it faint
            }}
          />
          {/* <div className="absolute inset-0 bg-gradient-to-r from-gray-50/90 to-gray-50/70"></div> */}
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Trade with Structure
              <span className="text-gray-500 block">Master The Markets.</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              Join a premium community of serious traders for live-tested
              frameworks, structured mentorship, and clear market insights.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {user ? (
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-gray-950 hover:bg-black-700 text-white px-8 py-4 text-lg"
                >
                  Go to Dashboard →
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="bg-gray-900 hover:bg-black text-white px-8 py-4 text-lg"
                  >
                    Join Sentient Markets →
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-8 py-4 text-lg border-gray-300 bg-transparent"
                  >
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Structured, Premium Membership
            </h2>
            <p className="text-xl text-gray-600">
              Gain clear frameworks, live mentorship, and premium resources to
              refine your trading.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <Card className="border-2 border-black-200 shadow-none">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Premium Access
                  </h3>
                  <div className="text-5xl font-bold text-green-600 mb-2">
                    $1,000
                    <span className="text-xl text-gray-500 font-normal">
                      /3 months
                    </span>
                  </div>
                  <p className="text-gray-600">
                    For serious traders ready to trade with clarity.
                  </p>
                </div>

                <ul className="space-y-4 mb-8 text-left">
                  <li className="flex items-center text-gray-700">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    Live mentorship & structured sessions
                  </li>
                  <li className="flex items-center text-gray-700">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    Exclusive Discord community access
                  </li>
                  <li className="flex items-center text-gray-700">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    Exclusive Discord community
                  </li>
                  <li className="flex items-center text-gray-700">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    Weekly market commentary & deep dives
                  </li>
                  <li className="flex items-center text-gray-700">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    Resource library (PDFs, slides, replays)
                  </li>
                </ul>

                {user ? (
                  <Link href="/payment">
                    <Button
                      size="lg"
                      className="w-full bg-gray-900 hover:bg-black text-white"
                    >
                      Subscribe Now
                    </Button>
                  </Link>
                ) : (
                  <Link href="/signup">
                    <Button
                      size="lg"
                      className="w-full bg-gray-900 hover:bg-black text-white"
                    >
                      Get Started
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Trade With Clarity, Consistency, and Confidence
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Sentient Markets combines live-tested strategies, clear
              frameworks, and real mentorship to give you a structured path to
              trading mastery.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border border-gray-200 shadow-none hover:shadow-md transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="h-8 w-8 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Live Market Commentary
                </h3>
                <p className="text-gray-600">
                  Weekly structured insights and frameworks for consistent
                  improvement.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Live Mentorship
                </h3>
                <p className="text-gray-600">
                  Real-time mentorship from experienced traders, not recycled
                  theory.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Secure, Focused Community
                </h3>
                <p className="text-gray-600">
                  Exclusive Discord access for committed, serious traders only.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600">
              Comprehensive tools and resources to elevate your trading
              performance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Live Trading Sessions
                  </h4>
                  <p className="text-gray-600">
                    Watch and learn from market experts in real-time trading
                    sessions.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Discord Community
                  </h4>
                  <p className="text-gray-600">
                    Join our exclusive Discord server with 24/7 market
                    discussions.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Market Alerts
                  </h4>
                  <p className="text-gray-600">
                    Get instant notifications for important market movements and
                    opportunities.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Expert Analysis
                  </h4>
                  <p className="text-gray-600">
                    Daily market commentary and technical analysis from seasoned
                    professionals.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Educational Resources
                  </h4>
                  <p className="text-gray-600">
                    Comprehensive trading guides and tutorials for all skill
                    levels.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Trading Dashboard
                  </h4>
                  <p className="text-gray-600">
                    Personal analytics and performance tracking tools.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Trace With Structure And Clarity?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join serious traders building consistency, precision, and real
            market understanding with Sentient Markets.
          </p>
          {user ? (
            <Link href="/payment">
              <Button
                size="lg"
                className="bg-gray-900 hover:bg-black text-white px-8 py-4 text-lg"
              >
                Subscribe Now
              </Button>
            </Link>
          ) : (
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-gray-900 hover:bg-black text-white px-8 py-4 text-lg"
              >
                Get Started Today
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Image src="/logo.png" alt="Logo" width={40} height={50} />
              <span className="text-lg font-bold text-gray-900">
                Sentient Markets
              </span>
            </div>
            <p className="text-gray-600">
              © 2025 Sentient Markets. All rights reserved.
              <br />
              Empowering traders to trade with clarity, structure, and
              consistency.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
