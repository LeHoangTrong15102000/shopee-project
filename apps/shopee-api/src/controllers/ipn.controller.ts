import { Request, Response } from 'express'
import { paymentService } from '../container'
import { PaymentProvider } from '@services/payment/payment.interface'
import { Logger } from '@utils/logger'

/**
 * POST /payment/momo/ipn
 *
 * MoMo IPN endpoint. No JWT auth — signature verification is the auth mechanism.
 * MoMo requires HTTP 204 (No Content) response within 15 seconds.
 */
export const momoIpn = async (req: Request, res: Response): Promise<void> => {
  Logger.apiInfo('[IPN] MoMo IPN received', {
    orderId: req.body?.orderId,
    resultCode: req.body?.resultCode,
    transId: req.body?.transId,
  })

  try {
    await paymentService.handleIpn(PaymentProvider.MOMO, req.body)
    // MoMo requires HTTP 204 — no body
    res.status(204).end()
  } catch (err: any) {
    Logger.apiError('[IPN] MoMo IPN processing failed', {
      orderId: req.body?.orderId,
      error: err.message,
    })
    // Still return 204 to prevent MoMo from retrying on signature failures
    // For other errors, return 204 as well — reconciliation handles missed updates
    res.status(204).end()
  }
}

/**
 * GET /payment/vnpay/ipn
 *
 * VNPay IPN endpoint. No JWT auth — signature verification is the auth mechanism.
 * VNPay sends query params and expects JSON { RspCode: "00", Message: "Confirm Success" }.
 *
 * RspCode reference:
 *   "00" — success
 *   "97" — invalid checksum (signature mismatch)
 *   "99" — unknown / internal error
 */
export const vnpayIpn = async (req: Request, res: Response): Promise<void> => {
  Logger.apiInfo('[IPN] VNPay IPN received', {
    vnp_TxnRef: req.query?.vnp_TxnRef,
    vnp_ResponseCode: req.query?.vnp_ResponseCode,
    vnp_TransactionNo: req.query?.vnp_TransactionNo,
  })

  // Verify signature BEFORE delegating to the service.
  // This lets us return the spec-required RspCode "97" on checksum failure
  // rather than the generic "99" that a caught exception would produce.
  const provider = paymentService.getProvider(PaymentProvider.VNPAY)
  const signatureValid = provider.verifyIpn(req.query as Record<string, unknown>)

  if (!signatureValid) {
    Logger.apiWarn('[IPN] VNPay IPN rejected — invalid checksum', {
      vnp_TxnRef: req.query?.vnp_TxnRef,
    })
    res.status(200).json({ RspCode: '97', Message: 'Invalid Checksum' })
    return
  }

  try {
    await paymentService.handleIpn(PaymentProvider.VNPAY, req.query as Record<string, unknown>)
    // VNPay requires this exact response format
    res.status(200).json({ RspCode: '00', Message: 'Confirm Success' })
  } catch (err: any) {
    Logger.apiError('[IPN] VNPay IPN processing failed', {
      vnp_TxnRef: req.query?.vnp_TxnRef,
      error: err.message,
    })
    // Return error code so VNPay knows to retry
    res.status(200).json({ RspCode: '99', Message: 'Unknown error' })
  }
}
