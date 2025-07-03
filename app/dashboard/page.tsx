"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TrendingUp, LogOut, CreditCard, Users, ExternalLink, Copy, Check, AlertCircle, Settings } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

interface Payment {
  id: string
  payment_method: "paypal" | "usdt"
  amount: number
  currency: string
  status: "pending" | "completed" | "failed" | "cancelled"
  discord_invite_sent: boolean
  admin_verified: boolean
  created_at: string
}

interface Profile {
  id: string
  email: string | null
  full_name: string | null
}

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [discordInviteCopied, setDiscordInviteCopied] = useState(false)

  // Discord invite link (you would replace this with your actual Discord invite)
  const discordInviteLink = "https://discord.gg/sentientmarkets"

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    fetchUserData()
  }, [user, router])

  const fetchUserData = async () => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single()

      if (profileError) throw profileError
      setProfile(profileData)

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })

      if (paymentsError) throw paymentsError
      setPayments(paymentsData || [])
    } catch (error) {
      console.error("Error fetching user data:", error)
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const copyDiscordInvite = async () => {
    try {
      await navigator.clipboard.writeText(discordInviteLink)
      setDiscordInviteCopied(true)
      toast({
        title: "Copied!",
        description: "Discord invite link copied to clipboard",
      })
      setTimeout(() => setDiscordInviteCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      })
    }
  }

  const hasActiveSubscription = payments.some((payment) => payment.status === "completed" && payment.admin_verified)

  const getStatusBadge = (status: string, adminVerified: boolean) => {
    if (status === "completed" && adminVerified) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
    }
    if (status === "completed" && !adminVerified) {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending Verification</Badge>
    }
    if (status === "pending") {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Pending</Badge>
    }
    if (status === "failed") {
      return <Badge variant="destructive">Failed</Badge>
    }
    return <Badge variant="secondary">Cancelled</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Sentient Markets</span>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 text-sm hidden sm:block">Welcome, {profile?.full_name || "Trader"}</span>
              <Button onClick={handleSignOut} variant="ghost" size="sm" className="text-gray-700 hover:text-gray-900">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Trading Dashboard</h1>
            <p className="text-gray-600">Manage your subscription and access premium trading resources</p>
          </div>

          {/* Status Alert */}
          {!hasActiveSubscription && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Get Premium Access:</strong> Subscribe now to unlock exclusive trading insights and Discord
                community access.{" "}
                <Link href="/payment" className="font-medium underline hover:no-underline">
                  Subscribe here
                </Link>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Subscription Status */}
              <Card className="shadow-sm border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Subscription Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hasActiveSubscription ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Status:</span>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Premium Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Plan:</span>
                        <span className="text-gray-900 font-medium">Premium Access - $49/month</span>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-800 text-sm">
                          🎉 Your subscription is active! You have full access to all premium features.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Status:</span>
                        <Badge variant="secondary">No Active Subscription</Badge>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-gray-700 text-sm mb-3">
                          Subscribe to access premium trading insights and Discord community.
                        </p>
                        <Link href="/payment">
                          <Button className="bg-blue-600 hover:bg-blue-700 text-white">Subscribe Now</Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Discord Access */}
              <Card className="shadow-sm border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <Users className="h-5 w-5 mr-2" />
                    Discord Community Access
                  </CardTitle>
                  <CardDescription className="text-gray-600">Join our exclusive trading community</CardDescription>
                </CardHeader>
                <CardContent>
                  {hasActiveSubscription ? (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-800 text-sm mb-3">
                          🎉 You have access to our exclusive Discord community! Click below to join.
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={() => window.open(discordInviteLink, "_blank")}
                          className="bg-[#5865F2] hover:bg-[#4752C4] text-white flex items-center"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Join Discord Server
                        </Button>
                        <Button
                          onClick={copyDiscordInvite}
                          variant="outline"
                          className="border-gray-300 flex items-center bg-transparent"
                        >
                          {discordInviteCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                          {discordInviteCopied ? "Copied!" : "Copy Invite Link"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-gray-700 text-sm mb-3">
                          🔒 Discord access is available with a premium subscription.
                        </p>
                        <Link href="/payment">
                          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                            Subscribe to Access Discord
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment History */}
              <Card className="shadow-sm border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Payment History</CardTitle>
                  <CardDescription className="text-gray-600">
                    View your subscription payments and status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {payments.length > 0 ? (
                    <div className="space-y-4">
                      {payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-900 font-medium">
                                ${payment.amount} {payment.currency}
                              </span>
                              <span className="text-gray-500 text-sm">via {payment.payment_method.toUpperCase()}</span>
                            </div>
                            <p className="text-gray-500 text-sm">{new Date(payment.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">{getStatusBadge(payment.status, payment.admin_verified)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">No payments yet</p>
                      <Link href="/payment">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">Make Your First Payment</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="shadow-sm border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900 text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/payment" className="block">
                    <Button variant="outline" className="w-full justify-start border-gray-300 bg-transparent">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Manage Subscription
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start border-gray-300 bg-transparent" disabled>
                    <Settings className="h-4 w-4 mr-2" />
                    Account Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Support */}
              <Card className="shadow-sm border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900 text-lg">Need Help?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">Contact our support team for any questions or issues.</p>
                  <Button variant="outline" className="w-full border-gray-300 bg-transparent">
                    Contact Support
                  </Button>
                </CardContent>
              </Card>

              {/* Trading Resources */}
              <Card className="shadow-sm border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900 text-lg">Trading Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">Access guides, tutorials, and market analysis.</p>
                  <Button
                    variant="outline"
                    className="w-full border-gray-300 bg-transparent"
                    disabled={!hasActiveSubscription}
                  >
                    {hasActiveSubscription ? "View Resources" : "Subscribe to Access"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
