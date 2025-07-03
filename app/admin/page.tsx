"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  TrendingUp,
  LogOut,
  Eye,
  Check,
  X,
  ExternalLink,
  Users,
  CreditCard,
  Clock,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import Image from "next/image"

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
  profiles: {
    email: string | null
    full_name: string | null
  } | null
}

export default function AdminPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [error, setError] = useState<string | null>(null)

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

    // If we have a user, check admin status
    if (user) {
      console.log("User found, checking admin status for:", user.email)
      checkAdminStatus()
    }
  }, [user, authLoading, router])

  const checkAdminStatus = async () => {
    if (!user) return

    try {
      console.log("Checking admin status for user:", user.id)

      // Use the safe function to check admin status
      const { data: adminCheck, error: adminError } = await supabase.rpc("check_admin_status", {
        user_id: user.id,
      })

      console.log("Admin check result:", { adminCheck, adminError })

      if (adminError) {
        console.error("Admin check error:", adminError)

        // Check if it's a function not found error
        if (adminError.message.includes("function") && adminError.message.includes("does not exist")) {
          setError("Database function missing - please run the RLS fix script")
          return
        }

        // Check if it's a recursion or policy error
        if (adminError.message.includes("recursion") || adminError.message.includes("policy")) {
          setError("Database configuration issue - please contact support to fix RLS policies")
          return
        }

        setError(adminError.message)
        return
      }

      if (!adminCheck) {
        console.log("User is not an admin")
        router.push("/dashboard")
        return
      }

      console.log("User is admin")
      setIsAdmin(true)
      fetchPayments()
    } catch (error) {
      console.error("Error checking admin status:", error)

    
      let errorMessage = "Failed to verify admin status"
      if (error instanceof Error) {
        if (error.message.includes("recursion") || error.message.includes("policy")) {
          errorMessage = "Database policy configuration issue - please contact support"
        } else {
          errorMessage = error.message
        }
      }

      setError(errorMessage)
    }
  }

  const fetchPayments = async () => {
    try {
      console.log("Fetching payments...")
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          profiles (
            email,
            full_name
          )
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching payments:", error)

        if (error.message.includes("recursion") || error.message.includes("policy")) {
          throw new Error("Database policy issue - please contact support")
        }

        throw error
      }

      console.log("Payments fetched:", data?.length || 0)
      console.log("Payment Details", data)
      setPayments(data || [])
    } catch (error) {
      console.error("Error fetching payments:", error)
      toast({
        title: "Error",
        description: "Failed to load payments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updatePaymentStatus = async (paymentId: string, verified: boolean) => {
    try {
      const { error } = await supabase
        .from("payments")
        .update({
          admin_verified: verified,
          discord_invite_sent: verified,
          status: verified ? "completed" : "failed",
        })
        .eq("id", paymentId)

      if (error) throw error

      toast({
        title: "Success",
        description: `Payment ${verified ? "approved" : "rejected"} successfully`,
      })

      fetchPayments()
    } catch (error) {
      console.error("Error updating payment:", error)
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      })
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const getStatusBadge = (status: string, adminVerified: boolean) => {
    if (status === "completed" && adminVerified) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 shadow-none">Verified</Badge>
    }
    if (status === "completed" && !adminVerified) {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 shadow-none">Pending</Badge>
    }
    if (status === "pending") {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 shadow-none">Pending</Badge>
    }
    if (status === "failed") {
      return <Badge variant="destructive" className="shadow-none">Rejected</Badge>
    }
    return <Badge variant="secondary" className="shadow-none">Cancelled</Badge>
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="border-red-200">
            <CardHeader className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-red-600">Admin Access Error</CardTitle>
              <CardDescription className="text-gray-600">{error}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3">
                <Button onClick={checkAdminStatus} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>

                <Button onClick={() => router.push("/dashboard")} variant="outline">
                  Go to Dashboard
                </Button>

                <Button onClick={handleSignOut} variant="ghost">
                  Sign Out
                </Button>
              </div>

              {(error.includes("policy") || error.includes("recursion") || error.includes("function")) && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Database Issue:</strong> Please run the RLS policy fix script
                    (scripts/07-fix-rls-policies.sql) to resolve this issue.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
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

  // Loading or access denied state
  if (!isAdmin || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          {loading ? (
            <>
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <div className="text-gray-600 text-lg">Checking admin permissions...</div>
            </>
          ) : (
            <>
              <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
              <div className="text-gray-600 text-lg">Access Denied</div>
            </>
          )}
        </div>
      </div>
    )
  }

  const pendingPayments = payments.filter((p) => !p.admin_verified && p.status !== "failed")
  const totalPayments = payments.length
  const verifiedPayments = payments.filter((p) => p.admin_verified).length
  const totalRevenue = payments.filter((p) => p.admin_verified).reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
               <Image src="/logo.png" alt="Logo" width={40} height={50}/>   
              <span className="text-xl font-bold text-gray-900">Sentient Markets</span>
              <Badge className="bg-red-100 text-red-800 hover:bg-red-100 shadow-none">Admin</Badge>
            </div>
            <Button onClick={handleSignOut} variant="ghost" size="sm" className="text-gray-700 hover:text-gray-900">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage payments and user subscriptions</p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="shadow-none border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-900 text-sm font-medium flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Total Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{totalPayments}</div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-900 text-sm font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Pending Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{pendingPayments.length}</div>
              </CardContent>
            </Card>

            <Card className="shadow-none border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-900 text-sm font-medium flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Active Subscribers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{verifiedPayments}</div>
              </CardContent>
            </Card>

            <Card className="shadow-none border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-900 text-sm font-medium">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">${totalRevenue.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Payments Table */}
          <Card className="shadow-none border border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Payment Management</CardTitle>
              <CardDescription className="text-gray-600">Review and verify user payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      <TableHead className="text-gray-700">User</TableHead>
                      <TableHead className="text-gray-700">Method</TableHead>
                      <TableHead className="text-gray-700">Amount</TableHead>
                      <TableHead className="text-gray-700">Status</TableHead>
                      <TableHead className="text-gray-700">Date</TableHead>
                      <TableHead className="text-gray-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id} className="border-gray-200">
                        <TableCell>
                          <div className="text-gray-900">
                            <div className="font-medium">{payment.profiles?.full_name || "Unknown"}</div>
                            <div className="text-gray-500 text-sm">{payment.profiles?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-gray-300 text-gray-700">
                            {payment.payment_method.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-900 font-medium">
                          ${payment.amount} {payment.currency}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status, payment.admin_verified)}</TableCell>
                        <TableCell className="text-gray-600">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-gray-300 bg-transparent"
                                  onClick={() => setSelectedPayment(payment)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-white border border-gray-200 max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle className="text-gray-900">Payment Details</DialogTitle>
                                  <DialogDescription className="text-gray-600">
                                    Review payment information and verification status
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedPayment && (
                                  <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-gray-700 font-medium">User</Label>
                                        <p className="text-gray-900">{selectedPayment.profiles?.full_name}</p>
                                        <p className="text-gray-600 text-sm">{selectedPayment.profiles?.email}</p>
                                      </div>
                                      <div>
                                        <Label className="text-gray-700 font-medium">Amount</Label>
                                        <p className="text-gray-900 font-medium">
                                          ${selectedPayment.amount} {selectedPayment.currency}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-gray-700 font-medium">Method</Label>
                                        <p className="text-gray-900">{selectedPayment.payment_method.toUpperCase()}</p>
                                      </div>
                                      <div>
                                        <Label className="text-gray-700 font-medium">Date</Label>
                                        <p className="text-gray-900">
                                          {new Date(selectedPayment.created_at).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>

                                    <div>
                                      <Label className="text-gray-700 font-medium">Status</Label>
                                      <div className="mt-1">
                                        {getStatusBadge(selectedPayment.status, selectedPayment.admin_verified)}
                                      </div>
                                    </div>

                                    {selectedPayment.payment_proof_url && (
                                      <div>
                                        <Label className="text-gray-700 font-medium">Payment Proof</Label>
                                        <div className="mt-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-gray-300 bg-transparent"
                                            onClick={() => window.open(selectedPayment.payment_proof_url!, "_blank")}
                                          >
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            View Proof
                                          </Button>
                                        </div>
                                      </div>
                                    )}

                                    {!selectedPayment.admin_verified && selectedPayment.status !== "failed" && (
                                      <div className="flex space-x-3 pt-4 border-t border-gray-200">
                                        <Button
                                          onClick={() => updatePaymentStatus(selectedPayment.id, true)}
                                          className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                          <Check className="h-4 w-4 mr-2" />
                                          Approve
                                        </Button>
                                        <Button
                                          onClick={() => updatePaymentStatus(selectedPayment.id, false)}
                                          variant="destructive"
                                        >
                                          <X className="h-4 w-4 mr-2" />
                                          Reject
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            {!payment.admin_verified && payment.status !== "failed" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => updatePaymentStatus(payment.id, true)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => updatePaymentStatus(payment.id, false)}
                                  variant="destructive"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
