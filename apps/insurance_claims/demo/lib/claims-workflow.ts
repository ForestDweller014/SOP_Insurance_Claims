export const PHASES = [
  'VERIFY_ID',
  'RESOLVE_INTENT',
  'PROCESS_CASE',
  'POST_PROCESS',
] as const;

export type Phase = (typeof PHASES)[number];
export type IdentityField = 'name' | 'dob' | 'phone' | 'email' | 'id_last4';

export type Policyholder = {
  party_id: string;
  name: string;
  name_aliases?: string[];
  policy_number: string;
  dob: string;
  id_type: 'ssn_last4' | 'national_id_last4';
  id_last4: string;
  phone: string;
  phone_aliases?: string[];
  email: string;
  email_aliases?: string[];
};

export type Claim = {
  case_id: string;
  party_id: string;
  case_type: string;
  created_at: string;
  status: string;
  summary: string;
  denial_reason?: string;
  documents_needed?: string[];
  appeal_deadline?: string;
  expected_reimbursement_amount: string;
  allowed_max_amount: string;
  net_pay: string;
  net_fee: string;
};

export type IntentHints = {
  caseType?: string;
  status?: string;
  month?: number;
  year?: number;
  topic?: 'denial' | 'status' | 'documents' | 'general';
};

export type WorkflowState = {
  phase: Phase;
  phaseHistory: Phase[];
  candidatePartyId?: string;
  matchedFields: IdentityField[];
  mismatchAttempts: number;
  refusedFields: IdentityField[];
  intentHints: IntentHints;
  selectedCaseId?: string;
  escalationOffered: boolean;
  postProcessChoice?: 'send' | 'skip';
};

export type WorkflowData = {
  policyholders: Policyholder[];
  claims: Claim[];
};

export type WorkflowTurn = {
  state: WorkflowState;
  reply: string;
};

type ExtractedIdentity = Partial<Record<IdentityField, string>> & {
  policyNumber?: string;
};

const IDENTITY_LABELS: Record<IdentityField, string> = {
  name: 'full name',
  dob: 'date of birth',
  phone: 'phone number',
  email: 'email address',
  id_last4: 'last four ID digits',
};

const MONTHS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

const NEXT_PHASE: Partial<Record<Phase, Phase>> = {
  VERIFY_ID: 'RESOLVE_INTENT',
  RESOLVE_INTENT: 'PROCESS_CASE',
  PROCESS_CASE: 'POST_PROCESS',
};

export function createInitialState(): WorkflowState {
  return {
    phase: 'VERIFY_ID',
    phaseHistory: ['VERIFY_ID'],
    matchedFields: [],
    mismatchAttempts: 0,
    refusedFields: [],
    intentHints: {},
    escalationOffered: false,
  };
}

function transition(
  state: WorkflowState,
  next: Phase,
  gateSatisfied: boolean,
): WorkflowState {
  if (!gateSatisfied || NEXT_PHASE[state.phase] !== next) return state;
  return { ...state, phase: next, phaseHistory: [...state.phaseHistory, next] };
}

function normalizeText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9@.+]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizeName(value: string): string {
  return normalizeText(value).replace(/[^a-z0-9 ]/g, '');
}

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function normalizeDate(value: string): string | undefined {
  const iso = value.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (iso) {
    return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  }
  const us = value.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/);
  if (us) {
    return `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`;
  }
  return undefined;
}

function extractIdentity(text: string, policyholders: Policyholder[]): ExtractedIdentity {
  const normalized = normalizeText(text);
  const result: ExtractedIdentity = {};
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const phone = text.match(/(?:\+?1[\s().-]*)?(?:\d[\s().-]*){10}\b/)?.[0];
  const idContext = text.match(/(?:ssn|social security|national id|id|last four|last 4)[^\d]{0,24}(\d{4})\b/i);
  const policy = text.match(/\bPOL[-\s]?\d{4}\b/i)?.[0];
  const dob = normalizeDate(text);

  if (email) result.email = email.toLowerCase();
  if (phone) result.phone = normalizePhone(phone);
  if (idContext) result.id_last4 = idContext[1];
  if (policy) result.policyNumber = policy.toUpperCase().replace(/\s/g, '-');
  if (dob) result.dob = dob;

  for (const holder of policyholders) {
    const names = [holder.name, ...(holder.name_aliases ?? [])];
    const matchedName = names.find((name) =>
      normalized.includes(normalizeName(name)),
    );
    if (matchedName) {
      result.name = matchedName;
      break;
    }
  }
  return result;
}

function extractIntentHints(text: string, previous: IntentHints): IntentHints {
  const normalized = normalizeText(text);
  const next = { ...previous };
  for (const [month, number] of Object.entries(MONTHS)) {
    if (normalized.includes(month)) next.month = number;
  }
  const year = text.match(/\b(20\d{2})\b/)?.[1];
  if (year) next.year = Number(year);
  if (/\bhealth(?:care)?\b|\bmedical\b/.test(normalized)) next.caseType = 'healthcare';
  if (/\bdental\b/.test(normalized)) next.caseType = 'dental';
  if (/\bauto\b|\bvehicle\b|\bcar\b/.test(normalized)) next.caseType = 'auto';
  if (/\bdenied|denial|declined\b/.test(normalized)) {
    next.status = 'denied';
    next.topic = 'denial';
  } else if (/\bstatus|progress|where is\b/.test(normalized)) {
    next.topic = 'status';
  } else if (/\bdocument|upload|submit|paperwork\b/.test(normalized)) {
    next.topic = 'documents';
  }
  return next;
}

function locateCandidate(
  extracted: ExtractedIdentity,
  data: WorkflowData,
  existingPartyId?: string,
): Policyholder | undefined {
  if (existingPartyId) {
    return data.policyholders.find((holder) => holder.party_id === existingPartyId);
  }
  if (extracted.policyNumber) {
    const holder = data.policyholders.find(
      (item) => item.policy_number.toUpperCase() === extracted.policyNumber,
    );
    if (holder) return holder;
  }
  if (extracted.name) {
    const target = normalizeName(extracted.name);
    const holder = data.policyholders.find((item) =>
      [item.name, ...(item.name_aliases ?? [])].some(
        (name) => normalizeName(name) === target,
      ),
    );
    if (holder) return holder;
  }
  const candidates = data.policyholders.filter((holder) => {
    const checks = [
      extracted.dob && extracted.dob === holder.dob,
      extracted.email &&
        [holder.email, ...(holder.email_aliases ?? [])]
          .map((email) => email.toLowerCase())
          .includes(extracted.email),
      extracted.phone &&
        [holder.phone, ...(holder.phone_aliases ?? [])]
          .map(normalizePhone)
          .includes(extracted.phone),
      extracted.id_last4 && extracted.id_last4 === holder.id_last4,
    ];
    return checks.some(Boolean);
  });
  return candidates.length === 1 ? candidates[0] : undefined;
}

function identityMatches(
  field: IdentityField,
  value: string,
  holder: Policyholder,
): boolean {
  if (field === 'name') {
    const target = normalizeName(value);
    return [holder.name, ...(holder.name_aliases ?? [])].some(
      (name) => normalizeName(name) === target,
    );
  }
  if (field === 'dob') return normalizeDate(value) === holder.dob || value === holder.dob;
  if (field === 'phone') {
    return [holder.phone, ...(holder.phone_aliases ?? [])]
      .map(normalizePhone)
      .includes(normalizePhone(value));
  }
  if (field === 'email') {
    return [holder.email, ...(holder.email_aliases ?? [])]
      .map((email) => email.toLowerCase())
      .includes(value.toLowerCase());
  }
  return value.replace(/\D/g, '').slice(-4) === holder.id_last4;
}

function detectRefusedField(text: string): IdentityField | undefined {
  if (!/\b(won't|will not|refuse|not sharing|not giving|can't give|cannot give)\b/i.test(text)) {
    return undefined;
  }
  if (/ssn|social|national id|last four|last 4/i.test(text)) return 'id_last4';
  if (/phone/i.test(text)) return 'phone';
  if (/email/i.test(text)) return 'email';
  if (/birth|dob/i.test(text)) return 'dob';
  if (/name/i.test(text)) return 'name';
  return undefined;
}

function isUpset(text: string): boolean {
  return /ridiculous|frustrat|angry|annoy|already told|waste of time|unacceptable/i.test(text);
}

function resolveClaim(state: WorkflowState, data: WorkflowData): Claim | undefined {
  if (!state.candidatePartyId) return undefined;
  let candidates = data.claims.filter(
    (claim) => claim.party_id === state.candidatePartyId,
  );
  const hints = state.intentHints;
  if (hints.caseType) candidates = candidates.filter((claim) => claim.case_type === hints.caseType);
  if (hints.status) candidates = candidates.filter((claim) => claim.status === hints.status);
  if (hints.month) {
    candidates = candidates.filter(
      (claim) => Number(claim.created_at.slice(5, 7)) === hints.month,
    );
  }
  if (hints.year) candidates = candidates.filter((claim) => Number(claim.created_at.slice(0, 4)) === hints.year);
  return candidates.length === 1 ? candidates[0] : undefined;
}

function safeVerificationReply(
  state: WorkflowState,
  upset: boolean,
  refused?: IdentityField,
): string {
  const empathy = upset
    ? 'I hear how frustrating this is, and I’m sorry for the extra step. '
    : '';
  if (state.mismatchAttempts >= 3) {
    return `${empathy}I couldn’t complete automated verification after several attempts. I still can’t disclose claim information, but I can connect you with a human representative.`;
  }
  const remaining = (Object.keys(IDENTITY_LABELS) as IdentityField[]).filter(
    (field) => !state.matchedFields.includes(field) && field !== refused,
  );
  const needed = 3 - state.matchedFields.length;
  if (refused) {
    return `${empathy}That’s okay—you don’t have to use your ${IDENTITY_LABELS[refused]}. To protect your claim information, please use ${needed} more ${needed === 1 ? 'detail' : 'details'} from: ${remaining.map((field) => IDENTITY_LABELS[field]).join(', ')}. You can also ask for a human representative.`;
  }
  return `${empathy}Claim information is protected, so I need ${needed} more matching ${needed === 1 ? 'detail' : 'details'} before I can continue. You may use: ${remaining.map((field) => IDENTITY_LABELS[field]).join(', ')}.`;
}

function groundedClaimReply(claim: Claim, text: string): string {
  if (/why|reason|denied|denial/i.test(text) && claim.denial_reason) {
    return `Claim ${claim.case_id} was denied because ${claim.denial_reason}. ${claim.documents_needed?.length ? `The file needs ${claim.documents_needed.join(' and ')}.` : ''}`.trim();
  }
  if (/document|need|submit|upload/i.test(text) && claim.documents_needed?.length) {
    return `For claim ${claim.case_id}, the requested documents are ${claim.documents_needed.join(' and ')}. Use the member portal or claim upload link when possible so the files stay attached to the claim.`;
  }
  if (/status|progress/i.test(text)) {
    return `Claim ${claim.case_id} is currently ${claim.status}. ${claim.summary}.`;
  }
  if (/pay|amount|reimburse/i.test(text)) {
    return `For claim ${claim.case_id}, the expected reimbursement is $${claim.expected_reimbursement_amount}, the allowed maximum is $${claim.allowed_max_amount}, and the finalized payment is $${claim.net_pay}.`;
  }
  return `I can help with claim ${claim.case_id}. It is a ${claim.case_type} claim created on ${claim.created_at}, and its current status is ${claim.status}. Ask about the status, decision, requested documents, or payment information.`;
}

export function processMessage(
  current: WorkflowState,
  text: string,
  data: WorkflowData,
): WorkflowTurn {
  let state: WorkflowState = {
    ...current,
    phaseHistory: [...current.phaseHistory],
    matchedFields: [...current.matchedFields],
    refusedFields: [...current.refusedFields],
    intentHints: extractIntentHints(text, current.intentHints),
  };

  if (state.phase === 'VERIFY_ID') {
    if (/\b(human|representative|agent|transfer me)\b/i.test(text)) {
      return {
        state: { ...state, escalationOffered: true },
        reply: 'I can connect you with a human representative. Until they complete verification, I still can’t disclose claim information.',
      };
    }

    const refused = detectRefusedField(text);
    if (refused && !state.refusedFields.includes(refused)) {
      state.refusedFields.push(refused);
    }
    const extracted = extractIdentity(text, data.policyholders);
    const holder = locateCandidate(extracted, data, state.candidatePartyId);
    if (holder) state.candidatePartyId = holder.party_id;

    let turnHadMismatch = false;
    if (holder) {
      for (const field of Object.keys(IDENTITY_LABELS) as IdentityField[]) {
        const value = extracted[field];
        if (!value || state.matchedFields.includes(field)) continue;
        if (identityMatches(field, value, holder)) state.matchedFields.push(field);
        else turnHadMismatch = true;
      }
    }
    if (turnHadMismatch) state.mismatchAttempts += 1;

    if (state.matchedFields.length < 3) {
      if (state.mismatchAttempts >= 3) state.escalationOffered = true;
      return {
        state,
        reply: safeVerificationReply(state, isUpset(text), refused),
      };
    }

    state = transition(state, 'RESOLVE_INTENT', true);
    const claim = resolveClaim(state, data);
    if (claim) {
      state = { ...state, selectedCaseId: claim.case_id };
      state = transition(state, 'PROCESS_CASE', Boolean(state.selectedCaseId));
      return {
        state,
        reply: `Thank you—your identity is verified. I also remembered what you shared earlier and matched it to claim ${claim.case_id}, so you don’t need to start over. ${groundedClaimReply(claim, text)}`,
      };
    }
    return {
      state,
      reply: 'Thank you—your identity is verified. What type of claim are you calling about, and roughly when was it filed?',
    };
  }

  if (state.phase === 'RESOLVE_INTENT') {
    const claim = resolveClaim(state, data);
    if (!claim) {
      return {
        state,
        reply: 'I found more than one possible claim. Please share the claim type, approximate filing month, or whether it is open, closed, or denied.',
      };
    }
    state = { ...state, selectedCaseId: claim.case_id };
    state = transition(state, 'PROCESS_CASE', Boolean(state.selectedCaseId));
    return { state, reply: groundedClaimReply(claim, text) };
  }

  if (state.phase === 'PROCESS_CASE') {
    const claim = data.claims.find((item) => item.case_id === state.selectedCaseId);
    if (!claim) {
      return {
        state: { ...state, escalationOffered: true },
        reply: 'I can’t access the selected claim record right now. I can connect you with a human representative.',
      };
    }
    if (/\b(done|that'?s all|nothing else|no more questions|finish)\b/i.test(text)) {
      state = transition(state, 'POST_PROCESS', Boolean(state.selectedCaseId));
      return {
        state,
        reply: `Before we finish, would you like an email summary covering claim ${claim.case_id}, its ${claim.status} status, and the next steps we discussed? You can say yes or skip.`,
      };
    }
    return { state, reply: groundedClaimReply(claim, text) };
  }

  if (/\b(yes|send|email it|please do)\b/i.test(text)) {
    return {
      state: { ...state, postProcessChoice: 'send' },
      reply: 'Your email-summary choice is recorded for this demo. The conversation is complete.',
    };
  }
  if (/\b(no|skip|don'?t|do not)\b/i.test(text)) {
    return {
      state: { ...state, postProcessChoice: 'skip' },
      reply: 'No problem—I’ll skip the email summary. The conversation is complete.',
    };
  }
  return {
    state,
    reply: 'Would you like the conversation summary emailed, or would you prefer to skip it?',
  };
}

export function getSelectedClaim(
  state: WorkflowState,
  claims: Claim[],
): Claim | undefined {
  if (state.phase === 'VERIFY_ID' || state.phase === 'RESOLVE_INTENT') return undefined;
  return claims.find((claim) => claim.case_id === state.selectedCaseId);
}
