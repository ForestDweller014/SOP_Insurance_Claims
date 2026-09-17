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
  topic?: 'denial' | 'status' | 'documents' | 'next_steps' | 'general';
};

export type IntentResolution = {
  status: 'resolved' | 'ambiguous' | 'not_found';
  candidateCaseIds: string[];
  clarification?: string;
};

export type EmotionalState =
  | 'neutral'
  | 'frustrated'
  | 'angry'
  | 'anxious'
  | 'confused';

export type IdentityEvidence = {
  normalizedValue: string;
  status: 'observed' | 'matched' | 'mismatched';
  firstSeenPhase: Phase;
  lastSeenTurn: number;
};

export type ConversationMemory = {
  turnCount: number;
  identity: {
    evidence: Partial<Record<IdentityField, IdentityEvidence>>;
    matchedFields: IdentityField[];
    refusedFields: IdentityField[];
    failedAttempts: number;
  };
  caller: {
    role?: 'policyholder' | 'representative' | 'unknown';
    relationship?: string;
  };
  policy: {
    policyNumber?: string;
  };
  intent: {
    topic?: IntentHints['topic'];
    resolution?: IntentResolution['status'];
    candidateCaseIds: string[];
  };
  claim: {
    type?: string;
    approximateDate?: { month?: number; year?: number };
    statusHint?: string;
    caseIdentifiers: string[];
  };
  emotion: {
    current: EmotionalState;
    history: Array<{ state: EmotionalState; turn: number }>;
  };
  escalation: {
    requested: boolean;
    requestCount: number;
    offered: boolean;
  };
  postProcess: {
    preferenceHint?: 'send' | 'skip';
    finalConsent?: 'send' | 'skip';
  };
};

export type WorkflowState = {
  phase: Phase;
  phaseHistory: Phase[];
  candidatePartyId?: string;
  selectedCaseId?: string;
  memory: ConversationMemory;
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
    memory: {
      turnCount: 0,
      identity: {
        evidence: {},
        matchedFields: [],
        refusedFields: [],
        failedAttempts: 0,
      },
      caller: {},
      policy: {},
      intent: { candidateCaseIds: [] },
      claim: { caseIdentifiers: [] },
      emotion: { current: 'neutral', history: [] },
      escalation: { requested: false, requestCount: 0, offered: false },
      postProcess: {},
    },
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
  const year = [...text.matchAll(/\b(20\d{2})\b/g)].find((match) => {
    const prefix = text.slice(Math.max(0, (match.index ?? 0) - 3), match.index);
    return !/CL[-\s]/i.test(prefix);
  })?.[1];
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
  } else if (/\bnext steps?\b|\bwhat (?:do|should) i do\b|\bwhat happens next\b/.test(normalized)) {
    next.topic = 'next_steps';
  } else if (/\bclaim question\b|\bhelp (?:me )?with (?:my )?claim\b/.test(normalized)) {
    next.topic = 'general';
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

function detectEmotion(text: string): EmotionalState {
  if (/furious|angry|unacceptable|outrage/i.test(text)) return 'angry';
  if (/ridiculous|frustrat|annoy|already told|waste of time/i.test(text)) {
    return 'frustrated';
  }
  if (/anxious|worried|scared|nervous|concerned/i.test(text)) return 'anxious';
  if (/confused|don'?t understand|unclear|what do you mean/i.test(text)) {
    return 'confused';
  }
  return 'neutral';
}

function detectCallerContext(text: string): ConversationMemory['caller'] {
  const relationship = text.match(
    /\b(son|daughter|spouse|wife|husband|parent|mother|father|guardian|attorney)\b/i,
  )?.[1].toLowerCase();
  if (/\b(on behalf of|representing|representative)\b/i.test(text) || relationship) {
    return { role: 'representative', relationship };
  }
  if (/\b(policyholder|my policy|my claim|my insurance)\b/i.test(text)) {
    return { role: 'policyholder' };
  }
  return {};
}

function detectPostProcessPreference(text: string): 'send' | 'skip' | undefined {
  if (/\b(?:don'?t|do not|skip|no)\b.{0,24}\b(?:email|summary)\b/i.test(text)) {
    return 'skip';
  }
  if (/\b(?:email|send)\b.{0,30}\bsummary\b|\bsummary\b.{0,30}\bemail\b/i.test(text)) {
    return 'send';
  }
  return undefined;
}

function normalizeEvidence(field: IdentityField, value: string): string {
  if (field === 'name') return normalizeName(value);
  if (field === 'phone') return normalizePhone(value);
  if (field === 'email') return value.toLowerCase();
  if (field === 'dob') return normalizeDate(value) ?? value;
  return value.replace(/\D/g, '').slice(-4);
}

function captureMessageMemory(
  current: WorkflowState,
  text: string,
  data: WorkflowData,
): {
  memory: ConversationMemory;
  extractedIdentity: ExtractedIdentity;
  refusedField?: IdentityField;
} {
  const turn = current.memory.turnCount + 1;
  const extractedIdentity = extractIdentity(text, data.policyholders);
  const refusedField = detectRefusedField(text);
  const previousHints: IntentHints = {
    caseType: current.memory.claim.type,
    status: current.memory.claim.statusHint,
    month: current.memory.claim.approximateDate?.month,
    year: current.memory.claim.approximateDate?.year,
    topic: current.memory.intent.topic,
  };
  const hints = extractIntentHints(text, previousHints);
  const caller = detectCallerContext(text);
  const emotion = detectEmotion(text);
  const escalationRequested = /\b(human|representative|agent|transfer me)\b/i.test(text);
  const preferenceHint = detectPostProcessPreference(text);
  const caseIdentifiers = [
    ...current.memory.claim.caseIdentifiers,
    ...(text.match(/\bCL[-\s]?\d{4}\b/gi) ?? []).map((value) =>
      value.toUpperCase().replace(/\s/g, '-'),
    ),
  ].filter((value, index, values) => values.indexOf(value) === index);

  const evidence = { ...current.memory.identity.evidence };
  for (const field of Object.keys(IDENTITY_LABELS) as IdentityField[]) {
    const value = extractedIdentity[field];
    if (!value) continue;
    evidence[field] = {
      normalizedValue: normalizeEvidence(field, value),
      status: evidence[field]?.status ?? 'observed',
      firstSeenPhase: evidence[field]?.firstSeenPhase ?? current.phase,
      lastSeenTurn: turn,
    };
  }

  const refusedFields = [...current.memory.identity.refusedFields];
  if (refusedField && !refusedFields.includes(refusedField)) {
    refusedFields.push(refusedField);
  }

  return {
    extractedIdentity,
    refusedField,
    memory: {
      turnCount: turn,
      identity: {
        evidence,
        matchedFields: [...current.memory.identity.matchedFields],
        refusedFields,
        failedAttempts: current.memory.identity.failedAttempts,
      },
      caller: {
        role: caller.role ?? current.memory.caller.role,
        relationship: caller.relationship ?? current.memory.caller.relationship,
      },
      policy: {
        policyNumber:
          extractedIdentity.policyNumber ?? current.memory.policy.policyNumber,
      },
      intent: {
        topic: hints.topic ?? current.memory.intent.topic,
        resolution: current.memory.intent.resolution,
        candidateCaseIds: [...current.memory.intent.candidateCaseIds],
      },
      claim: {
        type: hints.caseType ?? current.memory.claim.type,
        approximateDate:
          hints.month || hints.year
            ? { month: hints.month, year: hints.year }
            : current.memory.claim.approximateDate,
        statusHint: hints.status ?? current.memory.claim.statusHint,
        caseIdentifiers,
      },
      emotion: {
        current: emotion,
        history:
          emotion === 'neutral'
            ? [...current.memory.emotion.history]
            : [...current.memory.emotion.history, { state: emotion, turn }],
      },
      escalation: {
        requested: current.memory.escalation.requested || escalationRequested,
        requestCount:
          current.memory.escalation.requestCount + (escalationRequested ? 1 : 0),
        offered: current.memory.escalation.offered,
      },
      postProcess: {
        preferenceHint:
          preferenceHint ?? current.memory.postProcess.preferenceHint,
        finalConsent: current.memory.postProcess.finalConsent,
      },
    },
  };
}

function intentClarification(candidates: Claim[]): string {
  const types = [...new Set(candidates.map((claim) => claim.case_type))];
  if (types.length > 1) {
    return `Which claim type do you mean: ${types.sort().join(', ')}?`;
  }
  const dates = [...new Set(candidates.map((claim) => claim.created_at.slice(0, 7)))];
  if (dates.length > 1) {
    return 'What approximate month and year was the claim filed?';
  }
  const statuses = [...new Set(candidates.map((claim) => claim.status))];
  if (statuses.length > 1) {
    return `Is the claim ${statuses.sort().join(', or ')}?`;
  }
  return 'Please share the claim ID so I can select the correct case.';
}

export function resolveIntent(
  state: WorkflowState,
  data: WorkflowData,
): IntentResolution {
  if (!state.candidatePartyId) {
    return { status: 'not_found', candidateCaseIds: [] };
  }
  let candidates = data.claims.filter(
    (claim) => claim.party_id === state.candidatePartyId,
  );
  const hints = state.memory.claim;
  if (hints.caseIdentifiers.length) {
    candidates = candidates.filter((claim) =>
      hints.caseIdentifiers.includes(claim.case_id),
    );
  }
  if (hints.type) candidates = candidates.filter((claim) => claim.case_type === hints.type);
  if (hints.statusHint) candidates = candidates.filter((claim) => claim.status === hints.statusHint);
  if (hints.approximateDate?.month) {
    candidates = candidates.filter(
      (claim) => Number(claim.created_at.slice(5, 7)) === hints.approximateDate?.month,
    );
  }
  if (hints.approximateDate?.year) {
    candidates = candidates.filter(
      (claim) => Number(claim.created_at.slice(0, 4)) === hints.approximateDate?.year,
    );
  }
  if (candidates.length === 1) {
    return {
      status: 'resolved',
      candidateCaseIds: [candidates[0].case_id],
    };
  }
  if (candidates.length > 1) {
    return {
      status: 'ambiguous',
      candidateCaseIds: candidates.map((claim) => claim.case_id),
      clarification: intentClarification(candidates),
    };
  }
  return {
    status: 'not_found',
    candidateCaseIds: [],
    clarification:
      'I could not match those details to one of your claims. Please check the claim type, filing date, status, or claim ID.',
  };
}

function applyIntentResolution(
  state: WorkflowState,
  resolution: IntentResolution,
): WorkflowState {
  return {
    ...state,
    memory: {
      ...state.memory,
      intent: {
        ...state.memory.intent,
        resolution: resolution.status,
        candidateCaseIds: [...resolution.candidateCaseIds],
      },
    },
  };
}

function safeVerificationReply(
  state: WorkflowState,
  upset: boolean,
  refused?: IdentityField,
): string {
  const identity = state.memory.identity;
  const empathy = upset
    ? 'I hear how frustrating this is, and I’m sorry for the extra step. '
    : '';
  if (identity.failedAttempts >= 3) {
    return `${empathy}I couldn’t complete automated verification after several attempts. I still can’t disclose claim information, but I can connect you with a human representative.`;
  }
  const remaining = (Object.keys(IDENTITY_LABELS) as IdentityField[]).filter(
    (field) => !identity.matchedFields.includes(field) && field !== refused,
  );
  const needed = 3 - identity.matchedFields.length;
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
  const captured = captureMessageMemory(current, text, data);
  let state: WorkflowState = {
    ...current,
    phaseHistory: [...current.phaseHistory],
    memory: captured.memory,
  };

  if (state.phase === 'VERIFY_ID') {
    if (/\b(human|representative|agent|transfer me)\b/i.test(text)) {
      return {
        state: {
          ...state,
          memory: {
            ...state.memory,
            escalation: { ...state.memory.escalation, offered: true },
          },
        },
        reply: 'I can connect you with a human representative. Until they complete verification, I still can’t disclose claim information.',
      };
    }

    const refused = captured.refusedField;
    const extracted = captured.extractedIdentity;
    const holder = locateCandidate(extracted, data, state.candidatePartyId);
    if (holder) state.candidatePartyId = holder.party_id;

    let turnHadMismatch = false;
    const evidence = { ...state.memory.identity.evidence };
    const matchedFields = [...state.memory.identity.matchedFields];
    if (holder) {
      for (const field of Object.keys(IDENTITY_LABELS) as IdentityField[]) {
        const value = extracted[field];
        if (!value || matchedFields.includes(field)) continue;
        if (identityMatches(field, value, holder)) {
          matchedFields.push(field);
          if (evidence[field]) evidence[field] = { ...evidence[field], status: 'matched' };
        } else {
          turnHadMismatch = true;
          if (evidence[field]) evidence[field] = { ...evidence[field], status: 'mismatched' };
        }
      }
    }
    state = {
      ...state,
      memory: {
        ...state.memory,
        identity: {
          ...state.memory.identity,
          evidence,
          matchedFields,
          failedAttempts:
            state.memory.identity.failedAttempts + (turnHadMismatch ? 1 : 0),
        },
      },
    };

    if (state.memory.identity.matchedFields.length < 3) {
      if (state.memory.identity.failedAttempts >= 3) {
        state = {
          ...state,
          memory: {
            ...state.memory,
            escalation: { ...state.memory.escalation, offered: true },
          },
        };
      }
      return {
        state,
        reply: safeVerificationReply(
          state,
          state.memory.emotion.current !== 'neutral' || isUpset(text),
          refused,
        ),
      };
    }

    state = transition(state, 'RESOLVE_INTENT', true);
    const resolution = resolveIntent(state, data);
    state = applyIntentResolution(state, resolution);
    if (resolution.status === 'resolved') {
      const claim = data.claims.find(
        (item) => item.case_id === resolution.candidateCaseIds[0],
      );
      if (!claim) {
        return {
          state,
          reply: 'I could not access the matched claim record. I can connect you with a human representative.',
        };
      }
      state = { ...state, selectedCaseId: claim.case_id };
      state = transition(state, 'PROCESS_CASE', Boolean(state.selectedCaseId));
      return {
        state,
        reply: `Thank you—your identity is verified. I also remembered what you shared earlier and matched it to claim ${claim.case_id}, so you don’t need to start over. ${groundedClaimReply(claim, text)}`,
      };
    }
    return {
      state,
      reply: `Thank you—your identity is verified. ${resolution.clarification ?? 'What type of claim are you calling about, and roughly when was it filed?'}`,
    };
  }

  if (state.phase === 'RESOLVE_INTENT') {
    const resolution = resolveIntent(state, data);
    state = applyIntentResolution(state, resolution);
    if (resolution.status !== 'resolved') {
      return {
        state,
        reply: resolution.clarification ?? 'Please share the claim type, filing date, status, or claim ID.',
      };
    }
    const claim = data.claims.find(
      (item) => item.case_id === resolution.candidateCaseIds[0],
    );
    if (!claim) {
      return {
        state,
        reply: 'I could not access the matched claim record. I can connect you with a human representative.',
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
        state: {
          ...state,
          memory: {
            ...state.memory,
            escalation: { ...state.memory.escalation, offered: true },
          },
        },
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
      state: {
        ...state,
        memory: {
          ...state.memory,
          postProcess: {
            ...state.memory.postProcess,
            preferenceHint: 'send',
            finalConsent: 'send',
          },
        },
      },
      reply: 'Your email-summary choice is recorded for this demo. The conversation is complete.',
    };
  }
  if (/\b(no|skip|don'?t|do not)\b/i.test(text)) {
    return {
      state: {
        ...state,
        memory: {
          ...state.memory,
          postProcess: {
            ...state.memory.postProcess,
            preferenceHint: 'skip',
            finalConsent: 'skip',
          },
        },
      },
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

export function getSafeMemorySummary(state: WorkflowState): string[] {
  const summary: string[] = [];
  const memory = state.memory;
  const observedIdentity = Object.keys(memory.identity.evidence) as IdentityField[];
  if (observedIdentity.length) {
    summary.push(`Identity: ${observedIdentity.map((field) => IDENTITY_LABELS[field]).join(', ')}`);
  }
  if (memory.caller.role) {
    summary.push(
      `Caller: ${memory.caller.role}${memory.caller.relationship ? ` (${memory.caller.relationship})` : ''}`,
    );
  }
  if (memory.policy.policyNumber) summary.push('Policy hint captured');
  if (memory.intent.topic) summary.push(`Intent: ${memory.intent.topic}`);
  if (memory.claim.type) summary.push(`Claim type: ${memory.claim.type}`);
  if (memory.claim.approximateDate?.month) {
    const month = Object.entries(MONTHS).find(
      ([, number]) => number === memory.claim.approximateDate?.month,
    )?.[0];
    if (month) summary.push(`Date hint: ${month}`);
  }
  if (memory.claim.approximateDate?.year) {
    summary.push(`Year hint: ${memory.claim.approximateDate.year}`);
  }
  if (memory.claim.statusHint) summary.push(`Status hint: ${memory.claim.statusHint}`);
  if (memory.claim.caseIdentifiers.length) summary.push('Case ID hint captured');
  if (memory.emotion.current !== 'neutral') {
    summary.push(`Emotion: ${memory.emotion.current}`);
  }
  if (memory.identity.refusedFields.length) {
    summary.push(
      `Refused: ${memory.identity.refusedFields.map((field) => IDENTITY_LABELS[field]).join(', ')}`,
    );
  }
  if (memory.identity.failedAttempts) {
    summary.push(`Failed attempts: ${memory.identity.failedAttempts}`);
  }
  if (memory.escalation.requested) summary.push('Human help requested');
  if (memory.postProcess.preferenceHint) {
    summary.push(`Email preference: ${memory.postProcess.preferenceHint}`);
  }
  return summary;
}
