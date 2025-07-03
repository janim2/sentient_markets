"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TrendingUp, CreditCard, Coins, ArrowLeft, Check, AlertCircle, Upload, FileText } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

export default function PaymentPage() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "usdt">("paypal")
  const [loading, setLoading] = useState(false)
  const [usdtProof, setUsdtProof] = useState<File | null>(null)
  const [usdtTxHash, setUsdtTxHash] = useState("")
  const [usdtNotes, setUsdtNotes] = useState("")
  const [storageAvailable, setStorageAvailable] = useState(true)

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

    // Check if storage is available
    checkStorageAvailability()
  }, [user, router])

  const checkStorageAvailability = async () => {
    try {
      console.log("=== Storage Availability Check ===")

      // Method 1: Try to list buckets
      console.log("1. Attempting to list buckets...")
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

      console.log("Buckets result:", { buckets, bucketsError })

      if (bucketsError) {
        console.warn("Cannot list buckets:", bucketsError)
        // This might be normal - try alternative method
      } else {
        console.log("Buckets found:", buckets?.length || 0)
        buckets?.forEach((bucket) => {
          console.log(`- Bucket: ${bucket.id} (${bucket.name}) - Public: ${bucket.public}`)
        })
      }

      // Method 2: Try to access the specific bucket directly
      console.log("2. Attempting to access payment-proofs bucket...")
      const { data: files, error: filesError } = await supabase.storage.from("payment-proofs").list("", { limit: 1 })

      console.log("Files list result:", { files, filesError })

      if (filesError) {
        console.warn("Cannot access payment-proofs bucket:", filesError)

        // Check specific error types
        if (filesError.message.includes("Bucket not found")) {
          console.error("❌ Bucket 'payment-proofs' does not exist")
          setStorageAvailable(false)
          return
        } else if (filesError.message.includes("not allowed") || filesError.message.includes("permission")) {
          console.warn("⚠️ Bucket exists but access restricted - this is normal for RLS")
          // Bucket exists but we can't list files due to RLS - that's OK
          setStorageAvailable(true)
          return
        } else {
          console.error("❌ Unknown storage error:", filesError.message)
          setStorageAvailable(false)
          return
        }
      } else {
        console.log("✅ Successfully accessed payment-proofs bucket")
        console.log("Files in bucket:", files?.length || 0)
        setStorageAvailable(true)
        return
      }

      // Method 3: Try to get bucket info via SQL (if we have access)
      console.log("3. Attempting to check bucket via database...")
      const { data: bucketInfo, error: bucketError } = await supabase
        .from("storage.buckets")
        .select("id, name, public")
        .eq("id", "payment-proofs")
        .single()

      console.log("Bucket info result:", { bucketInfo, bucketError })

      if (bucketError) {
        console.warn("Cannot query bucket info:", bucketError)
        // Assume storage is available if we can't check
        setStorageAvailable(true)
      } else {
        console.log("✅ Bucket found in database:", bucketInfo)
        setStorageAvailable(true)
      }
    } catch (error) {
      console.error("❌ Storage check failed with exception:", error)
      setStorageAvailable(false)
    }
  }

  const testStorageUpload = async () => {
    if (!user) return

    try {
      console.log("=== Testing Storage Upload ===")

      // Create a small test file
      const testContent = "test file content"
      const testFile = new Blob([testContent], { type: "text/plain" })
      const testFileName = `${user.id}/test-${Date.now()}.txt`

      console.log("Attempting to upload test file:", testFileName)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(testFileName, testFile, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        console.error("❌ Test upload failed:", uploadError)

        if (uploadError.message.includes("Bucket not found")) {
          console.error("Bucket 'payment-proofs' does not exist!")
          return false
        } else if (uploadError.message.includes("not allowed")) {
          console.error("Upload not allowed - check RLS policies")
          return false
        } else {
          console.error("Unknown upload error:", uploadError.message)
          return false
        }
      } else {
        console.log("✅ Test upload successful:", uploadData)

        // Clean up test file
        const { error: deleteError } = await supabase.storage.from("payment-proofs").remove([testFileName])

        if (deleteError) {
          console.warn("Could not delete test file:", deleteError)
        } else {
          console.log("✅ Test file cleaned up")
        }

        return true
      }
    } catch (error) {
      console.error("❌ Test upload exception:", error)
      return false
    }
  }

  const handlePayPalPayment = async () => {
    setLoading(true)
    try {
      // Create payment record
      const { data, error } = await supabase
        .from("payments")
        .insert({
          user_id: user?.id,
          payment_method: "paypal",
          amount: 49.0,
          currency: "USD",
          status: "pending",
        })
        .select()
        .single()

      if (error) throw error

      // In a real implementation, you would integrate with PayPal SDK here
      // For now, we'll simulate a successful payment
      toast({
        title: "PayPal Integration",
        description:
          "PayPal payment integration would be implemented here. For demo purposes, payment is marked as completed.",
      })

      // Update payment status to completed (in real app, this would be done via webhook)
      await supabase
        .from("payments")
        .update({
          status: "completed",
          admin_verified: true,
          discord_invite_sent: true,
          paypal_payment_id: "DEMO_" + Date.now(),
        })
        .eq("id", data.id)

      toast({
        title: "Payment Successful!",
        description: "Your subscription is now active. You can access Discord!",
      })

      router.push("/dashboard")
    } catch (error) {
      console.error("Payment error:", error)
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const uploadPaymentProof = async (file: File): Promise<string | null> => {
    if (!storageAvailable) {
      console.log("Storage not available, skipping file upload")
      return null
    }

    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase()
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`

      console.log("Uploading file:", fileName)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        console.error("Upload error:", uploadError)

        // Handle specific storage errors
        if (uploadError.message.includes("Bucket not found")) {
          throw new Error("Storage not configured - file upload disabled")
        } else if (uploadError.message.includes("not allowed")) {
          throw new Error("File type not allowed - please use JPG, PNG, or PDF")
        } else if (uploadError.message.includes("too large")) {
          throw new Error("File too large - maximum 5MB allowed")
        } else {
          throw new Error("File upload failed - " + uploadError.message)
        }
      }

      console.log("Upload successful:", uploadData)

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("payment-proofs").getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error("File upload error:", error)
      throw error
    }
  }

  const handleUSDTPayment = async () => {
    if (!usdtTxHash.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide the transaction hash.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    let proofUrl = null

    try {
      // Upload proof file if provided and storage is available
      if (usdtProof) {
        try {
          proofUrl = await uploadPaymentProof(usdtProof)
          if (proofUrl) {
            toast({
              title: "File Uploaded",
              description: "Payment proof uploaded successfully",
            })
          }
        } catch (uploadError) {
          console.error("File upload failed:", uploadError)

          // Show warning but continue with payment submission
          toast({
            title: "File Upload Warning",
            description:
              uploadError instanceof Error
                ? uploadError.message
                : "File upload failed, but payment will still be submitted",
            variant: "destructive",
          })

          // Don't return here - continue with payment submission
        }
      }

      // Create payment record
      const paymentData = {
        user_id: user?.id,
        payment_method: "usdt" as const,
        amount: 49.0,
        currency: "USDT",
        status: "pending" as const,
        payment_proof_url: proofUrl,
        admin_verified: false,
      }

      console.log("Creating payment record:", paymentData)

      const { error: paymentError } = await supabase.from("payments").insert(paymentData)

      if (paymentError) {
        console.error("Payment creation error:", paymentError)
        throw new Error("Failed to create payment record: " + paymentError.message)
      }

      toast({
        title: "USDT Payment Submitted",
        description: "Your payment is pending admin verification. You will receive Discord access once verified.",
      })

      router.push("/dashboard")
    } catch (error) {
      console.error("USDT payment error:", error)

      let errorMessage = "There was an error submitting your USDT payment. Please try again."
      if (error instanceof Error) {
        errorMessage = error.message
      }

      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 5MB.",
        variant: "destructive",
      })
      return
    }

    // Check file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please select a JPG, PNG, GIF, WebP, or PDF file.",
        variant: "destructive",
      })
      return
    }

    setUsdtProof(file)
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="bg-black p-2 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Sentient Markets</span>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Subscribe to Premium</h1>
            <p className="text-xl text-gray-600">Choose your payment method to access exclusive trading insights</p>
          </div>

          {/* Storage Warning */}
          {!storageAvailable && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Note:</strong> File upload is currently unavailable. You can still submit USDT payments with
                transaction hash, but file proof upload is disabled.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Pricing Card */}
            <div className="lg:col-span-1">
              <Card className="shadow-sm border-2 border-blue-200 sticky top-8">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-gray-900">Premium Access</CardTitle>
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    $49<span className="text-lg text-gray-500 font-normal">/month</span>
                  </div>
                  <CardDescription className="text-gray-600">
                    Full access to trading community and premium features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-center text-gray-700">
                      <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                      Live trading sessions
                    </li>
                    <li className="flex items-center text-gray-700">
                      <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                      Discord community access
                    </li>
                    <li className="flex items-center text-gray-700">
                      <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                      Real-time market analysis
                    </li>
                    <li className="flex items-center text-gray-700">
                      <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                      Trading guides & resources
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Payment Method Selection */}
            <div className="lg:col-span-2">
              <Card className="shadow-sm border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Select Payment Method</CardTitle>
                  <CardDescription className="text-gray-600">
                    Choose how you'd like to pay for your subscription
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value) => setPaymentMethod(value as "paypal" | "usdt")}
                    className="space-y-4"
                  >
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                      <RadioGroupItem value="paypal" id="paypal" />
                      <Label htmlFor="paypal" className="flex items-center space-x-3 cursor-pointer flex-1">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-gray-900 font-medium">PayPal</div>
                          <div className="text-gray-600 text-sm">Instant activation • Secure payment</div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                      <RadioGroupItem value="usdt" id="usdt" />
                      <Label htmlFor="usdt" className="flex items-center space-x-3 cursor-pointer flex-1">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <Coins className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-gray-900 font-medium">USDT (Tether)</div>
                          <div className="text-gray-600 text-sm">Manual verification required • 24-48 hours</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* PayPal Payment */}
                  {paymentMethod === "paypal" && (
                    <div className="space-y-4">
                      <Alert className="border-blue-200 bg-blue-50">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          You will be redirected to PayPal to complete your payment securely. Your subscription will be
                          activated immediately upon successful payment.
                        </AlertDescription>
                      </Alert>
                      <Button
                        onClick={handlePayPalPayment}
                        disabled={loading}
                        size="lg"
                        className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white"
                      >
                        {loading ? "Processing..." : "Pay with PayPal - $49.00"}
                      </Button>
                    </div>
                  )}

                  {/* USDT Payment */}
                  {paymentMethod === "usdt" && (
                    <div className="space-y-6">
                      <Alert className="border-yellow-200 bg-yellow-50">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                          <strong>USDT Payment Instructions:</strong>
                          <ol className="mt-2 space-y-1 list-decimal list-inside text-sm">
                            <li>Send exactly $49 USDT to our wallet address below</li>
                            <li>Provide the transaction hash (required)</li>
                            <li>Upload payment proof if possible (optional)</li>
                            <li>Wait for admin verification (usually within 24 hours)</li>
                          </ol>
                        </AlertDescription>
                      </Alert>

                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <Label className="text-gray-700 font-medium">USDT Wallet Address (TRC20)</Label>
                        <div className="mt-2 p-3 bg-white border border-gray-300 rounded-md">
                          <code className="text-sm text-gray-900 break-all">TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE</code>
                        </div>
                        <p className="text-gray-600 text-xs mt-1">⚠️ Only send USDT (TRC20) to this address</p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="txHash" className="text-gray-700 font-medium">
                            Transaction Hash *
                          </Label>
                          <Input
                            id="txHash"
                            value={usdtTxHash}
                            onChange={(e) => setUsdtTxHash(e.target.value)}
                            placeholder="Enter USDT transaction hash"
                            className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            required
                          />
                          <p className="text-gray-500 text-xs mt-1">This is required for payment verification</p>
                        </div>

                        <div>
                          <Label htmlFor="proof" className="text-gray-700 font-medium">
                            Payment Proof {storageAvailable ? "(Optional)" : "(Unavailable)"}
                          </Label>
                          <div className="mt-2">
                            {storageAvailable ? (
                              <div className="flex items-center justify-center w-full">
                                <label
                                  htmlFor="proof"
                                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                                >
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-2 text-gray-400" />
                                    <p className="mb-2 text-sm text-gray-500">
                                      <span className="font-semibold">Click to upload</span> payment screenshot
                                    </p>
                                    <p className="text-xs text-gray-500">PNG, JPG, WebP or PDF (MAX. 5MB)</p>
                                  </div>
                                  <Input
                                    id="proof"
                                    type="file"
                                    onChange={handleFileChange}
                                    accept="image/*,.pdf"
                                    className="hidden"
                                  />
                                </label>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center w-full h-32 border-2 border-gray-200 border-dashed rounded-lg bg-gray-100">
                                <div className="text-center">
                                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                  <p className="text-sm text-gray-500">File upload temporarily unavailable</p>
                                  <p className="text-xs text-gray-400">You can still submit with transaction hash</p>
                                </div>
                              </div>
                            )}
                            {usdtProof && (
                              <p className="text-sm text-green-600 mt-2">✓ File selected: {usdtProof.name}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="notes" className="text-gray-700 font-medium">
                            Additional Notes (Optional)
                          </Label>
                          <Textarea
                            id="notes"
                            value={usdtNotes}
                            onChange={(e) => setUsdtNotes(e.target.value)}
                            placeholder="Any additional information about your payment (e.g., screenshot description if upload failed)"
                            className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            rows={3}
                          />
                        </div>

                        <Button
                          onClick={handleUSDTPayment}
                          disabled={loading || !usdtTxHash.trim()}
                          size="lg"
                          className="w-full bg-gray-900 hover:bg-black text-white"
                        >
                          {loading ? "Submitting..." : "Submit USDT Payment"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
