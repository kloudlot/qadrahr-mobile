/* AUTO-GENERATED from the API's openapi.json — do not edit by hand. Run `npm run gen:api`. */

export type HealthResponseDto = {
  "status": "ok" | "degraded";
  "controlPlaneMongo": "up" | "down";
  "redis": "up" | "down";
  "timestamp": string;
};

export type PlatformResponseDto = {
  /** The product's name, set by the operator. Tenants do not rename it. */
  "productName": string;
};

export type CreateShiftDto = {
  "name": string;
  "code": string;
  /** HH:mm in the company timezone. */
  "startTime": string;
  "endTime": string;
  /** Inferred from the times when omitted — an end at or before the start is a night shift. */
  "crossesMidnight"?: boolean;
  "breakMinutes"?: number;
  "graceMinutes"?: number;
  /** 0 = Sunday. */
  "workDays"?: string[];
  "minMinutesForFullDay"?: number;
  "minMinutesForHalfDay"?: number;
  /** Worked minutes beyond this become overtime. Defaults to the shift length. */
  "overtimeAfterMinutes"?: number;
  "status"?: "active" | "inactive";
};

export type ShiftResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "name": string;
  /** Unique within the company. */
  "code": string;
  /** Local to the company timezone. */
  "startTime": string;
  "endTime": string;
  /** A night shift ends on the following calendar day — the business date does not. */
  "crossesMidnight": boolean;
  "breakMinutes": number;
  /** Lateness inside this is not recorded as late. */
  "graceMinutes": number;
  /** Days this shift runs, **0 = Sunday** through 6 = Saturday — matching Date#getUTCDay and Company.workDays, NOT ISO. A client sending 7 for Sunday is refused by the write validation, and one reading 0 as invalid loses a day. */
  "workDays": number[];
  "minMinutesForFullDay": number;
  "minMinutesForHalfDay": number;
  /** Minutes worked before overtime starts counting. */
  "overtimeAfterMinutes": number;
  "status": "active" | "inactive";
};

export type PaginationMetaDto = {
  /** One-based page number. */
  "page": number;
  /** Maximum records per page. */
  "limit": number;
  /** Total records matching the filter. */
  "total": number;
  "totalPages": number;
};

export type UpdateShiftDto = {
  "name"?: string;
  "startTime"?: string;
  "endTime"?: string;
  "crossesMidnight"?: boolean;
  "breakMinutes"?: number;
  "graceMinutes"?: number;
  /** 0 = Sunday. */
  "workDays"?: number[];
  "minMinutesForFullDay"?: number;
  "minMinutesForHalfDay"?: number;
  "overtimeAfterMinutes"?: number;
  "status"?: "active" | "inactive";
};

export type AssignRosterDto = {
  "shiftId": string;
  /** Assign to one employee. Beats a department assignment. */
  "employeeId"?: string;
  /** Assign to a whole department. */
  "departmentId"?: string;
  "effectiveFrom": string;
  /** Omit for open-ended. */
  "effectiveTo"?: string;
};

export type RosterAssignmentResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "shiftId": string;
  /** Set for a per-person assignment. Null when the assignment is departmental. */
  "employeeId": string | null;
  "departmentId": string | null;
  "effectiveFrom": string;
  /** Null means open-ended. */
  "effectiveTo": string | null;
};

export type ClockDto = {
  /** Inferred as the opposite of the last punch when omitted. */
  "direction"?: "in" | "out";
  /** When the punch happened. Set by offline clients syncing a queue. */
  "occurredAt"?: string;
  "latitude"?: number;
  "longitude"?: number;
  /** The device's own reported error, in metres. */
  "accuracyMetres"?: number;
  /** True when the phone reports the position came from a mock-location provider. The punch is recorded and flagged. */
  "mockedLocation"?: boolean;
  /** The face sitting done for this punch (POST /me/attendance/face/sessions). What the server concluded from it goes onto the punch; a sitting backs one punch. */
  "faceSessionId"?: string;
  /** For a punch made offline: the key of a photo uploaded to a slot from POST /me/attendance/face/selfie-slot. It is matched, but cannot show the person was there, so the punch is flagged. */
  "faceCaptureKey"?: string;
  "deviceId"?: string;
  /** Client-generated id making a retry harmless. Offline clients queue punches, so retries are the normal case rather than the exception. */
  "clientPunchId"?: string;
};

export type PunchVerificationResponseDto = {
  "method": "face";
  /** Only `verified` is unremarkable; every other value raises an exception on the day. `pending` becomes one of the others once the face has been checked. */
  "status": "verified" | "uncertain" | "mismatch" | "liveness_failed" | "liveness_not_checked" | "not_enrolled" | "pending" | "unverified";
  /** Similarity to the enrolled face, 0–1, when the two were compared. */
  "score": number | null;
  "sessionId": string | null;
  "model": string | null;
  "checkedAt": string | null;
};

export type PunchEventResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "employeeId": string;
  /** The UTC instant. */
  "occurredAt": string;
  /** The day this belongs to in the COMPANY timezone, which is not always the UTC day. */
  "businessDate": string;
  "direction": "in" | "out";
  "source": "mobile" | "kiosk" | "web" | "biometric" | "import" | "correction";
  "branchId": string | null;
  "latitude": number | null;
  "longitude": number | null;
  /** The device’s own accuracy claim. The geofence is widened by it. */
  "accuracyMetres": number | null;
  "distanceMetres": number | null;
  /** True when the phone reported a mock-location provider. Null when it did not say. */
  "mockedLocation": boolean | null;
  /** For a punch from a terminal: how the terminal identified the employee. */
  "terminalVerifyMode": "fingerprint" | "face" | "card" | "password" | "other" | null;
  /** The face check. Null when none applied to this punch. */
  "verification": PunchVerificationResponseDto | null;
  /** Null when the punch carried no location — not the same as false. */
  "withinGeofence": boolean | null;
  "deviceId": string | null;
  /** The terminal’s own id, used to make an import replay-safe. */
  "externalId": string | null;
  /** Set when this punch was entered to correct another one. */
  "correctsPunchId": string | null;
  /** Superseded punches are KEPT. The original evidence is never deleted. */
  "supersededByCorrection": boolean;
  "reason": string | null;
  "recordedBy": string | null;
};

export type AttendanceDayResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "employeeId": string;
  "businessDate": string;
  "shiftId": string | null;
  "status": "present" | "partial" | "absent" | "on_leave" | "holiday" | "rest_day";
  "firstIn": string | null;
  "lastOut": string | null;
  "workedMinutes": number;
  "breakMinutes": number;
  "lateMinutes": number;
  "earlyOutMinutes": number;
  /** Bucketed separately because each bucket is paid at a different multiplier. */
  "overtimeWeekdayMinutes": number;
  "overtimeRestDayMinutes": number;
  "overtimeHolidayMinutes": number;
  /** An in without an out. Non-zero means the day needs a person to look at it. */
  "unpairedPunches": number;
  /** The punches this day was computed from. */
  "punchIds": string[];
  "hasCorrections": boolean;
  "exceptions": string[];
  "computedAt": string | null;
};

export type ClockResponseDto = {
  "punch": PunchEventResponseDto;
  /** The recomputed day, including this punch. */
  "day": AttendanceDayResponseDto;
  /** Present when the punch was accepted but flagged. Not an error — the punch exists and counts. Absent on an ordinary punch. */
  "warning"?: string;
};

export type PunchInputDto = {
  /** How the terminal identified the employee, when it says. */
  "verifyMode"?: "fingerprint" | "face" | "card" | "password" | "other";
  "employeeNumber"?: string;
  "employeeId"?: string;
  /** The terminal's enrolment number, when the punch came from a device. */
  "biometricId"?: string;
  "occurredAt": string;
  "direction"?: "in" | "out";
  /** The terminal's own record id. */
  "externalId": string;
  "deviceId"?: string;
};

export type ImportPunchesDto = {
  /** Applied to rows that omit one. */
  "deviceId"?: string;
  "punches": PunchInputDto[];
};

export type ImportPunchesResponseDto = {
  "received": number;
  "accepted": number;
  /** Already present by external id. Re-importing the same file is safe. */
  "duplicates": number;
  /** Rows that could not be read, reported by index rather than silently dropped. */
  "rejected": Record<string, unknown>[];
  /** Days whose aggregation is now stale and has been queued for recompute. */
  "businessDatesTouched": string[];
};

export type AttendanceSummaryResponseDto = {
  "from": string;
  "to": string;
  "daysPresent": number;
  "daysAbsent": number;
  "daysOnLeave": number;
  "workedMinutes": number;
  "lateMinutes": number;
  /** Bucketed separately because each bucket is paid at a different multiplier. */
  "overtimeWeekdayMinutes": number;
  "overtimeRestDayMinutes": number;
  "overtimeHolidayMinutes": number;
  /** Days carrying an exception — an unpaired punch, a geofence miss. */
  "exceptionDays": number;
};

export type CorrectExistingPunchDto = {
  "occurredAt": string;
  "direction"?: "in" | "out";
  "reason": string;
  "punchId": string;
};

export type CorrectPunchDto = {
  "occurredAt": string;
  "direction"?: "in" | "out";
  "reason": string;
};

export type RecomputeAttendanceDto = {
  "businessDate": string;
  /** Limit to one employee. Omit for the whole company. */
  "employeeId"?: string;
};

export type RecomputeResponseDto = {
  /** Attendance days rebuilt from their punches. */
  "recomputed": number;
};

export type RequestAttendanceCorrectionDto = {
  /** `missing` adds a punch that was never recorded; `correct` fixes the time of one that was. */
  "kind": "missing" | "correct";
  /** The punch to correct. Required for `correct`. */
  "punchId"?: string;
  /** The time that is right. */
  "occurredAt": string;
  /** Required for `missing`. */
  "direction"?: "in" | "out";
  "reason": string;
};

export type AttendanceCorrectionRequestResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "employeeId": string;
  "requestedByUserId": string;
  "kind": "missing" | "correct";
  /** The punch corrected, for `correct`. */
  "punchId": string | null;
  /** The recorded time being replaced, for `correct`. */
  "originalOccurredAt": string | null;
  /** The time asked for. */
  "occurredAt": string;
  "direction"?: "in" | "out";
  "reason": string;
  "status": "pending" | "applied" | "rejected" | "cancelled" | "failed";
  "workflowInstanceId": string | null;
  /** The punch written on approval. */
  "appliedPunchId": string | null;
  "appliedAt": string | null;
  /** Why an approved request could not be applied. */
  "failureReason"?: string;
};

export type GeofenceResponseDto = {
  "latitude": number;
  "longitude": number;
  /** Radius in metres. */
  "radiusMeters": number;
};

export type MyWorkLocationResponseDto = {
  "branchId": string | null;
  "name": string | null;
  "timezone": string | null;
  /** Null means this branch does not geofence mobile clock-in. */
  "geofence": GeofenceResponseDto | null;
};

export type MyShiftResponseDto = {
  "shiftId": string | null;
  "name": string | null;
  "startTime": string | null;
  "endTime": string | null;
  "breakMinutes": number | null;
  /** Paid working minutes — the span less the break. Computed server-side because a night shift spans midnight, and 22:00 to 06:00 is eight hours rather than minus sixteen. */
  "scheduledMinutes": number | null;
  "crossesMidnight": boolean;
  /** Whether this shift runs on the date asked about. */
  "worksToday": boolean;
};

export type StatutoryRegistrationDto = {
  /** Scheme code, validated against the country */
  "scheme": string;
  "identifier": string;
  "effectiveFrom"?: string;
};

export type PayrollCalendarDto = {
  "frequency"?: "monthly" | "semi_monthly" | "weekly" | "bi_weekly";
  "cutOffDay"?: number;
  "payDay"?: number;
};

export type SalaryDistributionDto = {
  /** Percent of salary paid as basic */
  "basic"?: number;
  "housing"?: number;
  "transport"?: number;
};

export type BankChargeTierDto = {
  /** Net pay below this (minor units). Null: the top tier. */
  "upTo": number | null;
  /** The charge, in minor units. */
  "amount": number;
};

export type BankChargeDeductionDto = {
  "enabled": boolean;
  /** Ascending by `upTo`, the last open. Defaults to the usual Nigerian tiers. */
  "tiers"?: BankChargeTierDto[];
  /** Banks whose transfers aren't charged. */
  "exemptBankCodes"?: string[];
};

export type LegacyPayslipsDto = {
  "enabled": boolean;
  "baseUrl"?: string | null;
  /** The first period paid in QadraHR. */
  "cutoverPeriod"?: string | null;
};

export type CreateCompanyDto = {
  "name": string;
  /** Short code, unique within the tenant */
  "code": string;
  "legalName"?: string;
  /** Determines which statutory rule pack applies. Cannot be changed once payroll has run. */
  "countryCode": "NG" | "GH" | "KE";
  /** Defaults to the country's currency. Must match it unless deliberately overridden. */
  "currency"?: string;
  /** Defaults to the country's timezone. */
  "timezone"?: string;
  "registrationNumber"?: string;
  /** TIN / KRA PIN / GRA TIN */
  "taxId"?: string;
  "statutoryRegistrations"?: StatutoryRegistrationDto[];
  "payrollCalendar"?: PayrollCalendarDto;
  /** MM-DD */
  "fiscalYearStart"?: string;
  /** Working days, 0 = Sunday. Six-day weeks are common in retail and manufacturing. */
  "workDays"?: number[];
  "address"?: string;
  "salaryDistribution"?: SalaryDistributionDto;
  "applyBankCharges"?: boolean;
  /** Nigeria: annual rent relief in MINOR UNITS for an employee with no rent recorded. Null means none. */
  "defaultAnnualRentRelief"?: number | null;
  /** structure: figures from compensation and pay structures. schedule: from a spreadsheet uploaded each period. */
  "payrollMethod"?: "structure" | "schedule";
  /** Passing the bank's transfer charge on to employees, from net pay. */
  "bankChargeDeduction"?: BankChargeDeductionDto;
  /** Looking up pre-QadraHR payslips in the legacy Paytrail platform. */
  "legacyPayslips"?: LegacyPayslipsDto;
  "adminIds"?: string[];
};

export type StatutoryRegistrationResponseDto = {
  /** The scheme this registration is with, e.g. PENSION, NHF, ITF, SSNIT, NSSF, SHIF. */
  "scheme": string;
  /** The EMPLOYER's number with that body. */
  "identifier": string;
  "effectiveFrom"?: string;
};

export type PayrollCalendarResponseDto = {
  "frequency": "monthly" | "semi_monthly" | "weekly" | "bi_weekly";
  /** Day of month variable input closes. */
  "cutOffDay": number;
  /** Day of month people are paid. */
  "payDay": number;
};

export type SalaryDistributionResponseDto = {
  /** Percent of gross. */
  "basic": number;
  /** Percent of gross. */
  "housing": number;
  /** Percent of gross. */
  "transport": number;
};

export type BankChargeTierResponseDto = {
  "upTo": number | null;
  "amount": number;
};

export type BankChargeDeductionResponseDto = {
  "enabled": boolean;
  "tiers": BankChargeTierResponseDto[];
  "exemptBankCodes": string[];
};

export type LegacyPayslipsResponseDto = {
  "enabled": boolean;
  "baseUrl": string | null;
  "cutoverPeriod": string | null;
};

export type CompanyResponseDto = {
  "_id": string;
  "name": string;
  /** Unique within the tenant. */
  "code": string;
  "legalName"?: string;
  /** Determines which statutory rule pack payroll resolves for this company. */
  "countryCode": "NG" | "GH" | "KE";
  /** ISO 4217. All pay for this company is in it. */
  "currency": string;
  /** IANA zone. Business dates — pay periods, attendance days — resolve in it. */
  "timezone": string;
  "registrationNumber"?: string;
  "taxId"?: string;
  "statutoryRegistrations": StatutoryRegistrationResponseDto[];
  "payrollCalendar": PayrollCalendarResponseDto;
  /** Fiscal year start as MM-DD. */
  "fiscalYearStart": string;
  /** Working days, 0 = Sunday. Drives working-day leave calculation and rest-day overtime. */
  "workDays": number[];
  "address"?: string;
  "salaryDistribution": SalaryDistributionResponseDto;
  /** Whether bank transfer charges are deducted from the employee. */
  "applyBankCharges": boolean;
  /** Nigeria: annual rent relief (minor units) when no rent is recorded. */
  "defaultAnnualRentRelief": number | null;
  "payrollMethod": "structure" | "schedule";
  "bankChargeDeduction": BankChargeDeductionResponseDto;
  "legacyPayslips": LegacyPayslipsResponseDto;
  /** Whether the legacy API key is saved. The key is never returned. */
  "legacyPayslipsKeySet": boolean;
  /** Users administering this company. */
  "adminIds": string[];
  "status": "active" | "inactive";
  "createdBy": string | null;
  "updatedBy": string | null;
  "createdAt": string;
  "updatedAt": string;
};

export type UpdateCompanyDto = {
  "name"?: string;
  /** Short code, unique within the tenant */
  "code"?: string;
  "legalName"?: string;
  /** Defaults to the country's currency. Must match it unless deliberately overridden. */
  "currency"?: string;
  /** Defaults to the country's timezone. */
  "timezone"?: string;
  "registrationNumber"?: string;
  /** TIN / KRA PIN / GRA TIN */
  "taxId"?: string;
  "statutoryRegistrations"?: StatutoryRegistrationDto[];
  "payrollCalendar"?: PayrollCalendarDto;
  /** MM-DD */
  "fiscalYearStart"?: string;
  /** Working days, 0 = Sunday. Six-day weeks are common in retail and manufacturing. */
  "workDays"?: number[];
  "address"?: string;
  "salaryDistribution"?: SalaryDistributionDto;
  "applyBankCharges"?: boolean;
  /** Nigeria: annual rent relief in MINOR UNITS for an employee with no rent recorded. Null means none. */
  "defaultAnnualRentRelief"?: number | null;
  /** structure: figures from compensation and pay structures. schedule: from a spreadsheet uploaded each period. */
  "payrollMethod"?: "structure" | "schedule";
  /** Passing the bank's transfer charge on to employees, from net pay. */
  "bankChargeDeduction"?: BankChargeDeductionDto;
  /** Looking up pre-QadraHR payslips in the legacy Paytrail platform. */
  "legacyPayslips"?: LegacyPayslipsDto;
  "adminIds"?: string[];
  "status"?: "active" | "inactive";
};

export type FaceSettingsResponseDto = {
  "mode": "off" | "required";
  "onFailure": "flag" | "block";
  "enrolmentApproval": "auto" | "hr_review";
  "captureRetentionDays": number;
  "branchIds": string[];
};

export type FaceAvailabilityResponseDto = {
  "available": boolean;
  /** Why the face check cannot be turned on, or null when it can. */
  "reason": "not_configured" | "not_in_plan" | null;
};

export type AttendanceSettingsResponseDto = {
  "companyId": string | null;
  /** True when this company has none of its own and uses the organisation's. */
  "inherited": boolean;
  "face": FaceSettingsResponseDto;
  "faceAvailability": FaceAvailabilityResponseDto;
  "updatedAt": string | null;
};

export type UpdateFaceSettingsDto = {
  /** `required` asks for a face at every clock-in from the app. Refused with 409 when the face check isn't in the plan or isn't available on this server. */
  "mode"?: "off" | "required";
  /** `flag` records the punch and raises an exception. `block` refuses a punch whose face is definitely someone else or whose liveness check failed; an uncertain match, an engine that is down and a punch queued offline are still recorded and flagged. */
  "onFailure"?: "flag" | "block";
  /** Whether HR reviews an enrolment before it is used. */
  "enrolmentApproval"?: "auto" | "hr_review";
  /** Days the photos taken at clock-in are kept before they are deleted. */
  "captureRetentionDays"?: number;
  /** Branches the check applies to. Empty means all of them. */
  "branchIds"?: string[];
};

export type UpdateAttendanceSettingsDto = {
  "face"?: UpdateFaceSettingsDto;
};

export type MyFaceEnrolmentResponseDto = {
  "status": "pending_review" | "approved" | "rejected";
  /** Why HR turned it down, if they did. */
  "reviewNote": string | null;
  "enrolledAt": string | null;
};

export type BiometricNoticeResponseDto = {
  "version": number;
  "title": string;
  "paragraphs": string[];
};

export type MyFaceStatusResponseDto = {
  /** What the app should do next. `off`: no face is asked for. `needs_consent` and `needs_enrolment`: clock-ins are recorded and flagged until the employee has enrolled. `awaiting_review`: enrolled, and HR has yet to approve it. `ready`: take a face at clock-in. */
  "state": "unavailable" | "off" | "needs_consent" | "needs_enrolment" | "awaiting_review" | "ready";
  /** Whether a face is asked for at this employee’s clock-ins. */
  "required": boolean;
  "onFailure": "flag" | "block";
  "availability": FaceAvailabilityResponseDto;
  "consentGiven": boolean;
  "enrolment": MyFaceEnrolmentResponseDto | null;
  "notice": BiometricNoticeResponseDto;
};

export type GiveConsentDto = {
  /** The version of the notice that was on the screen. */
  "noticeVersion": number;
};

export type StartFaceSessionDto = {
  "purpose": "enrol" | "punch";
};

export type FaceSessionStartedResponseDto = {
  "sessionId": string;
  "purpose": "enrol" | "punch";
  /** The capture page, to open in a web view. The link is the credential. */
  "url": string;
  "expiresAt": string;
};

export type SelfieSlotDto = {
  "contentType": "image/jpeg" | "image/png" | "image/webp";
};

export type FaceFrameSlotResponseDto = {
  "role": "align" | "turn" | "final";
  "uploadUrl": string;
  "key": string;
  "requiredHeaders": Record<string, unknown>;
};

export type FaceSessionSummaryResponseDto = {
  "sessionId": string;
  "purpose": "enrol" | "punch";
  "outcome": "verified" | "uncertain" | "mismatch" | "liveness_failed" | "low_quality" | null;
  "awaitingCheck": boolean;
  "attemptsLeft": number;
  "used": boolean;
  "expiresAt": string;
};

export type FaceSessionViewResponseDto = {
  "purpose": "enrol" | "punch";
  "challenges": string[];
  "attemptsLeft": number;
  "expiresAt": string;
  "firstName": string | null;
  "orgName": string;
  "productName": string;
  "brandColor": string;
  "brandTextColor": string;
};

export type FrameSlotDto = {
  "role": "align" | "turn" | "final";
  "contentType": "image/jpeg" | "image/png" | "image/webp";
};

export type FrameSlotsDto = {
  "frames": FrameSlotDto[];
};

export type SubmitFramesDto = {
  /** Key of the frame taken before the challenges. */
  "align"?: string;
  /** Key of the frame taken as the head-turn challenge passed. */
  "turn"?: string;
  /** Key of the gated frontal photo: the one that is matched. */
  "final": string;
};

export type FaceSubmitVerdictResponseDto = {
  "status": "verified" | "rejected";
  "outcome"?: "verified" | "uncertain" | "enrolled" | "pending_review";
  /** `low_quality`: take the photo again. `no_match` and `liveness`: start the sitting over. `policy`: stop. */
  "reason"?: "low_quality" | "no_match" | "liveness" | "policy";
  "message"?: string;
  "retryable"?: boolean;
  "attemptsLeft"?: number;
};

export type FaceNamedEmployeeResponseDto = {
  "employeeId": string;
  "name": string;
  "employeeNumber": string;
};

export type FaceEnrolmentRowResponseDto = {
  "employeeId": string;
  "name"?: string;
  "employeeNumber"?: string;
  "status": "pending_review" | "approved" | "rejected";
  "approvedVia": "onboarding_photo" | "automatic" | "reviewer" | null;
  /** Another employee whose enrolled face this one closely resembles. */
  "resembles": FaceNamedEmployeeResponseDto | null;
  "resemblanceScore": number | null;
  "photoCount": number;
  "reviewNote": string | null;
  "reviewedAt": string | null;
  "enrolledAt": string | null;
};

export type FacePhotoUrlsResponseDto = {
  /** Short-lived links. Each view is recorded. */
  "urls": string[];
};

export type ApproveEnrolmentDto = {
  "note"?: string;
};

export type FaceEnrolmentStatusResponseDto = {
  "status": "pending_review" | "approved" | "rejected";
};

export type RejectEnrolmentDto = {
  /** Why, in words the employee can be shown. */
  "note": string;
};

export type FaceCaptureResponseDto = {
  "role": "align" | "turn" | "final";
  "url": string;
};

export type FacePunchReviewResponseDto = {
  "punchId": string;
  "employeeId": string;
  "status": "verified" | "uncertain" | "mismatch" | "liveness_failed" | "liveness_not_checked" | "not_enrolled" | "pending" | "unverified";
  /** Similarity to the enrolled face, 0–1, when the two were compared. */
  "score": number | null;
  /** Which check failed, if one did. */
  "problem": string | null;
  /** True when the punch came with one photo taken offline. */
  "offlinePhoto": boolean;
  "challenges": string[];
  /** When the photos were deleted under the retention setting, if they have been. */
  "photosDeletedAt": string | null;
  /** The photos taken for this punch. Empty once retention has deleted them. */
  "captures": FaceCaptureResponseDto[];
  /** Links to the employee's enrolment photos. */
  "enrolled": string[];
};

export type CreateDocumentTypeDto = {
  "name": string;
  "code": string;
  "description"?: string;
  /** Nobody may be without one. Drives the compliance report. */
  "required"?: boolean;
  "gradeIds"?: string[];
  "employmentTypes"?: string[];
  "countryCodes"?: string[];
  /** A permit with no expiry recorded is one nobody will be reminded about. */
  "requiresExpiry"?: boolean;
  "remindDaysBefore"?: number;
  "requiresVerification"?: boolean;
  /** Days to keep after exit. Omit to keep indefinitely — rarely the right choice. */
  "retainAfterExitDays"?: number;
  "requiresAcknowledgement"?: boolean;
};

export type DocumentTypeResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "name": string;
  /** Unique within the company. */
  "code": string;
  "description"?: string;
  /** Required types are what the compliance report measures against. */
  "required": boolean;
  /** Grades this applies to. Empty means every grade. */
  "gradeIds": string[];
  /** Empty means every employment type. */
  "employmentTypes": string[];
  /** Empty means every country. */
  "countryCodes": string[];
  "requiresExpiry": boolean;
  /** Days before expiry that a reminder fires. */
  "remindDaysBefore": number;
  "requiresVerification": boolean;
  /** Days after exit this may be kept. Null means kept indefinitely — a deliberate choice someone has to make, not a default that quietly deletes. */
  "retainAfterExitDays": number | null;
  "requiresAcknowledgement": boolean;
  "status": "active" | "inactive";
};

export type DocumentUploadUrlDto = {
  "filename": string;
  "contentType": string;
};

export type DocumentUploadUrlResponseDto = {
  /** Short-lived, single-use PUT target. The key is signed into it. */
  "uploadUrl": string;
  /** Send back as `storageKey` when recording the document. */
  "key": string;
  /** Signed into the URL (including the content type) — an upload omitting them is refused by storage. */
  "requiredHeaders": Record<string, unknown>;
};

export type RecordDocumentDto = {
  "documentTypeId": string;
  "filename": string;
  /** The key returned by the upload-url endpoint. */
  "storageKey": string;
  "contentType"?: string;
  "sizeBytes"?: number;
  "reference"?: string;
  "issuedOn"?: string;
  "expiresOn"?: string;
};

export type EmployeeDocumentResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "employeeId": string;
  "documentTypeId": string;
  "filename": string;
  "contentType"?: string;
  "sizeBytes": number;
  /** The document’s own number. */
  "reference"?: string;
  "issuedOn": string | null;
  "expiresOn": string | null;
  "status": "pending_verification" | "verified" | "rejected" | "expired" | "superseded";
  "verifiedBy": string | null;
  "verifiedAt": string | null;
  "rejectionReason"?: string;
  /** The document this replaced. Superseded documents are kept, not deleted. */
  "supersedesId": string | null;
  "acknowledgedAt": string | null;
  "lastRemindedOn": string | null;
  "uploadedBy": string | null;
};

export type ComplianceGapResponseDto = {
  "employeeId": string;
  "employeeNumber": string;
  "name": string;
  /** One gap per employee and document type. */
  "documentType": string;
  "reason": "missing" | "expired" | "expiring_soon" | "unverified";
  /** For expired and expiring documents. */
  "expiresOn"?: string | null;
};

export type VerifyDocumentDto = {
  "approved": boolean;
  /** Required on a rejection — the employee has to know what to do differently. */
  "reason"?: string;
};

export type PresignedUrlResponseDto = {
  /** Short-lived. The storage key itself is never returned. */
  "url": string;
};

export type ReminderRunResponseDto = {
  /** Reminders sent. Idempotent per document per day. */
  "sent": number;
  "skipped": number;
};

export type PurgeDto = {
  /** Defaults to TRUE. This is the only operation that destroys data irrecoverably, so it is easy to look before leaping. */
  "dryRun"?: boolean;
};

export type PurgeCandidateResponseDto = {
  "documentId": string;
  "employeeNumber": string;
  "documentType": string;
  "exitDate": string;
  "retainUntil": string;
};

export type PurgeResultResponseDto = {
  /** Defaults to true. This is the only operation that destroys data irrecoverably. */
  "dryRun": boolean;
  "candidates": PurgeCandidateResponseDto[];
  "purged": number;
  /** One failure does not abort the rest; the record is left for the next run. */
  "failed": Record<string, unknown>[];
};

export type RequestReportDto = {
  /** Only these departments (current). */
  "departmentIds"?: string[];
  /** Only these branches (current). */
  "branchIds"?: string[];
  /** Leave types to include. For `absenteeism`, the types counted as sickness (default: types whose code or name says "sick"). */
  "leaveTypeIds"?: string[];
  "format"?: "csv" | "xlsx";
  "kind": "headcount" | "turnover" | "new_hires" | "exits" | "workforce_movements" | "workforce_demographics" | "probation_status" | "attendance_summary" | "attendance_register" | "attendance_overtime" | "leave_utilisation" | "absenteeism" | "leave_liability" | "payroll_cost" | "recruitment_funnel" | "training_compliance" | "document_compliance" | "er_cases" | "custom";
  /** Required for kind `custom` — the saved definition to run. */
  "definitionId"?: string;
  "from"?: string;
  "to"?: string;
  /** The leave year, for leave balance reports. */
  "year"?: number;
  /** Companies to include. Omit for the one in context. More than one needs `report:consolidated`, and each must be a company the caller can act on. */
  "companyIds"?: string[];
  /** Consolidates into one currency. Every rate used is recorded on the run, so the same report reproduces. */
  "presentationCurrency"?: string;
};

export type AppliedRateResponseDto = {
  "from": string;
  "to": string;
  "rate": number;
  /** The rate in force on the report’s own date — never today’s. */
  "effectiveFrom": string;
};

export type ReportRunResponseDto = {
  "_id": string;
  "companyId": string | null;
  /** See GET /reports/kinds for what each is. */
  "kind": "headcount" | "turnover" | "new_hires" | "exits" | "workforce_movements" | "workforce_demographics" | "probation_status" | "attendance_summary" | "attendance_register" | "attendance_overtime" | "leave_utilisation" | "absenteeism" | "leave_liability" | "payroll_cost" | "recruitment_funnel" | "training_compliance" | "document_compliance" | "er_cases" | "custom";
  "status": "queued" | "running" | "ready" | "failed";
  "parameters": Record<string, unknown>;
  /** A consolidated report spans several companies. */
  "companyIds": string[];
  "presentationCurrency"?: string;
  "format": "csv" | "xlsx";
  "scheduleName"?: string | null;
  /** Every rate this run converted at, so the same report reproduces. */
  "ratesUsed": AppliedRateResponseDto[];
  "rowCount": number;
  /** Recorded ON the run, so somebody waiting learns why instead of watching it sit. */
  "error"?: string;
  "startedAt": string | null;
  "completedAt": string | null;
  "requestedBy": string | null;
};

export type ReportKindResponseDto = {
  "kind": "headcount" | "turnover" | "new_hires" | "exits" | "workforce_movements" | "workforce_demographics" | "probation_status" | "attendance_summary" | "attendance_register" | "attendance_overtime" | "leave_utilisation" | "absenteeism" | "leave_liability" | "payroll_cost" | "recruitment_funnel" | "training_compliance" | "document_compliance" | "er_cases" | "custom";
  "name": string;
  "description": string;
  "category": "workforce" | "time" | "leave" | "pay" | "talent" | "compliance" | "custom";
  "module": "core_hr" | "time_attendance" | "face_attendance" | "leave" | "payroll" | "recruitment" | "performance" | "employee_relations" | "documents" | "expenses" | "learning" | "reporting" | "ai" | "broadcast" | "assets" | null;
  /** range needs from/to; year takes a leave year; snapshot is as at today. */
  "period": "range" | "year" | "snapshot";
  "filters": ("department" | "branch" | "leaveTypes")[];
  /** Data permissions it needs beyond report:create. */
  "requires": string[];
  /** Whether consolidating into one currency means anything for it. */
  "currency": boolean;
  "defaultSchedulePeriod": "previous_month" | "month_to_date" | "previous_week" | "previous_quarter" | "year_to_date" | "last_30_days" | null;
  /** Whether the caller may run it. */
  "allowed": boolean;
  "reason": string | null;
};

export type ReportCatalogFieldResponseDto = {
  "path": string;
  "label": string;
  "type": "string" | "number" | "money" | "date" | "boolean";
  /** What this FIELD accepts, not what the system supports. Offering `contains` on a date is how a builder produces a filter that quietly matches nothing. */
  "operators": string[];
};

export type ReportSubjectResponseDto = {
  "key": string;
  "label": string;
  /** Needed on top of report:read. Pay lives behind payslip:read_all, not this. */
  "requires": string;
  "fields": ReportCatalogFieldResponseDto[];
  "operators": string[];
};

export type ReportFilterDto = {
  /** Must be a field the catalog lists. */
  "field": string;
  "operator": "eq" | "ne" | "in" | "notIn" | "gt" | "gte" | "lt" | "lte" | "between" | "contains" | "isNull" | "isNotNull";
  /** A string, number, boolean, or list for `in`. Coerced to the field’s own type. */
  "value"?: string | number | boolean | string[];
};

export type SaveReportDefinitionDto = {
  "name": string;
  "description"?: string;
  /** A key from GET /reports/catalog. */
  "subject": string;
  "fields": string[];
  "filters"?: ReportFilterDto[];
  "sortBy"?: string;
  "sortDirection"?: "asc" | "desc";
  /** A ceiling on rows, so a definition cannot become an export of the collection. */
  "rowLimit"?: number;
};

export type ReportPreviewResponseDto = {
  "columns": string[];
  /** At most 25. A preview that returns five thousand rows is not a preview. */
  "rows": Record<string, unknown>[];
  "sampled": number;
  /** What the report would actually produce. */
  "total": number;
};

export type ReportFilterResponseDto = {
  "field": string;
  "operator": string;
  /** Coerced to the field’s own type. */
  "value": string | number | boolean | string[];
};

export type ReportDefinitionResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "name": string;
  "description"?: string;
  "subject": string;
  /** Field paths, in column order. */
  "fields": string[];
  "filters": ReportFilterResponseDto[];
  "sortBy": string | null;
  "sortDirection": "asc" | "desc";
  /** Capped again at execution — a stored limit is tenant data like anything else. */
  "rowLimit": number;
};

export type SaveReportScheduleDto = {
  /** Only these departments (current). */
  "departmentIds"?: string[];
  /** Only these branches (current). */
  "branchIds"?: string[];
  /** Leave types to include. For `absenteeism`, the types counted as sickness (default: types whose code or name says "sick"). */
  "leaveTypeIds"?: string[];
  "format"?: "csv" | "xlsx";
  "name": string;
  "kind": "headcount" | "turnover" | "new_hires" | "exits" | "workforce_movements" | "workforce_demographics" | "probation_status" | "attendance_summary" | "attendance_register" | "attendance_overtime" | "leave_utilisation" | "absenteeism" | "leave_liability" | "payroll_cost" | "recruitment_funnel" | "training_compliance" | "document_compliance" | "er_cases" | "custom";
  /** Required when kind is `custom`. */
  "definitionId"?: string;
  "cadence": "daily" | "weekly" | "monthly";
  /** ISO weekday, 1 = Monday. For `weekly`. */
  "weekday"?: number;
  /** For `monthly`. Clamped to the last day in shorter months rather than skipped. */
  "dayOfMonth"?: number;
  "companyIds"?: string[];
  "presentationCurrency"?: string;
  /** The window each run covers, ending the day before it fires. Omit for the report’s own default (usually the previous month). */
  "period"?: "previous_month" | "month_to_date" | "previous_week" | "previous_quarter" | "year_to_date" | "last_30_days" | null;
  /** Who is told it is ready. A report nobody hears about is a file nobody opens. */
  "recipientUserIds": string[];
  "isActive"?: boolean;
};

export type ReportScheduleResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "name": string;
  "kind": string;
  "definitionId": string | null;
  /** An enum, not a cron expression — see the endpoint description for why. */
  "cadence": "daily" | "weekly" | "monthly";
  /** ISO weekday, 1 = Monday. */
  "weekday": number;
  /** Clamped to the last day in shorter months rather than skipping them. */
  "dayOfMonth": number;
  "companyIds": string[];
  "presentationCurrency": string | null;
  /** Told by link when the file exists. */
  "recipientUserIds": string[];
  /** The window each run covers. Null takes the report’s own default. */
  "period": "previous_month" | "month_to_date" | "previous_week" | "previous_quarter" | "year_to_date" | "last_30_days" | null;
  "departmentIds": string[];
  "branchIds": string[];
  "leaveTypeIds": string[];
  "format": "csv" | "xlsx";
  "isActive": boolean;
  /** The business date it last fired for. A second sweep the same day is a no-op. */
  "lastRunOn": string | null;
  "lastRunId": string | null;
};

export type UpdateReportScheduleDto = {
  /** Only these departments (current). */
  "departmentIds"?: string[];
  /** Only these branches (current). */
  "branchIds"?: string[];
  /** Leave types to include. For `absenteeism`, the types counted as sickness (default: types whose code or name says "sick"). */
  "leaveTypeIds"?: string[];
  "format"?: "csv" | "xlsx";
  "name"?: string;
  "kind"?: "headcount" | "turnover" | "new_hires" | "exits" | "workforce_movements" | "workforce_demographics" | "probation_status" | "attendance_summary" | "attendance_register" | "attendance_overtime" | "leave_utilisation" | "absenteeism" | "leave_liability" | "payroll_cost" | "recruitment_funnel" | "training_compliance" | "document_compliance" | "er_cases" | "custom";
  /** Required when kind is `custom`. */
  "definitionId"?: string;
  "cadence"?: "daily" | "weekly" | "monthly";
  /** ISO weekday, 1 = Monday. For `weekly`. */
  "weekday"?: number;
  /** For `monthly`. Clamped to the last day in shorter months rather than skipped. */
  "dayOfMonth"?: number;
  "companyIds"?: string[];
  "presentationCurrency"?: string;
  /** The window each run covers, ending the day before it fires. Omit for the report’s own default (usually the previous month). */
  "period"?: "previous_month" | "month_to_date" | "previous_week" | "previous_quarter" | "year_to_date" | "last_30_days" | null;
  /** Who is told it is ready. A report nobody hears about is a file nobody opens. */
  "recipientUserIds"?: string[];
  "isActive"?: boolean;
};

export type ExchangeRateResponseDto = {
  "_id": string;
  "fromCurrency": string;
  "toCurrency": string;
  "rate": number;
  "effectiveFrom": string;
  "source"?: string;
  "createdBy": string | null;
};

export type SetExchangeRateDto = {
  "fromCurrency": string;
  "toCurrency": string;
  /** Units of toCurrency per one fromCurrency. */
  "rate": number;
  "effectiveFrom": string;
  "source"?: string;
};

export type HeadcountKpiDto = {
  "active": number;
  "onLeave": number;
  /** Active plus on leave. Excludes exited employees. */
  "total": number;
};

export type PayrollKpiDto = {
  "lastPeriodEnd": string | null;
  "grossCost": string | null;
  "employerCost": string | null;
  "currency": string | null;
};

export type AttendanceKpiDto = {
  /** Attendance days flagged for review — a missing punch or a failed geofence. */
  "exceptionsOpen": number;
};

export type LeaveKpiDto = {
  /** Leave requests awaiting a decision. */
  "pendingRequests": number;
};

export type RecruitmentKpiDto = {
  "openRequisitions": number;
  "activeApplications": number;
};

export type ComplianceKpiDto = {
  /** Disciplinary and grievance cases still open. */
  "unresolvedCases": number;
};

export type DashboardKpisDto = {
  /** The company's today, resolved in its own timezone. */
  "asOf": string;
  "headcount": HeadcountKpiDto;
  /** Null when the plan does not include this module. */
  "payroll": PayrollKpiDto | null;
  /** Null when the plan does not include this module. */
  "attendance": AttendanceKpiDto | null;
  /** Null when the plan does not include this module. */
  "leave": LeaveKpiDto | null;
  /** Null when the plan does not include this module. */
  "recruitment": RecruitmentKpiDto | null;
  /** Null when the plan does not include this module. */
  "compliance": ComplianceKpiDto | null;
};

export type CreateRequisitionDto = {
  "title": string;
  "departmentId": string;
  "designationId"?: string;
  "gradeId"?: string;
  "branchId"?: string;
  "hiringManagerId"?: string;
  "headcount"?: number;
  "employmentType"?: "full_time" | "part_time" | "contract" | "intern";
  /** Integer minor units, monthly. */
  "budgetMin"?: number;
  "budgetMax"?: number;
  "currency"?: string;
  "justification"?: string;
  "targetStartDate"?: string;
};

export type JobRequisitionResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "reference": string;
  "title": string;
  "departmentId": string;
  "designationId": string | null;
  "gradeId": string | null;
  "branchId": string | null;
  /** Positions this requisition covers. */
  "headcount": number;
  /** Filled so far. The requisition closes when equal. */
  "filledCount": number;
  "employmentType": "full_time" | "part_time" | "contract" | "intern";
  /** Integer minor units. */
  "budgetMin": number;
  /** Integer minor units. An offer above this is flagged, not blocked. */
  "budgetMax": number;
  "currency"?: string;
  "status": "draft" | "pending_approval" | "approved" | "rejected" | "posted" | "filled" | "cancelled";
  "workflowInstanceId": string | null;
  "justification"?: string;
};

export type PipelineStageDto = {
  "name": string;
  "order": number;
  /** Blocks moving forward until a scorecard exists. */
  "requiresScorecard"?: boolean;
  /** The stage that means "hired". Exactly one per pipeline. */
  "isTerminal"?: boolean;
};

export type CreatePostingDto = {
  "requisitionId": string;
  "title": string;
  "description": string;
  "requirements"?: string;
  "location"?: string;
  "workMode"?: "on_site" | "hybrid" | "remote";
  /** Publishing a salary range has consequences for existing staff. Off by default. */
  "showSalaryRange"?: boolean;
  /** Screen careers-page applications with AI as they arrive. Off by default; any application can still be screened on request. */
  "autoScreen"?: boolean;
  "stages"?: PipelineStageDto[];
  "closingDate"?: string;
};

export type PipelineStageResponseDto = {
  "name": string;
  "order": number;
  /** A stage that demands a scorecard cannot be left behind without one. */
  "requiresScorecard": boolean;
  /** Terminal stages end the application. */
  "isTerminal": boolean;
};

export type JobPostingResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "requisitionId": string;
  /** The token in the public advert URL. Unguessable, and revoked when closed. */
  "publicToken": string;
  "title": string;
  "description": string;
  "requirements"?: string;
  "location"?: string;
  "workMode": "on_site" | "hybrid" | "remote";
  /** Whether the requisition’s budget is shown on the public advert. */
  "showSalaryRange": boolean;
  /** Whether careers-page applications are screened by AI as they arrive. */
  "autoScreen": boolean;
  "stages": PipelineStageResponseDto[];
  "status": "draft" | "published" | "closed";
  "closingDate": string | null;
  "publishedAt": string | null;
  "applicationCount": number;
};

export type UpdatePostingDto = {
  "title"?: string;
  "description"?: string;
  "requirements"?: string;
  "location"?: string;
  "workMode"?: "on_site" | "hybrid" | "remote";
  "showSalaryRange"?: boolean;
  /** Screen careers-page applications with AI as they arrive. */
  "autoScreen"?: boolean;
  /** Null removes the closing date. */
  "closingDate"?: string | null;
  /** Replaces the pipeline. Refused if it drops a stage a candidate is currently at — they would have nowhere to be. */
  "stages"?: PipelineStageDto[];
};

export type FunnelStageResponseDto = {
  "stage": string;
  "count": number;
};

export type ScreenUnscreenedResponseDto = {
  /** Applications queued for screening. */
  "queued": number;
};

export type StageTransitionResponseDto = {
  "fromStage": string | null;
  "toStage": string;
  "at": string;
  "byUserId": string | null;
  "note"?: string;
};

export type ScorecardResponseDto = {
  "stage": string;
  "interviewerId": string;
  "rating": number;
  "recommendation": "strong_yes" | "yes" | "no" | "strong_no";
  "strengths"?: string;
  "concerns"?: string;
  /** Scorecards are append-only — a submitted one is never rewritten. */
  "submittedAt": string;
};

export type AiScreeningResponseDto = {
  "status": "pending" | "done" | "failed" | "skipped";
  /** 0–100 fit against the posting. */
  "score": number | null;
  "recommendation": "interview" | "review" | "reject" | null;
  "summary": string | null;
  "strengths": string[];
  "gaps": string[];
  /** Things to check, e.g. an unexplained gap. Never protected traits. */
  "riskFlags": string[];
  /** Facts read from the CV: phone, location, education, experience, yearsOfExperience, skills. */
  "extracted": Record<string, unknown> | null;
  "source": "cv" | "cover_letter" | null;
  "model": string | null;
  "tokens": number;
  /** Why it failed or was skipped. */
  "error": string | null;
  "requestedAt": string | null;
  "screenedAt": string | null;
};

export type ApplicationResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "postingId": string;
  "candidateId": string;
  "currentStage": string;
  "status": "active" | "rejected" | "withdrawn" | "hired";
  /** Every move, in order. */
  "history": StageTransitionResponseDto[];
  "scorecards": ScorecardResponseDto[];
  /** The AI screening, when the organisation has AI. Null if it was never run. */
  "aiScreening": AiScreeningResponseDto | null;
};

export type CandidateResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "firstName": string;
  "lastName": string;
  "email": string;
  "phone"?: string;
  "location"?: string;
  "linkedInUrl"?: string;
  /** Set once the candidate was hired and converted into an employee. */
  "convertedToEmployeeId": string | null;
  "source"?: string;
};

export type MoveStageDto = {
  "toStage": string;
  "note"?: string;
};

export type SubmitScorecardDto = {
  "stage": string;
  "rating": number;
  "recommendation": "strong_yes" | "yes" | "no" | "strong_no";
  "strengths"?: string;
  "concerns"?: string;
};

export type RejectApplicationDto = {
  /** Required. A rejected candidate may ask why, and so may a regulator. */
  "reason": string;
  /** Email the candidate that their application is not going further. The reason above is internal and is never included. */
  "notifyCandidate"?: boolean;
};

export type CreateOfferDto = {
  "applicationId": string;
  /** Integer minor units. */
  "salaryAmount": number;
  "salaryBasis"?: "monthly" | "annual";
  "proposedStartDate": string;
  "jobTitle"?: string;
  "currency"?: string;
  "gradeId"?: string;
  "designationId"?: string;
  "branchId"?: string;
  /** An offer with no expiry never closes. */
  "expiresOn"?: string;
  "note"?: string;
};

export type OfferLetterSummaryDto = {
  "title": string;
  /** The version of the wording it was written from. */
  "version": number;
  "issuedAt": string;
};

export type OfferAcceptanceSummaryDto = {
  "typedName": string;
  "signedAt": string;
};

export type OfferResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "applicationId": string;
  "candidateId": string;
  "requisitionId": string;
  "jobTitle": string;
  /** Integer minor units. */
  "salaryAmount": number;
  "currency": string;
  "salaryBasis": "monthly" | "annual";
  "proposedStartDate": string;
  "gradeId": string | null;
  "designationId": string | null;
  "departmentId": string | null;
  "branchId": string | null;
  "status": "draft" | "pending_approval" | "approved" | "sent" | "accepted" | "declined" | "withdrawn" | "expired";
  /** Above the requisition’s budget. Flagged for the approver, never blocked. */
  "outsideApprovedBudget": boolean;
  "workflowInstanceId": string | null;
  "expiresOn": string | null;
  "sentAt": string | null;
  "respondedAt": string | null;
  /** Who recorded the answer: the candidate online, or HR on their behalf. */
  "respondedVia": "candidate" | "hr" | null;
  /** Why HR withdrew it. Kept for the file; never sent to the candidate. */
  "withdrawalReason"?: string;
  "withdrawnAt"?: string | null;
  /** The employee this offer became (converted or approved as a new hire). Set, the offer is done. */
  "hiredEmployeeId"?: string | null;
  /** The letter as sent. Download it from GET /offers/{id}/letter. */
  "letter": OfferLetterSummaryDto | null;
  /** Set when the candidate accepted online, by signing the letter. */
  "acceptance": OfferAcceptanceSummaryDto | null;
};

export type OfferFileUrlResponseDto = {
  /** A short-lived link. */
  "url": string;
};

export type WithdrawOfferDto = {
  /** Kept on the offer for the file. Never sent to the candidate. */
  "reason": string;
};

export type DeclineOfferDto = {
  "reason": string;
};

export type OfferConversionResponseDto = {
  "employeeId": string;
  /** Issued by the tenant’s counter. */
  "employeeNumber": string;
  /** Raised from the onboarding pack. An accepted offer becomes a person to onboard. */
  "onboardingTasksCreated": number;
};

export type PublicSalaryRangeResponseDto = {
  /** Integer minor units. */
  "min": number;
  "max": number;
  "currency": string;
};

export type PublicJobViewResponseDto = {
  "token": string;
  "title": string;
  "companyName"?: string;
  "description": string;
  "requirements"?: string;
  "location"?: string;
  "workMode": "on_site" | "hybrid" | "remote";
  "closingDate": string | null;
  /** Only when the employer opted in. */
  "salaryRange"?: PublicSalaryRangeResponseDto;
};

export type ResumeUploadDto = {
  "filename": string;
  /** PDF or Word only. A careers form is not a general-purpose file host. */
  "contentType": string;
};

export type ResumeUploadResponseDto = {
  "uploadUrl": string;
  /** The one storage key the API does return, and deliberately: the applicant has to send it back on apply to claim the file. It is a one-shot slot this endpoint issued, the content type is signed into the URL, and apply refuses any key outside this posting’s prefix — so a key the caller invented cannot attach a file from somewhere else. */
  "key": string;
  "expiresInSeconds": number;
  /** Signed into the URL. An upload omitting them is rejected by storage. */
  "requiredHeaders": Record<string, unknown>;
};

export type ApplyToJobDto = {
  "firstName": string;
  "lastName": string;
  "email": string;
  "phone"?: string;
  "location"?: string;
  "linkedInUrl"?: string;
  /** Storage key of a CV uploaded through a presigned URL beforehand. */
  "resumeKey"?: string;
  "coverLetter"?: string;
};

export type ApplicationReceivedResponseDto = {
  /** Deliberately says nothing else. Whether the posting exists, whether the candidate already applied, and whether the email is known are all disclosures an unauthenticated caller should not be able to probe for. */
  "received": boolean;
};

export type CareersBoardLinkResponseDto = {
  /** Null when the company has no careers page. The public URL is /public/careers/{boardToken}. */
  "boardToken": string | null;
};

export type PublicCareersJobResponseDto = {
  /** The posting token — view with GET /public/jobs/{token}. */
  "token": string;
  "title": string;
  "location"?: string;
  "closingDate": string | null;
};

export type PublicCareersListingResponseDto = {
  "companyName"?: string;
  "jobs": PublicCareersJobResponseDto[];
};

export type OfferLetterMergeFieldDto = {
  "field": string;
  "description": string;
};

export type OfferLetterSettingsResponseDto = {
  "companyId": string | null;
  "inherited": boolean;
  "title": string;
  /** Paragraphs separated by blank lines, with {{merge.fields}}. */
  "body": string;
  /** Bumped whenever the wording changes. */
  "version": number;
  "updatedAt": string | null;
  "mergeFields": OfferLetterMergeFieldDto[];
};

export type UpdateOfferLetterSettingsDto = {
  "title"?: string;
  /** Paragraphs separated by blank lines, with {{merge.fields}}. */
  "body"?: string;
};

export type OfferCompanyDto = {
  "name": string;
  "brandColor": string;
  "wordmark": string;
};

export type OfferLetterTextDto = {
  "title": string;
  "paragraphs": string[];
  /** What the candidate signs under. */
  "acceptance": string;
};

export type OfferPublicViewDto = {
  "company": OfferCompanyDto;
  "candidateName": string;
  "jobTitle": string;
  "salary": string;
  "startDate": string;
  "expiresOn": string | null;
  "status": "open" | "accepted" | "declined" | "expired" | "withdrawn";
  "letter": OfferLetterTextDto | null;
  "acceptedAt": string | null;
  "signedName": string | null;
};

export type AcceptOfferOnlineDto = {
  /** Their full name, typed. */
  "typedName": string;
  /** The drawn signature, as a PNG data URL. */
  "signature": string;
  /** They read the letter and accept it. */
  "consent": boolean;
};

export type NextOfKinDto = {
  "name": string;
  "relationship": string;
  "phone": string;
  "address"?: string;
};

export type DependantDto = {
  "name": string;
  "relationship": string;
  "dateOfBirth"?: string;
};

export type BankDetailsDto = {
  /** Must operate in the company country */
  "bankListId": string;
  "accountNumber": string;
  "accountName": string;
  "branchCode"?: string;
};

export type StatutoryIdDto = {
  /** Validated against the company country */
  "scheme": string;
  "identifier": string;
};

export type VoluntaryPensionDto = {
  /** Employee rate, percent of pensionable pay. */
  "eeRate": number;
  /** Employer rate, percent of pensionable pay. */
  "erRate"?: number;
};

export type StartingPayDto = {
  /** Gross pay in INTEGER MINOR UNITS (kobo/pesewas/cents) — 45000000 is 450,000.00. */
  "grossAmount": number;
  "basis"?: "monthly" | "annual";
  /** The pay structure that splits it. Left out: the grade’s, or the company default. */
  "payStructureId"?: string;
};

export type CreateEmployeeDto = {
  "firstName": string;
  /** The enrolment number a biometric terminal knows this person by. Separate from the employee number: terminals number enrolments from 1 and a site that has run ZKTeco for years already has those assigned. Required for device attendance to match. */
  "biometricId"?: string;
  "middleName"?: string;
  "lastName": string;
  "workEmail": string;
  "phone": string;
  "personalEmail"?: string;
  "alternatePhone"?: string;
  /** Business date, YYYY-MM-DD */
  "dateOfBirth"?: string;
  "gender"?: "male" | "female" | "other" | "undisclosed";
  "maritalStatus"?: "single" | "married" | "divorced" | "widowed" | "undisclosed";
  "nationality"?: string;
  "stateOfOrigin"?: string;
  "residentialAddress"?: string;
  "nextOfKin"?: NextOfKinDto;
  "dependants"?: DependantDto[];
  "branchId": string;
  /** Defaults to the designation's department. Required only when the designation has none. */
  "departmentId"?: string;
  "designationId": string;
  "gradeId": string;
  /** Reporting manager */
  "managerId"?: string;
  /** Links a self-service login. Required before this employee can approve anything — an employee with no user account has no way to act. */
  "userId"?: string;
  "employmentType": "full_time" | "part_time" | "contract" | "intern" | "nysc" | "consultant";
  /** Business date, YYYY-MM-DD */
  "hireDate": string;
  "probationEndDate"?: string;
  "confirmationDate"?: string;
  "workLocation"?: "onsite" | "remote" | "hybrid";
  /** Defaults to "pending" — someone who has not started must not reach a payroll run. */
  "status"?: "pending" | "active" | "on_leave" | "suspended" | "exited";
  "bank"?: BankDetailsDto;
  "statutoryIds"?: StatutoryIdDto[];
  /** Nigeria remits PAYE per state of residence. */
  "taxState"?: string;
  /** Annual rent in INTEGER MINOR UNITS. Feeds Nigerian rent relief. */
  "annualRentPaid"?: number;
  "taxExempt"?: boolean;
  "pensionExempt"?: boolean;
  /** Nigeria: not charged NHF. */
  "nhfExempt"?: boolean;
  /** Voluntary pension on top of the statutory rate. Null removes it. */
  "voluntaryPension"?: VoluntaryPensionDto | null;
  "customFields"?: Record<string, unknown>;
  /** Their starting salary, recorded from the hire date. Needs employee:read_sensitive. Only when adding someone; later changes go through their compensation. */
  "startingPay"?: StartingPayDto;
};

export type NextOfKinResponseDto = {
  "name": string;
  "relationship": string;
  "phone": string;
  "address"?: string;
};

export type DependantResponseDto = {
  "name": string;
  "relationship": string;
  /** ISO date, YYYY-MM-DD. */
  "dateOfBirth"?: string;
};

export type BankDetailsResponseDto = {
  "bankListId": string;
  "accountNumber": string;
  "accountName": string;
  "branchCode"?: string;
  /** The organisation's name for the bank. On a single employee's read. */
  "bankName"?: string;
};

export type StatutoryIdResponseDto = {
  /** The scheme this identifier belongs to, e.g. PENSION, NHF, SSNIT, NSSF. */
  "scheme": string;
  "identifier": string;
};

export type VoluntaryPensionResponseDto = {
  "eeRate": number;
  "erRate": number;
};

export type EmployeeResponseDto = {
  "_id": string;
  /** The legal entity this employee belongs to. */
  "companyId": string;
  /** Issued from the company sequence. */
  "employeeNumber": string;
  /** The enrolment number a biometric terminal knows this person by. */
  "biometricId": string | null;
  /** The linked login, when employee self-service is enabled. Null when it is not. */
  "userId": string | null;
  "status": "pending" | "active" | "on_leave" | "suspended" | "exited";
  "firstName": string;
  "middleName"?: string;
  "lastName": string;
  /** Sensitive — omitted without employee:read_sensitive. */
  "dateOfBirth"?: string;
  "gender": "male" | "female" | "other" | "undisclosed";
  "maritalStatus": string;
  "nationality"?: string;
  "stateOfOrigin"?: string;
  "personalEmail"?: string;
  "workEmail": string;
  "phone": string;
  "alternatePhone"?: string;
  "residentialAddress"?: string;
  "nextOfKin"?: NextOfKinResponseDto | null;
  "dependants": DependantResponseDto[];
  "branchId": string;
  "departmentId": string;
  "designationId": string;
  "gradeId": string;
  /** The employee this person reports to. Null at the top of the reporting line. */
  "managerId": string | null;
  "employmentType": "full_time" | "part_time" | "contract" | "intern" | "nysc" | "consultant";
  /** ISO date, YYYY-MM-DD. */
  "hireDate": string;
  "probationEndDate"?: string;
  "confirmationDate"?: string;
  "exitDate"?: string;
  "workLocation": "onsite" | "remote" | "hybrid";
  /** The CURRENT compensation record. Payroll resolves the record effective on the period end date rather than following this pointer, which is a convenience for reads. */
  "compensationId": string | null;
  /** Sensitive. Absent means the caller is not entitled, not that none is on file. */
  "bank"?: BankDetailsResponseDto | null;
  /** Sensitive. Absent means the caller is not entitled, not that none are recorded. */
  "statutoryIds"?: StatutoryIdResponseDto[];
  /** Annual rent paid, in INTEGER MINOR UNITS (kobo, pesewas, cents). Feeds Nigerian rent relief. Sensitive. Absent means the caller is not entitled; null means none was recorded and a recorded zero means no relief applies — three different things. */
  "annualRentPaid"?: number | null;
  /** False excludes this employee from payroll runs. */
  "isPayrollActive": boolean;
  "taxExempt": boolean;
  "taxExemptReason"?: string;
  "pensionExempt": boolean;
  "nhfExempt": boolean;
  /** Voluntary pension rates, percent of pensionable pay. Null when none. */
  "voluntaryPension": VoluntaryPensionResponseDto | null;
  /** State of residence. Nigeria remits PAYE to the tax authority of this state, so it is payroll-relevant rather than demographic. */
  "taxState"?: string;
  "createdAt": string;
  "updatedAt": string;
};

export type EmployeeImportTemplateUrlDto = {
  /** A short-lived link to the xlsx template. */
  "url": string;
};

export type EmployeeImportSlotDto = {
  "filename": string;
  "contentType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" | "text/csv";
};

export type EmployeeImportSlotResponseDto = {
  /** PUT the file here. */
  "uploadUrl": string;
  /** Send this back as storageKey to check or import it. */
  "key": string;
  "requiredHeaders": Record<string, unknown>;
};

export type InspectImportDto = {
  /** The key an upload slot returned, once the file is uploaded to it. */
  "storageKey": string;
  "filename": string;
};

export type ImportFileColumnDto = {
  /** The column's position in the file, from 0. */
  "index": number;
  /** The header as written in the file. */
  "header": string;
  /** The field it fills when matched by name; null when nothing matches. */
  "suggested": string | null;
  /** Up to three values. */
  "samples": string[];
};

export type ImportFieldDto = {
  "key": string;
  "header": string;
  /** The file must have a column for it. */
  "required": boolean;
  "notes": string;
};

export type ImportColumnsResponseDto = {
  "headers": ImportFileColumnDto[];
  "columns": ImportFieldDto[];
  /** Rows below the header. */
  "rows": number;
};

export type ImportTemplateDto = {
  /** The header row to start a bulk-import spreadsheet from. */
  "header": string;
};

export type ImportEmployeesDto = {
  /** Raw CSV content, instead of an uploaded file. Org structure is referenced by CODE (branchCode, departmentCode, designationCode, gradeCode) — an administrator preparing a spreadsheet knows codes, not ObjectIds. Headers may be the field names or the template’s labels ("First name"). */
  "csv"?: string;
  /** The key an upload slot returned, once the file is uploaded to it. */
  "storageKey"?: string;
  /** The uploaded file’s name; its extension says how to read it. */
  "filename"?: string;
  /** Validate everything and create nothing. Makes a large import safe to attempt. */
  "dryRun"?: boolean;
  /** The file's headers, as written, to the field each fills (from POST /employees/import/columns). Overrides matching by name; an empty value ignores the column. */
  "mapping"?: Record<string, unknown>;
  /** Give migrated staff their self-service login straight away, on their work email. Off by default: logins usually go out when the organisation is ready. Needs employee:update and user:create. */
  "sendLogins"?: boolean;
};

export type ImportRowErrorDto = {
  /** 1-based and counts the header row, so it matches what the user sees in a spreadsheet. */
  "row": number;
  "employeeReference": string;
  "errors": string[];
};

export type ImportResultDto = {
  "totalRows": number;
  /** Zero when dryRun is true — nothing is written. */
  "created": number;
  /** Of those created, how many were existing staff (the migrated column): active, with no onboarding checklist and no invite. */
  "migrated": number;
  "failed": number;
  /** Of the migrated, how many were given a login (with sendLogins). */
  "loginsSent": number;
  /** True means the file was validated and nothing was created. */
  "dryRun": boolean;
  "errors": ImportRowErrorDto[];
};

export type EmployeeIdSchemeResponseDto = {
  "scheme": string;
  "label": string;
  "notes": string;
  "format": string | null;
  /** A regular expression source, for checking as it is typed. Null when any value goes. */
  "pattern": string | null;
  /** Asked of every new hire in this country. */
  "required": boolean;
};

export type ResolveBankDto = {
  "bankListId": string;
  "accountNumber": string;
};

export type BankLookupResponseDto = {
  "status": "verified" | "not_found" | "unavailable";
  /** When verified. */
  "accountName": string | null;
  /** When unavailable: why the name has to be typed. */
  "reason": string | null;
};

export type BulkEmployeeLoginsDto = {
  /** Which of their emails the login is made on. `personal` needs one on record. */
  "loginEmail"?: "work" | "personal";
  /** Who to give a login. Left out: every active or on-leave employee here who has none — staff imported as migrated, typically. */
  "employeeIds"?: string[];
};

export type BulkLoginSkippedDto = {
  "employeeId": string;
  "employeeNumber": string;
  "name": string;
  "reason": string;
};

export type BulkLoginsResponseDto = {
  /** People looked at. */
  "total": number;
  /** New account made and invited. */
  "invited": number;
  /** Existing account nobody had set up: linked and re-invited. */
  "reinvited": number;
  /** Existing, set-up account linked. */
  "linked": number;
  /** Had a login already. */
  "alreadyLinked": number;
  /** Nothing done, and why. */
  "skipped": BulkLoginSkippedDto[];
};

export type EmployeeCountsResponseDto = {
  "active": number;
  "pending": number;
  "on_leave": number;
  "suspended": number;
  "exited": number;
  /** Everyone on file, whatever their status. */
  "all": number;
};

export type CompensationResponseDto = {
  "_id": string;
  "companyId": string;
  "employeeId": string;
  /** Gross pay in INTEGER MINOR UNITS (kobo, pesewas, cents) — never a decimal. 45000000 with currency NGN and basis monthly is ₦450,000.00 a month. */
  "grossAmount": number;
  /** ISO 4217. Set by the employing company. */
  "currency": string;
  "basis": "monthly" | "annual";
  /** The pay structure that splits gross into components. Null uses the company default. */
  "payStructureId": string | null;
  /** ISO date. The day this record takes effect. */
  "effectiveFrom": string;
  /** Null on the record currently in force; otherwise the day before the next one. */
  "effectiveTo": string | null;
  "reason": "hire" | "promotion" | "annual_review" | "adjustment" | "demotion" | "correction";
  "note"?: string;
  /** The approval that authorized this change, when one was required. */
  "workflowInstanceId": string | null;
  /** Where this sits against the grade band. Above-band pay is RECORDED, not refused — the exception is visible rather than blocked. */
  "bandPosition": "below" | "within" | "above";
  "createdAt": string;
};

export type SetCompensationDto = {
  /** Gross pay in INTEGER MINOR UNITS (kobo/pesewas/cents) — 45000000 is 450,000.00. Never a decimal. */
  "grossAmount": number;
  "currency": string;
  /** How grossAmount is expressed. Grade bands are monthly; an annual figure is normalized before the band check. */
  "basis"?: "monthly" | "annual";
  /** Business date. Payroll resolves the record in force on the period end date, so this decides which salary a given payslip uses. */
  "effectiveFrom": string;
  "reason": "hire" | "promotion" | "annual_review" | "adjustment" | "demotion" | "correction";
  "note"?: string;
  "payStructureId"?: string;
};

export type EmployeeLoginDto = {
  /** Which of their emails the login is made on. `personal` needs one on record. */
  "loginEmail"?: "work" | "personal";
};

export type EmployeeLoginResponseDto = {
  /** `invited`: an account was made on their work email, linked, and invited. `reinvited`: an existing account nobody had set up was linked and sent a fresh invite. `linked`: an existing, set-up account was linked. `already_linked`: they had a login already; nothing changed. `skipped`: nothing was done — see `reason`. */
  "outcome": "invited" | "reinvited" | "linked" | "already_linked" | "skipped";
  "email": string;
  "userId": string | null;
  "reason": string | null;
};

export type UpdateEmployeeDto = {
  "firstName"?: string;
  /** The enrolment number a biometric terminal knows this person by. Separate from the employee number: terminals number enrolments from 1 and a site that has run ZKTeco for years already has those assigned. Required for device attendance to match. */
  "biometricId"?: string;
  "middleName"?: string;
  "lastName"?: string;
  "workEmail"?: string;
  "phone"?: string;
  "personalEmail"?: string;
  "alternatePhone"?: string;
  /** Business date, YYYY-MM-DD */
  "dateOfBirth"?: string;
  "gender"?: "male" | "female" | "other" | "undisclosed";
  "maritalStatus"?: "single" | "married" | "divorced" | "widowed" | "undisclosed";
  "nationality"?: string;
  "stateOfOrigin"?: string;
  "residentialAddress"?: string;
  "nextOfKin"?: NextOfKinDto;
  "dependants"?: DependantDto[];
  "branchId"?: string;
  /** Defaults to the designation's department. Required only when the designation has none. */
  "departmentId"?: string;
  "designationId"?: string;
  "gradeId"?: string;
  /** Reporting manager */
  "managerId"?: string;
  /** Links a self-service login. Required before this employee can approve anything — an employee with no user account has no way to act. */
  "userId"?: string;
  "employmentType"?: "full_time" | "part_time" | "contract" | "intern" | "nysc" | "consultant";
  "probationEndDate"?: string;
  "confirmationDate"?: string;
  "workLocation"?: "onsite" | "remote" | "hybrid";
  /** Defaults to "pending" — someone who has not started must not reach a payroll run. */
  "status"?: "pending" | "active" | "on_leave" | "suspended" | "exited";
  "bank"?: BankDetailsDto;
  "statutoryIds"?: StatutoryIdDto[];
  /** Nigeria remits PAYE per state of residence. */
  "taxState"?: string;
  /** Annual rent in INTEGER MINOR UNITS. Feeds Nigerian rent relief. */
  "annualRentPaid"?: number;
  "taxExempt"?: boolean;
  "pensionExempt"?: boolean;
  /** Nigeria: not charged NHF. */
  "nhfExempt"?: boolean;
  /** Voluntary pension on top of the statutory rate. Null removes it. */
  "voluntaryPension"?: VoluntaryPensionDto | null;
  "customFields"?: Record<string, unknown>;
  "exitDate"?: string;
  "isPayrollActive"?: boolean;
};

export type GeofenceDto = {
  /** Decimal degrees */
  "latitude": number;
  "longitude": number;
  /** Metres. Wide enough to absorb GPS drift, narrow enough to mean something. */
  "radiusMeters"?: number;
};

export type CreateBranchDto = {
  "name": string;
  /** Unique within the company */
  "code": string;
  "address"?: string;
  "city"?: string;
  /** Payroll-relevant in Nigeria, where PAYE is remitted per state. */
  "state"?: string;
  /** Overrides the company timezone. */
  "timezone"?: string;
  /** Required for mobile clock-in at this branch. */
  "geofence"?: GeofenceDto;
  "isHeadOffice"?: boolean;
};

export type BranchResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "name": string;
  /** Unique within the company. Used in CSV imports. */
  "code": string;
  "address"?: string;
  "city"?: string;
  /** State or region. Feeds Nigerian PAYE remittance, which is by state. */
  "state"?: string;
  /** IANA zone. Attendance days are resolved in this zone, so a punch just before midnight lands on the day the employee actually worked. */
  "timezone"?: string;
  /** Null means mobile clock-in is not geofenced at this branch. */
  "geofence"?: GeofenceResponseDto | null;
  "isHeadOffice": boolean;
  "status": "active" | "inactive";
};

export type UpdateBranchDto = {
  "name"?: string;
  /** Unique within the company */
  "code"?: string;
  "address"?: string;
  "city"?: string;
  /** Payroll-relevant in Nigeria, where PAYE is remitted per state. */
  "state"?: string;
  /** Overrides the company timezone. */
  "timezone"?: string;
  /** Required for mobile clock-in at this branch. */
  "geofence"?: GeofenceDto;
  "isHeadOffice"?: boolean;
  "status"?: "active" | "inactive";
};

export type CreateDepartmentDto = {
  "name": string;
  /** Unique within the company */
  "code": string;
  /** Parent department. Must belong to the same company. */
  "parentDepartmentId"?: string;
  /** Resolves the department_head approver type in workflows. */
  "headEmployeeId"?: string;
  /** Maps payroll cost onto the GL. */
  "costCenter"?: string;
  "description"?: string;
};

export type DepartmentResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "name": string;
  /** Unique within the company. Used in CSV imports. */
  "code": string;
  /** Null at the top of the hierarchy. */
  "parentDepartmentId": string | null;
  /** The department head. Resolves the department_head approver in workflow definitions, so an unset head means those approvals cannot route. */
  "headEmployeeId": string | null;
  "costCenter"?: string;
  "description"?: string;
  "status": "active" | "inactive";
};

export type DepartmentNodeDto = {
  "id": string;
  "name": string;
  "code": string;
  "headEmployeeId": string | null;
  "costCenter"?: string;
  /** Empty at a leaf. */
  "children": DepartmentNodeDto[];
};

export type UpdateDepartmentDto = {
  "name"?: string;
  /** Unique within the company */
  "code"?: string;
  /** Parent department. Must belong to the same company. */
  "parentDepartmentId"?: string;
  /** Resolves the department_head approver type in workflows. */
  "headEmployeeId"?: string;
  /** Maps payroll cost onto the GL. */
  "costCenter"?: string;
  "description"?: string;
  "status"?: "active" | "inactive";
};

export type CreateDesignationDto = {
  "title": string;
  /** Unique within the company */
  "code": string;
  "departmentId"?: string;
  /** Default grade for holders; drives salary-band validation on hire. */
  "gradeId"?: string;
  "jobDescription"?: string;
};

export type DesignationResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "title": string;
  /** Unique within the company. */
  "code": string;
  /** The department this job title normally sits in. Null when it spans several. */
  "departmentId": string | null;
  /** The grade this title normally carries. A convenience for hiring — the grade on the EMPLOYEE is what pay and leave entitlement resolve against. */
  "gradeId": string | null;
  "jobDescription"?: string;
  "status": "active" | "inactive";
};

export type UpdateDesignationDto = {
  "title"?: string;
  /** Unique within the company */
  "code"?: string;
  "departmentId"?: string;
  /** Default grade for holders; drives salary-band validation on hire. */
  "gradeId"?: string;
  "jobDescription"?: string;
  "status"?: "active" | "inactive";
};

export type SalaryBandDto = {
  /** INTEGER MINOR UNITS (kobo/pesewas/cents) — 30000000 is 300,000.00. Never a decimal. */
  "min": number;
  "mid": number;
  "max": number;
  "currency": string;
};

export type CreateGradeDto = {
  "name": string;
  /** Unique within the company */
  "code": string;
  /** Higher is more senior. Unique per company — ties make grade_above approver resolution ambiguous. */
  "level": number;
  "salaryBand": SalaryBandDto;
  /** Leave days above the policy baseline. */
  "additionalLeaveDays"?: number;
  "description"?: string;
};

export type SalaryBandResponseDto = {
  /** Minimum, in integer minor units. */
  "min": number;
  /** Midpoint — the reference for compa-ratio. */
  "mid": number;
  /** Maximum, in integer minor units. */
  "max": number;
  /** ISO 4217. */
  "currency": string;
};

export type GradeResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "name": string;
  /** Unique within the company. */
  "code": string;
  /** Seniority. Higher is more senior, and workflow rules compare against it. */
  "level": number;
  "salaryBand": SalaryBandResponseDto;
  /** The pay structure new hires at this grade default to. Null uses the company one. */
  "defaultPayStructureId": string | null;
  /** Leave days this grade earns ON TOP of the leave policy allowance. */
  "additionalLeaveDays": number;
  "description"?: string;
  "status": "active" | "inactive";
};

export type UpdateGradeDto = {
  "name"?: string;
  /** Unique within the company */
  "code"?: string;
  /** Higher is more senior. Unique per company — ties make grade_above approver resolution ambiguous. */
  "level"?: number;
  "salaryBand"?: SalaryBandDto;
  /** Leave days above the policy baseline. */
  "additionalLeaveDays"?: number;
  "description"?: string;
  "status"?: "active" | "inactive";
};

export type CreateUserDto = {
  "email": string;
  /** Optional. Every new user is emailed a link to set their own password; one set here works only for their first sign-in, where they must replace it with their own. */
  "password"?: string;
  "firstName": string;
  "lastName": string;
  "roleIds"?: string[];
  /** Legal entities this user may act on. */
  "companyIds"?: string[];
  /** Used when no x-company-id header is sent. */
  "defaultCompanyId"?: string;
  /** Grants access to every company in the tenant, bypassing companyIds. Reserve for group-level roles. */
  "hasAllCompanyAccess"?: boolean;
};

export type UserResponseDto = {
  "_id": string;
  "email": string;
  "firstName": string;
  "lastName": string;
  /** Roles held. Permissions are the union of these roles. */
  "roleIds": string[];
  /** Companies this user may act in. Ignore when hasAllCompanyAccess is true — it is not the limit in that case. */
  "companyIds": string[];
  /** Selected when no x-company-id header is sent. */
  "defaultCompanyId": string | null;
  /** Grants every company in the tenant, including ones created later. */
  "hasAllCompanyAccess": boolean;
  /** False blocks login without deleting history. */
  "isActive": boolean;
  /** Invited and not yet set up — never signed in or used a set-password link. Only then can the invite be resent. */
  "invitePending": boolean;
  /** Last sign-in with a password. Null if they never have. */
  "lastLoginAt": string | null;
  "createdAt": string;
  "updatedAt": string;
};

export type UpdateUserDto = {
  "email"?: string;
  "firstName"?: string;
  "lastName"?: string;
  "roleIds"?: string[];
  /** Legal entities this user may act on. */
  "companyIds"?: string[];
  /** Used when no x-company-id header is sent. */
  "defaultCompanyId"?: string;
  /** Grants access to every company in the tenant, bypassing companyIds. Reserve for group-level roles. */
  "hasAllCompanyAccess"?: boolean;
};

export type SessionUserDto = {
  "id": string;
  "email": string;
  "firstName": string;
  "lastName": string;
  "tenantId": string;
  "roleIds": string[];
};

export type TokenPairDto = {
  /** Short-lived. Send as `Authorization: Bearer <token>`. */
  "accessToken": string;
  /** Long-lived and SINGLE USE — refreshing rotates it. */
  "refreshToken": string;
  "user": SessionUserDto;
};

export type MfaChallengeDto = {
  /** Always true, and present only on this shape. Use it to tell the two apart. */
  "mfaRequired": boolean;
  /** Send this back with the code. Single use. */
  "challengeToken": string;
  "expiresInSeconds": number;
};

export type PasswordChangeChallengeDto = {
  "passwordChangeRequired": true;
  /** Present to POST /auth/password/first-change. */
  "challengeToken": string;
  "expiresInSeconds": number;
};

export type LoginDto = {
  /** Work email. The tenant is resolved from it — a client never sends a tenant id to log in. */
  "email": string;
  "password": string;
};

export type FirstPasswordChangeDto = {
  /** From the login response. */
  "challengeToken": string;
  "newPassword": string;
};

export type VerifyMfaDto = {
  /** From the login response. */
  "challengeToken": string;
  /** A six-digit authenticator code, or a recovery code. */
  "code": string;
};

export type RefreshTokenDto = {
  /** SINGLE USE — refreshing rotates it and the old one stops working, so a client must store the new token from every refresh. Sessions are single-device: signing in elsewhere retires this one. */
  "refreshToken": string;
};

export type ForgotPasswordDto = {
  "email": string;
};

export type ResetPasswordDto = {
  /** The token from the emailed link. */
  "token": string;
  "password": string;
};

export type AuthContextDto = {
  "userId": string;
  /** The customer this login belongs to. */
  "tenantId": string;
  "email": string;
  "roleIds": string[];
  "sessionId"?: string;
  /** Resolved permission set. `*:*` grants everything. Absent on routes with no permission requirement — treat absent as no access, never as unrestricted. */
  "permissions"?: string[];
};

export type MfaStatusDto = {
  "enabled": boolean;
  "enabledAt": string | null;
  /** How many recovery codes remain unused. */
  "recoveryCodesRemaining": number;
};

export type MfaSetupDto = {
  /** Base32 secret, for manual entry when a camera is unavailable. */
  "secret": string;
  /** Render as a QR code. Contains the secret — treat it as one. */
  "otpauthUrl": string;
};

export type MfaCodeDto = {
  "code": string;
};

export type MfaEnabledDto = {
  /** Shown ONCE and stored only as hashes. Each is a single-use bypass of the second factor — tell the user to save them somewhere other than the phone holding the app. */
  "recoveryCodes": string[];
};

export type ClearanceItemResponseDto = {
  "item": string;
  /** The function that has to sign this off. */
  "owner": string;
  "cleared": boolean;
  "clearedBy": string | null;
  "clearedAt": string | null;
  "note"?: string;
  /** Set on items added from the asset register. Returning the asset clears the item. */
  "assetId"?: string | null;
};

export type LifecycleEventResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "employeeId": string;
  "type": "onboarding" | "confirmation" | "transfer" | "promotion" | "suspension" | "reinstatement" | "exit";
  /** When the change takes effect — not when it was recorded. */
  "effectiveDate": string;
  /** The employment state before this event. */
  "previous": Record<string, unknown>;
  /** The employment state after it. Kept so the change is readable on its own. */
  "next": Record<string, unknown>;
  "reason"?: string;
  "exitType"?: "resignation" | "termination" | "retirement" | "end_of_contract" | "death" | "abandonment" | null;
  /** Populated on exit. An exit is not finished until every item is cleared. */
  "clearanceChecklist": ClearanceItemResponseDto[];
  "exitInterview"?: Record<string, unknown> | null;
  /** The run that paid the final settlement, once one exists. */
  "finalSettlementPayrollRunId": string | null;
  "workflowInstanceId": string | null;
  "initiatedBy": string | null;
};

export type OnboardDto = {
  /** Business date the change takes effect */
  "effectiveDate": string;
  "reason"?: string;
  /** User the generated onboarding tasks are assigned to. */
  "taskAssigneeId"?: string;
  /** Give them a self-service login and email the invite. On unless false. A clash (the email belongs to another organization, or to another employee) does not stop onboarding; the result says what happened. */
  "sendInvite"?: boolean;
  /** Which of their emails the login is made on. `personal` needs one on record. */
  "loginEmail"?: "work" | "personal";
};

export type OnboardingResultResponseDto = {
  "event": LifecycleEventResponseDto;
  /** Tasks created from the onboarding pack. Read them from /lifecycle/tasks. */
  "tasksCreated": number;
  /** Their self-service login. Null when `sendInvite` was false. */
  "login": EmployeeLoginResponseDto | null;
};

export type ConfirmDto = {
  /** Business date the change takes effect */
  "effectiveDate": string;
  "reason"?: string;
};

export type TransferDto = {
  /** Business date the change takes effect */
  "effectiveDate": string;
  "reason"?: string;
  "branchId"?: string;
  "departmentId"?: string;
};

export type PromoteDto = {
  /** Business date the change takes effect */
  "effectiveDate": string;
  "reason"?: string;
  "gradeId"?: string;
  "designationId"?: string;
  /** New gross in INTEGER MINOR UNITS. Recorded as an effective-dated compensation change, band-checked against the NEW grade. */
  "newGrossAmount"?: number;
  "currency"?: string;
  "basis"?: "monthly" | "annual";
};

export type SuspendDto = {
  /** Business date the change takes effect */
  "effectiveDate": string;
  "reason"?: string;
  /** Whether pay continues during suspension. Defaults to true — stopping someone's salary should be an explicit decision, not a side effect. */
  "withPay"?: boolean;
};

export type ReinstateDto = {
  /** Business date the change takes effect */
  "effectiveDate": string;
  "reason"?: string;
};

export type ClearanceItemDto = {
  "item": string;
  "owner": string;
};

export type ExitDto = {
  /** Business date the change takes effect */
  "effectiveDate": string;
  "reason"?: string;
  "exitType": "resignation" | "termination" | "retirement" | "end_of_contract" | "death" | "abandonment";
  /** Manager to reassign this employee's reports to. Required if they still manage anyone active. */
  "reassignReportsTo"?: string;
  "clearanceItems"?: ClearanceItemDto[];
  /** Storage keys for resignation letters etc. */
  "attachmentKeys"?: string[];
};

export type OnboardingTaskResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "employeeId": string;
  "title": string;
  "description"?: string;
  "kind": "onboarding" | "offboarding";
  /** Who does it: a department’s name, "Line manager", or a label on older tasks. */
  "owner": string;
  /** The owning department, if one. */
  "ownerDepartmentId": string | null;
  /** Null on one-off tasks. */
  "templateItemId": string | null;
  /** On "return this asset" tasks. Taking the asset back completes the task. */
  "assetId": string | null;
  /** The exit an offboarding task is for. */
  "lifecycleEventId": string | null;
  "assigneeId": string | null;
  "dueDate"?: string;
  "status": "pending" | "in_progress" | "completed" | "skipped";
  "completedBy": string | null;
  "completedAt": string | null;
  "note"?: string;
};

export type AddTaskDto = {
  "kind": "onboarding" | "offboarding";
  "title": string;
  "description"?: string;
  /** A department of this company, or the employee's line manager. */
  "ownerType": "department" | "line_manager";
  /** For a department owner. */
  "ownerDepartmentId"?: string;
  /** Omit to give it to the owner: the department's head, or their line manager. */
  "assigneeId"?: string;
  "dueDate"?: string;
};

export type CompleteTaskDto = {
  "note"?: string;
};

export type SkipTaskDto = {
  "note"?: string;
};

export type UpdateTaskDto = {
  /** null to unassign. */
  "assigneeId"?: string | null;
  "dueDate"?: string;
};

export type ClearItemDto = {
  /** Index of the item in the clearance checklist */
  "itemIndex": number;
  "note"?: string;
};

export type OwnerCompanyDto = {
  "_id": string;
  "name": string;
};

export type OwnerDepartmentDto = {
  "code": string;
  /** The most common name for the code. */
  "name": string;
  /** Companies with an active department of this code. */
  "companyIds": string[];
};

export type ChecklistOwnersResponseDto = {
  "companies": OwnerCompanyDto[];
  /** Department codes in use, by code. */
  "departments": OwnerDepartmentDto[];
};

export type ChecklistAudienceResponseDto = {
  "employmentTypes": ("full_time" | "part_time" | "contract" | "intern" | "nysc" | "consultant")[];
  "workLocations": ("onsite" | "remote" | "hybrid")[];
  "departmentIds": string[];
  "branchIds": string[];
};

export type ChecklistItemResponseDto = {
  "_id": string;
  "title": string;
  "description": string | null;
  /** Null on items saved before owners were departments; `owner` is then a label. */
  "ownerType": "department" | "line_manager" | null;
  "ownerDepartmentCode": string | null;
  /** What to call the owner. */
  "owner": string;
  "defaultAssigneeId": string | null;
  "dueOffsetDays": number;
  "appliesTo": ChecklistAudienceResponseDto;
};

export type ChecklistResponseDto = {
  "kind": "onboarding" | "offboarding";
  /** The company whose own checklist this is; null for the organisation's. */
  "companyId": string | null;
  /** True when a company has no checklist of its own and uses the organisation’s — `items` are then the organisation’s. */
  "inherited": boolean;
  "items": ChecklistItemResponseDto[];
  "updatedAt": string | null;
};

export type ChecklistAudienceDto = {
  "employmentTypes"?: ("full_time" | "part_time" | "contract" | "intern" | "nysc" | "consultant")[];
  "workLocations"?: ("onsite" | "remote" | "hybrid")[];
  /** Only on a company's own checklist: departments belong to one company. */
  "departmentIds"?: string[];
  /** Only on a company's own checklist: branches belong to one company. */
  "branchIds"?: string[];
};

export type ChecklistItemDto = {
  /** Keep an existing item’s id when editing; omit it for a new item. */
  "_id"?: string;
  "title": string;
  "description"?: string | null;
  /** A department (its head gets the task), or the employee's line manager. */
  "ownerType": "department" | "line_manager";
  /** The owning department's code, for `ownerType: department`. On the organisation's checklist it is resolved in each company to that company's department with the code; at least one company must have it. On a company’s own, that company must have it. */
  "ownerDepartmentCode"?: string | null;
  /** Gets the task instead of the owner, if they can access the company. */
  "defaultAssigneeId"?: string | null;
  /** Days from the start date (onboarding) or last day (offboarding). Negative is before it. */
  "dueOffsetDays"?: number;
  "appliesTo"?: ChecklistAudienceDto;
};

export type ReplaceChecklistDto = {
  /** Every item, in the order they are run. */
  "items": ChecklistItemDto[];
};

export type SubmitResignationDto = {
  /** My last working day, YYYY-MM-DD. */
  "lastWorkingDay": string;
  "reason": string;
};

export type ResignationResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "employeeId": string;
  "requestedByUserId": string;
  "lastWorkingDay": string;
  "reason": string;
  /** `accepted` means approved, with the exit still to be recorded by HR; `completed` once it has been. */
  "status": "pending" | "accepted" | "rejected" | "cancelled" | "completed";
  "workflowInstanceId": string | null;
  "acceptedAt": string | null;
  /** The exit HR recorded. */
  "exitEventId": string | null;
  /** Present on the HR list. */
  "employeeName"?: string;
};

export type AssetHolderResponseDto = {
  "employeeId": string;
  /** Looked up on read. */
  "name": string;
  "assignedAt": string;
  "dueBackAt": string | null;
};

export type AssetResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "tag": string;
  "name": string;
  "category": string;
  "make"?: string;
  "model"?: string;
  "serialNumber"?: string;
  "purchaseDate": string | null;
  /** Integer minor units. */
  "purchaseCost": number | null;
  "currency": string | null;
  "warrantyExpiry": string | null;
  "branchId": string | null;
  "condition": string;
  "status": "available" | "assigned" | "in_repair" | "lost" | "retired";
  "holder": AssetHolderResponseDto | null;
  "notes"?: string;
};

export type CreateAssetDto = {
  /** Generated when omitted. */
  "tag"?: string;
  "name": string;
  "category": "laptop" | "desktop" | "monitor" | "phone" | "tablet" | "vehicle" | "furniture" | "accessory" | "other";
  "make"?: string;
  "model"?: string;
  "serialNumber"?: string;
  "purchaseDate"?: string;
  /** Integer minor units. */
  "purchaseCost"?: number;
  /** Defaults to the company's. */
  "currency"?: string;
  "warrantyExpiry"?: string;
  "branchId"?: string;
  "condition"?: "new" | "good" | "fair" | "poor" | "damaged";
  "notes"?: string;
};

export type UpdateAssetDto = {
  /** Generated when omitted. */
  "tag"?: string;
  "name"?: string;
  "category"?: "laptop" | "desktop" | "monitor" | "phone" | "tablet" | "vehicle" | "furniture" | "accessory" | "other";
  "make"?: string;
  "model"?: string;
  "serialNumber"?: string;
  "purchaseDate"?: string;
  /** Integer minor units. */
  "purchaseCost"?: number;
  /** Defaults to the company's. */
  "currency"?: string;
  "warrantyExpiry"?: string;
  "branchId"?: string;
  "condition"?: "new" | "good" | "fair" | "poor" | "damaged";
  "notes"?: string;
};

export type AssetAssignmentResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "assetId": string;
  "employeeId": string;
  "employeeName": string;
  "assignedAt": string;
  "conditionOut": string;
  "returnedAt": string | null;
  "conditionIn": string | null;
  "note"?: string;
  /** On self-service history. */
  "assetTag"?: string;
  /** On self-service history. */
  "assetName"?: string;
};

export type AssignAssetDto = {
  "employeeId": string;
  /** As handed over. Defaults to its recorded condition. */
  "condition"?: "new" | "good" | "fair" | "poor" | "damaged";
  /** For a loan. */
  "dueBackAt"?: string;
  "note"?: string;
};

export type ReturnAssetDto = {
  /** As received back. */
  "condition": "new" | "good" | "fair" | "poor" | "damaged";
  /** Where it goes next. */
  "status"?: "available" | "in_repair" | "retired";
  "note"?: string;
};

export type SetAssetStatusDto = {
  "status": "available" | "in_repair" | "lost" | "retired";
  "note"?: string;
};

export type AssetReportResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "assetId": string;
  "assetTag": string;
  "assetName": string;
  "employeeId": string;
  "employeeName": string;
  "kind": "fault" | "damage" | "loss";
  "description": string;
  "status": "open" | "resolved";
  "resolution"?: string;
  "resolvedAt": string | null;
};

export type ResolveReportDto = {
  "resolution": string;
  /** Also move the asset, e.g. to in_repair or lost. Omit to leave it as it is. */
  "assetStatus"?: "in_repair" | "lost" | "available";
};

export type AssetRequestResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "employeeId": string;
  "employeeName": string;
  "category": string;
  "reason": string;
  "neededBy": string | null;
  "status": "pending_approval" | "approved" | "rejected" | "cancelled" | "fulfilled";
  "workflowInstanceId": string | null;
  "fulfilledAssetId": string | null;
  "fulfilledAt": string | null;
};

export type FulfilAssetRequestDto = {
  /** An available asset to hand over. */
  "assetId": string;
  "note"?: string;
};

export type MyAssetsResponseDto = {
  /** What I hold now. */
  "holding": AssetResponseDto[];
  /** What I have held before. */
  "history": AssetAssignmentResponseDto[];
};

export type ReportAssetDto = {
  "kind": "fault" | "damage" | "loss";
  "description": string;
};

export type CreateAssetRequestDto = {
  "category": "laptop" | "desktop" | "monitor" | "phone" | "tablet" | "vehicle" | "furniture" | "accessory" | "other";
  "reason": string;
  "neededBy"?: string;
};

export type LetterheadFileResponseDto = {
  "filename": string;
};

export type LetterheadSettingsResponseDto = {
  "companyId": string | null;
  /** True when a company uses the organisation's letterhead. */
  "inherited": boolean;
  /** The letterhead documents are printed onto; null for the built-in header. */
  "letterhead": LetterheadFileResponseDto | null;
  /** Space kept clear for the letterhead's header, in mm. */
  "topMm": number;
  /** Space kept clear for the letterhead's footer, in mm. */
  "bottomMm": number;
  "updatedAt": string | null;
};

export type UpdateLetterheadDto = {
  /** From POST /letterheads/upload, once uploaded. Null goes back to the built-in header. */
  "key"?: string | null;
  /** Shown in settings. */
  "filename"?: string;
  /** Space kept clear for the letterhead's header, in mm. */
  "topMm"?: number;
  /** Space kept clear for the letterhead's footer, in mm. */
  "bottomMm"?: number;
};

export type LetterheadUploadDto = {
  "filename": string;
  "contentType": string;
};

export type LetterheadUploadSlotResponseDto = {
  "uploadUrl": string;
  "key": string;
  "requiredHeaders": Record<string, unknown>;
};

export type BroadcastAudienceDto = {
  /** Empty: the sender's own company. */
  "companyIds"?: string[];
  /** Empty: every department. */
  "departmentIds"?: string[];
  /** Empty: every branch. */
  "branchIds"?: string[];
};

export type BroadcastChannelsDto = {
  "email"?: boolean;
  "push"?: boolean;
};

export type BroadcastStatsDto = {
  /** People it was sent to. */
  "recipients": number;
  /** Of those, with a login — the only ones whose reading can be seen. */
  "withLogin": number;
  "read": number;
  "acknowledged": number;
};

export type BroadcastResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "title": string;
  "body": string;
  "audience": BroadcastAudienceDto;
  "channels": BroadcastChannelsDto;
  "requiresAcknowledgement": boolean;
  "pinnedUntil": string | null;
  "status": "draft" | "scheduled" | "sending" | "sent" | "cancelled";
  "scheduledFor": string | null;
  "sentAt": string | null;
  "recipientCount": number;
  "lastRemindedAt": string | null;
  /** Once sent. */
  "stats": BroadcastStatsDto | null;
};

export type CreateBroadcastDto = {
  "title": string;
  "body": string;
  "audience"?: BroadcastAudienceDto;
  /** In-app is always on. */
  "channels"?: BroadcastChannelsDto;
  "requiresAcknowledgement"?: boolean;
  /** Pinned to the top of feeds until this date. */
  "pinnedUntil"?: string | null;
};

export type AudiencePreviewDto = {
  /** Active employees it would reach. */
  "employees": number;
  /** Of those, with a login: in-app and push. */
  "withLogin": number;
  /** Of those, with an email address. */
  "withEmail": number;
};

export type UpdateBroadcastDto = {
  "title"?: string;
  "body"?: string;
  "audience"?: BroadcastAudienceDto;
  /** In-app is always on. */
  "channels"?: BroadcastChannelsDto;
  "requiresAcknowledgement"?: boolean;
  /** Pinned to the top of feeds until this date. */
  "pinnedUntil"?: string | null;
};

export type SendBroadcastDto = {
  /** Send at this time. Omit to send now. */
  "at"?: string;
};

export type BroadcastRecipientResponseDto = {
  "employeeId": string;
  "name": string;
  "email": string | null;
  "hasLogin": boolean;
  "readAt": string | null;
  "acknowledgedAt": string | null;
};

export type MyBroadcastResponseDto = {
  "_id": string;
  "title": string;
  "body": string;
  "sentAt": string;
  "pinned": boolean;
  "requiresAcknowledgement": boolean;
  "readAt": string | null;
  "acknowledgedAt": string | null;
  /** The sender's name. */
  "from": string;
};

export type UnreadCountDto = {
  "unread": number;
  /** Of those needing acknowledgement, not yet acknowledged. */
  "toAcknowledge": number;
};

export type MergeFieldDto = {
  "field": string;
  "description": string;
};

export type NewHireSettingsResponseDto = {
  "companyId": string | null;
  "inherited": boolean;
  "requiredSections": ("personal" | "contact" | "emergency" | "bank" | "identity" | "documents" | "guarantors")[];
  "guarantorsRequired": number;
  "guarantorMethods": ("esign" | "paper")[];
  "guarantorIdRequired": boolean;
  "guarantorPhotoRequired": boolean;
  "linkLifetimeDays": number;
  "guarantorFormTitle": string;
  "guarantorFormBody": string;
  "formVersion": number;
  "updatedAt": string | null;
  "mergeFields": MergeFieldDto[];
};

export type UpdateNewHireSettingsDto = {
  "requiredSections"?: ("personal" | "contact" | "emergency" | "bank" | "identity" | "documents" | "guarantors")[];
  "guarantorsRequired"?: number;
  /** At least one. */
  "guarantorMethods"?: ("esign" | "paper")[];
  "guarantorIdRequired"?: boolean;
  "guarantorPhotoRequired"?: boolean;
  "linkLifetimeDays"?: number;
  "guarantorFormTitle"?: string;
  /** Paragraphs separated by blank lines, with {{merge.fields}}. */
  "guarantorFormBody"?: string;
};

export type FileUrlResponseDto = {
  "url": string;
};

export type InviteNewHireDto = {
  /** Where the invite goes. */
  "personalEmail": string;
  /** Prefills their form; they can correct it. */
  "firstName"?: string;
  "lastName"?: string;
  /** If already known. Otherwise asked for when approving. */
  "workEmail"?: string;
  "designationId": string;
  /** Only when the designation has no department. */
  "departmentId"?: string;
  "branchId": string;
  "gradeId": string;
  "managerId"?: string;
  "employmentType": "full_time" | "part_time" | "contract" | "intern" | "nysc" | "consultant";
  "workLocation"?: "onsite" | "remote" | "hybrid";
  /** Their first day. */
  "hireDate": string;
  /** Their starting salary, applied when approved. Needs employee:read_sensitive. */
  "startingPay"?: StartingPayDto;
};

export type StartingPayViewDto = {
  /** Minor units. */
  "grossAmount": number;
  "basis": "monthly" | "annual";
  "payStructureId": string | null;
};

export type ReviewNoteResponseDto = {
  "section": "personal" | "contact" | "emergency" | "bank" | "identity" | "documents" | "guarantors";
  "note": string;
};

export type PersonalViewDto = {
  "firstName": string | null;
  "middleName": string | null;
  "lastName": string | null;
  "dateOfBirth": string | null;
  "gender": string | null;
  "maritalStatus": string | null;
  "nationality": string | null;
  "stateOfOrigin": string | null;
  "hasPhoto": boolean;
};

export type ContactViewDto = {
  "phone": string | null;
  "alternatePhone": string | null;
  "residentialAddress": string | null;
  /** State of residence, for PAYE. */
  "taxState": string | null;
};

export type EmergencyContactViewDto = {
  "name": string;
  "relationship": string;
  "phone": string;
  "address": string | null;
};

export type HrBankViewDto = {
  "bankListId": string | null;
  "bankName": string | null;
  "accountNumber": string | null;
  "accountName": string | null;
  /** The name came from the bank, not typed. */
  "verified": boolean;
};

export type HrIdentityViewDto = {
  "scheme": string;
  "label": string;
  "identifier": string;
};

export type HrDocumentViewDto = {
  "documentTypeId": string;
  "documentType": string;
  "filename": string;
  "contentType": string;
  "sizeBytes": number;
};

export type HrGuarantorViewDto = {
  "_id": string;
  "name": string;
  "email": string;
  "phone": string;
  "relationship": string;
  "status": "pending" | "signed" | "declined" | "expired";
  "address": string | null;
  "occupation": string | null;
  "employer": string | null;
  "yearsKnown": number | null;
  "hasIdDocument": boolean;
  "hasPhoto": boolean;
  "method": "esign" | "paper";
  /** When they e-signed, or the paper form was uploaded. */
  "signedAt": string | null;
  "signedFromIp": string | null;
  "hasSignedForm": boolean;
  /** Why HR rejected the paper form, while it is still to be replaced. */
  "rejectionReason": string | null;
  "declineReason": string | null;
  "lastSentAt": string | null;
};

export type NewHireDetailDto = {
  "_id": string;
  "status": "invited" | "in_progress" | "submitted" | "changes_requested" | "approved" | "cancelled" | "expired";
  "name": string;
  "personalEmail": string;
  "workEmail": string | null;
  "designationId": string;
  "departmentId": string;
  "branchId": string;
  "gradeId": string;
  "managerId": string | null;
  "employmentType": string;
  "workLocation": string;
  "hireDate": string;
  "offerId": string | null;
  "invitedBy": string;
  "lastSentAt": string | null;
  "linkExpiresAt": string | null;
  "openedAt": string | null;
  "submittedAt": string | null;
  "decidedAt": string | null;
  "employeeId": string | null;
  "guarantorOverrideReason": string | null;
  /** Null when none is set, and for anyone without employee:read_sensitive. */
  "startingPay": StartingPayViewDto | null;
  /** Onboarded automatically on their start date. */
  "autoOnboard": boolean;
  "loginEmail": "work" | "personal";
  "onboardedAt": string | null;
  /** Why automatic onboarding has not happened yet. */
  "onboardError": string | null;
  "reviewNotes": ReviewNoteResponseDto[];
  "completedSections": ("personal" | "contact" | "emergency" | "bank" | "identity" | "documents" | "guarantors")[];
  "guarantorsRequired": number;
  "personal": PersonalViewDto;
  "contact": ContactViewDto;
  "emergencyContacts": EmergencyContactViewDto[];
  "bank": HrBankViewDto;
  "identity": HrIdentityViewDto[];
  "documents": HrDocumentViewDto[];
  "guarantors": HrGuarantorViewDto[];
};

export type InviteFromOfferDto = {
  /** Defaults to the candidate's email. */
  "personalEmail"?: string;
  /** Defaults to the offer's. Required if the offer has none. */
  "branchId"?: string;
  "designationId"?: string;
  "gradeId"?: string;
  "employmentType"?: "full_time" | "part_time" | "contract" | "intern" | "nysc" | "consultant";
};

export type NewHireFunnelDto = {
  "days": number;
  /** Invited in the window (cancelled excluded). */
  "invited": number;
  /** Of those, opened their link. */
  "opened": number;
  /** Of those, sent their details at least once. */
  "submitted": number;
  /** Of those, approved into an employee. */
  "approved": number;
  /** Median days from invite to first sending their details. */
  "medianDaysToSubmit": number | null;
  /** The same, for the window before. */
  "previousMedianDaysToSubmit": number | null;
};

export type NewHireMetricsDto = {
  /** Sent their details; waiting on HR. */
  "readyToReview": number;
  /** How long the oldest of those has waited. */
  "oldestWaitingDays": number | null;
  /** Still filling in their details (invited, in progress, sent back). */
  "inProgress": number;
  /** Invited but haven't opened the link. */
  "notOpened": number;
  /** Start within 14 days and not approved yet. */
  "startingSoonUnapproved": number;
  /** Guarantors of open new hires who have not signed. */
  "guarantorsAwaiting": number;
  "window": NewHireFunnelDto;
};

export type NewHireSummaryDto = {
  "_id": string;
  "status": "invited" | "in_progress" | "submitted" | "changes_requested" | "approved" | "cancelled" | "expired";
  "name": string;
  "personalEmail": string;
  "designationId": string;
  "hireDate": string;
  "lastSentAt": string | null;
  "submittedAt": string | null;
  "employeeId": string | null;
  "guarantorsSigned": number;
  "guarantorsRequired": number;
  "createdAt": string | null;
};

export type RejectGuarantorFormDto = {
  "reason": string;
};

export type ReviewNoteDto = {
  "section": "personal" | "contact" | "emergency" | "bank" | "identity" | "documents" | "guarantors";
  "note": string;
};

export type RequestChangesDto = {
  "notes": ReviewNoteDto[];
};

export type ApproveNewHireDto = {
  /** Required if not set at invite. */
  "workEmail"?: string;
  /** Approve with fewer signed guarantors than required. Recorded. */
  "guarantorOverrideReason"?: string;
  /** Onboard them automatically: now if their start date has come, otherwise on the morning it does. Onboarding activates them, makes their checklist and gives them a login. */
  "autoOnboard"?: boolean;
  /** Who works through their onboarding checklist. */
  "onboardTaskAssigneeId"?: string;
  /** Which of their emails their login is made on. */
  "loginEmail"?: "work" | "personal";
  /** Their starting salary, replacing any given with the invite. Needs employee:read_sensitive. */
  "startingPay"?: StartingPayDto;
};

export type CompanyBrandDto = {
  "name": string;
  "brandColor": string;
  "wordmark": string;
};

export type PublicBankViewDto = {
  "bankListId": string | null;
  /** Masked: re-enter to change. */
  "accountNumber": string | null;
  "accountName": string | null;
  "verified": boolean;
};

export type BankOptionDto = {
  "_id": string;
  "name": string;
};

export type PublicIdentityOptionDto = {
  "value": string;
  "label": string;
};

export type PublicIdentityDto = {
  "scheme": string;
  "label": string;
  "format": string;
  "required": boolean;
  /** Masked: re-enter to change. A PFA is shown as chosen. */
  "value": string | null;
  /** For a PFA: the PFAs to choose from. Null for a number they type. */
  "options": PublicIdentityOptionDto[] | null;
};

export type PublicDocumentDto = {
  "documentTypeId": string;
  "name": string;
  "description": string | null;
  /** What they uploaded, if anything. */
  "filename": string | null;
};

export type PublicGuarantorDto = {
  "_id": string;
  "name": string;
  /** None for a guarantor signing on paper. */
  "email": string | null;
  "phone": string;
  "relationship": string;
  "status": "pending" | "signed" | "declined" | "expired";
  "method": "esign" | "paper";
  "paperFormUploaded": boolean;
  /** Why HR sent the paper form back. */
  "rejectionReason": string | null;
};

export type OnboardingViewDto = {
  "company": CompanyBrandDto;
  "role": string;
  "startDate": string;
  "status": "invited" | "in_progress" | "submitted" | "changes_requested" | "approved" | "cancelled" | "expired";
  "editable": boolean;
  "linkExpiresAt": string | null;
  "reviewNotes": ReviewNoteResponseDto[];
  "requiredSections": ("personal" | "contact" | "emergency" | "bank" | "identity" | "documents" | "guarantors")[];
  "completedSections": ("personal" | "contact" | "emergency" | "bank" | "identity" | "documents" | "guarantors")[];
  "personal": PersonalViewDto;
  "contact": ContactViewDto;
  "emergencyContacts": EmergencyContactViewDto[];
  "bank": PublicBankViewDto;
  "bankLookupAvailable": boolean;
  "banks": BankOptionDto[];
  /** States to choose a state of residence from. Empty where PAYE is national. */
  "states": string[];
  "identity": PublicIdentityDto[];
  "documents": PublicDocumentDto[];
  "guarantorsRequired": number;
  /** How guarantors may sign here. */
  "guarantorMethods": ("esign" | "paper")[];
  "guarantors": PublicGuarantorDto[];
};

export type SavePersonalDto = {
  "firstName": string;
  "middleName"?: string;
  "lastName": string;
  "dateOfBirth": string;
  "gender": "male" | "female" | "other" | "undisclosed";
  "maritalStatus"?: "single" | "married" | "divorced" | "widowed" | "undisclosed";
  "nationality"?: string;
  "stateOfOrigin"?: string;
};

export type SaveContactDto = {
  "phone": string;
  "alternatePhone"?: string;
  "residentialAddress": string;
  /** State of residence, for PAYE (Nigeria). */
  "taxState"?: string;
};

export type EmergencyContactDto = {
  "name": string;
  "relationship": string;
  "phone": string;
  "address"?: string;
};

export type SaveEmergencyDto = {
  "contacts": EmergencyContactDto[];
};

export type SaveBankDto = {
  "bankListId": string;
  "accountNumber": string;
  /** Only used when the bank could not be checked; otherwise the bank’s name wins. */
  "accountName"?: string;
};

export type IdentityEntryDto = {
  "scheme": string;
  "identifier": string;
};

export type SaveIdentityDto = {
  "ids": IdentityEntryDto[];
};

export type UploadSlotDto = {
  "filename": string;
  "contentType": string;
};

export type UploadSlotResponseDto = {
  "uploadUrl": string;
  "key": string;
  "requiredHeaders": Record<string, unknown>;
};

export type ConfirmDocumentDto = {
  /** The document type it is. */
  "documentTypeId": string;
  /** The key the upload slot returned. */
  "storageKey": string;
  "filename": string;
  "contentType": string;
};

export type ConfirmPhotoDto = {
  "storageKey": string;
  "contentType": string;
};

export type GuarantorInputDto = {
  /** esign: emailed a link to sign online. paper: you download, print and upload it. Defaults to esign when allowed. */
  "method"?: "esign" | "paper";
  "name": string;
  /** Required to sign online. */
  "email"?: string;
  "phone": string;
  "relationship": string;
};

export type ConfirmPaperFormDto = {
  /** The key the upload slot returned. */
  "storageKey": string;
  "filename": string;
  "contentType": string;
};

export type GuarantorIdentityDto = {
  "name": string;
  "email": string;
  "phone": string;
  "relationship": string;
};

export type GuarantorDetailsViewDto = {
  "address": string | null;
  "occupation": string | null;
  "employer": string | null;
  "employerAddress": string | null;
  "yearsKnown": number | null;
  "hasIdDocument": boolean;
  "hasPhoto": boolean;
};

export type GuarantorRequirementsDto = {
  "idDocument": boolean;
  "photo": boolean;
};

export type GuarantorFormDto = {
  "title": string;
  /** With {{merge.fields}}; fill them from `values`. */
  "body": string;
  "version": number;
  "values": Record<string, unknown>;
};

export type GuarantorViewDto = {
  "company": CompanyBrandDto;
  "employeeName": string;
  "role": string;
  "status": "pending" | "signed" | "declined" | "expired";
  "guarantor": GuarantorIdentityDto;
  "details": GuarantorDetailsViewDto;
  "requirements": GuarantorRequirementsDto;
  "form": GuarantorFormDto;
  "signedAt": string | null;
  "declineReason": string | null;
};

export type SaveGuarantorDetailsDto = {
  "address": string;
  "occupation": string;
  "employer"?: string;
  "employerAddress"?: string;
  "yearsKnown": number;
};

export type ConfirmGuarantorUploadDto = {
  "purpose": "id" | "photo";
  "storageKey": string;
  "contentType": string;
};

export type SignGuarantorFormDto = {
  /** Their full name, typed. */
  "typedName": string;
  /** The drawn signature, as a PNG data URL. */
  "signature": string;
  /** They read the form and agree to it. */
  "consent": boolean;
};

export type DeclineGuarantorDto = {
  "reason": string;
};

export type OpenCaseDto = {
  "caseType": "query" | "warning" | "misconduct" | "grievance" | "pip";
  /** The person the case is about. */
  "employeeId": string;
  "title": string;
  "details": string;
  /** Who a grievance is about, so the case can be kept away from them. */
  "subjectOfComplaintId"?: string;
  "severity"?: "low" | "medium" | "high";
  /** Working days the employee has to respond. */
  "responseDays"?: number;
  /** Defaults to true for a grievance. */
  "confidential"?: boolean;
  "handlerUserIds"?: string[];
  /** Storage keys of supporting evidence. */
  "documentKeys"?: string[];
};

export type CaseEventResponseDto = {
  "type": string;
  "summary": string;
  "at": string;
  "byUserId": string | null;
};

export type PlanCheckpointResponseDto = {
  "dueOn": string;
  "status": "pending" | "held" | "missed";
  "heldOn": string | null;
  "outcome": string | null;
  "recordedBy": string | null;
};

export type PipPlanResponseDto = {
  "startDate": string;
  "endDate": string;
  "cadence": "weekly" | "fortnightly" | "monthly";
  "objectives": string[];
  /** Generated from the period and cadence. The end date is always a review. */
  "checkpoints": PlanCheckpointResponseDto[];
  "finalOutcome": string | null;
};

export type EmployeeRelationsCaseResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "reference": string;
  "caseType": "query" | "warning" | "misconduct" | "grievance" | "pip";
  /** The person the case is about. */
  "employeeId": string;
  /** Who raised it. */
  "raisedById": string | null;
  /** For a grievance: the person complained about. */
  "subjectOfComplaintId": string | null;
  "title": string;
  /** The allegation, as put to the employee. They answer this. */
  "details": string;
  "stage": "draft" | "raised" | "awaiting_response" | "hearing" | "decided" | "closed" | "appealed" | "withdrawn";
  "severity": "low" | "medium" | "high";
  /** The employee’s own account. */
  "employeeResponse"?: string;
  "respondedAt": string | null;
  /** A decision before this date is REFUSED — the window is not decorative. */
  "responseDueBy": string | null;
  "hearingDate": string | null;
  /** Panel members. Anyone involved in the case — the complainant, the accused — is excluded. */
  "hearingPanelIds": string[];
  /** The outcome, in the words given to the employee. */
  "decision"?: string;
  "sanction": "none" | "verbal_warning" | "written_warning" | "final_written_warning" | "suspension" | "demotion" | "dismissal";
  /** Warnings lapse. An expired sanction must not count toward a later escalation. */
  "sanctionExpiresOn": string | null;
  "decidedAt": string | null;
  "appealGrounds"?: string;
  "appealOutcome"?: string;
  "appealedAt": string | null;
  /** Append-only. */
  "history": CaseEventResponseDto[];
  /** Set only on a `pip`. Null on every other case type. */
  "plan": PipPlanResponseDto | null;
  /** Confidential cases are visible only to named handlers, not to HR at large. */
  "confidential": boolean;
  "handlerUserIds": string[];
  /** The handlers by name, in the same order. Present on a single case read. */
  "handlerNames"?: string[];
};

export type LiveSanctionResponseDto = {
  "reference": string;
  "sanction": "verbal_warning" | "written_warning" | "final_written_warning" | "suspension" | "demotion" | "dismissal";
  "decidedOn": string;
  /** Only unexpired sanctions appear here — that is the point of the endpoint. */
  "expiresOn": string | null;
};

export type ScheduleHearingDto = {
  "hearingDate": string;
  /** Nobody hears their own case, and no subject of a grievance hears it. */
  "panelIds"?: string[];
};

export type DecideCaseDto = {
  "decision": string;
  "sanction"?: "none" | "verbal_warning" | "written_warning" | "final_written_warning" | "suspension" | "demotion" | "dismissal";
  /** How long the sanction stays live. Defaults by sanction type. */
  "sanctionDurationDays"?: number;
  "documentKeys"?: string[];
};

export type ResolveAppealDto = {
  "outcome": string;
};

export type SetPipPlanDto = {
  "startDate": string;
  "endDate": string;
  "cadence": "weekly" | "fortnightly" | "monthly";
  /** What has to change, in the words the employee was given. */
  "objectives"?: string[];
};

export type RecordCheckpointDto = {
  "status": "held" | "missed";
  /** Defaults to the date it was due. */
  "heldOn"?: string;
  "outcome"?: string;
};

export type CreatePolicyDto = {
  "title": string;
  "code": string;
  "summary"?: string;
  /** Storage key of the document itself. */
  "documentKey"?: string;
  "effectiveFrom"?: string;
  /** Empty means everyone. */
  "departmentIds"?: string[];
  "requiresAcknowledgement"?: boolean;
};

export type PolicyResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "title": string;
  "code": string;
  /** A new version needs fresh acknowledgement — an old one does not carry over. */
  "version": number;
  "summary"?: string;
  "status": "draft" | "published" | "archived";
  "effectiveFrom": string | null;
  /** Empty means the whole company. */
  "departmentIds": string[];
  "requiresAcknowledgement": boolean;
};

export type PolicyComplianceResponseDto = {
  "policyId": string;
  "title": string;
  "version": number;
  "required": number;
  "acknowledged": number;
  "outstanding": number;
};

export type RespondToCaseDto = {
  "response": string;
  "documentKeys"?: string[];
};

export type AppealCaseDto = {
  "grounds": string;
  "documentKeys"?: string[];
};

export type PolicyAcknowledgementResponseDto = {
  "_id": string;
  "policyId": string;
  /** The version acknowledged. Acknowledging v2 says nothing about v3. */
  "policyVersion": number;
  "employeeId": string;
  "acknowledgedAt": string;
  /** Recorded because an acknowledgement is evidence, and evidence has provenance. */
  "ipAddress": string | null;
};

export type CreateLeaveTypeDto = {
  "name": string;
  "code": string;
  "isPaid"?: boolean;
  "requiresDocument"?: boolean;
  "documentRequiredAfterDays"?: number;
  "genderEligibility"?: "any" | "male" | "female";
  /** False for maternity, which runs in calendar weeks. */
  "excludesNonWorkingDays"?: boolean;
  "allowHalfDays"?: boolean;
  "status"?: "active" | "inactive";
  "description"?: string;
};

export type LeaveTypeResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "name": string;
  /** Unique within the company. */
  "code": string;
  /** Unpaid leave becomes a payroll deduction. */
  "isPaid": boolean;
  "requiresDocument": boolean;
  /** Documentation is only demanded past this many days — 0 means always. */
  "documentRequiredAfterDays": number;
  "genderEligibility": "any" | "female" | "male";
  /** When true, weekends and public holidays do not consume the entitlement. */
  "excludesNonWorkingDays": boolean;
  "allowHalfDays": boolean;
  "status": "active" | "inactive";
  "description"?: string;
};

export type CreateLeavePolicyDto = {
  "leaveTypeId": string;
  "name": string;
  "gradeIds"?: string[];
  "departmentIds"?: string[];
  "employmentTypes"?: string[];
  /** Higher wins when several policies match. */
  "priority"?: number;
  "accrualMethod"?: "annual_upfront" | "monthly" | "anniversary" | "none";
  "daysPerYear"?: number;
  "proRateOnJoin"?: boolean;
  "availableDuringProbation"?: boolean;
  "carryOverMaxDays"?: number;
  /** Months before carried-over days lapse. 0 = never. */
  "carryOverExpiryMonths"?: number;
  "allowEncashment"?: boolean;
  "minNoticeDays"?: number;
  "maxConsecutiveDays"?: number;
  "allowNegativeBalance"?: boolean;
  "status"?: "active" | "inactive";
};

export type LeavePolicyResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "leaveTypeId": string;
  "name": string;
  /** Empty means every grade. */
  "gradeIds": string[];
  /** Empty means every department. */
  "departmentIds": string[];
  /** Empty means every employment type. */
  "employmentTypes": string[];
  /** Higher wins when several policies match the same employee. */
  "priority": number;
  "accrualMethod": "annual_upfront" | "monthly" | "anniversary" | "none";
  "daysPerYear": number;
  /** A mid-year joiner earns a proportion of the year rather than all of it. */
  "proRateOnJoin": boolean;
  "availableDuringProbation": boolean;
  /** Days that may cross into next year. 0 means none. */
  "carryOverMaxDays": number;
  /** Months into the new year before carried days expire unused. */
  "carryOverExpiryMonths": number;
  "allowEncashment": boolean;
  "minNoticeDays": number;
  /** 0 means no ceiling. */
  "maxConsecutiveDays": number;
  /** Allows taking leave not yet accrued, which the ledger records as negative. */
  "allowNegativeBalance": boolean;
  "status": "active" | "inactive";
};

export type LeaveRequestResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "employeeId": string;
  "leaveTypeId": string;
  "startDate": string;
  "endDate": string;
  /** Working days consumed, holiday-aware. Half-days are why this is not a whole number. */
  "days": number;
  "halfDayStart": boolean;
  "halfDayEnd": boolean;
  /** The entitlement year this draws from. */
  "year": number;
  "reason"?: string;
  /** Who is covering. Null when nobody was named. */
  "handoverToId": string | null;
  "status": "pending" | "approved" | "rejected" | "cancelled" | "withdrawn";
};

export type CancelLeaveRequestDto = {
  "reason"?: string;
};

export type LeaveBalanceResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "employeeId": string;
  "leaveTypeId": string;
  "year": number;
  /** Granted so far this year. */
  "accrued": number;
  /** Brought forward from last year. */
  "carriedOver": number;
  "taken": number;
  /** Requested and awaiting a decision — already reserved. */
  "pending": number;
  "encashed": number;
  /** Carried days that lapsed before they were used. */
  "expired": number;
  /** Manual corrections, signed. */
  "adjustments": number;
  /** What may actually be requested. Every other figure explains this one. */
  "available": number;
  "recalculatedAt": string | null;
};

export type LeaveLedgerEntryResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "employeeId": string;
  "leaveTypeId": string;
  "year": number;
  "type": "accrual" | "taken" | "carry_over" | "expiry" | "encashment" | "adjustment" | "reversal";
  /** Signed. Negative entries reduce the balance. */
  "days": number;
  "effectiveDate": string;
  /** What caused this entry, so it can be traced back. */
  "sourceType"?: string;
  "sourceId": string | null;
  /** Makes an accrual idempotent — the same period cannot be granted twice. */
  "periodKey": string | null;
  "reason"?: string;
};

export type AdjustLeaveBalanceDto = {
  "employeeId": string;
  "leaveTypeId": string;
  "year": number;
  /** Signed. Negative removes days, positive grants them. */
  "days": number;
  "reason": string;
};

export type AccrualRunDto = {
  /** YYYY-MM-DD. Defaults to today in the company timezone. */
  "asOf"?: string;
};

export type AccrualRunResponseDto = {
  "year": number;
  /** The date accrual was computed up to. */
  "asOf": string;
  "employeesConsidered": number;
  "entriesCreated": number;
  "daysGranted": number;
  /** Already accrued for this period. Re-running the sweep is safe. */
  "skipped": number;
  /** Reported and skipped rather than aborting the sweep for everyone else. */
  "errors": Record<string, unknown>[];
};

export type CarryOverResponseDto = {
  "fromYear": number;
  "toYear": number;
  "employeesProcessed": number;
  "daysCarried": number;
  /** Days over the policy cap. Forfeited deliberately, and recorded as an entry. */
  "daysForfeited": number;
};

export type CreateLeaveRequestDto = {
  "leaveTypeId": string;
  "startDate": string;
  "endDate": string;
  /** Start on the afternoon of the first day. */
  "halfDayStart"?: boolean;
  /** End at midday on the last day. */
  "halfDayEnd"?: boolean;
  "reason"?: string;
  /** Colleague covering the duties while away. */
  "handoverToId"?: string;
  "contactDuringLeave"?: string;
  /** Storage keys of supporting documents. */
  "documentKeys"?: string[];
};

export type CreateHolidayDto = {
  "date": string;
  "name": string;
  /** Limits the holiday to specific branches. Omit for company-wide. */
  "branchIds"?: string[];
  /** A declared day that is nonetheless worked — announced then withdrawn. */
  "isWorkingDay"?: boolean;
  "note"?: string;
};

export type HolidayResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "countryCode": string;
  "date": string;
  "name": string;
  /** Branches it applies to. Empty means everywhere in the country. */
  "branchIds": string[];
  /** True for a declared working day that would otherwise be a rest day. */
  "isWorkingDay": boolean;
  "note"?: string;
};

export type RatingLevelDto = {
  "value": number;
  "label": string;
  "description"?: string;
};

export type CreateCycleDto = {
  "name": string;
  "periodStart": string;
  "periodEnd": string;
  /** Held per cycle: a 3-of-5 and a 3-of-4 are different judgements. */
  "ratingScale"?: RatingLevelDto[];
  /** Fraction of the rating carried by goals. */
  "goalWeighting"?: number;
  "departmentIds"?: string[];
  "description"?: string;
};

export type RatingLevelResponseDto = {
  "value": number;
  "label": string;
  "description"?: string;
};

export type PerformanceCycleResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "name": string;
  "periodStart": string;
  "periodEnd": string;
  /** Phases move one way. What may be edited depends entirely on this. */
  "phase": "draft" | "goal_setting" | "in_progress" | "self_review" | "manager_review" | "calibration" | "closed";
  "ratingScale": RatingLevelResponseDto[];
  /** Percent of the final score from goals; the remainder comes from competencies. */
  "goalWeighting": number;
  /** Empty means the whole company. */
  "departmentIds": string[];
  "description"?: string;
};

export type UpdateCycleDto = {
  "name"?: string;
  "periodStart"?: string;
  "periodEnd"?: string;
  /** Held per cycle: a 3-of-5 and a 3-of-4 are different judgements. */
  "ratingScale"?: RatingLevelDto[];
  /** Fraction of the rating carried by goals. */
  "goalWeighting"?: number;
  "departmentIds"?: string[];
  "description"?: string;
};

export type AdvancePhaseDto = {
  "phase": "draft" | "goal_setting" | "in_progress" | "self_review" | "manager_review" | "calibration" | "closed";
  /** Closing with people who have goals but no shared appraisal is refused unless this is true. */
  "confirmIncomplete"?: boolean;
};

export type ScoreComponentResponseDto = {
  "label": string;
  "weight": number;
  "rating": number;
  /** rating × weight ÷ 100 — the contribution to the score. */
  "weighted": number;
};

export type CalibrationAdjustmentResponseDto = {
  "fromRating": number;
  "toRating": number;
  "reason": string;
  "adjustedBy": string;
  "adjustedAt": string;
};

export type AppraisalResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "cycleId": string;
  "employeeId": string;
  /** So a calibration panel can see whom it rates without employee:read. */
  "employeeName"?: string;
  /** What the manager said. Calibration never overwrites this. */
  "managerRating": number | null;
  /** After calibration. The rating that counts for pay and promotion. */
  "finalRating": number | null;
  "goalScore": number;
  "competencyScore": number;
  /** How the score was arrived at, line by line. */
  "breakdown": ScoreComponentResponseDto[];
  /** Appended, never replacing. Every move is on the record with its reason. */
  "calibrations": CalibrationAdjustmentResponseDto[];
  /** Only a rated or calibrated appraisal can be shared with the employee. */
  "status": "pending" | "rated" | "calibrated" | "shared" | "acknowledged";
  "sharedAt": string | null;
  "acknowledgedAt": string | null;
  /** The employee’s latest answer to the shared appraisal. */
  "employeeAgreement": "agree" | "disagree" | null;
  /** The employee's response. Disagreement is recorded, not resolved. */
  "employeeComment"?: string;
};

export type RatingDistributionResponseDto = {
  "rating": number;
  "label": string;
  "count": number;
  /** Share of the cycle. What a calibration conversation is actually held against. */
  "percentage": number;
};

export type CycleProgressRowResponseDto = {
  "employeeId": string;
  "name": string;
  "goals": number;
  "goalsActive": number;
  "goalWeight": number;
  "selfReview": "none" | "draft" | "submitted";
  "managerReview": "none" | "draft" | "submitted";
  "feedback": number;
  "appraisal": string;
  "finalRating": number | null;
};

export type ShareAllResponseDto = {
  "shared": number;
};

export type ComputeAppraisalDto = {
  "employeeId": string;
};

export type CreateGoalDto = {
  "cycleId": string;
  /** Omit to set a goal for yourself. */
  "employeeId"?: string;
  "title": string;
  /** A fraction. One employee’s goals must total 1. */
  "weight": number;
  "description"?: string;
  "measure"?: string;
  /** The goal this rolls up to. */
  "parentGoalId"?: string;
  "dueDate"?: string;
};

export type GoalResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "cycleId": string;
  "employeeId": string;
  "title": string;
  "description"?: string;
  /** Percent. An employee’s goals are expected to total 100. */
  "weight": number;
  "measure"?: string;
  /** A parent goal this rolls up into — how a team goal cascades. */
  "parentGoalId": string | null;
  "status": "draft" | "active" | "achieved" | "missed" | "cancelled";
  /** Percent complete, as reported by the owner. */
  "progress": number;
  "dueDate": string | null;
};

export type UpdateGoalDto = {
  "title"?: string;
  "weight"?: number;
  "progress"?: number;
  "status"?: "draft" | "active" | "achieved" | "missed" | "cancelled";
  "description"?: string;
  "measure"?: string;
  "dueDate"?: string;
};

export type CompetencyDto = {
  "name": string;
  "weight": number;
  "description"?: string;
};

export type CreateFrameworkDto = {
  "name": string;
  "competencies": CompetencyDto[];
  /** Empty means the company-wide default. */
  "gradeIds"?: string[];
};

export type CompetencyResponseDto = {
  "name": string;
  "description"?: string;
  /** Percent of the competency half of the score. */
  "weight": number;
};

export type CompetencyFrameworkResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "name": string;
  /** Grades this framework applies to. */
  "gradeIds": string[];
  "competencies": CompetencyResponseDto[];
  "status": "active" | "inactive";
};

export type GoalRatingDto = {
  "goalId": string;
  "rating": number;
  "comment"?: string;
};

export type CompetencyRatingDto = {
  "competency": string;
  "rating": number;
  "comment"?: string;
};

export type SubmitReviewDto = {
  "cycleId": string;
  "reviewType": "self" | "manager" | "peer" | "upward";
  /** The person being reviewed. Omitted for a self-review. */
  "employeeId"?: string;
  "goalRatings"?: GoalRatingDto[];
  "competencyRatings"?: CompetencyRatingDto[];
  "strengths"?: string;
  "developmentAreas"?: string;
  "overallComment"?: string;
  /** Submitting makes the review immutable. A draft can be revised freely. */
  "submit"?: boolean;
};

export type GoalRatingResponseDto = {
  "goalId": string;
  "rating": number;
  "comment"?: string;
};

export type CompetencyRatingResponseDto = {
  "competency": string;
  "rating": number;
  "comment"?: string;
};

export type PerformanceReviewResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "cycleId": string;
  "employeeId": string;
  /** Who wrote it — null for peer and upward feedback, which is anonymous to everyone but its author. */
  "reviewerId": string | null;
  "reviewType": "self" | "manager" | "peer" | "upward";
  "goalRatings": GoalRatingResponseDto[];
  "competencyRatings": CompetencyRatingResponseDto[];
  "strengths"?: string;
  "developmentAreas"?: string;
  "overallComment"?: string;
  "status": "draft" | "submitted";
  /** Once submitted, the ratings are fixed. A change is a new review. */
  "submittedAt": string | null;
};

export type CalibrateDto = {
  "toRating": number;
  /** Required. Calibration is itself a judgement, and it has to be explainable. */
  "reason": string;
  /** For the audit log only; the stored value is authoritative. */
  "fromRatingHint"?: number;
};

export type MyCycleResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "name": string;
  "periodStart": string;
  "periodEnd": string;
  /** Phases move one way. What may be edited depends entirely on this. */
  "phase": "draft" | "goal_setting" | "in_progress" | "self_review" | "manager_review" | "calibration" | "closed";
  "ratingScale": RatingLevelResponseDto[];
  /** Percent of the final score from goals; the remainder comes from competencies. */
  "goalWeighting": number;
  /** Empty means the whole company. */
  "departmentIds": string[];
  "description"?: string;
  /** Reviews the caller still owes in this cycle. */
  "owed": number;
};

export type GoalProgressDto = {
  "progress": number;
};

export type OwedReviewResponseDto = {
  "reviewType": "self" | "manager" | "peer" | "upward";
  "employeeId": string;
  "employeeName": string;
  "status": "not_started" | "draft";
  /** The phase that has to end before it is late. */
  "phase": "draft" | "goal_setting" | "in_progress" | "self_review" | "manager_review" | "calibration" | "closed";
};

export type ReviewCycleSummaryDto = {
  "_id": string;
  "name": string;
  "phase": "draft" | "goal_setting" | "in_progress" | "self_review" | "manager_review" | "calibration" | "closed";
  "ratingScale": RatingLevelResponseDto[];
  "goalWeighting"?: number;
};

export type SelfReviewFormResponseDto = {
  "cycle": ReviewCycleSummaryDto;
  "goals": GoalResponseDto[];
  "competencies": CompetencyResponseDto[];
  "review": PerformanceReviewResponseDto | null;
};

export type SelfReviewDto = {
  "goalRatings"?: GoalRatingDto[];
  "competencyRatings"?: CompetencyRatingDto[];
  "strengths"?: string;
  "developmentAreas"?: string;
  "overallComment"?: string;
  /** Submitting makes the review immutable. A draft can be revised freely. */
  "submit"?: boolean;
};

export type PersonRefDto = {
  "employeeId": string;
  "name": string;
};

export type FeedbackTargetsResponseDto = {
  "peers": PersonRefDto[];
  "manager": PersonRefDto | null;
};

export type FeedbackDto = {
  /** The colleague (peer) or your manager (upward). */
  "employeeId": string;
  "reviewType": "peer" | "upward";
  "strengths"?: string;
  "developmentAreas"?: string;
  "overallComment"?: string;
  "submit"?: boolean;
};

export type ManagerCommentGoalDto = {
  "goal": string;
  "rating": number;
  "comment": string;
};

export type ManagerCommentCompetencyDto = {
  "competency": string;
  "rating": number;
  "comment": string;
};

export type ManagerCommentsDto = {
  "strengths"?: string;
  "developmentAreas"?: string;
  "overallComment"?: string;
  "goalComments": ManagerCommentGoalDto[];
  "competencyComments": ManagerCommentCompetencyDto[];
};

export type EmployeeResponseEntryDto = {
  "agreement": "agree" | "disagree";
  "comment"?: string;
  "at": string;
};

export type AppraisalSelfViewResponseDto = {
  "_id": string;
  "cycleId": string;
  "cycleName": string;
  "periodStart": string;
  "periodEnd": string;
  "status": "pending" | "rated" | "calibrated" | "shared" | "acknowledged";
  "sharedAt": string | null;
  "acknowledgedAt": string | null;
  "finalRating": number | null;
  "ratingLabel": string | null;
  "ratingScale": RatingLevelResponseDto[];
  "managerRating": number | null;
  "goalScore": number;
  "competencyScore": number;
  "goalWeighting": number;
  "breakdown": ScoreComponentResponseDto[];
  "calibrated": boolean;
  "calibrationReason": string | null;
  "manager": ManagerCommentsDto | null;
  "employeeAgreement": "agree" | "disagree" | null;
  "employeeComment": string | null;
  "responses": EmployeeResponseEntryDto[];
};

export type AcknowledgeAppraisalDto = {
  /** Whether the employee agrees with the outcome. Disagreeing needs a comment. */
  "agreement"?: "agree" | "disagree";
  /** Disagreement is recorded, not resolved. A box that only accepts agreement tells you nothing. */
  "comment"?: string;
};

export type RecommendDto = {
  "appraisalId": string;
  "kind": "promotion" | "increment" | "both";
  /** When it takes effect — not the approval date. */
  "effectiveDate": string;
  "justification": string;
  "proposedGradeId"?: string;
  "proposedDesignationId"?: string;
  /** Integer minor units, monthly. Must sit inside the grade’s band. */
  "proposedSalary"?: number;
  "currency"?: string;
};

export type PerformanceRecommendationResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "appraisalId": string;
  "cycleId": string;
  "employeeId": string;
  "employeeName"?: string;
  /** Where its approval stands (pending, blocked, approved, …), on lists. */
  "approvalState"?: string | null;
  "blockedReason"?: string | null;
  /** Why an approved recommendation has not applied yet. */
  "applyError"?: string;
  "kind": "promotion" | "increment" | "both";
  /** COPIED from the appraisal at the time it was raised. A later recalibration cannot change what an approver appears to have signed off. */
  "basedOnRating": number;
  "proposedGradeId": string | null;
  "proposedDesignationId": string | null;
  /** Integer minor units. */
  "proposedSalary": number | null;
  "currency"?: string;
  "effectiveDate": string;
  "justification": string;
  "status": "pending" | "approved" | "rejected" | "applied" | "cancelled";
  "workflowInstanceId": string | null;
  /** When it produced a real compensation change. Stays approved if that fails. */
  "appliedAt": string | null;
  "note"?: string;
};

export type TeamGoalSummaryDto = {
  "count": number;
  "totalWeight": number;
  "active": number;
  "draft": number;
};

export type TeamAppraisalSummaryDto = {
  "_id"?: string;
  "status": "pending" | "rated" | "calibrated" | "shared" | "acknowledged";
  "finalRating"?: number | null;
  "ratingLabel"?: string | null;
  "breakdown"?: ScoreComponentResponseDto[];
  "employeeAgreement"?: string | null;
  "employeeComment"?: string | null;
};

export type TeamReportSummaryResponseDto = {
  "employeeId": string;
  "name": string;
  "goals": TeamGoalSummaryDto;
  "selfReview": "none" | "draft" | "submitted";
  "managerReview": "none" | "draft" | "submitted";
  "feedbackCount": number;
  "appraisal": TeamAppraisalSummaryDto | null;
};

export type AnonymousFeedbackResponseDto = {
  "reviewType": "peer" | "upward";
  "strengths"?: string;
  "developmentAreas"?: string;
  "overallComment"?: string;
};

export type TeamReportDetailResponseDto = {
  "employee": PersonRefDto;
  "cycle": ReviewCycleSummaryDto;
  "goals": GoalResponseDto[];
  "competencies": CompetencyResponseDto[];
  "frameworkName": string | null;
  "selfReview": PerformanceReviewResponseDto | null;
  "feedback": AnonymousFeedbackResponseDto[];
  /** Responses held back until there are enough to keep their authors anonymous. */
  "feedbackHeld": number;
  "myReview": PerformanceReviewResponseDto | null;
  "appraisal": TeamAppraisalSummaryDto | null;
};

export type TeamGoalDto = {
  "title": string;
  /** A fraction. One employee’s goals must total 1. */
  "weight": number;
  "description"?: string;
  "measure"?: string;
  "dueDate"?: string;
};

export type ActivatedGoalsResponseDto = {
  "activated": number;
};

export type SalaryBandOptionDto = {
  "min": number;
  "mid": number;
  "max": number;
  "currency": string;
};

export type GradeOptionDto = {
  "_id": string;
  "name": string;
  "level": number;
  "salaryBand"?: SalaryBandOptionDto;
};

export type DesignationOptionDto = {
  "_id": string;
  "title": string;
  "gradeId": string | null;
};

export type TeamOptionsResponseDto = {
  "grades": GradeOptionDto[];
  "designations": DesignationOptionDto[];
};

export type TeamRecommendDto = {
  "kind": "promotion" | "increment" | "both";
  /** When it takes effect — not the approval date. */
  "effectiveDate": string;
  "justification": string;
  "proposedGradeId"?: string;
  "proposedDesignationId"?: string;
  /** Integer minor units, monthly. Must sit inside the grade’s band. */
  "proposedSalary"?: number;
  "currency"?: string;
};

export type ManagerReviewDto = {
  "goalRatings"?: GoalRatingDto[];
  "competencyRatings"?: CompetencyRatingDto[];
  "strengths"?: string;
  "developmentAreas"?: string;
  "overallComment"?: string;
  /** Submitting makes the review immutable. A draft can be revised freely. */
  "submit"?: boolean;
};

export type CreateTenantDto = {
  /** URL-safe slug: lowercase letters, numbers and hyphens only. Becomes the tenant's database name and cannot be changed afterwards. */
  "tenantId": string;
  /** Display name, shown to users. */
  "name": string;
  "subdomain"?: string;
  /** Deployment region for this tenant's data. Set explicitly where a customer has data-residency requirements — Kenya's DPA being the live case. */
  "region"?: string;
  /** The first user. Created as an owner inside the new tenant database. */
  "ownerEmail": string;
  /** Hashed before storage; never returned. */
  "ownerPassword": string;
  "ownerFirstName"?: string;
  "ownerLastName"?: string;
};

export type TenantProvisionedResponseDto = {
  "tenantId": string;
  "name": string;
  /** A failure after the registry entry leaves this `suspended` rather than deleting it, so a half-provisioned tenant is visible to ops instead of disappearing. */
  "status": "provisioning" | "active" | "suspended";
  "ownerId": string;
};

export type TenantBrandingDto = {
  /** The single colour the console brands with. Hover and subtle states are derived from it. Null means the default accent. */
  "accentColor": string | null;
  /** Up to four characters for the sidebar mark. Null falls back to the tenant name. */
  "wordmark": string | null;
  /** A short-lived link to the tenant's logo, minted per read. Null when there is no logo, or when read outside the tenant (the operator console). */
  "logoUrl": string | null;
  /** A short-lived link to the tenant's browser-tab icon. Null when there is none. */
  "faviconUrl": string | null;
  /** A short-lived link to the sign-in background image. Null when there is none. */
  "loginBackgroundUrl": string | null;
};

export type TenantProfileDto = {
  "tenantId": string;
  "name": string;
  "branding": TenantBrandingDto;
};

export type LogoUploadDto = {
  "filename": string;
  /** PNG, JPEG or WebP. Not SVG, which can carry script. */
  "contentType": "image/png" | "image/jpeg" | "image/webp";
};

export type LogoUploadResponseDto = {
  /** PUT the image here. */
  "uploadUrl": string;
  /** Send this back as logoKey on PATCH /tenants/me/branding. */
  "key": string;
  "requiredHeaders": Record<string, unknown>;
};

export type BrandingUploadDto = {
  /** logo: PNG, JPEG or WebP up to 1 MB. favicon: a square PNG up to 256 KB. login_background: PNG, JPEG or WebP up to 4 MB. */
  "kind": "logo" | "favicon" | "login_background";
  "filename": string;
  "contentType": "image/png" | "image/jpeg" | "image/webp";
};

export type BrandingUploadResponseDto = {
  /** PUT the image here. */
  "uploadUrl": string;
  /** Send this back on PATCH /tenants/me/branding as logoKey, faviconKey or loginBackgroundKey, matching the kind asked for. */
  "key": string;
  "requiredHeaders": Record<string, unknown>;
};

export type UpdateTenantBrandingDto = {
  /** Hex colour, or null to reset. */
  "accentColor"?: string | null;
  "wordmark"?: string | null;
  /** The key a logo upload slot returned, once the image is uploaded to it; null removes the logo. */
  "logoKey"?: string | null;
  /** The key a favicon upload slot returned; null removes the favicon. */
  "faviconKey"?: string | null;
  /** The key a login-background upload slot returned; null removes it. */
  "loginBackgroundKey"?: string | null;
};

export type PublicTenantBrandingDto = {
  "name": string;
  "accentColor": string | null;
  "wordmark": string | null;
  /** Short-lived link. */
  "logoUrl": string | null;
  /** Short-lived link. */
  "faviconUrl": string | null;
  /** Short-lived link. */
  "loginBackgroundUrl": string | null;
};

export type PlanResponseDto = {
  "code": string;
  "name": string;
  "description"?: string;
  "modules": ("core_hr" | "time_attendance" | "face_attendance" | "leave" | "payroll" | "recruitment" | "performance" | "employee_relations" | "documents" | "expenses" | "learning" | "reporting" | "ai" | "broadcast" | "assets")[];
  "maxEmployees": number | null;
  "status": "active" | "retired";
};

export type CreatePlanDto = {
  /** Stable identifier a tenant references. */
  "code": string;
  "name": string;
  "description"?: string;
  "modules": ("core_hr" | "time_attendance" | "face_attendance" | "leave" | "payroll" | "recruitment" | "performance" | "employee_relations" | "documents" | "expenses" | "learning" | "reporting" | "ai" | "broadcast" | "assets")[];
  /** Headcount ceiling. Recorded, not enforced. */
  "maxEmployees"?: number;
};

export type UpdatePlanDto = {
  /** Stable identifier a tenant references. */
  "code"?: string;
  "name"?: string;
  "description"?: string;
  "modules"?: ("core_hr" | "time_attendance" | "face_attendance" | "leave" | "payroll" | "recruitment" | "performance" | "employee_relations" | "documents" | "expenses" | "learning" | "reporting" | "ai" | "broadcast" | "assets")[];
  /** Headcount ceiling. Recorded, not enforced. */
  "maxEmployees"?: number;
  "status"?: "active" | "retired";
};

export type AssignPlanDto = {
  /** Plan code, or null to lift all restrictions. */
  "planCode": string | null;
  "subscriptionStatus"?: "trialing" | "active" | "past_due" | "cancelled";
};

export type TenantPlanResponseDto = {
  "tenantId": string;
  "name": string;
  /** Null means unrestricted. */
  "planCode": string | null;
  "subscriptionStatus": "trialing" | "active" | "past_due" | "cancelled";
  "currentPeriodEnd": string | null;
};

export type EntitlementsResponseDto = {
  "planCode": string | null;
  "modules": ("core_hr" | "time_attendance" | "face_attendance" | "leave" | "payroll" | "recruitment" | "performance" | "employee_relations" | "documents" | "expenses" | "learning" | "reporting" | "ai" | "broadcast" | "assets")[];
  /** True when no plan restricts this tenant. */
  "unrestricted": boolean;
};

export type OperatorLoginDto = {
  "email": string;
  "password": string;
};

export type OperatorLoginResponseDto = {
  /** Enrolled: send a code from the authenticator. */
  "mfaRequired"?: boolean;
  /** Not yet enrolled: add `secret` (or scan `otpauthUrl`) to an authenticator, then send a code. */
  "enrolmentRequired"?: boolean;
  /** Single use, and short-lived. */
  "challengeToken": string;
  "expiresInSeconds": number;
  /** The password is temporary: send `newPassword` with the code. */
  "passwordChangeRequired": boolean;
  /** The TOTP secret to enrol. Only on enrolment. */
  "secret"?: string;
  /** otpauth:// URL for a QR code. Only on enrolment. */
  "otpauthUrl"?: string;
};

export type OperatorMfaDto = {
  "challengeToken": string;
  /** A TOTP code, or a recovery code (xxxx-xxxx-xxxx). */
  "code": string;
  /** Required while the password is temporary. At least 12 characters. */
  "newPassword"?: string;
};

export type OperatorProfileDto = {
  "id": string;
  "email": string;
  "name": string;
  "role": "support" | "admin" | "owner";
};

export type OperatorSignedInDto = {
  /** Send as `Authorization: Bearer <token>`. */
  "accessToken": string;
  /** SINGLE USE — refreshing rotates it. */
  "refreshToken": string;
  "operator": OperatorProfileDto;
  /** Only on enrolment, and only ONCE. Each bypasses the authenticator a single time. */
  "recoveryCodes"?: string[];
};

export type OperatorRefreshDto = {
  /** SINGLE USE — refreshing rotates it and the old one stops working. */
  "refreshToken": string;
};

export type OperatorTokenPairDto = {
  /** Send as `Authorization: Bearer <token>`. */
  "accessToken": string;
  /** SINGLE USE — refreshing rotates it. */
  "refreshToken": string;
  "operator": OperatorProfileDto;
};

export type OperatorTenantSummaryDto = {
  "tenantId": string;
  "name": string;
  "status": "provisioning" | "active" | "suspended";
  "region": string;
  /** Null means unrestricted. */
  "planCode": string | null;
  "subscriptionStatus": "trialing" | "active" | "past_due" | "cancelled";
  "createdAt": string | null;
  /** Active clock-in terminals. */
  "devices": number;
  /** Terminals silent for over 4 hours. */
  "silentDevices": number;
};

export type TenantBrandingViewDto = {
  "accentColor": string | null;
  "wordmark": string | null;
};

export type LastPayrollRunDto = {
  "reference": string;
  "status": string;
  "periodEnd": string;
  "payDate": string;
};

export type TenantUsageDto = {
  "companies": number;
  "activeEmployees": number;
  "users": number;
  "lastPayrollRun": LastPayrollRunDto | null;
};

export type OperatorActionViewDto = {
  "action": string;
  "operatorEmail": string;
  "reason": string | null;
  "target": string | null;
  "createdAt": string;
};

export type OperatorTenantDetailDto = {
  "tenantId": string;
  "name": string;
  "status": "provisioning" | "active" | "suspended";
  "region": string;
  /** Null means unrestricted. */
  "planCode": string | null;
  "subscriptionStatus": "trialing" | "active" | "past_due" | "cancelled";
  "createdAt": string | null;
  /** Active clock-in terminals. */
  "devices": number;
  /** Terminals silent for over 4 hours. */
  "silentDevices": number;
  "subdomain": string | null;
  "branding": TenantBrandingViewDto;
  "currentPeriodEnd": string | null;
  /** Null while provisioning. */
  "usage": TenantUsageDto | null;
  /** What operators have done here, newest first. */
  "history": OperatorActionViewDto[];
};

export type ProvisionTenantDto = {
  /** Lowercase letters, numbers and hyphens. */
  "tenantId": string;
  "name": string;
  "subdomain"?: string;
  /** Where the data must live. */
  "region"?: string;
  "ownerEmail": string;
  "ownerFirstName": string;
  "ownerLastName": string;
  "planCode"?: string;
  "subscriptionStatus"?: "trialing" | "active" | "past_due" | "cancelled";
};

export type ProvisionedTenantDto = {
  "tenant": OperatorTenantSummaryDto;
  /** The owner's first password. Shown ONCE — pass it on securely. */
  "ownerTemporaryPassword": string;
};

export type ChangeTenantStatusDto = {
  "reason": string;
};

export type AssignTenantPlanDto = {
  /** Null lifts every restriction. */
  "planCode": string | null;
  "reason"?: string;
};

export type UpdateSubscriptionDto = {
  "subscriptionStatus"?: "trialing" | "active" | "past_due" | "cancelled";
  "currentPeriodEnd"?: string | null;
};

export type OperatorSummaryDto = {
  "id": string;
  "email": string;
  "name": string;
  "role": "support" | "admin" | "owner";
  "isActive": boolean;
  "mfaEnabled": boolean;
  /** Still on a temporary password. */
  "mustChangePassword": boolean;
  "lastLoginAt": string | null;
  "createdAt": string;
};

export type CreateOperatorDto = {
  "email": string;
  "name": string;
  "role": "support" | "admin" | "owner";
};

export type OperatorWithPasswordDto = {
  "operator": OperatorSummaryDto;
  /** Temporary. Shown ONCE; changed at first sign-in. */
  "temporaryPassword": string;
};

export type UpdateOperatorDto = {
  "role"?: "support" | "admin" | "owner";
  /** False deactivates, ending their session at once. */
  "isActive"?: boolean;
};

export type PlatformOverviewDto = {
  "activeTenants": number;
  "suspendedTenants": number;
  "provisioningTenants": number;
  /** Trials whose period ends within 7 days. */
  "trialsEndingSoon": number;
  "pastDue": number;
  /** Terminals silent over 12 hours. */
  "silentDevices": number;
};

export type DependencyHealthDto = {
  "name": string;
  "status": "up" | "down";
  /** Round trip, ms. */
  "latencyMs": number | null;
};

export type QueueHealthDto = {
  "name": string;
  "waiting": number;
  "active": number;
  "delayed": number;
  "failed": number;
  "completed": number;
};

export type DeviceFleetTenantDto = {
  "tenantId": string;
  "name": string;
  "reporting": number;
  /** Silent 4–12 hours. */
  "silentShort": number;
  /** Silent over 12 hours, or never seen. */
  "silentLong": number;
};

export type DeviceFleetDto = {
  "reporting": number;
  "silentShort": number;
  "silentLong": number;
  /** Tenants with a silent terminal first. */
  "byTenant": DeviceFleetTenantDto[];
};

export type PlatformHealthDto = {
  "checkedAt": string;
  "dependencies": DependencyHealthDto[];
  "queues": QueueHealthDto[];
  "devices": DeviceFleetDto;
};

export type BankResponseDto = {
  "_id": string;
  "countryCode": string;
  "name": string;
  /** NIBSS sort code, where it applies. */
  "sortCode"?: string;
  /** What bank files are grouped by. */
  "bankCode": string;
  "swiftCode"?: string;
  /** Whether this bank charges to process a file. */
  "enableBankCharge": boolean;
  "isActive": boolean;
  /** When a whole-list load last wrote it. Unset if only ever added by hand. */
  "syncedAt"?: string | null;
  "syncedFrom"?: "paystack" | "bundled" | null;
};

export type BankCountrySummaryDto = {
  "countryCode": "NG" | "GH" | "KE";
  "total": number;
  /** Offered to tenants. */
  "active": number;
  "syncedAt": string | null;
  "syncedFrom": "paystack" | "bundled" | null;
};

export type BankListSummaryDto = {
  /** Whether this server has a Paystack key, so it can sync from Paystack. */
  "paystackConfigured": boolean;
  /** Every supported country. */
  "countries": BankCountrySummaryDto[];
};

export type SyncBankListDto = {
  "countryCode": "NG" | "GH" | "KE";
};

export type BankLoadResultDto = {
  "countryCode": string;
  "source": "paystack" | "bundled";
  /** How many banks the source listed. */
  "listed": number;
  "inserted": number;
  "updated": number;
  /** Banks left out, with why — usually a name already taken by another code. */
  "skipped": string[];
};

export type CreateBankListDto = {
  "countryCode": "NG" | "GH" | "KE";
  "name": string;
  /** Code used on this country's disbursement files */
  "bankCode": string;
  /** NIBSS sort code (Nigeria) */
  "sortCode"?: string;
  "swiftCode"?: string;
  "enableBankCharge"?: boolean;
};

export type UpdateBankListDto = {
  "name"?: string;
  /** Code used on this country's disbursement files */
  "bankCode"?: string;
  /** NIBSS sort code (Nigeria) */
  "sortCode"?: string;
  "swiftCode"?: string;
  "enableBankCharge"?: boolean;
  "isActive"?: boolean;
};

export type CurrencyResponseDto = {
  "code": string;
  "name": string;
  /** Decimal places (ISO 4217): 0 for JPY, 3 for KWD. */
  "minorUnits": number;
  /** Whether tenants may choose it for new use. */
  "isEnabled": boolean;
  /** Enabled countries whose home currency this is. Such a currency cannot be disabled: new companies there default to it. Close the country to new companies to unlock it. */
  "homeCountries": string[];
  "updatedAt"?: string;
};

export type CurrencySummaryDto = {
  "enabled": number;
  "total": number;
};

export type SetCurrencyEnabledDto = {
  "isEnabled": boolean;
  /** Kept in the operator audit log. */
  "reason"?: string;
};

export type CurrencyChangeResponseDto = {
  "code": string;
  "name": string;
  /** Decimal places (ISO 4217): 0 for JPY, 3 for KWD. */
  "minorUnits": number;
  /** Whether tenants may choose it for new use. */
  "isEnabled": boolean;
  /** Enabled countries whose home currency this is. Such a currency cannot be disabled: new companies there default to it. Close the country to new companies to unlock it. */
  "homeCountries": string[];
  "updatedAt"?: string;
  /** False when it already was so — usually another operator got there first. Nothing was recorded for this request, reason included. */
  "changed": boolean;
};

export type CountryRulePackReadinessDto = {
  "version": number;
  "effectiveFrom": string;
};

export type CountryBankReadinessDto = {
  "total": number;
  "active": number;
};

export type CountryReadinessDto = {
  /** The published rule pack in force today. Null means payroll there cannot run. */
  "rulePack"?: CountryRulePackReadinessDto | null;
  "banks": CountryBankReadinessDto;
};

export type OperatorCountryResponseDto = {
  "code": string;
  "name": string;
  /** New companies there default to it. */
  "currency": string;
  "timezone": string;
  /** Whether new companies may be created there. */
  "isEnabled": boolean;
  "readiness": CountryReadinessDto;
  "updatedAt"?: string;
};

export type SetCountryEnabledDto = {
  "isEnabled": boolean;
  /** Kept in the operator audit log. */
  "reason"?: string;
};

export type CountryChangeResponseDto = {
  "code": string;
  "name": string;
  /** New companies there default to it. */
  "currency": string;
  "timezone": string;
  /** Whether new companies may be created there. */
  "isEnabled": boolean;
  /** Home currencies this change re-enabled. Empty when none was off. */
  "currenciesEnabled": string[];
  /** False when it already was so — usually another operator got there first. Nothing was recorded for this request, reason included. */
  "changed": boolean;
};

export type GovernedFlagResponseDto = {
  /** Null while the structural question behind it is unresolved. */
  "value": boolean | null;
  /** The assumption that decides this. A pack cannot publish while it is unresolved. */
  "assumptionId": string | null;
};

export type RemittanceSpecResponseDto = {
  "scheme": string;
  "authority": string;
};

export type RuleComponentResponseDto = {
  "code": string;
  "name": string;
  "kind": "tax" | "contribution" | "levy" | "relief" | "credit" | "earning";
  "payer": "employee" | "employer";
  /** The base this is computed on. Ordering follows from it. */
  "appliesOn": string;
  "method": "flat" | "percentage" | "bands" | "tiered_cap" | "expression";
  /** Rates, bands, caps and floors — the figures that need sign-off. */
  "parameters": Record<string, unknown>;
  "reducesTaxableIncome": GovernedFlagResponseDto;
  "pensionable": boolean;
  "proratable": boolean;
  "taxExempt": boolean;
  "remittance": RemittanceSpecResponseDto | null;
  "sequence": number;
  "description"?: string;
};

export type SourceReferenceResponseDto = {
  "title": string;
  "citation": string;
  "url": string | null;
  "retrievedAt": string | null;
};

export type StatutoryRulePackResponseDto = {
  "_id": string;
  "countryCode": string;
  "version": number;
  "effectiveFrom": string;
  /** Set when superseded. Superseded packs are never deleted. */
  "effectiveTo": string | null;
  "status": "draft" | "published" | "superseded";
  "currency": string;
  "periodsPerYear": number;
  "components": RuleComponentResponseDto[];
  /** The engine REFUSES a pack whose sign-off is empty. This is the publish gate. */
  "signedOffBy": string | null;
  "signedOffAt": string | null;
  /** Dated citations to primary law. Secondary sources are research, not citations. */
  "sourceReferences": SourceReferenceResponseDto[];
  "provenance": "ported" | "verified" | "provisional";
  "notes"?: string;
};

export type LoadBundledRulePacksDto = {
  "countryCode": string;
};

export type BundledRulePackDto = {
  "effectiveFrom": string;
  "version": number;
  "status": "draft" | "published" | "superseded";
  /** False when a pack starting that day was already there. */
  "created": boolean;
  /** What still stands between a new draft and publishing. */
  "problems": Record<string, unknown>[];
};

export type BundledRulePacksResponseDto = {
  "countryCode": string;
  "packs": BundledRulePackDto[];
};

export type RulePackValidationResponseDto = {
  "valid": boolean;
  /** Every problem, not just the first. An expression referencing an unknown root is refused here rather than resolving to null at runtime and computing a component as zero on every payslip. */
  "problems": Record<string, unknown>[];
};

export type GovernedFlagDto = {
  "value"?: boolean;
  /** Defers this flag to an open structural question, which blocks publishing. */
  "assumptionId"?: string;
};

export type ComponentConditionDto = {
  "when": string;
  "skip"?: boolean;
};

export type RemittanceSpecDto = {
  "scheme": string;
  "authority": string;
  "frequency": string;
  "dueDay"?: number;
  /** How the schedule is grouped for filing — PAYE by tax state, pension by PFA. */
  "groupBy"?: string;
};

export type RuleComponentDto = {
  "code": string;
  "name": string;
  "kind": "earning" | "tax" | "contribution" | "levy" | "relief" | "credit";
  "payer": "employee" | "employer";
  "appliesOn": "salary" | "basic" | "pensionable" | "gross" | "taxableIncome" | "taxPayable";
  "method": "flat" | "percentage" | "bands" | "tiered_cap" | "expression";
  /** Shape is validated per method at publish time, not by this DTO. */
  "parameters": Record<string, unknown>;
  "reducesTaxableIncome"?: GovernedFlagDto;
  "pensionable"?: boolean;
  "proratable"?: boolean;
  /** In gross and in net, out of taxable income. */
  "taxExempt"?: boolean;
  "conditions"?: ComponentConditionDto[];
  "remittance"?: RemittanceSpecDto;
  /** Tie-break within a phase only. */
  "sequence"?: number;
  "description"?: string;
};

export type SourceReferenceDto = {
  "title": string;
  "citation": string;
  "url"?: string;
  "retrievedAt"?: string;
};

export type CreateRulePackDto = {
  "countryCode": string;
  "effectiveFrom": string;
  "currency": string;
  "periodsPerYear"?: number;
  "components"?: RuleComponentDto[];
  "sourceReferences"?: SourceReferenceDto[];
  /** Ported means it agrees with another implementation — a shared assumption. */
  "provenance"?: "ported" | "verified";
  "notes"?: string;
};

export type UpdateRulePackDto = {
  "effectiveFrom"?: string;
  "components"?: RuleComponentDto[];
  "sourceReferences"?: SourceReferenceDto[];
  "periodsPerYear"?: number;
  "notes"?: string;
};

export type PublishRulePackDto = {
  /** Who verified these figures. Defaults to the caller. */
  "signedOffBy"?: string;
  "provenance"?: "ported" | "verified";
  "sourceReferences"?: SourceReferenceDto[];
};

export type AssumptionResolutionResponseDto = {
  "value": boolean;
  "citation": string;
  "resolvedBy": string;
  "resolvedAt": string;
  "parameters": Record<string, unknown> | null;
};

export type StructuralAssumptionResponseDto = {
  "_id": string;
  "assumptionId": string;
  "countryCode": string;
  "question": string;
  "affects": string[];
  "governs": string;
  "state": "unresolved" | "resolved";
  "resolution": AssumptionResolutionResponseDto | null;
  "blocksPublish": boolean;
  /** What the engine assumes meanwhile. Never a substitute for resolving it. */
  "provisionalValue": boolean | null;
  "notes"?: string;
};

export type CreateAssumptionDto = {
  "assumptionId": string;
  "countryCode": string;
  "question": string;
  "affects"?: string[];
  "governs": string;
  "blocksPublish"?: boolean;
  /** A provisional answer for draft packs and golden-case authoring. */
  "provisionalValue"?: boolean;
  "notes"?: string;
};

export type SetProvisionalDto = {
  "value": boolean;
};

export type ResolveAssumptionDto = {
  "value": boolean;
  /** Primary law. A citation is what separates resolved from guessed. */
  "citation": string;
  /** Who verified it. Defaults to the caller. */
  "resolvedBy"?: string;
  /** Extra parameters the answer carries, e.g. concessionary thresholds. */
  "parameters"?: Record<string, unknown>;
};

export type CreateRoleDto = {
  "name": string;
  "description"?: string;
  /** Permission strings from the catalog, `module:action`. A module wildcard (`leave:*`) and the global wildcard (`*:*`) are accepted; anything not in the catalog is refused, so a typo fails at write time rather than silently granting nothing. */
  "permissions": string[];
};

export type RoleResponseDto = {
  "_id": string;
  "name": string;
  "description"?: string;
  /** Strings from the code-owned catalog. Anything else is refused. */
  "permissions": string[];
  /** System roles cannot be edited or deleted — that is how lockout is prevented. */
  "isSystem": boolean;
  "isActive": boolean;
};

export type UpdateRoleDto = {
  "name"?: string;
  "description"?: string;
  /** Permission strings from the catalog, `module:action`. A module wildcard (`leave:*`) and the global wildcard (`*:*`) are accepted; anything not in the catalog is refused, so a typo fails at write time rather than silently granting nothing. */
  "permissions"?: string[];
  /** Deactivating a role revokes it everywhere it is held, without deleting it — so the grant history stays readable. */
  "isActive"?: boolean;
};

export type PermissionGroupDto = {
  "module": string;
  "permissions": string[];
};

export type PermissionCatalogDto = {
  "catalog": PermissionGroupDto[];
  "flat": string[];
};

export type EffectivePermissionsDto = {
  "permissions": string[];
};

export type RegisterPushTokenDto = {
  /** The Expo push token the device reports. */
  "token": string;
  "platform": "ios" | "android";
};

export type PushTokenAckDto = {
  "ok": boolean;
};

export type UnregisterPushTokenDto = {
  "token": string;
};

export type PushCategoryPreferenceResponseDto = {
  "key": "approvals" | "requests" | "pay" | "performance" | "cases" | "announcements" | "other";
  "label": string;
  "enabled": boolean;
};

export type PushPreferencesResponseDto = {
  /** Master switch for push to my phone. */
  "enabled": boolean;
  "categories": PushCategoryPreferenceResponseDto[];
};

export type NotificationPreferencesResponseDto = {
  "push": PushPreferencesResponseDto;
};

export type UpdatePushPreferencesDto = {
  "enabled"?: boolean;
  /** Categories to switch OFF. Replaces the stored list; any category not named is on. */
  "muted"?: ("approvals" | "requests" | "pay" | "performance" | "cases" | "announcements" | "other")[];
};

export type UpdateNotificationPreferencesDto = {
  "push": UpdatePushPreferencesDto;
};

export type NotificationResponseDto = {
  "_id": string;
  "recipientUserId": string;
  "companyId": string | null;
  "type": string;
  "title": string;
  "body": string;
  /** Enough to deep-link to the thing it is about. */
  "data": Record<string, unknown>;
  "channels": string[];
  "status": "pending" | "sent" | "failed";
  "readAt": string | null;
  "sentAt": string | null;
  "failureReason"?: string;
  /** When it was raised. Sent on every read; now declared. */
  "createdAt": string;
};

export type UnreadCountResponseDto = {
  "unread": number;
};

export type MarkedReadResponseDto = {
  /** Notifications moved to read. */
  "updated": number;
};

export type StateAliasResponseDto = {
  "_id": string;
  "alias": string;
};

export type StateResponseDto = {
  "code": string;
  "name": string;
  /** Built-in spellings it is recognised by. */
  "aliases": string[];
  /** This organisation's own spellings. */
  "customAliases": StateAliasResponseDto[];
};

export type CreateStateAliasDto = {
  "countryCode": string;
  /** The state it means — a name or any spelling of one. */
  "state": string;
  "alias": string;
};

export type EmploymentContractResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "employeeId": string;
  "contractType": "permanent" | "fixed_term" | "probationary" | "consultancy" | "internship";
  /** Increments on renewal. Version 1 is never deleted. */
  "version": number;
  "startDate": string;
  /** Null for a permanent contract. */
  "endDate": string | null;
  "probationMonths": number;
  "noticePeriodDays": number;
  "status": "draft" | "active" | "expired" | "terminated" | "superseded";
  /** The version this one replaced, when it came from a renewal. */
  "renewedFromId": string | null;
  "terminationReason"?: string;
  "terminatedOn": string | null;
  /** Terms particular to this contract — allowances, clauses, anything negotiated. */
  "terms": Record<string, unknown>;
};

export type ExpireLapsedResponseDto = {
  /** Contracts moved to `expired` because their end date has passed. */
  "expired": number;
};

export type CreateContractDto = {
  "contractType": "permanent" | "fixed_term" | "probationary" | "consultancy" | "internship";
  "startDate": string;
  /** Required for fixed_term and internship; omit for permanent. */
  "endDate"?: string;
  "probationMonths"?: number;
  "noticePeriodDays"?: number;
  "documentKey"?: string;
  "terms"?: Record<string, unknown>;
};

export type RenewContractDto = {
  "contractType": "permanent" | "fixed_term" | "probationary" | "consultancy" | "internship";
  "startDate": string;
  /** Required for fixed_term and internship; omit for permanent. */
  "endDate"?: string;
  "probationMonths"?: number;
  "noticePeriodDays"?: number;
  "documentKey"?: string;
  "terms"?: Record<string, unknown>;
};

export type TerminateContractDto = {
  "terminatedOn": string;
  "reason": string;
};

export type DepartmentHeadcountNodeResponseDto = {
  "id": string;
  "name": string;
  "code": string;
  "headEmployeeId": string | null;
  /** Employees directly in this department. */
  "headcount": number;
  /** Including every descendant — what a director actually asks for. */
  "totalHeadcount": number;
  /** Sub-departments, nested. */
  "children": DepartmentHeadcountNodeResponseDto[];
};

export type ReportingNodeResponseDto = {
  "id": string;
  "employeeNumber": string;
  "name": string;
  "designationId": string | null;
  "departmentId": string | null;
  "directReports": number;
  "reports": ReportingNodeResponseDto[];
};

export type HeadcountBucketResponseDto = {
  "key": string;
  "count": number;
};

export type OrgSummaryResponseDto = {
  "total": number;
  "active": number;
  "byStatus": HeadcountBucketResponseDto[];
  "byEmploymentType": HeadcountBucketResponseDto[];
};

export type RoutingConditionDto = {
  /** Evaluated against the subject payload by the shared sandboxed evaluator. */
  "when": string;
  "useSteps": string;
};

export type EscalationTargetDto = {
  "approverType": "role" | "reporting_manager" | "department_head" | "grade_above" | "specific_user" | "expression";
  "approverRef"?: string;
  "levels"?: number;
};

export type WorkflowStepDto = {
  "order": number;
  "name": string;
  /** specific_user is fragile — it breaks when that person leaves. Prefer a role or a derived approver. */
  "approverType": "role" | "reporting_manager" | "department_head" | "grade_above" | "specific_user" | "expression";
  /** A role NAME, a user id, or an expression, depending on approverType. */
  "approverRef"?: string;
  /** How far up the reporting line or grade ladder. */
  "levels"?: number;
  /** `any` — the first decision resolves the step. `all` — everyone must approve. */
  "quorum"?: "any" | "all";
  "slaHours"?: number;
  "escalateTo"?: EscalationTargetDto;
  "allowDelegate"?: boolean;
};

export type StepSetDto = {
  /** A set named "default" is required. */
  "name": string;
  "steps": WorkflowStepDto[];
};

export type CreateWorkflowDefinitionDto = {
  "subjectType": string;
  /** Scopes the definition to one company. Omit for tenant-wide. */
  "companyId"?: string;
  "description"?: string;
  "conditions"?: RoutingConditionDto[];
  "stepSets": StepSetDto[];
};

export type RoutingConditionResponseDto = {
  /** Evaluated by the sandboxed AST evaluator — never eval. */
  "when": string;
  "useSteps": string;
};

export type EscalationTargetResponseDto = {
  "approverType": "role" | "reporting_manager" | "department_head" | "grade_above" | "specific_user" | "expression";
  "approverRef"?: string;
  "levels": number;
};

export type WorkflowStepResponseDto = {
  "order": number;
  "name": string;
  /** How the approver is found. Never a hardcoded person. */
  "approverType": "role" | "reporting_manager" | "department_head" | "grade_above" | "specific_user" | "expression";
  /** The role name, user id, or grade level the type resolves against. */
  "approverRef"?: string;
  /** How far up the reporting line to walk. */
  "levels": number;
  /** `all` needs every resolved approver; `any` needs one. */
  "quorum": "any" | "all";
  /** Deadline in hours; approvers are reminded halfway. At the deadline the step escalates, or the request expires if there is no escalation target. Null means no deadline. */
  "slaHours": number | null;
  /** Added as an approver alongside the current ones when the deadline passes. Null means the request expires at the deadline instead. */
  "escalateTo": EscalationTargetResponseDto | null;
  /** Whether an out-of-office delegate may act here. */
  "allowDelegate": boolean;
};

export type StepSetResponseDto = {
  "name": string;
  "steps": WorkflowStepResponseDto[];
};

export type WorkflowDefinitionResponseDto = {
  "_id": string;
  /** Null for the tenant-wide definition; set when a company overrides it. */
  "companyId": string | null;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  /** What this governs. A module starts a workflow by naming one of these. */
  "subjectType": string;
  /** Editing publishes a new version. */
  "version": number;
  "description"?: string;
  /** First match wins; the default set is used when none match. */
  "conditions": RoutingConditionResponseDto[];
  "stepSets": StepSetResponseDto[];
  "isActive": boolean;
};

export type SubjectFieldResponseDto = {
  /** Read by a condition as `subject.<field>`. */
  "field": string;
  "label": string;
  /** `money` is integer minor units (kobo, pesewas, cents). */
  "type": "number" | "money" | "boolean" | "string" | "date" | "enum";
  /** Allowed values, for `enum`. */
  "values"?: string[];
  "description"?: string;
};

export type SubjectDescriptorResponseDto = {
  "subjectType": string;
  "label": string;
  "description": string;
  /** False when no module starts requests of this type yet — nothing routes through it. */
  "connected": boolean;
  "fields": SubjectFieldResponseDto[];
};

export type ApproverTypeResponseDto = {
  "value": "role" | "reporting_manager" | "department_head" | "grade_above" | "specific_user" | "expression";
  "label": string;
  "description": string;
  /** What `approverRef` holds for this type. Absent when it takes none. */
  "ref"?: "role_name" | "user_id" | "expression";
  /** Whether `levels` changes anything for this type. */
  "usesLevels": boolean;
};

export type WorkflowMetadataResponseDto = {
  "subjects": SubjectDescriptorResponseDto[];
  "approverTypes": ApproverTypeResponseDto[];
};

export type SimulateWorkflowDto = {
  "subjectType": string;
  /** Who is raising the request. Approvers are resolved relative to them. */
  "employeeId": string;
  /** The values the request would carry — what routing conditions read as `subject.*`. */
  "payload"?: Record<string, unknown>;
  /** An unsaved definition to test instead of the active one. Validated as if saved. */
  "draft"?: CreateWorkflowDefinitionDto;
};

export type ConditionErrorResponseDto = {
  "when": string;
  "error": string;
};

export type SimulatedApproverResponseDto = {
  "userId": string;
  "name": string;
  "email": string;
};

export type SimulatedStepResponseDto = {
  "order": number;
  "name": string;
  "approverType": string;
  "approverRef"?: string;
  "levels": number;
  "quorum": "any" | "all";
  "slaHours": number | null;
  "approvers": SimulatedApproverResponseDto[];
  /** Why nobody could be resolved. A live request would block at this step. */
  "blockedReason": string | null;
};

export type WorkflowSimulationResponseDto = {
  "source": "draft" | "saved";
  /** The saved version tested; null for a draft. */
  "definitionVersion": number | null;
  /** True when the company's own definition applies, not the tenant-wide one. */
  "companyScoped": boolean;
  "stepSetName": string;
  /** The condition that chose the step set; null when the default was used. */
  "matchedCondition": string | null;
  /** Conditions that failed to evaluate, or pointed at a missing step set. They are skipped. */
  "conditionErrors": ConditionErrorResponseDto[];
  /** Every step resolved now. A live request resolves each step when it reaches it, so later steps can differ if the organization changes in between. */
  "steps": SimulatedStepResponseDto[];
  /** True when any step resolved nobody. */
  "wouldBlock": boolean;
};

export type WorkflowInstanceResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "definitionId": string;
  /** The version in force when this started. */
  "definitionVersion": number;
  "stepSetName": string;
  /** SNAPSHOTTED at start. A definition edited afterwards does not change the chain a live request is already moving through. */
  "resolvedSteps": WorkflowStepResponseDto[];
  "subjectType": string;
  "subjectId": string;
  /** The EMPLOYEE who requested it — reporting-line resolution depends on this. */
  "requestedBy": string;
  "requestedByUserId": string | null;
  "currentStepOrder": number;
  /** Who may act right now. */
  "currentApprovers": string[];
  /** Who already has, at this step. */
  "currentStepApprovals": string[];
  "state": "pending" | "approved" | "rejected" | "returned" | "blocked" | "cancelled" | "expired";
  /** Why it blocked. Blocking beats auto-approving when no approver can be found. */
  "blockedReason"?: string;
  "payload": Record<string, unknown>;
  "dueAt": string | null;
  "completedAt": string | null;
  /** Whether the originating module has applied the decision’s effect yet. */
  "outcomeApplied": boolean;
  /** True once any step was decided by override rather than by its approvers. */
  "overridden": boolean;
  /** The requesting employee’s name. Present on reads. */
  "requesterName"?: string | null;
  /** Names of `currentApprovers`, in the same order. Present on reads. */
  "currentApproverNames"?: string[];
  /** Deciding needs a code from the approver’s authenticator app. Present on reads. */
  "requiresStepUp"?: boolean;
  /** Rejecting or returning needs a reason. Present on reads. */
  "requiresComment"?: boolean;
};

export type StartWorkflowDto = {
  "subjectType": string;
  "subjectId": string;
  /** The employee the request is about */
  "requestedBy": string;
  "payload"?: Record<string, unknown>;
};

export type WorkflowDecisionResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "instanceId": string;
  "stepOrder": number;
  "stepName": string;
  "actorId": string;
  "actorEmail"?: string;
  /** Set when a delegate acted. Both people are on the record, not just the delegate. */
  "onBehalfOf": string | null;
  "decision": "approved" | "rejected" | "returned" | "delegated" | "cancelled";
  "comment"?: string;
  /** True when an SLA escalation moved it on. */
  "viaEscalation": boolean;
  /** True when someone decided the step in place of its assigned approvers. The comment is the reason. */
  "overridden": boolean;
  /** The approvers an override went around. */
  "bypassedApprovers": string[];
  /** Who decided. Present on reads. */
  "actorName"?: string;
  /** Whose authority a delegate used. Present on reads. */
  "onBehalfOfName"?: string | null;
};

export type BulkDecideDto = {
  /** A rejection at any step ends the whole request. */
  "decision": "approved" | "rejected" | "returned";
  "comment"?: string;
  /** A code from your authenticator app (or a recovery code). Needed to decide a request whose subject asks for it, such as a payroll approval. */
  "otp"?: string;
  /** Requests to decide. Each is checked on its own; one failing does not stop the rest. */
  "instanceIds": string[];
};

export type BulkDecisionFailureResponseDto = {
  "instanceId": string;
  "reason": string;
};

export type BulkDecisionResponseDto = {
  /** Requests decided. */
  "succeeded": string[];
  /** Requests left as they were, and why. */
  "failed": BulkDecisionFailureResponseDto[];
};

export type DecideDto = {
  /** A rejection at any step ends the whole request. */
  "decision": "approved" | "rejected" | "returned";
  "comment"?: string;
  /** A code from your authenticator app (or a recovery code). Needed to decide a request whose subject asks for it, such as a payroll approval. */
  "otp"?: string;
};

export type OverrideDecisionDto = {
  /** Decides the whole current step, whatever its quorum. A rejection ends the request, as it would for an approver. */
  "decision": "approved" | "rejected" | "returned";
  /** Why the assigned approvers were bypassed. Kept on the record and sent to them. */
  "reason": string;
  /** A code from your authenticator app (or a recovery code). Needed to decide a request whose subject asks for it, such as a payroll approval. */
  "otp"?: string;
};

export type CancelWorkflowDto = {
  "reason"?: string;
};

export type DelegationResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "delegatorUserId": string;
  "delegateUserId": string;
  "fromDate": string;
  "toDate": string;
  "reason"?: string;
  "isActive": boolean;
};

export type CreateDelegationDto = {
  /** Who may act on your approvals while you are away. */
  "delegateUserId": string;
  /** Business date, inclusive */
  "fromDate": string;
  /** Business date, inclusive */
  "toDate": string;
  "reason"?: string;
};

export type MyProfileResponseDto = {
  "_id": string;
  /** The legal entity this employee belongs to. */
  "companyId": string;
  /** Issued from the company sequence. */
  "employeeNumber": string;
  /** The enrolment number a biometric terminal knows this person by. */
  "biometricId": string | null;
  /** The linked login, when employee self-service is enabled. Null when it is not. */
  "userId": string | null;
  "status": "pending" | "active" | "on_leave" | "suspended" | "exited";
  "firstName": string;
  "middleName"?: string;
  "lastName": string;
  /** Sensitive — omitted without employee:read_sensitive. */
  "dateOfBirth"?: string;
  "gender": "male" | "female" | "other" | "undisclosed";
  "maritalStatus": string;
  "nationality"?: string;
  "stateOfOrigin"?: string;
  "personalEmail"?: string;
  "workEmail": string;
  "phone": string;
  "alternatePhone"?: string;
  "residentialAddress"?: string;
  "nextOfKin"?: NextOfKinResponseDto | null;
  "dependants": DependantResponseDto[];
  "branchId": string;
  "departmentId": string;
  "designationId": string;
  "gradeId": string;
  /** The employee this person reports to. Null at the top of the reporting line. */
  "managerId": string | null;
  "employmentType": "full_time" | "part_time" | "contract" | "intern" | "nysc" | "consultant";
  /** ISO date, YYYY-MM-DD. */
  "hireDate": string;
  "probationEndDate"?: string;
  "confirmationDate"?: string;
  "exitDate"?: string;
  "workLocation": "onsite" | "remote" | "hybrid";
  /** The CURRENT compensation record. Payroll resolves the record effective on the period end date rather than following this pointer, which is a convenience for reads. */
  "compensationId": string | null;
  /** Sensitive. Absent means the caller is not entitled, not that none is on file. */
  "bank"?: BankDetailsResponseDto | null;
  /** Sensitive. Absent means the caller is not entitled, not that none are recorded. */
  "statutoryIds"?: StatutoryIdResponseDto[];
  /** Annual rent paid, in INTEGER MINOR UNITS (kobo, pesewas, cents). Feeds Nigerian rent relief. Sensitive. Absent means the caller is not entitled; null means none was recorded and a recorded zero means no relief applies — three different things. */
  "annualRentPaid"?: number | null;
  /** False excludes this employee from payroll runs. */
  "isPayrollActive": boolean;
  "taxExempt": boolean;
  "taxExemptReason"?: string;
  "pensionExempt": boolean;
  "nhfExempt": boolean;
  /** Voluntary pension rates, percent of pensionable pay. Null when none. */
  "voluntaryPension": VoluntaryPensionResponseDto | null;
  /** State of residence. Nigeria remits PAYE to the tax authority of this state, so it is payroll-relevant rather than demographic. */
  "taxState"?: string;
  "createdAt": string;
  "updatedAt": string;
  "branchName": string | null;
  "departmentName": string | null;
  /** The designation's title — what an employee calls their job. */
  "designationName": string | null;
};

export type MyCompanyResponseDto = {
  /** The company this request is acting in — the one named, or the default worked out when none is. What a company switcher should show as current. */
  "id": string;
  "name": string;
  "countryCode": string;
  "currency": string;
  "timezone": string;
  /** Days of the week the company works, **0 = Sunday** through 6 = Saturday — the JavaScript convention, not ISO. Six-day weeks are common in retail, so a client must read this rather than assume Monday to Friday. */
  "workDays": number[];
  /** Payslips for periods before this month can be looked up on the legacy payroll platform (GET /me/payslips/legacy). Null when there is no such lookup. */
  "earlierPayslipsBefore": string | null;
};

export type ColleagueResponseDto = {
  "_id": string;
  "employeeNumber": string;
  "firstName": string;
  "lastName": string;
};

export type RequestProfileChangeDto = {
  "phone"?: string;
  "alternatePhone"?: string;
  "personalEmail"?: string;
  "residentialAddress"?: string;
  "maritalStatus"?: "single" | "married" | "divorced" | "widowed" | "undisclosed";
  "nextOfKin"?: NextOfKinDto;
  "dependants"?: DependantDto[];
  /** Always requires approval. An employee changing their own account unreviewed is the classic payroll-fraud path. */
  "bank"?: BankDetailsDto;
  "reason"?: string;
};

export type ProfileChangeRequestResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "employeeId": string;
  "requestedByUserId": string;
  /** What was asked for. Nothing is written to the record until approval. */
  "changes": Record<string, unknown>;
  /** The values at the time of asking, so an approver can see the difference. */
  "previous": Record<string, unknown>;
  "status": "pending" | "applied" | "rejected" | "cancelled";
  "workflowInstanceId": string | null;
  "appliedAt": string | null;
  "reason"?: string;
};

export type CancelProfileChangeDto = {
  "reason"?: string;
};

export type DataExportSubjectResponseDto = {
  "employeeNumber": string;
  "name": string;
};

export type DataExportResponseDto = {
  "generatedAt": string;
  "subject": DataExportSubjectResponseDto;
  "employee": Record<string, unknown>;
  "compensationHistory": Record<string, unknown>[];
  "lifecycleHistory": Record<string, unknown>[];
  "profileChangeRequests": Record<string, unknown>[];
};

export type SearchEmployeeHitDto = {
  "id": string;
  "name": string;
  "employeeNumber": string;
  "status": string;
};

export type SearchRequestHitDto = {
  "id": string;
  "label": string;
  "requesterName": string | null;
  "state": string;
  "createdAt": string;
  /** The approvals list it opens in: waiting on you, raised by you, or oversight. */
  "view": "inbox" | "mine" | "all";
};

export type SearchCaseHitDto = {
  "id": string;
  "reference": string;
  "title": string;
  "caseType": string;
  "stage": string;
};

export type SearchResponseDto = {
  "employees": SearchEmployeeHitDto[];
  "requests": SearchRequestHitDto[];
  "cases": SearchCaseHitDto[];
};

export type SetupCheckResponseDto = {
  "key": string;
  "label": string;
  "done": boolean;
  /** Where in the console this is put right. Null when the tenant cannot fix it alone. */
  "href": string | null;
};

export type SetupStepResponseDto = {
  "key": string;
  "title": string;
  "description": string;
  /** Optional steps may be skipped; required ones cannot. */
  "required": boolean;
  "status": "done" | "todo" | "skipped";
  "href": string;
  "checks": SetupCheckResponseDto[];
};

export type SetupProgressResponseDto = {
  /** Steps done or skipped. */
  "done": number;
  "total": number;
};

export type SetupStatusResponseDto = {
  /** The company these steps describe. Null before the first company exists. */
  "companyId": string | null;
  "steps": SetupStepResponseDto[];
  "progress": SetupProgressResponseDto;
  /** Every required step is done. */
  "complete": boolean;
};

export type CopySetupDto = {
  /** The company to copy from. The target is the company in x-company-id. */
  "fromCompanyId": string;
  "include": ("branches" | "departments" | "grades" | "pay_structures" | "designations" | "leave" | "holidays" | "shifts" | "document_types" | "expense_policies")[];
  /** Report what would be copied, and write nothing. */
  "dryRun"?: boolean;
};

export type CopySetupKindResultDto = {
  "kind": "branches" | "departments" | "grades" | "pay_structures" | "designations" | "leave_types" | "leave_policies" | "holidays" | "shifts" | "document_types" | "expense_policies";
  "label": string;
  /** Copied, or — on a dry run — would be. */
  "copied": number;
  /** Left alone: the target already has one with the same code. */
  "alreadyThere": number;
  /** What was left out or changed on the way, one line each. */
  "notes": string[];
};

export type CopySetupResponseDto = {
  "dryRun": boolean;
  "results": CopySetupKindResultDto[];
  /** Things to review after copying, such as amounts in the other company’s currency. */
  "warnings": string[];
};

export type PayStructureComponentDto = {
  "code": string;
  "name": string;
  "method": "percentage" | "flat";
  /** A fraction of salary for percentage; integer minor units for flat. */
  "value": number;
  /** True divides the salary between components; false adds on top of it. */
  "partition"?: boolean;
  /** Absorbs any shortfall when partitions do not total the salary. */
  "remainder"?: boolean;
  /** Counts toward the pensionable base. */
  "pensionable"?: boolean;
  "proratable"?: boolean;
  /** In gross and net, out of taxable income. */
  "taxExempt"?: boolean;
  "sequence"?: number;
};

export type CreatePayStructureDto = {
  "name": string;
  "code": string;
  "components": PayStructureComponentDto[];
  "gradeIds"?: string[];
  /** The company-wide fallback. Exactly one per company. */
  "isDefault"?: boolean;
  "status"?: "active" | "inactive";
  "description"?: string;
};

export type PayStructureComponentResponseDto = {
  "code": string;
  "name": string;
  "method": "percentage" | "flat";
  /** A 0–1 fraction of salary for `percentage`; integer minor units for `flat`. */
  "value": number;
  /** Partition components divide the gross between them and must total it exactly. */
  "partition": boolean;
  /** Takes whatever is left after the others. At most one per structure. */
  "remainder": boolean;
  /** Counts toward the pension base. */
  "pensionable": boolean;
  /** Reduced for a part-period joiner or leaver. */
  "proratable": boolean;
  "taxExempt": boolean;
  /** Evaluation order. Lower runs first. */
  "sequence": number;
};

export type PayStructureResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "name": string;
  /** Unique within the company. */
  "code": string;
  "components": PayStructureComponentResponseDto[];
  /** Grades this applies to. Empty means all. */
  "gradeIds": string[];
  /** Used when a grade names no structure of its own. */
  "isDefault": boolean;
  "status": "active" | "inactive";
  "description"?: string;
};

export type UpdatePayStructureDto = {
  "name"?: string;
  "components"?: PayStructureComponentDto[];
  "gradeIds"?: string[];
  "isDefault"?: boolean;
  "status"?: "active" | "inactive";
  "description"?: string;
};

export type CreateComponentTargetingDto = {
  "componentCode": string;
  "gradeIds"?: string[];
  "departmentIds"?: string[];
  "designationIds"?: string[];
  "employeeIds"?: string[];
  "employmentTypes"?: string[];
  /** Inverts the match: the criteria describe who is EXCLUDED. */
  "exclude"?: boolean;
  "note"?: string;
};

export type ComponentTargetingResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "componentCode": string;
  "gradeIds": string[];
  "departmentIds": string[];
  "designationIds": string[];
  "employeeIds": string[];
  "employmentTypes": string[];
  /** Inverts the rule: everyone matched is EXCLUDED from the component instead. */
  "exclude": boolean;
  "status": "active" | "inactive";
  "note"?: string;
};

export type CreatePayrollRunDto = {
  "periodStart": string;
  /** Everything date-sensitive resolves against this, never the clock. */
  "periodEnd": string;
  "payDate": string;
  "runType"?: "regular" | "off_cycle" | "bonus" | "final_settlement";
  /** Limits the run to specific employees. Omit for the whole company. */
  "employeeIds"?: string[];
  "note"?: string;
};

export type ApprovalTrackResponseDto = {
  "status": "pending" | "approved" | "rejected" | "cancelled";
  "workflowInstanceId": string | null;
  "decidedAt": string | null;
};

export type RunApprovalsResponseDto = {
  /** Salaries, for the bank. */
  "bank": ApprovalTrackResponseDto | null;
  /** PAYE, pension and NHF. */
  "statutory": ApprovalTrackResponseDto | null;
};

export type RunReleaseResponseDto = {
  "_id": string;
  "employeeIds": string[];
  "status": "pending" | "approved" | "rejected" | "cancelled";
  "workflowInstanceId": string | null;
  "requestedBy": string;
  "requestedAt": string;
  "decidedAt": string | null;
};

export type CalculationProgressResponseDto = {
  /** Payslips computed so far. */
  "done": number;
  /** Payslips this run will produce. */
  "total": number;
  /** What it is doing now, in words a person can read. */
  "phase": string | null;
  "startedAt": string | null;
};

export type RulePackSnapshotResponseDto = {
  "rulePackId": string;
  "countryCode": string;
  "version": number;
  "effectiveFrom": string;
  "currency": string;
  "periodsPerYear": number;
  /** The period this was resolved FOR, not when it ran. */
  "resolutionDate": string;
  "snapshotAt": string;
  /** The engine that produced the figures. A payslip re-read years later shows this. */
  "engineVersion": string;
};

export type RunTotalsResponseDto = {
  "employees": number;
  /** Integer minor units. */
  "gross": number;
  /** Everything but tax. Integer minor units. */
  "totalDeductions": number;
  /** Integer minor units. */
  "totalTax": number;
  /** Integer minor units. */
  "netPay": number;
  /** Gross plus employer contributions. Integer minor units. */
  "employerCost": number;
  /** Unrecovered deductions carried to next period. */
  "carriedForward": number;
};

export type RunProblemResponseDto = {
  /** The employee it concerns, or `$company` for a whole-entity problem. */
  "employeeNumber": string;
  "message": string;
};

export type PayrollRunResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  /** Unique within the company. */
  "reference": string;
  "runType": "regular" | "off_cycle" | "bonus" | "final_settlement";
  /** Where the figures come from: pay structures, or an uploaded schedule. */
  "method": "structure" | "schedule";
  /** When a schedule was last confirmed or discarded. */
  "inputsChangedAt": string | null;
  /** A schedule run's two approvals. Null for a structure run, which has one. */
  "approvals": RunApprovalsResponseDto | null;
  /** Held employees released for payment after salary approval. */
  "releases": RunReleaseResponseDto[];
  "periodStart": string;
  "periodEnd": string;
  "payDate": string;
  /** Moves one way. A locked run is never edited — a correction is an off-cycle run with an adjusting entry. */
  "status": "draft" | "calculating" | "calculated" | "in_review" | "approved" | "locked" | "paid" | "cancelled";
  /** Set only while `calculating`. Poll this endpoint to follow it. */
  "progress": CalculationProgressResponseDto | null;
  "currency": string;
  /** Taken ONCE before any employee is computed, so the whole run uses one law. */
  "rulePackSnapshot": RulePackSnapshotResponseDto | null;
  "totals": RunTotalsResponseDto;
  "preflightProblems": RunProblemResponseDto[];
  /** When preflightProblems were found. Fixes made since are not reflected until it runs again. */
  "preflightCheckedAt": string | null;
  /** Raised during calculation. These do not stop the run; they are reported on it. */
  "exceptions": RunProblemResponseDto[];
  "workflowInstanceId": string | null;
  "calculatedAt": string | null;
  "approvedAt": string | null;
  "lockedAt": string | null;
  "paidAt": string | null;
  /** What finance recorded when the bank confirmed. Required to mark a run paid. */
  "bankReference": string | null;
  "note"?: string;
};

export type PreflightResponseDto = {
  "ok": boolean;
  /** Every blocking problem, not just the first — one pass should fix them all. */
  "problems": RunProblemResponseDto[];
  "checkedAt": string;
};

export type PayslipLineResponseDto = {
  "componentCode": string;
  "name": string;
  /** Reliefs and credits are `informational` — shown, never deducted. `employer_cost` is paid by the employer on top of pay. */
  "type": "earning" | "deduction" | "employer_cost" | "informational";
  /** Integer minor units. Always positive — `type` carries the direction. */
  "amount": number;
  "appliesOn": string | null;
  /** What the method was applied to, in minor units. */
  "base": number | null;
  "method": string;
  /** The rates, caps and bands this line used, as they stood at calculation. */
  "parameters": Record<string, unknown>;
  /** The line in words. This is what a payslip trace shows a person. */
  "computation": string;
  "reducesTaxableIncome": boolean;
  "taxExempt": boolean;
  "payer": "employee" | "employer";
  /** Which rule pack component produced this line. */
  "ruleRef": Record<string, unknown> | null;
  /** Set when the line came from an arrears input. */
  "relatesToPeriod"?: string | null;
};

export type PayslipResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "payrollRunId": string;
  "employeeId": string;
  "employeeNumber": string;
  "name": string;
  "periodStart": string;
  "periodEnd": string;
  "currency": string;
  "gross": number;
  "totalDeductions": number;
  "totalTax": number;
  "netPay": number;
  "employerCost": number;
  "taxableIncome": number;
  "preTaxDeductions": number;
  "reliefs": number;
  "taxCredits": number;
  "carriedForward": number;
  /** State of residence when calculated — where its PAYE goes. */
  "taxState": string | null;
  /** When the employee could first see it. Null until the run is locked. */
  "releasedAt": string | null;
  /** The full calculation trace, line by line, naming the rule behind each figure. Stored, not recomputed — re-reading this in 2029 shows the same numbers whatever the rates are by then. */
  "lines": PayslipLineResponseDto[];
  "warnings": string[];
  "exceptions": string[];
  /** Set for a joiner or leaver paid for part of the period. */
  "proration": Record<string, unknown> | null;
};

export type RunInputPersonDto = {
  "employeeId": string;
  "employeeNumber": string;
  "name": string;
  /** The date that puts them on this list: hired, left, or new pay effective. */
  "date": string;
};

export type RunLeaverDto = {
  "employeeId": string;
  "employeeNumber": string;
  "name": string;
  /** The date that puts them on this list: hired, left, or new pay effective. */
  "date": string;
  /** Whether a final-settlement run already includes them. A leaver is not in a regular run, so one without a settlement is someone not yet paid for their last days. */
  "hasFinalSettlement": boolean;
};

export type RunAttendanceInputDto = {
  /** Days recorded absent, across everyone in the run. */
  "absentDays": number;
  /** People with at least one absent day; their pay is reduced. */
  "employeesWithAbsence": number;
  /** Overtime minutes recorded in the period, all kinds. */
  "overtimeMinutes": number;
  /** People with recorded overtime. */
  "employeesWithOvertime": number;
};

export type RunLoanInputDto = {
  /** Instalments due this period from people in the run. */
  "instalments": number;
  /** Their total. Integer minor units. */
  "total": number;
};

export type RunInputsResponseDto = {
  "method": "structure" | "schedule";
  /** People the calculation will pay. */
  "population": number;
  /** Hired during the period: paid pro rata. */
  "joiners": RunInputPersonDto[];
  /** Left during the period: NOT in this run; paid by a final settlement. */
  "leavers": RunLeaverDto[];
  /** Pay changed with effect during the period. Empty for a schedule run. */
  "payChanges": RunInputPersonDto[];
  /** Null for a schedule run. */
  "attendance": RunAttendanceInputDto | null;
  "loans": RunLoanInputDto;
};

export type VarianceLineResponseDto = {
  "employeeNumber": string;
  "name": string;
  /** Integer minor units. */
  "previousNet": number;
  /** Integer minor units. */
  "currentNet": number;
  /** Signed. Integer minor units. */
  "delta": number;
  /** Signed percentage change against the previous period. */
  "percentChange": number;
  /** Why it moved, where the system can tell. */
  "reason": string;
};

export type MarkPaidDto = {
  /** Links this run to the money that actually moved. */
  "bankReference": string;
};

export type PayslipGenerationResponseDto = {
  /** PDFs rendered on this pass. */
  "generated": number;
  /** Already had a document. Re-running is safe and does not re-render. */
  "skipped": number;
  /** One failure does not abort the rest — the others still get their payslip. */
  "failed": Record<string, unknown>[];
};

export type CancelPayrollRunDto = {
  "reason": string;
};

export type VerificationFindingResponseDto = {
  /** `$run` for a whole-run finding. */
  "employeeNumber": string;
  "where": string;
  "stored": number;
  "recomputed": number;
  "message": string;
};

export type PayrollVerificationResponseDto = {
  "reference": string;
  "rulePackVersion": number | null;
  "engineVersion": string | null;
  "payslipsChecked": number;
  /** Lines re-executed against the snapshot. Band-method lines are counted separately from this because reimplementing the band walk here would be a second engine. */
  "linesChecked": number;
  "reproduces": boolean;
  "findings": VerificationFindingResponseDto[];
};

export type SettlementLoanResponseDto = {
  "reference": string;
  "loanType": string;
  /** Integer minor units. */
  "outstanding": number;
};

export type SettlementLeaveResponseDto = {
  "leaveTypeCode": string;
  "leaveTypeName": string;
  "days": number;
  /** Integer minor units. Zero when not encashable. */
  "value": number;
  "encashable": boolean;
  /** Non-encashable types are still listed. A silent omission is not an answer. */
  "reason": string;
};

export type FinalSettlementResponseDto = {
  "employeeId": string;
  "employeeNumber": string;
  "name": string;
  "exitDate": string | null;
  "currency": string;
  /** Monthly gross over ~21.67 working days. */
  "dailyRate": number;
  "loansToRecover": SettlementLoanResponseDto[];
  "totalLoanRecovery": number;
  "leave": SettlementLeaveResponseDto[];
  "totalEncashment": number;
  /** Encashment minus recovery. Negative means they owe the employer. */
  "netBeforePay": number;
  /** Anything the reader has to know to use these figures — that the employee has not exited yet, that recovery exceeds encashment, that notice pay is not included. */
  "notes": string[];
};

export type LegacyPayslipLineResponseDto = {
  "label": string;
  /** Minor units. */
  "amount": number;
};

export type LegacyPayslipResponseDto = {
  "period": string;
  "name": string;
  "company": string | null;
  "state": string | null;
  "bankName": string | null;
  /** Last four digits only. */
  "accountNumber": string;
  /** Minor units. */
  "basic": number;
  "earnings": LegacyPayslipLineResponseDto[];
  "deductions": LegacyPayslipLineResponseDto[];
  /** Minor units. */
  "gross": number;
  /** Minor units. */
  "net": number;
  "workDays": number;
  "absentDays": number;
};

export type MyPayslipLineResponseDto = {
  "componentCode": string;
  "name": string;
  /** Reliefs and credits are `informational` — shown, never deducted. `employer_cost` is paid by the employer on top of pay. */
  "type": "earning" | "deduction" | "employer_cost" | "informational";
  /** Integer minor units, never zero. Always positive — `type` carries the direction. */
  "amount": number;
  /** Set when the line is arrears for an earlier period. */
  "relatesToPeriod"?: string | null;
};

export type MyPayslipResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "payrollRunId": string;
  "employeeId": string;
  "employeeNumber": string;
  "name": string;
  "periodStart": string;
  "periodEnd": string;
  "currency": string;
  "gross": number;
  "totalDeductions": number;
  "totalTax": number;
  "netPay": number;
  "employerCost": number;
  "taxableIncome": number;
  "preTaxDeductions": number;
  "reliefs": number;
  "taxCredits": number;
  "carriedForward": number;
  /** State of residence when calculated — where its PAYE goes. */
  "taxState": string | null;
  /** When the employee could first see it. Null until the run is locked. */
  "releasedAt": string | null;
  /** Set for a joiner or leaver paid for part of the period. */
  "proration": Record<string, unknown> | null;
  /** Lines that came to nothing are left out. */
  "lines": MyPayslipLineResponseDto[];
};

export type OutputSummaryResponseDto = {
  "bankSchedules": number;
  "remittanceSchedules": number;
  /** People with a payslip but no bank file. They must be settled by hand. */
  "excludedFromDisbursement": number;
  "exceptions": number;
};

export type BankScheduleEntryResponseDto = {
  "employeeId": string;
  "employeeNumber": string;
  "accountName": string;
  "accountNumber": string;
  /** Integer minor units. */
  "amount": number;
  "narration": string;
  "reference": string | null;
};

export type BankScheduleResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "payrollRunId": string;
  "bankListId": string | null;
  "bankName": string;
  "bankCode": string;
  "sortCode": string | null;
  "currency": string;
  "entries": BankScheduleEntryResponseDto[];
  /** Integer minor units. */
  "totalAmount": number;
  "entryCount": number;
  /** What the bank charges to process the file. */
  "bankCharges": number;
};

export type RemittancePayeeResponseDto = {
  "bankName": string | null;
  "accountNumber": string;
  "accountName": string;
};

export type RemittanceEntryResponseDto = {
  "employeeId": string;
  "employeeNumber": string;
  "name": string;
  /** The identifier the authority knows this person by — an RSA PIN, a TIN. */
  "schemeIdentifier": string | null;
  /** Integer minor units. */
  "employeeAmount": number;
  /** Integer minor units. */
  "employerAmount": number;
};

export type RemittanceScheduleResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "payrollRunId": string;
  "scheme": string;
  "authority": string;
  /** What the schedule is split by, when one scheme needs several files. */
  "groupBy": string | null;
  "groupValue": string | null;
  /** What the group is called: a PFA’s name for its code. */
  "groupName": string | null;
  /** The company’s employer code with the PFA. */
  "employerCode": string | null;
  /** Where to pay it. */
  "payee": RemittancePayeeResponseDto | null;
  "entries": RemittanceEntryResponseDto[];
};

export type ExceptionReportEntryResponseDto = {
  "employeeNumber": string;
  "name": string;
  "category": string;
  /** Written to be read by the person who has to fix it. */
  "message": string;
};

export type ApplyForLoanOnBehalfDto = {
  /** Integer minor units. */
  "principal": number;
  "termMonths": number;
  /** The period the first instalment falls due. */
  "firstRepaymentPeriod": string;
  "loanType"?: "loan" | "salary_advance";
  /** Annual nominal rate as a fraction. */
  "annualRate"?: number;
  "interestMethod"?: "zero" | "flat" | "reducing_balance";
  "purpose"?: string;
  "employeeId": string;
};

export type LoanInstalmentResponseDto = {
  "number": number;
  /** The payroll period this falls due in. */
  "period": string;
  /** Integer minor units. */
  "principal": number;
  "interest": number;
  "total": number;
  "balanceAfter": number;
  /** Set when a payroll run actually posted it — not when it was calculated. */
  "paid": boolean;
  "paidInRunId": string | null;
  "paidAt": string | null;
};

export type LoanResponseDto = {
  "_id": string;
  /** The legal entity this record belongs to. */
  "companyId": string;
  /** The user who created it. Null for records the system created. */
  "createdBy": string | null;
  "createdAt": string;
  "updatedAt": string;
  "employeeId": string;
  "reference": string;
  "loanType": string;
  "currency": string;
  /** Integer minor units. */
  "principal": number;
  /** A rate, not a percentage. */
  "annualRate": number;
  "interestMethod": "flat" | "reducing_balance" | "zero";
  "termMonths": number;
  "firstRepaymentPeriod": string;
  "status": "pending" | "approved" | "active" | "settled" | "rejected" | "cancelled" | "written_off";
  /** The schedule. It must close at exactly zero or it is refused at creation. */
  "instalments": LoanInstalmentResponseDto[];
  "totalInterest": number;
  "totalRepayable": number;
  /** Still to repay, in minor units. */
  "outstanding": number;
  "workflowInstanceId": string | null;
  "purpose"?: string;
  "approvedAt": string | null;
  "settledAt": string | null;
  "note"?: string;
};

export type SettleLoanDto = {
  "note"?: string;
};

export type ApplyForLoanDto = {
  /** Integer minor units. */
  "principal": number;
  "termMonths": number;
  /** The period the first instalment falls due. */
  "firstRepaymentPeriod": string;
  "loanType"?: "loan" | "salary_advance";
  /** Annual nominal rate as a fraction. */
  "annualRate"?: number;
  "interestMethod"?: "zero" | "flat" | "reducing_balance";
  "purpose"?: string;
};

export type PayItemResponseDto = {
  "_id": string;
  /** The company whose own item this is; null for the organisation's. */
  "companyId": string | null;
  "code": string;
  "name": string;
  "aliases": string[];
  "kind": "earning" | "deduction" | "employer_cost";
  "taxable": boolean;
  "pensionable": boolean;
  "required": boolean;
  "active": boolean;
  "sequence": number;
};

export type CreatePayItemDto = {
  /** organisation: for every company. company: only the current one. */
  "scope"?: "organisation" | "company";
  "code": string;
  "name": string;
  "aliases"?: string[];
  "kind": "earning" | "deduction" | "employer_cost";
  /** Earnings: in taxable income. */
  "taxable"?: boolean;
  /** Earnings: in pensionable pay. */
  "pensionable"?: boolean;
  /** The column must be in the schedule and filled on every row. */
  "required"?: boolean;
  "active"?: boolean;
  "sequence"?: number;
};

export type CommonPayItemsDto = {
  "scope"?: "organisation" | "company";
};

export type UpdatePayItemDto = {
  "name"?: string;
  "aliases"?: string[];
  /** Earnings: in taxable income. */
  "taxable"?: boolean;
  /** Earnings: in pensionable pay. */
  "pensionable"?: boolean;
  /** The column must be in the schedule and filled on every row. */
  "required"?: boolean;
  "active"?: boolean;
  "sequence"?: number;
};

export type ScheduleExceptionResponseDto = {
  /** The spreadsheet's own row number. */
  "row": number;
  "employeeNumber": string | null;
  "messages": string[];
};

export type ScheduleTotalsResponseDto = {
  /** Minor units. */
  "salary": number;
  "earnings": number;
  "deductions": number;
  "employerCosts": number;
};

export type ScheduleCheckResponseDto = {
  /** Data rows read. */
  "rowCount": number;
  /** Rows that will be paid. */
  "acceptedCount": number;
  "exceptions": ScheduleExceptionResponseDto[];
  "warnings": string[];
  "totals": ScheduleTotalsResponseDto;
};

export type PayrollScheduleResponseDto = {
  /** Data rows read. */
  "rowCount": number;
  /** Rows that will be paid. */
  "acceptedCount": number;
  "exceptions": ScheduleExceptionResponseDto[];
  "warnings": string[];
  "totals": ScheduleTotalsResponseDto;
  "_id": string;
  "payrollRunId": string;
  "uploadedBy": string;
  /** Whether the caller uploaded it — only they can confirm or discard it. */
  "mine": boolean;
  "filename": string;
  "status": "ready" | "confirmed" | "discarded";
  "confirmedAt": string | null;
  "discardedAt": string | null;
  "createdAt": string;
};

export type ScheduleUploadSlotDto = {
  "filename": string;
  "contentType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" | "text/csv";
};

export type SubmitScheduleDto = {
  /** The key from the upload slot. */
  "storageKey": string;
  "filename": string;
  /** Check the file and report, without saving anything. */
  "dryRun"?: boolean;
};

export type HoldResponseDto = {
  "employeeId": string;
  "employeeNumber": string;
  /** The release that paid them, once approved. */
  "releaseId": string | null;
  "releasedAt": string | null;
};

export type SetHoldDto = {
  "employeeId": string;
  "hold": boolean;
};

export type RequestReleaseDto = {
  /** Held employees to pay now. */
  "employeeIds": string[];
};

export type LayoutCatalogResponseDto = {
  /** The fields each kind of file can use, and whether each is text, an amount or a date. */
  "sources": Record<string, unknown>;
  "presets": {
      "key"?: string;
      "name"?: string;
      "dataset"?: string;
    }[];
};

export type OutputLayoutColumnResponseDto = {
  "header": string;
  "source": string;
  "value": string | null;
  "amount": "major" | "minor" | null;
  "date": string | null;
};

export type OutputLayoutResponseDto = {
  "_id": string;
  "companyId": string | null;
  "name": string;
  "dataset": "bank" | "remittance" | "payslip";
  "scheme": string | null;
  "format": "csv" | "xlsx";
  "includeHeader": boolean;
  "columns": OutputLayoutColumnResponseDto[];
};

export type OutputLayoutColumnDto = {
  "header": string;
  /** A field of the dataset, `statutoryId:<SCHEME>`, `line:<CODE>`, `constant` or `template`. */
  "source": string;
  /** The text for a constant, the pattern for a template. */
  "value"?: string;
  /** Amounts: naira with 2 decimals (major), or kobo (minor). */
  "amount"?: "major" | "minor";
  "date"?: string;
};

export type CreateOutputLayoutDto = {
  "scope"?: "organisation" | "company";
  "name": string;
  "dataset": "bank" | "remittance" | "payslip";
  /** Remittance layouts: the scheme. */
  "scheme"?: string;
  "format"?: "csv" | "xlsx";
  "includeHeader"?: boolean;
  "columns": OutputLayoutColumnDto[];
};

export type LayoutPresetDto = {
  "preset": "access-bank" | "zenith-bank" | "pension" | "paye" | "nhf" | "nsitf" | "itf";
  "scope"?: "organisation" | "company";
};

export type UpdateOutputLayoutDto = {
  "name"?: string;
  /** Remittance layouts: the scheme. */
  "scheme"?: string;
  "format"?: "csv" | "xlsx";
  "includeHeader"?: boolean;
  "columns"?: OutputLayoutColumnDto[];
};

export type PreviewLayoutDto = {
  /** Bank files: only payments to this bank. */
  "bankCode"?: string;
  /** Bank files: the payments of one approved release from hold, instead of the main run. */
  "releaseId"?: string;
  /** The run to preview against. */
  "runId": string;
};

export type LayoutPreviewResponseDto = {
  "headers": string[];
  "rows": ((string | number)[])[];
  /** All the rows the file would have. */
  "total": number;
};

export type GenerateLayoutFileDto = {
  "layoutId": string;
  /** Bank files: only payments to this bank. */
  "bankCode"?: string;
  /** Bank files: the payments of one approved release from hold, instead of the main run. */
  "releaseId"?: string;
};

export type AnnualReportRowResponseDto = {
  "employeeId": string;
  "employeeNumber": string;
  "name": string;
  "taxState": string | null;
  /** TIN for PAYE; RSA PIN for pension. */
  "identifier": string | null;
  /** PFA code, for pension. */
  "pfa": string | null;
  /** January to December, minor units. */
  "months": number[];
  /** Minor units. */
  "total": number;
  /** PAYE: gross pay for the year. */
  "gross": number;
  /** PAYE: taxable income for the year. */
  "taxableIncome": number;
  /** Pension: the employees' share. */
  "employee": number;
  /** Pension: the employer's share. */
  "employer": number;
};

export type AnnualReportQueryDto = {
  "year": number;
  "kind": "paye" | "pension";
  /** PAYE: one state of residence only. */
  "state"?: string;
};

export type LegacyPayslipKeyDto = {
  /** The legacy platform's API key. Stored, used server-side, never returned. */
  "apiKey": string;
};

export type LegacyKeySavedResponseDto = {
  "saved": boolean;
};

export type SupportedBankResponseDto = {
  /** This organisation's entry; null when offered from the national list because none are set up yet. */
  "_id": string | null;
  /** The national bank — what bank details carry as bankListId. */
  "bankListId": string;
  "countryCode": string;
  "name": string;
  "bankCode": string;
  "sortCode": string | null;
  "isActive": boolean;
  /** The national list's name, for reference. */
  "nationalName": string;
};

export type SupportedBanksResponseDto = {
  /** False until the organisation chooses its banks; meanwhile every active national bank is offered. */
  "configured": boolean;
  "banks": SupportedBankResponseDto[];
};

export type AddSupportedBanksDto = {
  /** National bank ids to support. */
  "bankListIds": string[];
};

export type UpdateSupportedBankDto = {
  "name"?: string;
  /** For bank files. Account checks still use the national code. */
  "bankCode"?: string;
  "sortCode"?: string | null;
  "isActive"?: boolean;
};

export type DeviceResponseDto = {
  "serialNumber": string;
  "companyId": string;
  "status": "active" | "suspended";
  /** When the terminal last called in. Null means it never has — the difference between "nobody clocked in" and "the terminal is unplugged". */
  "lastSeenAt": string | null;
  /** Returned ONCE, at registration or re-issue. It is not recoverable afterwards. */
  "authToken"?: string;
};

export type RegisterDeviceDto = {
  /** The terminal's serial number. */
  "serialNumber": string;
  /** The company whose employees this terminal clocks. Defaults to the request scope. */
  "companyId"?: string;
};

export type SetDeviceStatusDto = {
  "status": "active" | "suspended";
};

export type ExpensePolicyResponseDto = {
  "_id": string;
  "name": string;
  "code": string;
  "categories": Record<string, unknown>[];
  "claimWindowDays": number | null;
  "status": "active" | "inactive";
};

export type ExpenseCategoryRuleDto = {
  "code": string;
  "name": string;
  /** Cap per line in MINOR units. Advisory — an over-cap line is flagged, not refused. */
  "capMinorUnits"?: number;
  /** A receipt is required above this, in minor units. Omit for never; 0 for always. */
  "receiptRequiredAboveMinorUnits"?: number;
};

export type CreateExpensePolicyDto = {
  "name": string;
  "code": string;
  "categories": ExpenseCategoryRuleDto[];
  /** How far back a claim may reach, in days. Omit for no limit. */
  "claimWindowDays"?: number;
};

export type UpdateExpensePolicyDto = {
  "name"?: string;
  "code"?: string;
  "categories"?: ExpenseCategoryRuleDto[];
  /** How far back a claim may reach, in days. Omit for no limit. */
  "claimWindowDays"?: number;
  "status"?: "active" | "inactive";
};

export type ExpenseLineResponseDto = {
  "_id": string;
  "categoryCode": string;
  "description": string;
  "spentOn": string;
  "amountMinorUnits": number;
  "merchant"?: string;
  /** Whether a receipt is on file. The key itself is never returned. */
  "hasReceipt": boolean;
  /** Over the category cap. Advisory — the approver decides. */
  "overCap": boolean;
  /** Reference of a claim holding a line that looks like this one. */
  "possibleDuplicateOf": string | null;
};

export type ExpenseClaimResponseDto = {
  "_id": string;
  "companyId": string;
  "employeeId": string;
  "reference": string;
  "title": string;
  "currency": string;
  "lines": ExpenseLineResponseDto[];
  /** Sum of the lines, in minor units. */
  "totalMinorUnits": number;
  "status": "draft" | "submitted" | "approved" | "rejected" | "queried" | "reimbursed" | "cancelled";
  "submittedAt": string | null;
  "decidedAt": string | null;
  "note": string | null;
  "reimbursedAt": string | null;
  "reimbursementReference": string | null;
};

export type ReceiptUrlResponseDto = {
  /** Short-lived. A signed URL is a bearer credential for its lifetime. */
  "url": string;
};

export type ReimburseClaimDto = {
  /** How the money actually moved. Without it, an approved claim has no payment. */
  "reference": string;
  /** Set when reimbursed through a payroll run. */
  "payrollRunId"?: string;
};

export type ReceiptUploadRequestDto = {
  "filename": string;
  /** Checked against the allowed list; an unsupported type is refused. */
  "contentType": string;
};

export type ExpenseUploadSlotDto = {
  "uploadUrl": string;
  /** Send this back as `receiptKey` when adding the line. */
  "key": string;
  "requiredHeaders": Record<string, unknown>;
};

export type CreateExpenseClaimDto = {
  "title": string;
};

export type MyExpenseCategoryDto = {
  "code": string;
  "name": string;
  /** Integer minor units. Null means no cap. Exceeding it is flagged, not refused. */
  "capMinorUnits": number | null;
  /** A receipt is required above this. Null means never; 0 means always. */
  "receiptRequiredAboveMinorUnits": number | null;
};

export type AddExpenseLineDto = {
  "categoryCode": string;
  "description": string;
  /** When the money was spent. */
  "spentOn": string;
  /** MINOR units. 1250000 is ₦12,500.00. */
  "amountMinorUnits": number;
  /** Used for duplicate detection — a line with no merchant is never flagged. */
  "merchant"?: string;
  /** Storage key from the upload endpoint. */
  "receiptKey"?: string;
};

export type SubmitReportDto = {
  "category": "fraud" | "harassment" | "discrimination" | "safety" | "corruption" | "data_misuse" | "other";
  "subject": string;
  /** What happened, in the reporter's own words. */
  "body": string;
  /** When true NOTHING identifying is stored — not hashed, not encrypted. The access code is the only route back to the thread. */
  "anonymous": boolean;
};

export type SubmittedReportDto = {
  "reference": string;
  /** Shown ONCE. It is not recoverable, and cannot be re-issued. */
  "accessCode": string;
};

export type FollowUpDto = {
  "reference": string;
  "accessCode": string;
};

export type ReportMessageDto = {
  "fromReporter": boolean;
  "body": string;
  "createdAt"?: string;
};

export type ReporterViewDto = {
  "reference": string;
  "category": "fraud" | "harassment" | "discrimination" | "safety" | "corruption" | "data_misuse" | "other";
  "subject": string;
  "body": string;
  "status": "received" | "triaging" | "investigating" | "closed";
  "outcome": string | null;
  "closedAt": string | null;
  "messages": ReportMessageDto[];
};

export type ReporterReplyDto = {
  "reference": string;
  "accessCode": string;
  "body": string;
};

export type ReportDto = {
  "_id": string;
  "reference": string;
  "category": "fraud" | "harassment" | "discrimination" | "safety" | "corruption" | "data_misuse" | "other";
  "subject": string;
  "body": string;
  /** True when nothing identifying was stored. */
  "anonymous": boolean;
  /** Null for an anonymous report, and null means nothing is recoverable. */
  "reporterEmployeeId": string | null;
  "status": "received" | "triaging" | "investigating" | "closed";
  "assignedToUserId": string | null;
  "messages": ReportMessageDto[];
  "outcome": string | null;
  "closedAt": string | null;
};

export type AssignReportDto = {
  /** One named handler, never a role — see the service. */
  "userId": string;
};

export type ReplyToReportDto = {
  "body": string;
};

export type CloseReportDto = {
  /** Required, and shown to the reporter. Someone who raises a concern and hears nothing concludes the channel does not work, and tells colleagues. */
  "outcome": string;
};

export type LearningItemResponseDto = {
  "_id": string;
  "name": string;
  "code": string;
  "kind": "course" | "certification" | "induction";
  "description"?: string;
  "provider"?: string;
  "validityMonths": number | null;
  "mandatoryForGradeIds": string[];
  "status": "active" | "inactive";
};

export type CreateLearningItemDto = {
  "name": string;
  "code": string;
  "kind": "course" | "certification" | "induction";
  "description"?: string;
  "provider"?: string;
  /** How long a completion stays valid, in months. Omit for never expires. */
  "validityMonths"?: number;
  /** Grades this is mandatory for. By grade rather than by person — the requirement follows the job, and a per-person list is one nobody updates when someone joins. */
  "mandatoryForGradeIds"?: string[];
};

export type UpdateLearningItemDto = {
  "name"?: string;
  "code"?: string;
  "kind"?: "course" | "certification" | "induction";
  "description"?: string;
  "provider"?: string;
  /** How long a completion stays valid, in months. Omit for never expires. */
  "validityMonths"?: number;
  /** Grades this is mandatory for. By grade rather than by person — the requirement follows the job, and a per-person list is one nobody updates when someone joins. */
  "mandatoryForGradeIds"?: string[];
  "status"?: "active" | "inactive";
};

export type EnrolmentResponseDto = {
  "_id": string;
  "employeeId": string;
  "learningItemId": string;
  "status": "enrolled" | "in_progress" | "completed" | "failed" | "withdrawn";
  "enrolledOn": string | null;
  "completedOn": string | null;
  /** Dated from the completion plus the item’s validity. */
  "expiresOn": string | null;
  "reference"?: string;
  /** Included on GET /me/learning, where the caller usually cannot read the catalogue to resolve learningItemId themselves. */
  "learningItemName"?: string;
};

export type ComplianceRowDto = {
  "employeeId": string;
  "employeeNumber": string;
  "name": string;
  "learningItem": string;
  /** `missing` means mandatory for this grade and never held. */
  "state": "missing" | "expired" | "expiring_30" | "expiring_90";
  "expiresOn": string | null;
  "daysRemaining": number | null;
};

export type EnrolDto = {
  "employeeId": string;
  "learningItemId": string;
  /** Defaults to the company's today. */
  "enrolledOn"?: string;
};

export type CompleteEnrolmentDto = {
  /** Expiry is dated from THIS, not from today — a certificate recorded late still lapses on its real anniversary. */
  "completedOn": string;
  /** The certificate number. */
  "reference"?: string;
};

export type AiStatusResponseDto = {
  /** Whether this organisation can use AI features right now. */
  "available": boolean;
  /** `not_configured`: this server has no AI service. `not_in_plan`: the plan does not include AI. Null when available. */
  "reason": "not_configured" | "not_in_plan" | null;
};

export type AiUsageTotalsResponseDto = {
  /** Model calls made. */
  "calls": number;
  "promptTokens": number;
  "completionTokens": number;
  "totalTokens": number;
};

export type AiUsageByMonthResponseDto = {
  /** Model calls made. */
  "calls": number;
  "promptTokens": number;
  "completionTokens": number;
  "totalTokens": number;
  /** Calendar month, UTC. */
  "month": string;
};

export type AiUsageByFeatureResponseDto = {
  /** Model calls made. */
  "calls": number;
  "promptTokens": number;
  "completionTokens": number;
  "totalTokens": number;
  "feature": string;
  "label": string;
};

export type AiUsageByCompanyResponseDto = {
  /** Model calls made. */
  "calls": number;
  "promptTokens": number;
  "completionTokens": number;
  "totalTokens": number;
  "companyId": string | null;
  /** Unknown when the company is gone. */
  "companyName": string;
};

export type AiUsageSummaryResponseDto = {
  "status": AiStatusResponseDto;
  "from": string;
  "to": string;
  "totals": AiUsageTotalsResponseDto;
  /** Every month in the period, oldest first — months with no use read zero. */
  "byMonth": AiUsageByMonthResponseDto[];
  /** Most tokens first. */
  "byFeature": AiUsageByFeatureResponseDto[];
  /** Across every company in the organisation, most tokens first. */
  "byCompany": AiUsageByCompanyResponseDto[];
};

export type AiUsageCallResponseDto = {
  "_id": string;
  "feature": string;
  "label": string;
  "model": string;
  "promptTokens": number;
  "completionTokens": number;
  "totalTokens": number;
  "companyId": string | null;
  "subjectType": string | null;
  /** The record the call was about. */
  "subjectId": string | null;
  "createdAt": string;
};

export type AuditLogResponseDto = {
  "_id": string;
  "actorId": string | null;
  "actorEmail"?: string;
  /** A queue job acts as `system` — it has no signed-in user behind it. */
  "actorType": "user" | "system" | "anonymous";
  "companyId": string | null;
  "action": string;
  "entityType": string;
  "entityId"?: string;
  "before"?: Record<string, unknown>;
  "after"?: Record<string, unknown>;
  /** Refused attempts are recorded too — those are the interesting ones. */
  "outcome": "success" | "failure";
  "errorMessage"?: string;
  "ip"?: string;
  "userAgent"?: string;
  /** Ties entries from one request together. */
  "correlationId"?: string;
  "method"?: string;
  "path"?: string;
  "metadata"?: Record<string, unknown>;
};

export type CountryResponseDto = {
  "code": string;
  "name": string;
  /** New companies there default to it. */
  "currency": string;
  "timezone": string;
  /** Whether new companies may be created there. */
  "isEnabled": boolean;
};

export type PfaRemittanceAccountViewDto = {
  "bankListId": string;
  "bankName": string | null;
  "accountNumber": string;
  "accountName": string;
};

export type PfaContactViewDto = {
  "name": string | null;
  "email": string | null;
  "phone": string | null;
};

export type PfaResponseDto = {
  "_id": string;
  "code": string;
  "name": string;
  "isActive": boolean;
  "remittanceAccount": PfaRemittanceAccountViewDto | null;
  "contact": PfaContactViewDto | null;
  /** The current company's employer code with this PFA. */
  "employerCode": string | null;
  /** Employees in this organisation whose PFA this is. */
  "employees": number;
};

export type PfaRemittanceAccountDto = {
  /** A bank this organisation supports (Settings → Banks). */
  "bankListId": string;
  "accountNumber": string;
  "accountName": string;
};

export type PfaContactDto = {
  "name"?: string;
  "email"?: string;
  "phone"?: string;
};

export type CreatePfaDto = {
  /** PenCom's code, as schedules write it. */
  "code": string;
  "name": string;
  "isActive"?: boolean;
  "remittanceAccount"?: PfaRemittanceAccountDto | null;
  "contact"?: PfaContactDto | null;
  /** The current company's employer code with this PFA (x-company-id). Null clears it. */
  "employerCode"?: string | null;
};

export type UpdatePfaDto = {
  /** PenCom's code, as schedules write it. */
  "code"?: string;
  "name"?: string;
  "isActive"?: boolean;
  "remittanceAccount"?: PfaRemittanceAccountDto | null;
  "contact"?: PfaContactDto | null;
  /** The current company's employer code with this PFA (x-company-id). Null clears it. */
  "employerCode"?: string | null;
};

/**
 * Every operation, keyed by `METHOD /path` exactly as the API declares it.
 * Read it through the helpers in ./types (Body, Res, Query, Item).
 */
export interface Operations {
  "GET /health": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: HealthResponseDto;
  };
  "GET /platform": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: PlatformResponseDto;
  };
  "GET /shifts": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "status"?: "active" | "inactive" };
    body: never;
    response: {
      "data": ShiftResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /shifts": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateShiftDto;
    response: ShiftResponseDto;
  };
  "GET /shifts/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: ShiftResponseDto;
  };
  "PATCH /shifts/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: UpdateShiftDto;
    response: ShiftResponseDto;
  };
  "DELETE /shifts/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: ShiftResponseDto;
  };
  "POST /shifts/roster": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: AssignRosterDto;
    response: RosterAssignmentResponseDto;
  };
  "GET /shifts/roster/assignments": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "employeeId"?: string };
    body: never;
    response: {
      "data": RosterAssignmentResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /attendance/kiosk/clock": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: ClockDto;
    response: ClockResponseDto;
  };
  "POST /attendance/import": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: ImportPunchesDto;
    response: ImportPunchesResponseDto;
  };
  "GET /attendance": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "from"?: string; "to"?: string; "employeeId"?: string; "status"?: "present" | "partial" | "absent" | "on_leave" | "holiday" | "rest_day"; "exceptionsOnly"?: string };
    body: never;
    response: {
      "data": AttendanceDayResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "GET /attendance/summary/{employeeId}": {
    path: { "employeeId": string };
    query: { "from": string; "to": string };
    body: never;
    response: AttendanceSummaryResponseDto;
  };
  "GET /attendance/punches/{employeeId}/{businessDate}": {
    path: { "employeeId": string; "businessDate": string };
    query: Record<string, never>;
    body: never;
    response: PunchEventResponseDto[];
  };
  "POST /attendance/punches/correct": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CorrectExistingPunchDto;
    response: PunchEventResponseDto;
  };
  "POST /attendance/punches/{employeeId}/missing": {
    path: { "employeeId": string };
    query: Record<string, never>;
    body: CorrectPunchDto;
    response: PunchEventResponseDto;
  };
  "POST /attendance/recompute": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: RecomputeAttendanceDto;
    response: RecomputeResponseDto;
  };
  "GET /me/attendance/corrections": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: AttendanceCorrectionRequestResponseDto[];
  };
  "POST /me/attendance/corrections": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: RequestAttendanceCorrectionDto;
    response: AttendanceCorrectionRequestResponseDto;
  };
  "POST /me/attendance/corrections/{id}/cancel": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: AttendanceCorrectionRequestResponseDto;
  };
  "POST /me/attendance/clock": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: ClockDto;
    response: ClockResponseDto;
  };
  "GET /me/attendance": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "from"?: string; "to"?: string; "employeeId"?: string; "status"?: "present" | "partial" | "absent" | "on_leave" | "holiday" | "rest_day"; "exceptionsOnly"?: string };
    body: never;
    response: {
      "data": AttendanceDayResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "GET /me/attendance/work-location": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: MyWorkLocationResponseDto;
  };
  "GET /me/attendance/shift/{businessDate}": {
    path: { "businessDate": string };
    query: Record<string, never>;
    body: never;
    response: MyShiftResponseDto;
  };
  "GET /me/attendance/punches/{businessDate}": {
    path: { "businessDate": string };
    query: Record<string, never>;
    body: never;
    response: PunchEventResponseDto[];
  };
  "GET /companies": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "status"?: "active" | "inactive"; "countryCode"?: string };
    body: never;
    response: {
      "data": CompanyResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /companies": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateCompanyDto;
    response: CompanyResponseDto;
  };
  "GET /companies/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: CompanyResponseDto;
  };
  "PATCH /companies/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: UpdateCompanyDto;
    response: CompanyResponseDto;
  };
  "DELETE /companies/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: CompanyResponseDto;
  };
  "GET /attendance/settings": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: AttendanceSettingsResponseDto;
  };
  "PUT /attendance/settings": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: UpdateAttendanceSettingsDto;
    response: AttendanceSettingsResponseDto;
  };
  "GET /attendance/settings/companies/{companyId}": {
    path: { "companyId": string };
    query: Record<string, never>;
    body: never;
    response: AttendanceSettingsResponseDto;
  };
  "PUT /attendance/settings/companies/{companyId}": {
    path: { "companyId": string };
    query: Record<string, never>;
    body: UpdateAttendanceSettingsDto;
    response: AttendanceSettingsResponseDto;
  };
  "DELETE /attendance/settings/companies/{companyId}": {
    path: { "companyId": string };
    query: Record<string, never>;
    body: never;
    response: AttendanceSettingsResponseDto;
  };
  "GET /me/attendance/face/status": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: MyFaceStatusResponseDto;
  };
  "POST /me/attendance/face/consent": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: GiveConsentDto;
    response: MyFaceStatusResponseDto;
  };
  "DELETE /me/attendance/face/consent": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: void;
  };
  "POST /me/attendance/face/sessions": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: StartFaceSessionDto;
    response: FaceSessionStartedResponseDto;
  };
  "POST /me/attendance/face/selfie-slot": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: SelfieSlotDto;
    response: FaceFrameSlotResponseDto;
  };
  "GET /me/attendance/face/sessions/{sessionId}": {
    path: { "sessionId": string };
    query: Record<string, never>;
    body: never;
    response: FaceSessionSummaryResponseDto;
  };
  "GET /public/face/{token}": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: FaceSessionViewResponseDto;
  };
  "POST /public/face/{token}/frames": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: FrameSlotsDto;
    response: FaceFrameSlotResponseDto[];
  };
  "POST /public/face/{token}/submit": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: SubmitFramesDto;
    response: FaceSubmitVerdictResponseDto;
  };
  "GET /attendance/face/enrolments": {
    path: Record<string, never>;
    query: { "status"?: "pending_review" | "approved" | "rejected" };
    body: never;
    response: FaceEnrolmentRowResponseDto[];
  };
  "GET /attendance/face/enrolments/{employeeId}/photos": {
    path: { "employeeId": string };
    query: Record<string, never>;
    body: never;
    response: FacePhotoUrlsResponseDto;
  };
  "POST /attendance/face/enrolments/{employeeId}/approve": {
    path: { "employeeId": string };
    query: Record<string, never>;
    body: ApproveEnrolmentDto;
    response: FaceEnrolmentStatusResponseDto;
  };
  "POST /attendance/face/enrolments/{employeeId}/reject": {
    path: { "employeeId": string };
    query: Record<string, never>;
    body: RejectEnrolmentDto;
    response: FaceEnrolmentStatusResponseDto;
  };
  "DELETE /attendance/face/enrolments/{employeeId}": {
    path: { "employeeId": string };
    query: Record<string, never>;
    body: never;
    response: void;
  };
  "GET /attendance/face/punches/{punchId}": {
    path: { "punchId": string };
    query: Record<string, never>;
    body: never;
    response: FacePunchReviewResponseDto;
  };
  "GET /document-types": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string };
    body: never;
    response: {
      "data": DocumentTypeResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /document-types": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateDocumentTypeDto;
    response: DocumentTypeResponseDto;
  };
  "GET /document-types/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: DocumentTypeResponseDto;
  };
  "POST /documents/employees/{employeeId}/upload-url": {
    path: { "employeeId": string };
    query: Record<string, never>;
    body: DocumentUploadUrlDto;
    response: DocumentUploadUrlResponseDto;
  };
  "GET /documents/employees/{employeeId}": {
    path: { "employeeId": string };
    query: Record<string, never>;
    body: never;
    response: EmployeeDocumentResponseDto[];
  };
  "POST /documents/employees/{employeeId}": {
    path: { "employeeId": string };
    query: Record<string, never>;
    body: RecordDocumentDto;
    response: EmployeeDocumentResponseDto;
  };
  "GET /documents": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "status"?: "pending_verification" | "verified" | "rejected" | "expired" | "superseded" };
    body: never;
    response: {
      "data": EmployeeDocumentResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "GET /documents/compliance": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: ComplianceGapResponseDto[];
  };
  "POST /documents/{id}/verify": {
    path: { "id": string };
    query: Record<string, never>;
    body: VerifyDocumentDto;
    response: EmployeeDocumentResponseDto;
  };
  "POST /documents/{id}/download": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: PresignedUrlResponseDto;
  };
  "POST /documents/reminders/run": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: ReminderRunResponseDto;
  };
  "POST /documents/retention/purge": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: PurgeDto;
    response: PurgeResultResponseDto;
  };
  "GET /me/documents": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: EmployeeDocumentResponseDto[];
  };
  "POST /me/documents/{id}/download": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: PresignedUrlResponseDto;
  };
  "GET /reports": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "kind"?: "headcount" | "turnover" | "new_hires" | "exits" | "workforce_movements" | "workforce_demographics" | "probation_status" | "attendance_summary" | "attendance_register" | "attendance_overtime" | "leave_utilisation" | "absenteeism" | "leave_liability" | "payroll_cost" | "recruitment_funnel" | "training_compliance" | "document_compliance" | "er_cases" | "custom"; "status"?: "queued" | "running" | "ready" | "failed" };
    body: never;
    response: {
      "data": ReportRunResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /reports": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: RequestReportDto;
    response: ReportRunResponseDto;
  };
  "GET /reports/kinds": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: ReportKindResponseDto[];
  };
  "GET /reports/catalog": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: ReportSubjectResponseDto[];
  };
  "POST /reports/definitions/preview": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: SaveReportDefinitionDto;
    response: ReportPreviewResponseDto;
  };
  "GET /reports/definitions": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string };
    body: never;
    response: {
      "data": ReportDefinitionResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /reports/definitions": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: SaveReportDefinitionDto;
    response: ReportDefinitionResponseDto;
  };
  "GET /reports/definitions/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: ReportDefinitionResponseDto;
  };
  "PATCH /reports/definitions/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: SaveReportDefinitionDto;
    response: ReportDefinitionResponseDto;
  };
  "DELETE /reports/definitions/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: void;
  };
  "GET /reports/schedules": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string };
    body: never;
    response: {
      "data": ReportScheduleResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /reports/schedules": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: SaveReportScheduleDto;
    response: ReportScheduleResponseDto;
  };
  "GET /reports/schedules/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: ReportScheduleResponseDto;
  };
  "PATCH /reports/schedules/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: UpdateReportScheduleDto;
    response: ReportScheduleResponseDto;
  };
  "DELETE /reports/schedules/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: void;
  };
  "GET /reports/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: ReportRunResponseDto;
  };
  "POST /reports/{id}/download": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: PresignedUrlResponseDto;
  };
  "GET /exchange-rates": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: ExchangeRateResponseDto[];
  };
  "POST /exchange-rates": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: SetExchangeRateDto;
    response: ExchangeRateResponseDto;
  };
  "GET /dashboard": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: DashboardKpisDto;
  };
  "GET /requisitions": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "status"?: "draft" | "pending_approval" | "approved" | "rejected" | "posted" | "filled" | "cancelled" };
    body: never;
    response: {
      "data": JobRequisitionResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /requisitions": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateRequisitionDto;
    response: JobRequisitionResponseDto;
  };
  "GET /requisitions/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: JobRequisitionResponseDto;
  };
  "POST /requisitions/{id}/submit": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: JobRequisitionResponseDto;
  };
  "GET /job-postings": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "status"?: "draft" | "published" | "closed" };
    body: never;
    response: {
      "data": JobPostingResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /job-postings": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreatePostingDto;
    response: JobPostingResponseDto;
  };
  "GET /job-postings/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: JobPostingResponseDto;
  };
  "PATCH /job-postings/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: UpdatePostingDto;
    response: JobPostingResponseDto;
  };
  "GET /job-postings/{id}/funnel": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: FunnelStageResponseDto[];
  };
  "POST /job-postings/{id}/screen": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: ScreenUnscreenedResponseDto;
  };
  "POST /job-postings/{id}/publish": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: JobPostingResponseDto;
  };
  "POST /job-postings/{id}/close": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: JobPostingResponseDto;
  };
  "GET /applications": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "postingId"?: string; "status"?: "active" | "rejected" | "withdrawn" | "hired"; "stage"?: string };
    body: never;
    response: {
      "data": ApplicationResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "GET /applications/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: ApplicationResponseDto;
  };
  "POST /applications/{id}/screen": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: ApplicationResponseDto;
  };
  "GET /applications/{id}/candidate": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: CandidateResponseDto;
  };
  "POST /applications/{id}/move": {
    path: { "id": string };
    query: Record<string, never>;
    body: MoveStageDto;
    response: ApplicationResponseDto;
  };
  "POST /applications/{id}/scorecard": {
    path: { "id": string };
    query: Record<string, never>;
    body: SubmitScorecardDto;
    response: ApplicationResponseDto;
  };
  "POST /applications/{id}/reject": {
    path: { "id": string };
    query: Record<string, never>;
    body: RejectApplicationDto;
    response: ApplicationResponseDto;
  };
  "GET /offers": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "status"?: "draft" | "pending_approval" | "approved" | "sent" | "accepted" | "declined" | "withdrawn" | "expired" };
    body: never;
    response: {
      "data": OfferResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /offers": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateOfferDto;
    response: OfferResponseDto;
  };
  "GET /offers/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: OfferResponseDto;
  };
  "POST /offers/{id}/send": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: OfferResponseDto;
  };
  "POST /offers/{id}/resend": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: OfferResponseDto;
  };
  "GET /offers/{id}/letter": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: OfferFileUrlResponseDto;
  };
  "POST /offers/{id}/accept": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: OfferResponseDto;
  };
  "POST /offers/{id}/withdraw": {
    path: { "id": string };
    query: Record<string, never>;
    body: WithdrawOfferDto;
    response: OfferResponseDto;
  };
  "POST /offers/{id}/decline": {
    path: { "id": string };
    query: Record<string, never>;
    body: DeclineOfferDto;
    response: OfferResponseDto;
  };
  "POST /offers/{id}/convert": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: OfferConversionResponseDto;
  };
  "GET /public/jobs/{token}": {
    path: { "token": string };
    query: Record<string, never>;
    body: never;
    response: PublicJobViewResponseDto;
  };
  "POST /public/jobs/{token}/resume-upload": {
    path: { "token": string };
    query: Record<string, never>;
    body: ResumeUploadDto;
    response: ResumeUploadResponseDto;
  };
  "POST /public/jobs/{token}/apply": {
    path: { "token": string };
    query: Record<string, never>;
    body: ApplyToJobDto;
    response: ApplicationReceivedResponseDto;
  };
  "GET /careers-board": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: CareersBoardLinkResponseDto;
  };
  "POST /careers-board": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: CareersBoardLinkResponseDto;
  };
  "DELETE /careers-board": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: void;
  };
  "GET /public/careers/{boardToken}": {
    path: { "boardToken": string };
    query: Record<string, never>;
    body: never;
    response: PublicCareersListingResponseDto;
  };
  "GET /offer-letter-settings": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: OfferLetterSettingsResponseDto;
  };
  "PUT /offer-letter-settings": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: UpdateOfferLetterSettingsDto;
    response: OfferLetterSettingsResponseDto;
  };
  "POST /offer-letter-settings/sample": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: OfferFileUrlResponseDto;
  };
  "GET /offer-letter-settings/companies/{companyId}": {
    path: { "companyId": string };
    query: Record<string, never>;
    body: never;
    response: OfferLetterSettingsResponseDto;
  };
  "PUT /offer-letter-settings/companies/{companyId}": {
    path: { "companyId": string };
    query: Record<string, never>;
    body: UpdateOfferLetterSettingsDto;
    response: OfferLetterSettingsResponseDto;
  };
  "DELETE /offer-letter-settings/companies/{companyId}": {
    path: { "companyId": string };
    query: Record<string, never>;
    body: never;
    response: OfferLetterSettingsResponseDto;
  };
  "POST /offer-letter-settings/companies/{companyId}/sample": {
    path: { "companyId": string };
    query: Record<string, never>;
    body: never;
    response: OfferFileUrlResponseDto;
  };
  "GET /public/offer/{token}": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: OfferPublicViewDto;
  };
  "GET /public/offer/{token}/letter": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: OfferFileUrlResponseDto;
  };
  "POST /public/offer/{token}/accept": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: AcceptOfferOnlineDto;
    response: OfferPublicViewDto;
  };
  "POST /public/offer/{token}/decline": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: DeclineOfferDto;
    response: OfferPublicViewDto;
  };
  "GET /employees": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "status"?: "pending" | "active" | "on_leave" | "suspended" | "exited"; "departmentId"?: string; "branchId"?: string; "gradeId"?: string; "managerId"?: string; "employmentType"?: string };
    body: never;
    response: {
      "data": EmployeeResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /employees": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateEmployeeDto;
    response: EmployeeResponseDto;
  };
  "GET /employees/import/template": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: ImportTemplateDto;
  };
  "POST /employees/import/template": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: EmployeeImportTemplateUrlDto;
  };
  "POST /employees/import/uploads": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: EmployeeImportSlotDto;
    response: EmployeeImportSlotResponseDto;
  };
  "POST /employees/import/columns": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: InspectImportDto;
    response: ImportColumnsResponseDto;
  };
  "POST /employees/import": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: ImportEmployeesDto;
    response: ImportResultDto;
  };
  "GET /employees/id-schemes": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: EmployeeIdSchemeResponseDto[];
  };
  "POST /employees/bank/resolve": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: ResolveBankDto;
    response: BankLookupResponseDto;
  };
  "POST /employees/logins": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: BulkEmployeeLoginsDto;
    response: BulkLoginsResponseDto;
  };
  "GET /employees/counts": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: EmployeeCountsResponseDto;
  };
  "GET /employees/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: EmployeeResponseDto;
  };
  "PATCH /employees/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: UpdateEmployeeDto;
    response: EmployeeResponseDto;
  };
  "GET /employees/{id}/reporting-chain": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: EmployeeResponseDto[];
  };
  "GET /employees/{id}/direct-reports": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: EmployeeResponseDto[];
  };
  "GET /employees/{id}/compensation": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: CompensationResponseDto[];
  };
  "POST /employees/{id}/compensation": {
    path: { "id": string };
    query: Record<string, never>;
    body: SetCompensationDto;
    response: CompensationResponseDto;
  };
  "POST /employees/{id}/login": {
    path: { "id": string };
    query: Record<string, never>;
    body: EmployeeLoginDto;
    response: EmployeeLoginResponseDto;
  };
  "GET /branches": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "status"?: "active" | "inactive" };
    body: never;
    response: {
      "data": BranchResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /branches": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateBranchDto;
    response: BranchResponseDto;
  };
  "GET /branches/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: BranchResponseDto;
  };
  "PATCH /branches/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: UpdateBranchDto;
    response: BranchResponseDto;
  };
  "DELETE /branches/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: BranchResponseDto;
  };
  "GET /departments": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "status"?: "active" | "inactive"; "parentId"?: string };
    body: never;
    response: {
      "data": DepartmentResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /departments": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateDepartmentDto;
    response: DepartmentResponseDto;
  };
  "GET /departments/tree": {
    path: Record<string, never>;
    query: { "includeInactive"?: string };
    body: never;
    response: DepartmentNodeDto[];
  };
  "GET /departments/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: DepartmentResponseDto;
  };
  "PATCH /departments/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: UpdateDepartmentDto;
    response: DepartmentResponseDto;
  };
  "DELETE /departments/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: DepartmentResponseDto;
  };
  "GET /designations": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "status"?: "active" | "inactive"; "departmentId"?: string };
    body: never;
    response: {
      "data": DesignationResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /designations": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateDesignationDto;
    response: DesignationResponseDto;
  };
  "GET /designations/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: DesignationResponseDto;
  };
  "PATCH /designations/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: UpdateDesignationDto;
    response: DesignationResponseDto;
  };
  "DELETE /designations/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: DesignationResponseDto;
  };
  "GET /grades": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "status"?: "active" | "inactive" };
    body: never;
    response: {
      "data": GradeResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /grades": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateGradeDto;
    response: GradeResponseDto;
  };
  "GET /grades/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: GradeResponseDto;
  };
  "PATCH /grades/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: UpdateGradeDto;
    response: GradeResponseDto;
  };
  "DELETE /grades/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: GradeResponseDto;
  };
  "GET /users": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string };
    body: never;
    response: {
      "data": UserResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /users": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateUserDto;
    response: UserResponseDto;
  };
  "POST /users/{id}/resend-invite": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: void;
  };
  "GET /users/me": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: UserResponseDto;
  };
  "GET /users/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: UserResponseDto;
  };
  "PATCH /users/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: UpdateUserDto;
    response: UserResponseDto;
  };
  "DELETE /users/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: void;
  };
  "POST /auth/login": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: LoginDto;
    response: TokenPairDto | MfaChallengeDto | PasswordChangeChallengeDto;
  };
  "POST /auth/password/first-change": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: FirstPasswordChangeDto;
    response: TokenPairDto | MfaChallengeDto;
  };
  "POST /auth/mfa/verify": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: VerifyMfaDto;
    response: TokenPairDto;
  };
  "POST /auth/refresh": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: RefreshTokenDto;
    response: TokenPairDto;
  };
  "POST /auth/forgot-password": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: ForgotPasswordDto;
    response: void;
  };
  "POST /auth/reset-password": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: ResetPasswordDto;
    response: void;
  };
  "POST /auth/logout": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: void;
  };
  "GET /auth/me": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: AuthContextDto;
  };
  "GET /me/mfa": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: MfaStatusDto;
  };
  "POST /me/mfa/setup": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: MfaSetupDto;
  };
  "POST /me/mfa/enable": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: MfaCodeDto;
    response: MfaEnabledDto;
  };
  "POST /me/mfa/disable": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: MfaCodeDto;
    response: MfaStatusDto;
  };
  "GET /employees/{id}/lifecycle": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: LifecycleEventResponseDto[];
  };
  "POST /employees/{id}/lifecycle/onboard": {
    path: { "id": string };
    query: Record<string, never>;
    body: OnboardDto;
    response: OnboardingResultResponseDto;
  };
  "POST /employees/{id}/lifecycle/confirm": {
    path: { "id": string };
    query: Record<string, never>;
    body: ConfirmDto;
    response: LifecycleEventResponseDto;
  };
  "POST /employees/{id}/lifecycle/transfer": {
    path: { "id": string };
    query: Record<string, never>;
    body: TransferDto;
    response: LifecycleEventResponseDto;
  };
  "POST /employees/{id}/lifecycle/promote": {
    path: { "id": string };
    query: Record<string, never>;
    body: PromoteDto;
    response: LifecycleEventResponseDto;
  };
  "POST /employees/{id}/lifecycle/suspend": {
    path: { "id": string };
    query: Record<string, never>;
    body: SuspendDto;
    response: LifecycleEventResponseDto;
  };
  "POST /employees/{id}/lifecycle/reinstate": {
    path: { "id": string };
    query: Record<string, never>;
    body: ReinstateDto;
    response: LifecycleEventResponseDto;
  };
  "POST /employees/{id}/lifecycle/exit": {
    path: { "id": string };
    query: Record<string, never>;
    body: ExitDto;
    response: LifecycleEventResponseDto;
  };
  "GET /employees/{id}/lifecycle/tasks": {
    path: { "id": string };
    query: { "kind"?: "onboarding" | "offboarding" };
    body: never;
    response: OnboardingTaskResponseDto[];
  };
  "POST /employees/{id}/lifecycle/tasks": {
    path: { "id": string };
    query: Record<string, never>;
    body: AddTaskDto;
    response: OnboardingTaskResponseDto;
  };
  "POST /employees/{id}/lifecycle/tasks/{taskId}/complete": {
    path: { "id": string; "taskId": string };
    query: Record<string, never>;
    body: CompleteTaskDto;
    response: OnboardingTaskResponseDto;
  };
  "POST /employees/{id}/lifecycle/tasks/{taskId}/skip": {
    path: { "id": string; "taskId": string };
    query: Record<string, never>;
    body: SkipTaskDto;
    response: OnboardingTaskResponseDto;
  };
  "PATCH /employees/{id}/lifecycle/tasks/{taskId}": {
    path: { "id": string; "taskId": string };
    query: Record<string, never>;
    body: UpdateTaskDto;
    response: OnboardingTaskResponseDto;
  };
  "POST /employees/{id}/lifecycle/events/{eventId}/clear": {
    path: { "eventId": string };
    query: Record<string, never>;
    body: ClearItemDto;
    response: LifecycleEventResponseDto;
  };
  "GET /lifecycle/checklists/owners/departments": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: ChecklistOwnersResponseDto;
  };
  "GET /lifecycle/checklists/{kind}": {
    path: { "kind": string };
    query: Record<string, never>;
    body: never;
    response: ChecklistResponseDto;
  };
  "PUT /lifecycle/checklists/{kind}": {
    path: { "kind": string };
    query: Record<string, never>;
    body: ReplaceChecklistDto;
    response: ChecklistResponseDto;
  };
  "POST /lifecycle/checklists/{kind}/reset": {
    path: { "kind": string };
    query: Record<string, never>;
    body: never;
    response: ChecklistResponseDto;
  };
  "GET /lifecycle/checklists/{kind}/companies/{companyId}": {
    path: { "kind": string; "companyId": string };
    query: Record<string, never>;
    body: never;
    response: ChecklistResponseDto;
  };
  "PUT /lifecycle/checklists/{kind}/companies/{companyId}": {
    path: { "kind": string; "companyId": string };
    query: Record<string, never>;
    body: ReplaceChecklistDto;
    response: ChecklistResponseDto;
  };
  "DELETE /lifecycle/checklists/{kind}/companies/{companyId}": {
    path: { "kind": string; "companyId": string };
    query: Record<string, never>;
    body: never;
    response: ChecklistResponseDto;
  };
  "GET /me/resignations": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: ResignationResponseDto[];
  };
  "POST /me/resignations": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: SubmitResignationDto;
    response: ResignationResponseDto;
  };
  "POST /me/resignations/{id}/withdraw": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: ResignationResponseDto;
  };
  "GET /resignations": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "status"?: "pending" | "accepted" | "rejected" | "cancelled" | "completed" };
    body: never;
    response: {
      "data": ResignationResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "GET /assets": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "status"?: "available" | "assigned" | "in_repair" | "lost" | "retired"; "category"?: "laptop" | "desktop" | "monitor" | "phone" | "tablet" | "vehicle" | "furniture" | "accessory" | "other"; "holderId"?: string };
    body: never;
    response: {
      "data": AssetResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /assets": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateAssetDto;
    response: AssetResponseDto;
  };
  "GET /assets/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: AssetResponseDto;
  };
  "PATCH /assets/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: UpdateAssetDto;
    response: AssetResponseDto;
  };
  "DELETE /assets/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: void;
  };
  "GET /assets/{id}/history": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: AssetAssignmentResponseDto[];
  };
  "POST /assets/{id}/assign": {
    path: { "id": string };
    query: Record<string, never>;
    body: AssignAssetDto;
    response: AssetResponseDto;
  };
  "POST /assets/{id}/return": {
    path: { "id": string };
    query: Record<string, never>;
    body: ReturnAssetDto;
    response: AssetResponseDto;
  };
  "POST /assets/{id}/status": {
    path: { "id": string };
    query: Record<string, never>;
    body: SetAssetStatusDto;
    response: AssetResponseDto;
  };
  "GET /asset-reports": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "status"?: "open" | "resolved" };
    body: never;
    response: {
      "data": AssetReportResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /asset-reports/{id}/resolve": {
    path: { "id": string };
    query: Record<string, never>;
    body: ResolveReportDto;
    response: AssetReportResponseDto;
  };
  "GET /asset-requests": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "status"?: "pending_approval" | "approved" | "rejected" | "cancelled" | "fulfilled" };
    body: never;
    response: {
      "data": AssetRequestResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /asset-requests/{id}/fulfil": {
    path: { "id": string };
    query: Record<string, never>;
    body: FulfilAssetRequestDto;
    response: AssetRequestResponseDto;
  };
  "GET /me/assets": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: MyAssetsResponseDto;
  };
  "POST /me/assets/{id}/report": {
    path: { "id": string };
    query: Record<string, never>;
    body: ReportAssetDto;
    response: AssetReportResponseDto;
  };
  "GET /me/asset-requests": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: AssetRequestResponseDto[];
  };
  "POST /me/asset-requests": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateAssetRequestDto;
    response: AssetRequestResponseDto;
  };
  "POST /me/asset-requests/{id}/cancel": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: AssetRequestResponseDto;
  };
  "GET /letterheads": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: LetterheadSettingsResponseDto;
  };
  "PUT /letterheads": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: UpdateLetterheadDto;
    response: LetterheadSettingsResponseDto;
  };
  "GET /letterheads/companies/{companyId}": {
    path: { "companyId": string };
    query: Record<string, never>;
    body: never;
    response: LetterheadSettingsResponseDto;
  };
  "PUT /letterheads/companies/{companyId}": {
    path: { "companyId": string };
    query: Record<string, never>;
    body: UpdateLetterheadDto;
    response: LetterheadSettingsResponseDto;
  };
  "DELETE /letterheads/companies/{companyId}": {
    path: { "companyId": string };
    query: Record<string, never>;
    body: never;
    response: LetterheadSettingsResponseDto;
  };
  "POST /letterheads/upload": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: LetterheadUploadDto;
    response: LetterheadUploadSlotResponseDto;
  };
  "GET /broadcasts": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "status"?: "draft" | "scheduled" | "sending" | "sent" | "cancelled" };
    body: never;
    response: {
      "data": BroadcastResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /broadcasts": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateBroadcastDto;
    response: BroadcastResponseDto;
  };
  "POST /broadcasts/audience-preview": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: BroadcastAudienceDto;
    response: AudiencePreviewDto;
  };
  "GET /broadcasts/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: BroadcastResponseDto;
  };
  "PATCH /broadcasts/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: UpdateBroadcastDto;
    response: BroadcastResponseDto;
  };
  "DELETE /broadcasts/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: void;
  };
  "POST /broadcasts/{id}/send": {
    path: { "id": string };
    query: Record<string, never>;
    body: SendBroadcastDto;
    response: BroadcastResponseDto;
  };
  "POST /broadcasts/{id}/cancel": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: BroadcastResponseDto;
  };
  "GET /broadcasts/{id}/recipients": {
    path: { "id": string };
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "state"?: "all" | "unread" | "unacknowledged" };
    body: never;
    response: {
      "data": BroadcastRecipientResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /broadcasts/{id}/remind": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: {
      "reminded"?: number;
    };
  };
  "GET /me/broadcasts": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string };
    body: never;
    response: {
      "data": MyBroadcastResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "GET /me/broadcasts/unread-count": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: UnreadCountDto;
  };
  "POST /me/broadcasts/{id}/read": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: void;
  };
  "POST /me/broadcasts/{id}/acknowledge": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: void;
  };
  "GET /new-hires/settings": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: NewHireSettingsResponseDto;
  };
  "PUT /new-hires/settings": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: UpdateNewHireSettingsDto;
    response: NewHireSettingsResponseDto;
  };
  "GET /new-hires/settings/companies/{companyId}": {
    path: { "companyId": string };
    query: Record<string, never>;
    body: never;
    response: NewHireSettingsResponseDto;
  };
  "PUT /new-hires/settings/companies/{companyId}": {
    path: { "companyId": string };
    query: Record<string, never>;
    body: UpdateNewHireSettingsDto;
    response: NewHireSettingsResponseDto;
  };
  "DELETE /new-hires/settings/companies/{companyId}": {
    path: { "companyId": string };
    query: Record<string, never>;
    body: never;
    response: NewHireSettingsResponseDto;
  };
  "POST /new-hires/settings/sample-form": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: FileUrlResponseDto;
  };
  "POST /new-hires/settings/companies/{companyId}/sample-form": {
    path: { "companyId": string };
    query: Record<string, never>;
    body: never;
    response: FileUrlResponseDto;
  };
  "GET /new-hires": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "status"?: "invited" | "in_progress" | "submitted" | "changes_requested" | "approved" | "cancelled" | "expired" };
    body: never;
    response: {
      "data": NewHireSummaryDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /new-hires": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: InviteNewHireDto;
    response: NewHireDetailDto;
  };
  "POST /new-hires/from-offer/{offerId}": {
    path: { "offerId": string };
    query: Record<string, never>;
    body: InviteFromOfferDto;
    response: NewHireDetailDto;
  };
  "GET /new-hires/metrics": {
    path: Record<string, never>;
    query: { "days"?: number };
    body: never;
    response: NewHireMetricsDto;
  };
  "GET /new-hires/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: NewHireDetailDto;
  };
  "GET /new-hires/{id}/files": {
    path: { "id": string };
    query: { "file": string };
    body: never;
    response: FileUrlResponseDto;
  };
  "POST /new-hires/{id}/resend": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: NewHireDetailDto;
  };
  "POST /new-hires/{id}/guarantors/{guarantorId}/resend": {
    path: { "id": string; "guarantorId": string };
    query: Record<string, never>;
    body: never;
    response: NewHireDetailDto;
  };
  "POST /new-hires/{id}/guarantors/{guarantorId}/reject-form": {
    path: { "id": string; "guarantorId": string };
    query: Record<string, never>;
    body: RejectGuarantorFormDto;
    response: NewHireDetailDto;
  };
  "POST /new-hires/{id}/cancel": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: NewHireDetailDto;
  };
  "POST /new-hires/{id}/request-changes": {
    path: { "id": string };
    query: Record<string, never>;
    body: RequestChangesDto;
    response: NewHireDetailDto;
  };
  "POST /new-hires/{id}/approve": {
    path: { "id": string };
    query: Record<string, never>;
    body: ApproveNewHireDto;
    response: NewHireDetailDto;
  };
  "GET /public/onboarding/{token}": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: OnboardingViewDto;
  };
  "PUT /public/onboarding/{token}/personal": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: SavePersonalDto;
    response: OnboardingViewDto;
  };
  "PUT /public/onboarding/{token}/contact": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: SaveContactDto;
    response: OnboardingViewDto;
  };
  "PUT /public/onboarding/{token}/emergency": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: SaveEmergencyDto;
    response: OnboardingViewDto;
  };
  "POST /public/onboarding/{token}/bank/resolve": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: ResolveBankDto;
    response: BankLookupResponseDto;
  };
  "PUT /public/onboarding/{token}/bank": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: SaveBankDto;
    response: OnboardingViewDto;
  };
  "PUT /public/onboarding/{token}/identity": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: SaveIdentityDto;
    response: OnboardingViewDto;
  };
  "POST /public/onboarding/{token}/uploads": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: UploadSlotDto;
    response: UploadSlotResponseDto;
  };
  "POST /public/onboarding/{token}/documents": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: ConfirmDocumentDto;
    response: OnboardingViewDto;
  };
  "DELETE /public/onboarding/{token}/documents/{documentTypeId}": {
    path: { "documentTypeId": string };
    query: Record<string, never>;
    body: never;
    response: OnboardingViewDto;
  };
  "POST /public/onboarding/{token}/photo": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: ConfirmPhotoDto;
    response: OnboardingViewDto;
  };
  "POST /public/onboarding/{token}/guarantors": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: GuarantorInputDto;
    response: OnboardingViewDto;
  };
  "PUT /public/onboarding/{token}/guarantors/{guarantorId}": {
    path: { "guarantorId": string };
    query: Record<string, never>;
    body: GuarantorInputDto;
    response: OnboardingViewDto;
  };
  "DELETE /public/onboarding/{token}/guarantors/{guarantorId}": {
    path: { "guarantorId": string };
    query: Record<string, never>;
    body: never;
    response: OnboardingViewDto;
  };
  "POST /public/onboarding/{token}/guarantors/{guarantorId}/resend": {
    path: { "guarantorId": string };
    query: Record<string, never>;
    body: never;
    response: OnboardingViewDto;
  };
  "GET /public/onboarding/{token}/guarantors/{guarantorId}/form": {
    path: { "guarantorId": string };
    query: Record<string, never>;
    body: never;
    response: FileUrlResponseDto;
  };
  "POST /public/onboarding/{token}/guarantors/{guarantorId}/paper-form": {
    path: { "guarantorId": string };
    query: Record<string, never>;
    body: ConfirmPaperFormDto;
    response: OnboardingViewDto;
  };
  "POST /public/onboarding/{token}/submit": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: OnboardingViewDto;
  };
  "GET /public/guarantor/{token}": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: GuarantorViewDto;
  };
  "PUT /public/guarantor/{token}/details": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: SaveGuarantorDetailsDto;
    response: GuarantorViewDto;
  };
  "POST /public/guarantor/{token}/uploads": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: UploadSlotDto;
    response: UploadSlotResponseDto;
  };
  "POST /public/guarantor/{token}/uploads/confirm": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: ConfirmGuarantorUploadDto;
    response: GuarantorViewDto;
  };
  "POST /public/guarantor/{token}/sign": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: SignGuarantorFormDto;
    response: GuarantorViewDto;
  };
  "POST /public/guarantor/{token}/decline": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: DeclineGuarantorDto;
    response: GuarantorViewDto;
  };
  "GET /public/guarantor/{token}/signed-copy": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: FileUrlResponseDto;
  };
  "GET /er-cases": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "caseType"?: "query" | "warning" | "misconduct" | "grievance" | "pip"; "stage"?: "draft" | "raised" | "awaiting_response" | "hearing" | "decided" | "closed" | "appealed" | "withdrawn"; "employeeId"?: string };
    body: never;
    response: {
      "data": EmployeeRelationsCaseResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /er-cases": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: OpenCaseDto;
    response: EmployeeRelationsCaseResponseDto;
  };
  "GET /er-cases/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: EmployeeRelationsCaseResponseDto;
  };
  "GET /er-cases/employee/{employeeId}/live-sanctions": {
    path: { "employeeId": string };
    query: Record<string, never>;
    body: never;
    response: LiveSanctionResponseDto[];
  };
  "POST /er-cases/{id}/hearing": {
    path: { "id": string };
    query: Record<string, never>;
    body: ScheduleHearingDto;
    response: EmployeeRelationsCaseResponseDto;
  };
  "POST /er-cases/{id}/decide": {
    path: { "id": string };
    query: Record<string, never>;
    body: DecideCaseDto;
    response: EmployeeRelationsCaseResponseDto;
  };
  "POST /er-cases/{id}/appeal/resolve": {
    path: { "id": string };
    query: Record<string, never>;
    body: ResolveAppealDto;
    response: EmployeeRelationsCaseResponseDto;
  };
  "POST /er-cases/{id}/close": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: EmployeeRelationsCaseResponseDto;
  };
  "POST /er-cases/{id}/plan": {
    path: { "id": string };
    query: Record<string, never>;
    body: SetPipPlanDto;
    response: EmployeeRelationsCaseResponseDto;
  };
  "POST /er-cases/{id}/plan/reviews/{dueOn}": {
    path: { "id": string; "dueOn": string };
    query: Record<string, never>;
    body: RecordCheckpointDto;
    response: EmployeeRelationsCaseResponseDto;
  };
  "GET /policies": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "status"?: "draft" | "published" | "archived" };
    body: never;
    response: {
      "data": PolicyResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /policies": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreatePolicyDto;
    response: PolicyResponseDto;
  };
  "GET /policies/compliance": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: PolicyComplianceResponseDto[];
  };
  "POST /policies/{id}/publish": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: PolicyResponseDto;
  };
  "GET /me/er-cases": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: EmployeeRelationsCaseResponseDto[];
  };
  "POST /me/er-cases/{id}/respond": {
    path: { "id": string };
    query: Record<string, never>;
    body: RespondToCaseDto;
    response: EmployeeRelationsCaseResponseDto;
  };
  "POST /me/er-cases/{id}/appeal": {
    path: { "id": string };
    query: Record<string, never>;
    body: AppealCaseDto;
    response: EmployeeRelationsCaseResponseDto;
  };
  "GET /me/policies/outstanding": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: PolicyResponseDto[];
  };
  "POST /me/policies/{id}/acknowledge": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: PolicyAcknowledgementResponseDto;
  };
  "GET /leave/types": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string };
    body: never;
    response: {
      "data": LeaveTypeResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /leave/types": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateLeaveTypeDto;
    response: LeaveTypeResponseDto;
  };
  "GET /leave/policies": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string };
    body: never;
    response: {
      "data": LeavePolicyResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /leave/policies": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateLeavePolicyDto;
    response: LeavePolicyResponseDto;
  };
  "GET /leave/requests": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "status"?: "pending" | "approved" | "rejected" | "cancelled" | "withdrawn"; "employeeId"?: string; "leaveTypeId"?: string; "year"?: string };
    body: never;
    response: {
      "data": LeaveRequestResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /leave/requests/{id}/cancel": {
    path: { "id": string };
    query: Record<string, never>;
    body: CancelLeaveRequestDto;
    response: LeaveRequestResponseDto;
  };
  "GET /leave/balances/{employeeId}": {
    path: { "employeeId": string };
    query: { "year"?: string };
    body: never;
    response: LeaveBalanceResponseDto[];
  };
  "GET /leave/balances/{employeeId}/{leaveTypeId}/ledger": {
    path: { "employeeId": string; "leaveTypeId": string };
    query: { "year"?: string };
    body: never;
    response: LeaveLedgerEntryResponseDto[];
  };
  "POST /leave/balances/adjust": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: AdjustLeaveBalanceDto;
    response: LeaveBalanceResponseDto;
  };
  "POST /leave/accrual/run": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: AccrualRunDto;
    response: AccrualRunResponseDto;
  };
  "POST /leave/accrual/carry-over/{year}": {
    path: { "year": string };
    query: Record<string, never>;
    body: never;
    response: CarryOverResponseDto;
  };
  "POST /leave/accrual/expire-carry-over/{year}": {
    path: { "year": string };
    query: Record<string, never>;
    body: AccrualRunDto;
    response: CarryOverResponseDto;
  };
  "GET /me/leave/types": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: LeaveTypeResponseDto[];
  };
  "GET /me/leave/requests": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: LeaveRequestResponseDto[];
  };
  "POST /me/leave/requests": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateLeaveRequestDto;
    response: LeaveRequestResponseDto;
  };
  "POST /me/leave/requests/{id}/withdraw": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: LeaveRequestResponseDto;
  };
  "GET /me/leave/balances": {
    path: Record<string, never>;
    query: { "year"?: string };
    body: never;
    response: LeaveBalanceResponseDto[];
  };
  "GET /holidays": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "year"?: string };
    body: never;
    response: {
      "data": HolidayResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /holidays": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateHolidayDto;
    response: HolidayResponseDto;
  };
  "DELETE /holidays/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: void;
  };
  "GET /performance-cycles": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "phase"?: "draft" | "goal_setting" | "in_progress" | "self_review" | "manager_review" | "calibration" | "closed" };
    body: never;
    response: {
      "data": PerformanceCycleResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /performance-cycles": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateCycleDto;
    response: PerformanceCycleResponseDto;
  };
  "GET /performance-cycles/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: PerformanceCycleResponseDto;
  };
  "PATCH /performance-cycles/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: UpdateCycleDto;
    response: PerformanceCycleResponseDto;
  };
  "POST /performance-cycles/{id}/phase": {
    path: { "id": string };
    query: Record<string, never>;
    body: AdvancePhaseDto;
    response: PerformanceCycleResponseDto;
  };
  "GET /performance-cycles/{id}/appraisals": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: AppraisalResponseDto[];
  };
  "GET /performance-cycles/{id}/distribution": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: RatingDistributionResponseDto[];
  };
  "GET /performance-cycles/{id}/progress": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: CycleProgressRowResponseDto[];
  };
  "POST /performance-cycles/{id}/appraisals/share": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: ShareAllResponseDto;
  };
  "POST /performance-cycles/{id}/appraisals/compute": {
    path: { "id": string };
    query: Record<string, never>;
    body: ComputeAppraisalDto;
    response: AppraisalResponseDto;
  };
  "POST /goals": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateGoalDto;
    response: GoalResponseDto;
  };
  "PATCH /goals/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: UpdateGoalDto;
    response: GoalResponseDto;
  };
  "GET /goals/cycle/{cycleId}/employee/{employeeId}": {
    path: { "cycleId": string; "employeeId": string };
    query: Record<string, never>;
    body: never;
    response: GoalResponseDto[];
  };
  "GET /goals/{id}/aligned": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: GoalResponseDto[];
  };
  "POST /goals/cycle/{cycleId}/employee/{employeeId}/activate": {
    path: { "cycleId": string; "employeeId": string };
    query: Record<string, never>;
    body: never;
    response: GoalResponseDto[];
  };
  "GET /competency-frameworks": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string };
    body: never;
    response: {
      "data": CompetencyFrameworkResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /competency-frameworks": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateFrameworkDto;
    response: CompetencyFrameworkResponseDto;
  };
  "POST /competency-frameworks/{id}/deactivate": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: CompetencyFrameworkResponseDto;
  };
  "GET /competency-frameworks/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: CompetencyFrameworkResponseDto;
  };
  "POST /performance-reviews": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: SubmitReviewDto;
    response: PerformanceReviewResponseDto;
  };
  "GET /performance-reviews/cycle/{cycleId}/employee/{employeeId}": {
    path: { "cycleId": string; "employeeId": string };
    query: Record<string, never>;
    body: never;
    response: PerformanceReviewResponseDto[];
  };
  "POST /performance-reviews/appraisals/{id}/calibrate": {
    path: { "id": string };
    query: Record<string, never>;
    body: CalibrateDto;
    response: AppraisalResponseDto;
  };
  "POST /performance-reviews/appraisals/{id}/share": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: AppraisalResponseDto;
  };
  "GET /me/performance/cycles": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: MyCycleResponseDto[];
  };
  "GET /me/performance/cycles/{cycleId}/goals": {
    path: { "cycleId": string };
    query: Record<string, never>;
    body: never;
    response: GoalResponseDto[];
  };
  "PATCH /me/performance/goals/{id}/progress": {
    path: { "id": string };
    query: Record<string, never>;
    body: GoalProgressDto;
    response: GoalResponseDto;
  };
  "GET /me/performance/cycles/{cycleId}/pending-reviews": {
    path: { "cycleId": string };
    query: Record<string, never>;
    body: never;
    response: OwedReviewResponseDto[];
  };
  "GET /me/performance/cycles/{cycleId}/self-review": {
    path: { "cycleId": string };
    query: Record<string, never>;
    body: never;
    response: SelfReviewFormResponseDto;
  };
  "PUT /me/performance/cycles/{cycleId}/self-review": {
    path: { "cycleId": string };
    query: Record<string, never>;
    body: SelfReviewDto;
    response: PerformanceReviewResponseDto;
  };
  "GET /me/performance/feedback-targets": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: FeedbackTargetsResponseDto;
  };
  "GET /me/performance/cycles/{cycleId}/feedback/{employeeId}": {
    path: { "cycleId": string; "employeeId": string };
    query: Record<string, never>;
    body: never;
    response: PerformanceReviewResponseDto;
  };
  "PUT /me/performance/cycles/{cycleId}/feedback": {
    path: { "cycleId": string };
    query: Record<string, never>;
    body: FeedbackDto;
    response: PerformanceReviewResponseDto;
  };
  "GET /me/performance/appraisals": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: AppraisalSelfViewResponseDto[];
  };
  "POST /me/performance/appraisals/{id}/acknowledge": {
    path: { "id": string };
    query: Record<string, never>;
    body: AcknowledgeAppraisalDto;
    response: AppraisalSelfViewResponseDto;
  };
  "GET /performance-recommendations": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "status"?: "pending" | "approved" | "rejected" | "applied" | "cancelled"; "cycleId"?: string };
    body: never;
    response: {
      "data": PerformanceRecommendationResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /performance-recommendations": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: RecommendDto;
    response: PerformanceRecommendationResponseDto;
  };
  "GET /performance-recommendations/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: PerformanceRecommendationResponseDto;
  };
  "POST /performance-recommendations/{id}/apply": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: PerformanceRecommendationResponseDto;
  };
  "POST /performance-recommendations/{id}/withdraw": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: PerformanceRecommendationResponseDto;
  };
  "GET /me/team/performance/cycles": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: PerformanceCycleResponseDto[];
  };
  "GET /me/team/performance/cycles/{cycleId}/reports": {
    path: { "cycleId": string };
    query: Record<string, never>;
    body: never;
    response: TeamReportSummaryResponseDto[];
  };
  "GET /me/team/performance/cycles/{cycleId}/reports/{employeeId}": {
    path: { "cycleId": string; "employeeId": string };
    query: Record<string, never>;
    body: never;
    response: TeamReportDetailResponseDto;
  };
  "POST /me/team/performance/cycles/{cycleId}/reports/{employeeId}/goals": {
    path: { "cycleId": string; "employeeId": string };
    query: Record<string, never>;
    body: TeamGoalDto;
    response: GoalResponseDto;
  };
  "PATCH /me/team/performance/cycles/{cycleId}/reports/{employeeId}/goals/{goalId}": {
    path: { "cycleId": string; "employeeId": string; "goalId": string };
    query: Record<string, never>;
    body: UpdateGoalDto;
    response: GoalResponseDto;
  };
  "POST /me/team/performance/cycles/{cycleId}/reports/{employeeId}/goals/activate": {
    path: { "cycleId": string; "employeeId": string };
    query: Record<string, never>;
    body: never;
    response: ActivatedGoalsResponseDto;
  };
  "GET /me/team/performance/options": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: TeamOptionsResponseDto;
  };
  "POST /me/team/performance/cycles/{cycleId}/reports/{employeeId}/recommendation": {
    path: { "cycleId": string; "employeeId": string };
    query: Record<string, never>;
    body: TeamRecommendDto;
    response: PerformanceRecommendationResponseDto;
  };
  "PUT /me/team/performance/cycles/{cycleId}/reports/{employeeId}/review": {
    path: { "cycleId": string; "employeeId": string };
    query: Record<string, never>;
    body: ManagerReviewDto;
    response: PerformanceReviewResponseDto;
  };
  "POST /tenants": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateTenantDto;
    response: TenantProvisionedResponseDto;
  };
  "GET /tenants/me": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: TenantProfileDto;
  };
  "POST /tenants/me/branding/logo-upload": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: LogoUploadDto;
    response: LogoUploadResponseDto;
  };
  "POST /tenants/me/branding/upload": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: BrandingUploadDto;
    response: BrandingUploadResponseDto;
  };
  "PATCH /tenants/me/branding": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: UpdateTenantBrandingDto;
    response: TenantProfileDto;
  };
  "GET /public/tenants/{tenantId}/branding": {
    path: { "tenantId": string };
    query: Record<string, never>;
    body: never;
    response: PublicTenantBrandingDto;
  };
  "GET /plans": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: PlanResponseDto[];
  };
  "POST /plans": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreatePlanDto;
    response: PlanResponseDto;
  };
  "GET /plans/{code}": {
    path: { "code": string };
    query: Record<string, never>;
    body: never;
    response: PlanResponseDto;
  };
  "PATCH /plans/{code}": {
    path: { "code": string };
    query: Record<string, never>;
    body: UpdatePlanDto;
    response: PlanResponseDto;
  };
  "PATCH /plans/tenants/{tenantId}": {
    path: { "tenantId": string };
    query: Record<string, never>;
    body: AssignPlanDto;
    response: TenantPlanResponseDto;
  };
  "GET /me/entitlements": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: EntitlementsResponseDto;
  };
  "POST /operator/auth/login": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: OperatorLoginDto;
    response: OperatorLoginResponseDto;
  };
  "POST /operator/auth/mfa": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: OperatorMfaDto;
    response: OperatorSignedInDto;
  };
  "POST /operator/auth/refresh": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: OperatorRefreshDto;
    response: OperatorTokenPairDto;
  };
  "GET /operator/auth/me": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: OperatorProfileDto;
  };
  "POST /operator/auth/logout": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: void;
  };
  "GET /operator/tenants": {
    path: Record<string, never>;
    query: { "status"?: "provisioning" | "active" | "suspended"; "planCode"?: string; "subscriptionStatus"?: "trialing" | "active" | "past_due" | "cancelled"; "search"?: string };
    body: never;
    response: OperatorTenantSummaryDto[];
  };
  "POST /operator/tenants": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: ProvisionTenantDto;
    response: ProvisionedTenantDto;
  };
  "GET /operator/tenants/{tenantId}": {
    path: { "tenantId": string };
    query: Record<string, never>;
    body: never;
    response: OperatorTenantDetailDto;
  };
  "POST /operator/tenants/{tenantId}/suspend": {
    path: { "tenantId": string };
    query: Record<string, never>;
    body: ChangeTenantStatusDto;
    response: OperatorTenantSummaryDto;
  };
  "POST /operator/tenants/{tenantId}/reactivate": {
    path: { "tenantId": string };
    query: Record<string, never>;
    body: ChangeTenantStatusDto;
    response: OperatorTenantSummaryDto;
  };
  "PATCH /operator/tenants/{tenantId}/plan": {
    path: { "tenantId": string };
    query: Record<string, never>;
    body: AssignTenantPlanDto;
    response: OperatorTenantSummaryDto;
  };
  "PATCH /operator/tenants/{tenantId}/subscription": {
    path: { "tenantId": string };
    query: Record<string, never>;
    body: UpdateSubscriptionDto;
    response: OperatorTenantSummaryDto;
  };
  "PATCH /operator/tenants/{tenantId}/branding": {
    path: { "tenantId": string };
    query: Record<string, never>;
    body: UpdateTenantBrandingDto;
    response: void;
  };
  "GET /operator/plans": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: PlanResponseDto[];
  };
  "POST /operator/plans": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreatePlanDto;
    response: PlanResponseDto;
  };
  "GET /operator/plans/{code}": {
    path: { "code": string };
    query: Record<string, never>;
    body: never;
    response: PlanResponseDto;
  };
  "PATCH /operator/plans/{code}": {
    path: { "code": string };
    query: Record<string, never>;
    body: UpdatePlanDto;
    response: PlanResponseDto;
  };
  "GET /operator/operators": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: OperatorSummaryDto[];
  };
  "POST /operator/operators": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateOperatorDto;
    response: OperatorWithPasswordDto;
  };
  "GET /operator/operators/activity": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: OperatorActionViewDto[];
  };
  "PATCH /operator/operators/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: UpdateOperatorDto;
    response: OperatorSummaryDto;
  };
  "POST /operator/operators/{id}/reset-mfa": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: OperatorSummaryDto;
  };
  "POST /operator/operators/{id}/reset-password": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: OperatorWithPasswordDto;
  };
  "GET /operator/platform/overview": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: PlatformOverviewDto;
  };
  "GET /operator/platform/health": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: PlatformHealthDto;
  };
  "GET /operator/bank-list": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "countryCode"?: string; "isActive"?: string };
    body: never;
    response: {
      "data": BankResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /operator/bank-list": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateBankListDto;
    response: BankResponseDto;
  };
  "GET /operator/bank-list/summary": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: BankListSummaryDto;
  };
  "POST /operator/bank-list/sync": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: SyncBankListDto;
    response: BankLoadResultDto;
  };
  "POST /operator/bank-list/load-bundled": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: BankLoadResultDto;
  };
  "PATCH /operator/bank-list/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: UpdateBankListDto;
    response: BankResponseDto;
  };
  "GET /operator/currencies": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "isEnabled"?: "true" | "false" };
    body: never;
    response: {
      "data": CurrencyResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "GET /operator/currencies/summary": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: CurrencySummaryDto;
  };
  "PATCH /operator/currencies/{code}": {
    path: { "code": string };
    query: Record<string, never>;
    body: SetCurrencyEnabledDto;
    response: CurrencyChangeResponseDto;
  };
  "GET /operator/countries": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: OperatorCountryResponseDto[];
  };
  "PATCH /operator/countries/{code}": {
    path: { "code": string };
    query: Record<string, never>;
    body: SetCountryEnabledDto;
    response: CountryChangeResponseDto;
  };
  "GET /operator/rule-packs": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "countryCode"?: string; "status"?: "draft" | "published" | "superseded" };
    body: never;
    response: {
      "data": StatutoryRulePackResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /operator/rule-packs": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateRulePackDto;
    response: StatutoryRulePackResponseDto;
  };
  "POST /operator/rule-packs/load-bundled": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: LoadBundledRulePacksDto;
    response: BundledRulePacksResponseDto;
  };
  "GET /operator/rule-packs/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: StatutoryRulePackResponseDto;
  };
  "PATCH /operator/rule-packs/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: UpdateRulePackDto;
    response: StatutoryRulePackResponseDto;
  };
  "GET /operator/rule-packs/{id}/validate": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: RulePackValidationResponseDto;
  };
  "POST /operator/rule-packs/{id}/publish": {
    path: { "id": string };
    query: Record<string, never>;
    body: PublishRulePackDto;
    response: StatutoryRulePackResponseDto;
  };
  "GET /operator/structural-assumptions": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "countryCode"?: string; "state"?: "unresolved" | "resolved" };
    body: never;
    response: {
      "data": StructuralAssumptionResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /operator/structural-assumptions": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateAssumptionDto;
    response: StructuralAssumptionResponseDto;
  };
  "PATCH /operator/structural-assumptions/{assumptionId}/provisional": {
    path: { "assumptionId": string };
    query: Record<string, never>;
    body: SetProvisionalDto;
    response: StructuralAssumptionResponseDto;
  };
  "POST /operator/structural-assumptions/{assumptionId}/resolve": {
    path: { "assumptionId": string };
    query: Record<string, never>;
    body: ResolveAssumptionDto;
    response: StructuralAssumptionResponseDto;
  };
  "GET /roles": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: RoleResponseDto[];
  };
  "POST /roles": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateRoleDto;
    response: RoleResponseDto;
  };
  "GET /roles/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: RoleResponseDto;
  };
  "PATCH /roles/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: UpdateRoleDto;
    response: RoleResponseDto;
  };
  "DELETE /roles/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: void;
  };
  "GET /permissions": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: PermissionCatalogDto;
  };
  "GET /permissions/me": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: EffectivePermissionsDto;
  };
  "POST /me/notifications/devices": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: RegisterPushTokenDto;
    response: PushTokenAckDto;
  };
  "DELETE /me/notifications/devices": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: UnregisterPushTokenDto;
    response: PushTokenAckDto;
  };
  "GET /me/notifications/preferences": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: NotificationPreferencesResponseDto;
  };
  "PUT /me/notifications/preferences": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: UpdateNotificationPreferencesDto;
    response: NotificationPreferencesResponseDto;
  };
  "GET /me/notifications": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "unreadOnly"?: string };
    body: never;
    response: {
      "data": NotificationResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "GET /me/notifications/unread-count": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: UnreadCountResponseDto;
  };
  "PATCH /me/notifications/{id}/read": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: NotificationResponseDto;
  };
  "PATCH /me/notifications/read-all": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: MarkedReadResponseDto;
  };
  "GET /reference/states": {
    path: Record<string, never>;
    query: { "country": string };
    body: never;
    response: StateResponseDto[];
  };
  "POST /state-aliases": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateStateAliasDto;
    response: StateAliasResponseDto;
  };
  "DELETE /state-aliases/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: void;
  };
  "GET /contracts/expiring": {
    path: Record<string, never>;
    query: { "withinDays"?: string };
    body: never;
    response: EmploymentContractResponseDto[];
  };
  "POST /contracts/expire-lapsed": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: ExpireLapsedResponseDto;
  };
  "GET /contracts/employee/{employeeId}": {
    path: { "employeeId": string };
    query: Record<string, never>;
    body: never;
    response: EmploymentContractResponseDto[];
  };
  "POST /contracts/employee/{employeeId}": {
    path: { "employeeId": string };
    query: Record<string, never>;
    body: CreateContractDto;
    response: EmploymentContractResponseDto;
  };
  "GET /contracts/employee/{employeeId}/effective": {
    path: { "employeeId": string };
    query: { "on": string };
    body: never;
    response: EmploymentContractResponseDto;
  };
  "POST /contracts/employee/{employeeId}/renew": {
    path: { "employeeId": string };
    query: Record<string, never>;
    body: RenewContractDto;
    response: EmploymentContractResponseDto;
  };
  "POST /contracts/{id}/activate": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: EmploymentContractResponseDto;
  };
  "POST /contracts/{id}/terminate": {
    path: { "id": string };
    query: Record<string, never>;
    body: TerminateContractDto;
    response: EmploymentContractResponseDto;
  };
  "GET /org-chart/departments": {
    path: Record<string, never>;
    query: { "includeInactive"?: string };
    body: never;
    response: DepartmentHeadcountNodeResponseDto[];
  };
  "GET /org-chart/reporting": {
    path: Record<string, never>;
    query: { "rootEmployeeId"?: string };
    body: never;
    response: ReportingNodeResponseDto[];
  };
  "GET /org-chart/summary": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: OrgSummaryResponseDto;
  };
  "GET /workflow-definitions": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "subjectType"?: string };
    body: never;
    response: {
      "data": WorkflowDefinitionResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /workflow-definitions": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateWorkflowDefinitionDto;
    response: WorkflowDefinitionResponseDto;
  };
  "GET /workflow-definitions/metadata": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: WorkflowMetadataResponseDto;
  };
  "POST /workflow-definitions/simulate": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: SimulateWorkflowDto;
    response: WorkflowSimulationResponseDto;
  };
  "GET /workflow-definitions/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: WorkflowDefinitionResponseDto;
  };
  "POST /workflow-definitions/{id}/deactivate": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: WorkflowDefinitionResponseDto;
  };
  "GET /approvals/inbox": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string };
    body: never;
    response: {
      "data": WorkflowInstanceResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "GET /approvals": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "state"?: "pending" | "approved" | "rejected" | "returned" | "blocked" | "cancelled" | "expired"; "subjectType"?: string };
    body: never;
    response: {
      "data": WorkflowInstanceResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "GET /approvals/mine": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string };
    body: never;
    response: {
      "data": WorkflowInstanceResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /approvals/start": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: StartWorkflowDto;
    response: WorkflowInstanceResponseDto;
  };
  "GET /approvals/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: WorkflowInstanceResponseDto;
  };
  "GET /approvals/{id}/decisions": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: WorkflowDecisionResponseDto[];
  };
  "POST /approvals/bulk-decide": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: BulkDecideDto;
    response: BulkDecisionResponseDto;
  };
  "POST /approvals/{id}/decide": {
    path: { "id": string };
    query: Record<string, never>;
    body: DecideDto;
    response: WorkflowInstanceResponseDto;
  };
  "POST /approvals/{id}/override": {
    path: { "id": string };
    query: Record<string, never>;
    body: OverrideDecisionDto;
    response: WorkflowInstanceResponseDto;
  };
  "POST /approvals/{id}/cancel": {
    path: { "id": string };
    query: Record<string, never>;
    body: CancelWorkflowDto;
    response: WorkflowInstanceResponseDto;
  };
  "POST /approvals/{id}/resubmit": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: WorkflowInstanceResponseDto;
  };
  "POST /approvals/{id}/retry": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: WorkflowInstanceResponseDto;
  };
  "GET /me/delegations": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: DelegationResponseDto[];
  };
  "POST /me/delegations": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateDelegationDto;
    response: DelegationResponseDto;
  };
  "POST /me/delegations/{id}/revoke": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: DelegationResponseDto;
  };
  "GET /me/profile": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: MyProfileResponseDto;
  };
  "PATCH /me/profile": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: RequestProfileChangeDto;
    response: ProfileChangeRequestResponseDto;
  };
  "GET /me/company": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: MyCompanyResponseDto;
  };
  "GET /me/holidays": {
    path: Record<string, never>;
    query: { "year": string };
    body: never;
    response: HolidayResponseDto[];
  };
  "GET /me/team": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: EmployeeResponseDto[];
  };
  "GET /me/colleagues": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: ColleagueResponseDto[];
  };
  "GET /me/profile-changes": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: ProfileChangeRequestResponseDto[];
  };
  "POST /me/profile-changes/{id}/cancel": {
    path: { "id": string };
    query: Record<string, never>;
    body: CancelProfileChangeDto;
    response: ProfileChangeRequestResponseDto;
  };
  "GET /me/data-export": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: DataExportResponseDto;
  };
  "GET /search": {
    path: Record<string, never>;
    query: { "q": string };
    body: never;
    response: SearchResponseDto;
  };
  "GET /setup": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: SetupStatusResponseDto;
  };
  "POST /setup/steps/{key}/skip": {
    path: { "key": string };
    query: Record<string, never>;
    body: never;
    response: SetupStatusResponseDto;
  };
  "DELETE /setup/steps/{key}/skip": {
    path: { "key": string };
    query: Record<string, never>;
    body: never;
    response: SetupStatusResponseDto;
  };
  "POST /setup/copy": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CopySetupDto;
    response: CopySetupResponseDto;
  };
  "GET /rule-packs": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "countryCode"?: string; "status"?: "draft" | "published" | "superseded" };
    body: never;
    response: {
      "data": StatutoryRulePackResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "GET /rule-packs/resolve": {
    path: Record<string, never>;
    query: { "countryCode": string; "asOf": string };
    body: never;
    response: StatutoryRulePackResponseDto;
  };
  "GET /rule-packs/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: StatutoryRulePackResponseDto;
  };
  "GET /rule-packs/{id}/validate": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: RulePackValidationResponseDto;
  };
  "GET /structural-assumptions": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "countryCode"?: string; "state"?: "unresolved" | "resolved" };
    body: never;
    response: {
      "data": StructuralAssumptionResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "GET /pay-structures": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "status"?: "active" | "inactive" };
    body: never;
    response: {
      "data": PayStructureResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /pay-structures": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreatePayStructureDto;
    response: PayStructureResponseDto;
  };
  "POST /pay-structures/from-company-defaults": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: PayStructureResponseDto;
  };
  "GET /pay-structures/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: PayStructureResponseDto;
  };
  "PATCH /pay-structures/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: UpdatePayStructureDto;
    response: PayStructureResponseDto;
  };
  "POST /pay-structures/targeting": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateComponentTargetingDto;
    response: ComponentTargetingResponseDto;
  };
  "GET /pay-structures/targeting/all": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string };
    body: never;
    response: {
      "data": ComponentTargetingResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "DELETE /pay-structures/targeting/{componentCode}": {
    path: { "componentCode": string };
    query: Record<string, never>;
    body: never;
    response: void;
  };
  "GET /payroll-runs": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "status"?: "draft" | "calculating" | "calculated" | "in_review" | "approved" | "locked" | "paid" | "cancelled" };
    body: never;
    response: {
      "data": PayrollRunResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /payroll-runs": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreatePayrollRunDto;
    response: PayrollRunResponseDto;
  };
  "GET /payroll-runs/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: PayrollRunResponseDto;
  };
  "POST /payroll-runs/{id}/preflight": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: PreflightResponseDto;
  };
  "POST /payroll-runs/{id}/calculate": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: PayrollRunResponseDto;
  };
  "GET /payroll-runs/{id}/payslips": {
    path: { "id": string };
    query: { "employeeNumber"?: string };
    body: never;
    response: PayslipResponseDto[];
  };
  "GET /payroll-runs/{id}/inputs": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: RunInputsResponseDto;
  };
  "GET /payroll-runs/{id}/variance": {
    path: { "id": string };
    query: { "thresholdPercent"?: number };
    body: never;
    response: VarianceLineResponseDto[];
  };
  "POST /payroll-runs/{id}/submit": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: PayrollRunResponseDto;
  };
  "POST /payroll-runs/{id}/lock": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: PayrollRunResponseDto;
  };
  "POST /payroll-runs/{id}/mark-paid": {
    path: { "id": string };
    query: Record<string, never>;
    body: MarkPaidDto;
    response: PayrollRunResponseDto;
  };
  "POST /payroll-runs/{id}/payslips/generate": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: PayslipGenerationResponseDto;
  };
  "POST /payroll-runs/{id}/cancel": {
    path: { "id": string };
    query: Record<string, never>;
    body: CancelPayrollRunDto;
    response: PayrollRunResponseDto;
  };
  "POST /payroll-runs/{id}/verify": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: PayrollVerificationResponseDto;
  };
  "GET /payroll-runs/employee/{employeeId}/payslips": {
    path: { "employeeId": string };
    query: Record<string, never>;
    body: never;
    response: PayslipResponseDto[];
  };
  "GET /payroll-runs/final-settlement/{employeeId}": {
    path: { "employeeId": string };
    query: Record<string, never>;
    body: never;
    response: FinalSettlementResponseDto;
  };
  "GET /me/payslips/legacy": {
    path: Record<string, never>;
    query: { "period": string };
    body: never;
    response: LegacyPayslipResponseDto;
  };
  "GET /me/payslips": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: MyPayslipResponseDto[];
  };
  "POST /me/payslips/{id}/download": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: PresignedUrlResponseDto;
  };
  "POST /payroll-runs/{id}/outputs": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: OutputSummaryResponseDto;
  };
  "GET /payroll-runs/{id}/outputs/bank-schedules": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: BankScheduleResponseDto[];
  };
  "POST /payroll-runs/{id}/outputs/bank-schedules/{bankCode}/file": {
    path: { "id": string; "bankCode": string };
    query: Record<string, never>;
    body: never;
    response: PresignedUrlResponseDto;
  };
  "GET /payroll-runs/{id}/outputs/remittances": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: RemittanceScheduleResponseDto[];
  };
  "GET /payroll-runs/{id}/outputs/exceptions": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: ExceptionReportEntryResponseDto[];
  };
  "POST /payroll-runs/{id}/outputs/register/file": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: PresignedUrlResponseDto;
  };
  "GET /loans": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "status"?: "pending" | "approved" | "active" | "settled" | "rejected" | "cancelled" | "written_off"; "employeeId"?: string };
    body: never;
    response: {
      "data": LoanResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /loans": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: ApplyForLoanOnBehalfDto;
    response: LoanResponseDto;
  };
  "GET /loans/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: LoanResponseDto;
  };
  "POST /loans/{id}/settle": {
    path: { "id": string };
    query: Record<string, never>;
    body: SettleLoanDto;
    response: LoanResponseDto;
  };
  "GET /me/loans": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: LoanResponseDto[];
  };
  "POST /me/loans": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: ApplyForLoanDto;
    response: LoanResponseDto;
  };
  "GET /pay-items": {
    path: Record<string, never>;
    query: { "scope"?: "organisation" | "company" };
    body: never;
    response: PayItemResponseDto[];
  };
  "POST /pay-items": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreatePayItemDto;
    response: PayItemResponseDto;
  };
  "GET /pay-items/effective": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: PayItemResponseDto[];
  };
  "POST /pay-items/common-set": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CommonPayItemsDto;
    response: PayItemResponseDto[];
  };
  "PATCH /pay-items/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: UpdatePayItemDto;
    response: PayItemResponseDto;
  };
  "DELETE /pay-items/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: void;
  };
  "POST /payroll-schedules/template": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: PresignedUrlResponseDto;
  };
  "GET /payroll-runs/{id}/schedules": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: PayrollScheduleResponseDto[];
  };
  "POST /payroll-runs/{id}/schedules": {
    path: { "id": string };
    query: Record<string, never>;
    body: SubmitScheduleDto;
    response: ScheduleCheckResponseDto | PayrollScheduleResponseDto;
  };
  "POST /payroll-runs/{id}/schedules/uploads": {
    path: { "id": string };
    query: Record<string, never>;
    body: ScheduleUploadSlotDto;
    response: UploadSlotResponseDto;
  };
  "POST /payroll-runs/{id}/schedules/{scheduleId}/confirm": {
    path: { "id": string; "scheduleId": string };
    query: Record<string, never>;
    body: never;
    response: PayrollScheduleResponseDto;
  };
  "POST /payroll-runs/{id}/schedules/{scheduleId}/discard": {
    path: { "id": string; "scheduleId": string };
    query: Record<string, never>;
    body: never;
    response: PayrollScheduleResponseDto;
  };
  "POST /payroll-runs/{id}/schedules/{scheduleId}/file": {
    path: { "id": string; "scheduleId": string };
    query: Record<string, never>;
    body: never;
    response: PresignedUrlResponseDto;
  };
  "GET /payroll-runs/{id}/holds": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: HoldResponseDto[];
  };
  "POST /payroll-runs/{id}/holds": {
    path: { "id": string };
    query: Record<string, never>;
    body: SetHoldDto;
    response: HoldResponseDto[];
  };
  "POST /payroll-runs/{id}/releases": {
    path: { "id": string };
    query: Record<string, never>;
    body: RequestReleaseDto;
    response: PayrollRunResponseDto;
  };
  "POST /payroll-runs/{id}/approvals/statutory/resubmit": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: PayrollRunResponseDto;
  };
  "GET /payroll-output-layouts/catalog": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: LayoutCatalogResponseDto;
  };
  "GET /payroll-output-layouts": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: OutputLayoutResponseDto[];
  };
  "POST /payroll-output-layouts": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateOutputLayoutDto;
    response: OutputLayoutResponseDto;
  };
  "POST /payroll-output-layouts/presets": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: LayoutPresetDto;
    response: OutputLayoutResponseDto;
  };
  "PATCH /payroll-output-layouts/{layoutId}": {
    path: { "layoutId": string };
    query: Record<string, never>;
    body: UpdateOutputLayoutDto;
    response: OutputLayoutResponseDto;
  };
  "DELETE /payroll-output-layouts/{layoutId}": {
    path: { "layoutId": string };
    query: Record<string, never>;
    body: never;
    response: void;
  };
  "POST /payroll-output-layouts/{layoutId}/preview": {
    path: { "layoutId": string };
    query: Record<string, never>;
    body: PreviewLayoutDto;
    response: LayoutPreviewResponseDto;
  };
  "POST /payroll-runs/{id}/outputs/files": {
    path: { "id": string };
    query: Record<string, never>;
    body: GenerateLayoutFileDto;
    response: PresignedUrlResponseDto;
  };
  "GET /payroll-reports/annual": {
    path: Record<string, never>;
    query: { "year": number; "kind": "paye" | "pension"; "state"?: string };
    body: never;
    response: AnnualReportRowResponseDto[];
  };
  "POST /payroll-reports/annual/file": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: AnnualReportQueryDto;
    response: PresignedUrlResponseDto;
  };
  "PUT /legacy-payslips/key": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: LegacyPayslipKeyDto;
    response: LegacyKeySavedResponseDto;
  };
  "GET /banks": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "countryCode"?: string; "isActive"?: string };
    body: never;
    response: {
      "data": BankResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "GET /banks/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: BankResponseDto;
  };
  "GET /supported-banks": {
    path: Record<string, never>;
    query: { "country"?: string; "active"?: "true" | "false" };
    body: never;
    response: SupportedBanksResponseDto;
  };
  "POST /supported-banks": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: AddSupportedBanksDto;
    response: SupportedBanksResponseDto;
  };
  "PATCH /supported-banks/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: UpdateSupportedBankDto;
    response: SupportedBanksResponseDto;
  };
  "DELETE /supported-banks/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: SupportedBanksResponseDto;
  };
  "GET /devices": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: DeviceResponseDto[];
  };
  "POST /devices": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: RegisterDeviceDto;
    response: DeviceResponseDto;
  };
  "POST /devices/{serialNumber}/token": {
    path: { "serialNumber": string };
    query: Record<string, never>;
    body: never;
    response: DeviceResponseDto;
  };
  "PATCH /devices/{serialNumber}/status": {
    path: { "serialNumber": string };
    query: Record<string, never>;
    body: SetDeviceStatusDto;
    response: DeviceResponseDto;
  };
  "GET /expense-policies": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: ExpensePolicyResponseDto[];
  };
  "POST /expense-policies": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateExpensePolicyDto;
    response: ExpensePolicyResponseDto;
  };
  "PATCH /expense-policies/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: UpdateExpensePolicyDto;
    response: ExpensePolicyResponseDto;
  };
  "GET /expenses": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "status"?: "draft" | "submitted" | "approved" | "rejected" | "queried" | "reimbursed" | "cancelled"; "employeeId"?: string };
    body: never;
    response: {
      "data": ExpenseClaimResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "GET /expenses/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: ExpenseClaimResponseDto;
  };
  "GET /expenses/{id}/lines/{lineId}/receipt": {
    path: { "id": string; "lineId": string };
    query: Record<string, never>;
    body: never;
    response: ReceiptUrlResponseDto;
  };
  "POST /expenses/{id}/reimburse": {
    path: { "id": string };
    query: Record<string, never>;
    body: ReimburseClaimDto;
    response: ExpenseClaimResponseDto;
  };
  "POST /me/expenses/receipt-upload-url": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: ReceiptUploadRequestDto;
    response: ExpenseUploadSlotDto;
  };
  "GET /me/expenses": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "status"?: "draft" | "submitted" | "approved" | "rejected" | "queried" | "reimbursed" | "cancelled" };
    body: never;
    response: {
      "data": ExpenseClaimResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /me/expenses": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateExpenseClaimDto;
    response: ExpenseClaimResponseDto;
  };
  "GET /me/expenses/categories": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: MyExpenseCategoryDto[];
  };
  "GET /me/expenses/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: ExpenseClaimResponseDto;
  };
  "POST /me/expenses/{id}/lines": {
    path: { "id": string };
    query: Record<string, never>;
    body: AddExpenseLineDto;
    response: ExpenseClaimResponseDto;
  };
  "DELETE /me/expenses/{id}/lines/{lineId}": {
    path: { "id": string; "lineId": string };
    query: Record<string, never>;
    body: never;
    response: ExpenseClaimResponseDto;
  };
  "POST /me/expenses/{id}/submit": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: ExpenseClaimResponseDto;
  };
  "POST /me/whistleblowing": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: SubmitReportDto;
    response: SubmittedReportDto;
  };
  "POST /me/whistleblowing/follow-up": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: FollowUpDto;
    response: ReporterViewDto;
  };
  "POST /me/whistleblowing/follow-up/reply": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: ReporterReplyDto;
    response: ReporterViewDto;
  };
  "GET /whistleblowing": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "status"?: "received" | "triaging" | "investigating" | "closed" };
    body: never;
    response: {
      "data": ReportDto[];
      "meta": PaginationMetaDto;
    };
  };
  "GET /whistleblowing/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: never;
    response: ReportDto;
  };
  "PATCH /whistleblowing/{id}/assign": {
    path: { "id": string };
    query: Record<string, never>;
    body: AssignReportDto;
    response: ReportDto;
  };
  "POST /whistleblowing/{id}/reply": {
    path: { "id": string };
    query: Record<string, never>;
    body: ReplyToReportDto;
    response: ReportDto;
  };
  "POST /whistleblowing/{id}/close": {
    path: { "id": string };
    query: Record<string, never>;
    body: CloseReportDto;
    response: ReportDto;
  };
  "GET /learning-items": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: LearningItemResponseDto[];
  };
  "POST /learning-items": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreateLearningItemDto;
    response: LearningItemResponseDto;
  };
  "PATCH /learning-items/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: UpdateLearningItemDto;
    response: LearningItemResponseDto;
  };
  "GET /learning-enrolments": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "employeeId"?: string; "status"?: "enrolled" | "in_progress" | "completed" | "failed" | "withdrawn" };
    body: never;
    response: {
      "data": EnrolmentResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "POST /learning-enrolments": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: EnrolDto;
    response: EnrolmentResponseDto;
  };
  "GET /learning-enrolments/compliance": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: ComplianceRowDto[];
  };
  "POST /learning-enrolments/{id}/complete": {
    path: { "id": string };
    query: Record<string, never>;
    body: CompleteEnrolmentDto;
    response: EnrolmentResponseDto;
  };
  "GET /me/learning": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: EnrolmentResponseDto[];
  };
  "GET /ai/status": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: AiStatusResponseDto;
  };
  "GET /ai/usage": {
    path: Record<string, never>;
    query: { "from"?: string; "to"?: string };
    body: never;
    response: AiUsageSummaryResponseDto;
  };
  "GET /ai/usage/calls": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "feature"?: string; "from"?: string; "to"?: string };
    body: never;
    response: {
      "data": AiUsageCallResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "GET /audit-logs": {
    path: Record<string, never>;
    query: { "page"?: number; "limit"?: number; "search"?: string; "sort"?: string; "action"?: string; "entityType"?: string; "entityId"?: string; "actorId"?: string; "companyId"?: string; "outcome"?: "success" | "failure"; "from"?: string; "to"?: string; "correlationId"?: string };
    body: never;
    response: {
      "data": AuditLogResponseDto[];
      "meta": PaginationMetaDto;
    };
  };
  "GET /audit-logs/{entityType}/{entityId}": {
    path: { "entityType": string; "entityId": string };
    query: Record<string, never>;
    body: never;
    response: AuditLogResponseDto[];
  };
  "GET /currencies": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: CurrencyResponseDto[];
  };
  "GET /countries": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: never;
    response: CountryResponseDto[];
  };
  "GET /pfas": {
    path: Record<string, never>;
    query: { "active"?: "true" | "false" };
    body: never;
    response: PfaResponseDto[];
  };
  "POST /pfas": {
    path: Record<string, never>;
    query: Record<string, never>;
    body: CreatePfaDto;
    response: PfaResponseDto;
  };
  "PATCH /pfas/{id}": {
    path: { "id": string };
    query: Record<string, never>;
    body: UpdatePfaDto;
    response: PfaResponseDto;
  };
}
