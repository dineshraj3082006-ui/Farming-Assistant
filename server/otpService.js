/* ==========================================================================
   KRISHIMITRA AI - Twilio Verify OTP Service
   Uses Twilio's official Verify API with pre-approved default SMS templates
   to deliver real-time OTPs to farmer mobile numbers worldwide.
   ========================================================================== */

const twilio = require('twilio');

// Fallback in-memory store if Twilio is not configured: mobile -> { otp, expiresAt, attempts }
const fallbackOtpStore = new Map();

/**
 * Normalizes an Indian or International mobile number to E.164 format (+91XXXXXXXXXX)
 */
function normalizeMobile(mobile) {
  if (!mobile) return '';
  const str = String(mobile).trim();
  const digits = str.replace(/\D/g, '');

  if (str.startsWith('+')) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

/**
 * Get or initialize Twilio Verify Client
 */
function getTwilioVerifyConfig() {
  const accountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
  const authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
  const serviceSid = (process.env.TWILIO_VERIFY_SERVICE_SID || '').trim();

  if (accountSid && authToken) {
    const client = twilio(accountSid, authToken);
    return { client, serviceSid };
  }
  return null;
}

/**
 * Send real-time OTP using Twilio Verify default template
 */
async function sendOtp(mobile) {
  const formattedNumber = normalizeMobile(mobile);
  if (!formattedNumber || formattedNumber.length < 12) {
    throw new Error('Please enter a valid 10-digit mobile number.');
  }

  const twilioConfig = getTwilioVerifyConfig();

  if (twilioConfig) {
    try {
      let serviceSid = twilioConfig.serviceSid;

      // If no service SID in env, dynamically get or create one
      if (!serviceSid) {
        const services = await twilioConfig.client.verify.v2.services.list({ limit: 1 });
        if (services.length > 0) {
          serviceSid = services[0].sid;
        } else {
          const newService = await twilioConfig.client.verify.v2.services.create({
            friendlyName: 'KrishiMitra AI'
          });
          serviceSid = newService.sid;
        }
      }

      console.log(`[Twilio Verify] Dispatching SMS OTP to ${formattedNumber} via Service ${serviceSid}...`);

      const verification = await twilioConfig.client.verify.v2.services(serviceSid)
        .verifications
        .create({ to: formattedNumber, channel: 'sms' });

      console.log(`[Twilio Verify] SMS dispatched successfully! Status: ${verification.status}, SID: ${verification.sid}`);

      return {
        success: true,
        delivered: true,
        provider: 'Twilio Verify (Default Template)',
        digits: 6,
        status: verification.status,
        message: `Real-time OTP has been sent via SMS to ${formattedNumber}! Check your mobile messages.`
      };
    } catch (twilioErr) {
      console.error('[Twilio Verify Error]:', twilioErr.code, twilioErr.message);

      let cleanError = twilioErr.message;
      if (twilioErr.code === 60200 || cleanError.includes('Invalid parameter `To`')) {
        cleanError = 'Invalid mobile number. Please check the 10-digit number.';
      } else if (twilioErr.code === 60203) {
        cleanError = 'Max verification send attempts reached. Please wait a few minutes.';
      }

      // Generate local fallback code for seamless developer testing
      const devCode = Math.floor(100000 + Math.random() * 900000).toString();
      fallbackOtpStore.set(formattedNumber, {
        otp: devCode,
        expiresAt: Date.now() + 5 * 60 * 1000,
        attempts: 0
      });

      return {
        success: true,
        delivered: false,
        provider: 'Local Fallback',
        digits: 6,
        devOtp: devCode,
        error: cleanError,
        message: `${cleanError} (For testing right now, your OTP code is: ${devCode})`
      };
    }
  }

  // Local fallback if no Twilio credentials
  const devCode = Math.floor(100000 + Math.random() * 900000).toString();
  fallbackOtpStore.set(formattedNumber, {
    otp: devCode,
    expiresAt: Date.now() + 5 * 60 * 1000,
    attempts: 0
  });

  return {
    success: true,
    delivered: false,
    provider: 'Local Mock',
    digits: 6,
    devOtp: devCode,
    message: `Twilio not configured. Use OTP: ${devCode}`
  };
}

/**
 * Verify entered OTP via Twilio Verify or fallback store
 */
async function verifyOtp(mobile, enteredOtp) {
  const formattedNumber = normalizeMobile(mobile);
  const cleanEntered = String(enteredOtp || '').trim();

  // Allow Demo login fallback for Raman Nair (9876543210)
  if (formattedNumber.endsWith('9876543210') && (cleanEntered === '1234' || cleanEntered === '123456')) {
    return { success: true, message: 'Demo OTP verified successfully' };
  }

  const twilioConfig = getTwilioVerifyConfig();

  if (twilioConfig && twilioConfig.serviceSid) {
    try {
      console.log(`[Twilio Verify] Checking code for ${formattedNumber}...`);
      const check = await twilioConfig.client.verify.v2.services(twilioConfig.serviceSid)
        .verificationChecks
        .create({ to: formattedNumber, code: cleanEntered });

      console.log(`[Twilio Verify] Result for ${formattedNumber}:`, check.status, 'Valid:', check.valid);

      if (check.status === 'approved' || check.valid) {
        return {
          success: true,
          message: 'OTP verified successfully via Twilio Verify.'
        };
      } else {
        return {
          success: false,
          error: 'Incorrect OTP entered. Please check your SMS and enter the valid 6-digit code.'
        };
      }
    } catch (err) {
      console.error('[Twilio Verify Check Error]:', err.message);
      if (err.status === 404) {
        return {
          success: false,
          error: 'Verification session expired. Please click "Resend OTP".'
        };
      }
      return {
        success: false,
        error: `Verification error: ${err.message}`
      };
    }
  }

  // Fallback in-memory verification
  const stored = fallbackOtpStore.get(formattedNumber);
  if (!stored) {
    return {
      success: false,
      error: 'No active OTP found. Please click "Send Verification OTP".'
    };
  }

  if (Date.now() > stored.expiresAt) {
    fallbackOtpStore.delete(formattedNumber);
    return { success: false, error: 'OTP has expired. Please request a new OTP.' };
  }

  if (stored.otp !== cleanEntered) {
    stored.attempts += 1;
    return {
      success: false,
      error: 'Incorrect OTP entered. Please enter the valid code sent to your phone.'
    };
  }

  fallbackOtpStore.delete(formattedNumber);
  return { success: true, message: 'OTP verified successfully.' };
}

module.exports = {
  sendOtp,
  verifyOtp,
  normalizeMobile
};
