"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  TrendingUp,
  LogOut,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Users,
  Copy,
  Check,
  Settings,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

interface Payment {
  id: string
  user_id: string
  payment_method: "paypal" | "usdt"
  amount: number
  currency: string
  status: "pending" | "completed" | "failed" | "cancelled"
  payment_proof_url: string | null
  paypal_payment_id: string | null
  discord_invite_sent: boolean
  admin_verified: boolean
  created_at: string
}

interface UserProfile {
  id: string
  email: string | null
  full_name: string | null
  created_at: string
  updated_at: string
}

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [paymentsLoading, setPaymentsLoading] = useState(true)
  const [paymentsError, setPaymentsError] = useState<string | null>(null)
  const [discordInviteCopied, setDiscordInviteCopied] = useState(false)

  // Discord invite link
  const discordInviteLink = "https://discord.gg/sentientmarkets"

  useEffect(() => {
    // Don't redirect while auth is still loading
    if (authLoading) {
      console.log("Auth still loading, waiting...")
      return
    }

    // Only redirect if auth is done loading and there's no user
    if (!authLoading && !user) {
      console.log("No user found after auth loading completed, redirecting to login")
      router.push("/login")
      return
    }

    // If we have a user, fetch their data
    if (user) {
      console.log("User found, fetching data for:", user.email)
      fetchUserData()
      fetchPaymentHistory()
    }
  }, [user, authLoading, router])

  const fetchUserData = async () => {
    if (!user) return

    try {
      console.log("Fetching user profile for:", user.id)

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileError) {
        console.error("Profile fetch error:", profileError)

        // If profile doesn't exist, create one
        if (profileError.code === "PGRST116") {
          console.log("Profile not found, creating one...")
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || null,
            })
            .select()
            .single()

          if (createError) {
            console.error("Error creating profile:", createError)
            // Use fallback data from user metadata
            setProfile({
              id: user.id,
              email: user.email || null,
              full_name: user.user_metadata?.full_name || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
          } else {
            setProfile(newProfile)
          }
        } else {
          // Use fallback data from user metadata
          setProfile({
            id: user.id,
            email: user.email || null,
            full_name: user.user_metadata?.full_name || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        }
      } else {
        setProfile(profileData)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)

      // Use fallback data from user metadata
      setProfile({
        id: user.id,
        email: user.email || null,
        full_name: user.user_metadata?.full_name || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    } finally {
      setDataLoading(false)
    }
  }

  const fetchPaymentHistory = async () => {
    if (!user) return

    setPaymentsLoading(true)
    setPaymentsError(null)

    try {
      console.log("Fetching payment history for:", user.id)

      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (paymentsError) {
        console.error("Payments fetch error:", paymentsError)

        // Handle specific error types
        if (paymentsError.message.includes("recursion") || paymentsError.message.includes("policy")) {
          setPaymentsError("Database configuration issue - please contact support")
        } else if (paymentsError.code === "PGRST301") {
          setPaymentsError("Permission denied - please check your account status")
        } else {
          setPaymentsError("Failed to load payment history")
        }

        // Set empty array so UI can still function
        setPayments([])
      } else {
        console.log("Payments fetched:", paymentsData?.length || 0)
        setPayments(paymentsData || [])
        setPaymentsError(null)
      }
    } catch (error) {
      console.error("Error fetching payment history:", error)

      let errorMessage = "Failed to load payment history"
      if (error instanceof Error) {
        if (error.message.includes("recursion") || error.message.includes("policy")) {
          errorMessage = "Database configuration issue - please contact support"
        } else if (error.message.includes("Failed to fetch")) {
          errorMessage = "Network connection issue - please check your internet"
        } else {
          errorMessage = error.message
        }
      }

      setPaymentsError(errorMessage)
      setPayments([])
    } finally {
      setPaymentsLoading(false)
    }
  }

  const retryFetchPayments = () => {
    fetchPaymentHistory()
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
      router.push("/")
    }
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

  const getStatusBadge = (status: string, adminVerified: boolean) => {
    if (status === "completed" && adminVerified) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </Badge>
      )
    }
    if (status === "pending" || (status === "completed" && !adminVerified)) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          <Clock className="h-3 w-3 mr-1" />
          Pending Verification
        </Badge>
      )
    }
    if (status === "failed") {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      )
    }
    return <Badge variant="secondary">Cancelled</Badge>
  }

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <div className="text-gray-600 text-lg">Checking authentication...</div>
        </div>
      </div>
    )
  }

  // Show loading while data is loading (but auth is complete)
  if (dataLoading && user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <div className="text-gray-600 text-lg">Loading your dashboard...</div>
        </div>
      </div>
    )
  }

  // Don't render anything if no user (redirect should happen in useEffect)
  if (!user || !profile) {
    return null
  }

  const hasActiveSubscription = payments.some((payment) => payment.status === "completed" && payment.admin_verified)

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
              <span className="text-gray-600 text-sm hidden sm:block">
                Welcome, {profile.full_name || profile.email?.split("@")[0] || "Trader"}
              </span>
              <Button onClick={retryFetchPayments} variant="ghost" size="sm" title="Refresh data">
                <RefreshCw className="h-4 w-4" />
              </Button>
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

          {/* Payment Error Alert */}
          {paymentsError && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <div className="flex items-center justify-between">
                  <span>
                    <strong>Warning:</strong> Could not load payment history. Some features may be limited.{" "}
                    {paymentsError}
                  </span>
                  <Button onClick={retryFetchPayments} size="sm" variant="outline" className="ml-4 bg-transparent">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
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
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-gray-900">Payment History</CardTitle>
                      <CardDescription className="text-gray-600">
                        View your subscription payments and status
                      </CardDescription>
                    </div>
                    {!paymentsLoading && (
                      <Button onClick={retryFetchPayments} size="sm" variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {paymentsLoading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-4" />
                      <p className="text-gray-600">Loading payment history...</p>
                    </div>
                  ) : paymentsError ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-8 w-8 mx-auto text-red-500 mb-4" />
                      <p className="text-gray-600 mb-4">Failed to load payment history</p>
                      <p className="text-gray-500 text-sm mb-4">{paymentsError}</p>
                      <Button onClick={retryFetchPayments} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                      </Button>
                    </div>
                  ) : payments.length === 0 ? (
                    <div className="text-center py-8">
                      <CreditCard className="h-8 w-8 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-4">No payments found</p>
                      <Link href="/payment">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">Make Your First Payment</Button>
                      </Link>
                    </div>
                  ) : (
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
