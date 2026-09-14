"use strict";

const REQUIRED_CHECKS=Object.freeze([
  "TERMS_APPROVED",
  "PRIVACY_APPROVED",
  "REFUND_APPROVED",
  "MERCHANT_CONTACT_READY",
  "ECOMMERCE_REPORTING_STATUS_CONFIRMED",
  "PRIVACY_CONTACT_READY",
  "PROCESSOR_LIST_CONFIRMED",
  "OVERSEAS_TRANSFER_DISCLOSURE_CONFIRMED",
  "UNDER14_POLICY_CONFIRMED",
  "PG_DISCLOSURE_CONFIRMED",
  "LEGAL_REVIEW_COMPLETED"
]);

function legalReadiness(env={}){
  const checks={};
  for(const k of REQUIRED_CHECKS)checks[k]=String(env[k]||"")==="true";
  const failed=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);
  return {ready:failed.length===0,failed,checks};
}

function publicLegalReadiness(env={}){
  const r=legalReadiness(env);
  return {
    ready:r.ready,
    failed:r.failed,
    termsApproved:r.checks.TERMS_APPROVED,
    privacyApproved:r.checks.PRIVACY_APPROVED,
    refundApproved:r.checks.REFUND_APPROVED,
    merchantContactReady:r.checks.MERCHANT_CONTACT_READY,
    ecommerceReportingStatusConfirmed:r.checks.ECOMMERCE_REPORTING_STATUS_CONFIRMED,
    privacyContactReady:r.checks.PRIVACY_CONTACT_READY,
    processorListConfirmed:r.checks.PROCESSOR_LIST_CONFIRMED,
    overseasTransferDisclosureConfirmed:r.checks.OVERSEAS_TRANSFER_DISCLOSURE_CONFIRMED,
    under14PolicyConfirmed:r.checks.UNDER14_POLICY_CONFIRMED,
    pgDisclosureConfirmed:r.checks.PG_DISCLOSURE_CONFIRMED,
    legalReviewCompleted:r.checks.LEGAL_REVIEW_COMPLETED
  };
}

function documentVersion(type){
  const map={
    terms:"draft-2026-09-14-v1",
    privacy:"draft-2026-09-14-v1",
    refund:"draft-2026-09-14-v1"
  };
  if(!map[type])throw new Error("unknown_legal_document");
  return map[type];
}

module.exports={REQUIRED_CHECKS,legalReadiness,publicLegalReadiness,documentVersion};
